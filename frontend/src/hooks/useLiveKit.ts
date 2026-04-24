import { useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { api, extractError } from '@/services/api'
import { useVoiceStore } from '@/store/voiceStore'

export function useLiveKit() {
  // Use getState() for callbacks so they never depend on the store object
  // reference — avoids the infinite re-render loop caused by store changing
  // on every setAudioLevel call inside the RAF tick.
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef      = useRef<number>(0)
  const callingRef  = useRef(false)

  // ── Start call ─────────────────────────────────────────────────────────

  const startCall = useCallback(async () => {
    if (callingRef.current) return
    const { agentState } = useVoiceStore.getState()
    if (agentState !== 'idle' && agentState !== 'disconnected') return
    callingRef.current = true
    try {
      useVoiceStore.getState().setAgentState('connecting')
      const { data } = await api.getVoiceToken()
      useVoiceStore.getState().setRoomInfo(data.token, data.room_name, data.livekit_url)
    } catch (err) {
      toast.error(extractError(err))
      useVoiceStore.getState().setAgentState('idle')
    } finally {
      callingRef.current = false
    }
  }, [])

  // ── End call ───────────────────────────────────────────────────────────

  const endCall = useCallback(async () => {
    cancelAnimationFrame(rafRef.current)
    analyserRef.current = null

    const { roomName } = useVoiceStore.getState()
    if (roomName) {
      try {
        await api.endVoiceSession(roomName)
      } catch {
        // best-effort
      }
    }
    useVoiceStore.getState().reset()
  }, [])

  // ── Mic audio level (Web Audio API) ───────────────────────────────────

  const startMicAnalyser = useCallback((stream: MediaStream) => {
    cancelAnimationFrame(rafRef.current)

    const ctx     = new AudioContext()
    const source  = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyserRef.current = analyser

    const buf = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      analyser.getByteFrequencyData(buf)
      const avg = buf.reduce((a, b) => a + b, 0) / buf.length
      useVoiceStore.getState().setAudioLevel(avg / 255)
      rafRef.current = requestAnimationFrame(tick)
    }
    tick()
  }, [])

  // Expose agentState for components that only use this hook
  const agentState = useVoiceStore(s => s.agentState)

  return { startCall, endCall, startMicAnalyser, agentState }
}
