"""
Voice Receptionist — LiveKit Agent Worker
==========================================
Run alongside the FastAPI server (separate terminal):

  Development:  python agent.py dev
  Production:   python agent.py start
"""
from __future__ import annotations

import asyncio

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
    function_tool,
    room_io,
)
from livekit.plugins import openai as lk_openai
from livekit.plugins import elevenlabs as lk_elevenlabs
from livekit.plugins import silero

try:
    from livekit.plugins import ai_coustics
    _AI_COUSTICS_AVAILABLE = True
except ImportError:
    _AI_COUSTICS_AVAILABLE = False
    logger.warning("livekit-plugins-ai-coustics not installed — noise cancellation disabled")

try:
    from livekit.plugins.turn_detector.multilingual import MultilingualModel
    _TURN_DETECTOR_AVAILABLE = True
except ImportError:
    _TURN_DETECTOR_AVAILABLE = False
    logger.warning("livekit-plugins-turn-detector not installed — using default endpointing")

from app.core.config import get_settings
from app.core.logger import setup_logging
from app.services.agent_service import build_system_prompt, load_business_settings

settings = get_settings()
setup_logging(debug=settings.DEBUG)

server = AgentServer()


class VoiceReceptionist(Agent):
    """Voice receptionist agent with farewell auto-hangup support."""

    def __init__(self, instructions: str, ctx: JobContext, is_phone_call: bool = False) -> None:
        super().__init__(instructions=instructions)
        self._ctx = ctx
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

    @function_tool
    async def end_conversation(self) -> str:
        """Call this tool when the user says goodbye, thank you and goodbye, or explicitly wants
        to end the call/conversation. After you receive this result, say a brief warm farewell
        — the call will disconnect automatically."""
        async def _disconnect() -> None:
            await asyncio.sleep(3.5)  # allow farewell TTS to finish
            try:
                await self._ctx.room.disconnect()
                logger.info("Room disconnected after farewell room={}", self._ctx.room.name)
            except Exception as exc:
                logger.warning("Disconnect failed: {}", exc)

        asyncio.create_task(_disconnect())
        return "Farewell acknowledged. Please say a brief, warm goodbye to the caller (one sentence only)."


def prewarm(proc: JobProcess) -> None:
    proc.userdata["vad"] = silero.VAD.load(
        activation_threshold=0.75,
        deactivation_threshold=0.55,
        min_speech_duration=0.2,
        min_silence_duration=0.9,
    )


server.setup_fnc = prewarm


@server.rtc_session(agent_name="voice-receptionist")
async def entrypoint(ctx: JobContext) -> None:
    is_phone_call = ctx.room.name.startswith("phone-")
    logger.info("Agent job started room={} phone_call={}", ctx.room.name, is_phone_call)

    biz_settings = await load_business_settings()
    system_prompt = build_system_prompt(biz_settings)

    stt = lk_elevenlabs.STT(
        model_id="scribe_v2",
        api_key=settings.ELEVENLABS_API_KEY,
    )

    llm = lk_openai.LLM(
        model=settings.GROK_MODEL,
        base_url=settings.GROK_BASE_URL,
        api_key=settings.GROK_API_KEY,
        temperature=0.7,
    )

    tts = lk_elevenlabs.TTS(
        voice_id=settings.ELEVENLABS_VOICE_ID,
        model=settings.ELEVENLABS_MODEL_ID,
        api_key=settings.ELEVENLABS_API_KEY,
    )

    if _TURN_DETECTOR_AVAILABLE:
        turn_handling = TurnHandlingOptions(
            turn_detection=MultilingualModel(),
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

    @session.on("user_input_transcribed")
    def _on_user(event) -> None:
        if event.is_final:
            logger.info("[USER] {}", event.transcript)

    @session.on("conversation_item_added")
    def _on_agent(event) -> None:
        if getattr(event.item, "role", None) == "assistant":
            logger.info("[AGENT] {}", getattr(event.item, "text_content", "")[:120])

    if _AI_COUSTICS_AVAILABLE:
        room_options = room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=ai_coustics.audio_enhancement(
                    model=ai_coustics.EnhancerModel.QUAIL_VF_L,
                    model_parameters=ai_coustics.ModelParameters(enhancement_level=0.9),
                ),
            ),
        )
    else:
        room_options = None

    await session.start(
        agent=VoiceReceptionist(instructions=system_prompt, ctx=ctx, is_phone_call=is_phone_call),
        room=ctx.room,
        **({"room_options": room_options} if room_options else {}),
    )

    logger.info("Agent session active room={}", ctx.room.name)


if __name__ == "__main__":
    cli.run_app(server)
