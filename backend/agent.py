"""
Voice Receptionist — LiveKit Agent Worker
==========================================
Run alongside the FastAPI server (separate terminal):

  Development:  python agent.py dev
  Production:   python agent.py start
"""
from __future__ import annotations

from dotenv import load_dotenv
load_dotenv()

from loguru import logger
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    TurnHandlingOptions,
    cli,
    room_io,
)
from livekit.plugins import openai as lk_openai
from livekit.plugins import elevenlabs as lk_elevenlabs
from livekit.plugins import silero

# Optional noise cancellation — gracefully disabled if package is not installed
try:
    from livekit.plugins import ai_coustics
    _AI_COUSTICS_AVAILABLE = True
except ImportError:
    _AI_COUSTICS_AVAILABLE = False
    logger.warning("livekit-plugins-ai-coustics not installed — noise cancellation disabled")

# Optional multilingual turn detection
try:
    from livekit.plugins.turn_detector.multilingual import MultilingualModel
    _TURN_DETECTOR_AVAILABLE = True
except ImportError:
    _TURN_DETECTOR_AVAILABLE = False
    logger.warning("livekit-plugins-turn-detector not installed — using default endpointing")

from app.core.config import get_settings
from app.core.logger import setup_logging
from app.services.agent_service import get_system_prompt

settings = get_settings()
setup_logging(debug=settings.DEBUG)

server = AgentServer()


class VoiceReceptionist(Agent):
    """Agent class with context-aware on_enter greeting."""

    def __init__(self, is_phone_call: bool = False) -> None:
        super().__init__(instructions=get_system_prompt())
        self._is_phone_call = is_phone_call

    async def on_enter(self) -> None:
        greeting_instruction = (
            "Greet the caller warmly. Keep it to one sentence, then ask how you can help."
            if self._is_phone_call
            else "Greet the user warmly and ask how you can help them today."
        )
        await self.session.generate_reply(
            instructions=greeting_instruction,
            allow_interruptions=True,
        )


def prewarm(proc: JobProcess) -> None:
    proc.userdata["vad"] = silero.VAD.load(
        # Raise threshold so casual background noise / distant voices don't trigger
        activation_threshold=0.65,
        # Require at least 150ms of continuous speech before accepting it
        # (default 50ms — too easy for a cough or noise burst to pass)
        min_speech_duration=0.15,
        # Keep a comfortable silence gap before we cut the user's turn
        min_silence_duration=0.6,
    )


server.setup_fnc = prewarm


@server.rtc_session(agent_name="voice-receptionist")
async def entrypoint(ctx: JobContext) -> None:
    is_phone_call = ctx.room.name.startswith("phone-")
    logger.info("Agent job started room={} phone_call={}", ctx.room.name, is_phone_call)

    # ── STT: ElevenLabs Scribe v2 realtime ───────────────────────────────
    stt = lk_elevenlabs.STT(
        model_id="scribe_v2",
        api_key=settings.ELEVENLABS_API_KEY,
    )

    # ── LLM: Groq via OpenAI-compatible SDK ──────────────────────────────
    llm = lk_openai.LLM(
        model=settings.GROK_MODEL,
        base_url=settings.GROK_BASE_URL,
        api_key=settings.GROK_API_KEY,
        temperature=0.7,
    )

    # ── TTS: ElevenLabs multilingual v2 ──────────────────────────────────
    tts = lk_elevenlabs.TTS(
        voice_id=settings.ELEVENLABS_VOICE_ID,
        model=settings.ELEVENLABS_MODEL_ID,
        api_key=settings.ELEVENLABS_API_KEY,
    )

    # ── Turn detection: multilingual model if available ───────────────────
    if _TURN_DETECTOR_AVAILABLE:
        turn_handling = TurnHandlingOptions(
            turn_detection=MultilingualModel(),
            # Still enforce a minimum delay so single noise pops can't fire the LLM
            endpointing={"min_delay": 0.8, "max_delay": 4.0},
        )
    else:
        turn_handling = TurnHandlingOptions(
            endpointing={"min_delay": 0.8, "max_delay": 4.0},
        )

    session = AgentSession(
        vad=ctx.proc.userdata["vad"],
        stt=stt,
        llm=llm,
        tts=tts,
        turn_handling=turn_handling,
    )

    # ── Transcript logging ────────────────────────────────────────────────
    @session.on("user_input_transcribed")
    def _on_user(event) -> None:
        if event.is_final:
            logger.info("[USER] {}", event.transcript)

    @session.on("conversation_item_added")
    def _on_agent(event) -> None:
        if getattr(event.item, "role", None) == "assistant":
            logger.info("[AGENT] {}", getattr(event.item, "text_content", "")[:120])

    # ── Room options: noise cancellation (ai_coustics) if available ───────
    if _AI_COUSTICS_AVAILABLE:
        room_options = room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=ai_coustics.audio_enhancement(
                    model=ai_coustics.EnhancerModel.QUAIL_VF_L,
                ),
            ),
        )
    else:
        room_options = None

    await session.start(
        agent=VoiceReceptionist(is_phone_call=is_phone_call),
        room=ctx.room,
        **({"room_options": room_options} if room_options else {}),
    )

    logger.info("Agent session active room={}", ctx.room.name)


if __name__ == "__main__":
    cli.run_app(server)
