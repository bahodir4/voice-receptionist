import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Mic, WifiOff, Radio } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  LiveKitRoom,
  useVoiceAssistant,
  useLocalParticipant,
  useTrackTranscription,
  RoomAudioRenderer,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import '@livekit/components-styles'

import { OrbAnimation } from '@/components/VoiceChat/OrbAnimation'
import { CallButton } from '@/components/VoiceChat/CallButton'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { useVoiceStore, type AgentState } from '@/store/voiceStore'
import { useLiveKit } from '@/hooks/useLiveKit'
import { useAuth } from '@/hooks/useAuth'

// ── State config (labels resolved via t() at render time) ────────────────────

const STATE_STYLE: Record<AgentState, {
  labelKey: string
  dot: string
  text: string
  ring: string
  glow: string
}> = {
  idle:         { labelKey: 'voice.state_ready',        dot: 'bg-slate-600',             text: 'text-slate-500',      ring: '',                   glow: '' },
  connecting:   { labelKey: 'voice.state_connecting',   dot: 'bg-amber-400 animate-pulse', text: 'text-amber-400',   ring: 'border-amber-400/25', glow: 'bg-amber-600/8' },
  initializing: { labelKey: 'voice.state_initializing', dot: 'bg-amber-400 animate-pulse', text: 'text-amber-400',   ring: 'border-amber-400/25', glow: 'bg-amber-600/8' },
  listening:    { labelKey: 'voice.state_listening',    dot: 'bg-emerald-400 animate-pulse', text: 'text-emerald-400', ring: 'border-emerald-400/30', glow: 'bg-emerald-600/8' },
  thinking:     { labelKey: 'voice.state_thinking',     dot: 'bg-violet-400 animate-pulse', text: 'text-violet-400',  ring: 'border-violet-400/30', glow: 'bg-violet-600/10' },
  speaking:     { labelKey: 'voice.state_speaking',     dot: 'bg-blue-400 animate-pulse',   text: 'text-blue-400',    ring: 'border-blue-400/30',   glow: 'bg-blue-600/10' },
  disconnected: { labelKey: 'voice.state_disconnected', dot: 'bg-slate-600',             text: 'text-slate-500',      ring: '',                   glow: '' },
}

// ── Call timer ─────────────────────────────────────────────────────────────────

function CallTimer({ running }: { running: boolean }) {
  const [secs, setSecs] = useState(0)

  useEffect(() => {
    if (!running) { setSecs(0); return }
    const id = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  const mm = Math.floor(secs / 60).toString().padStart(2, '0')
  const ss = (secs % 60).toString().padStart(2, '0')
  return <span className="tabular-nums font-mono text-[11px] text-slate-500">{mm}:{ss}</span>
}

// ── Orb stage (rings + orb, lives outside LiveKitRoom) ────────────────────────

function OrbStage() {
  const agentState = useVoiceStore(s => s.agentState)
  const audioLevel = useVoiceStore(s => s.audioLevel)
  const agentLevel = useVoiceStore(s => s.agentLevel)

  const cfg = STATE_STYLE[agentState]
  const showRings = ['listening', 'thinking', 'speaking', 'connecting', 'initializing'].includes(agentState)
  const ringSpeed = agentState === 'speaking' ? 0.65 : agentState === 'thinking' ? 1.0 : 1.8

  return (
    <div className="relative flex items-center justify-center select-none">

      {/* Ambient glow */}
      <AnimatePresence>
        {showRings && (
          <motion.div
            key="glow"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={`absolute w-80 h-80 rounded-full blur-[80px] ${cfg.glow}`}
          />
        )}
      </AnimatePresence>

      {/* Outer ring */}
      <AnimatePresence>
        {showRings && (
          <motion.div
            key="ring-outer"
            className={`absolute rounded-full border ${cfg.ring}`}
            style={{ width: 348, height: 348 }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: [0, 0.7, 0], scale: [0.95, 1.1, 0.95] }}
            exit={{ opacity: 0 }}
            transition={{ duration: ringSpeed, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* Inner ring */}
      <AnimatePresence>
        {showRings && (
          <motion.div
            key="ring-inner"
            className={`absolute rounded-full border ${cfg.ring}`}
            style={{ width: 296, height: 296 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: [0, 0.5, 0], scale: [0.98, 1.07, 0.98] }}
            exit={{ opacity: 0 }}
            transition={{ duration: ringSpeed, delay: ringSpeed * 0.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* Orb canvas */}
      <div style={{ '--orb-size': '240px' } as React.CSSProperties}>
        <OrbAnimation state={agentState} audioLevel={audioLevel} agentLevel={agentLevel} />
      </div>
    </div>
  )
}

// ── Room logic (must stay inside LiveKitRoom) ─────────────────────────────────

function VoiceRoomContent() {
  const setAgentState = useVoiceStore(s => s.setAgentState)
  const setConnected  = useVoiceStore(s => s.setConnected)
  const { startMicAnalyser } = useLiveKit()

  const { state: lkState, agentTranscriptions } = useVoiceAssistant()
  const { localParticipant } = useLocalParticipant()

  const micTrackRef = localParticipant
    ? { participant: localParticipant, source: Track.Source.Microphone }
    : undefined
  const { segments: userSegments } = useTrackTranscription(micTrackRef)

  useEffect(() => {
    const map: Record<string, AgentState> = {
      connecting: 'connecting', initializing: 'initializing',
      listening:  'listening',  thinking:     'thinking',
      speaking:   'speaking',
    }
    if (lkState in map) setAgentState(map[lkState]!)
    setConnected(true)
  }, [lkState, setAgentState, setConnected])

  useEffect(() => {
    if (!localParticipant) return
    const micPub = localParticipant.getTrackPublication('microphone' as never)
    const stream = (micPub as { track?: { mediaStream?: MediaStream } } | undefined)?.track?.mediaStream
    if (stream) startMicAnalyser(stream)
  }, [localParticipant, startMicAnalyser])

  useEffect(() => {
    const { addTranscript, updateLastTranscript, transcript } = useVoiceStore.getState()
    for (const seg of agentTranscriptions) {
      const ex = transcript.find(t => t.id === seg.id)
      if (!ex) addTranscript({ id: seg.id, role: 'agent', text: seg.text, timestamp: new Date(), isFinal: seg.final })
      else if (!ex.isFinal) updateLastTranscript(seg.id, seg.text, seg.final)
    }
  }, [agentTranscriptions])

  useEffect(() => {
    const { addTranscript, updateLastTranscript, transcript } = useVoiceStore.getState()
    for (const seg of userSegments) {
      const ex = transcript.find(t => t.id === seg.id)
      if (!ex) addTranscript({ id: seg.id, role: 'user', text: seg.text, timestamp: new Date(), isFinal: seg.final })
      else if (!ex.isFinal) updateLastTranscript(seg.id, seg.text, seg.final)
    }
  }, [userSegments])

  return <RoomAudioRenderer />
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function VoiceChatPage() {
  const store       = useVoiceStore()
  const agentState  = useVoiceStore(s => s.agentState)
  const isConnected = useVoiceStore(s => s.isConnected)
  const token       = useVoiceStore(s => s.token)
  const livekitUrl  = useVoiceStore(s => s.livekitUrl)
  const audioLevel  = useVoiceStore(s => s.audioLevel)

  const { startCall, endCall } = useLiveKit()
  const { user } = useAuth()
  const { t } = useTranslation()

  const isInRoom = !!token
  const cfg      = STATE_STYLE[agentState]

  return (
    <div className="min-h-screen bg-[#06060f] flex flex-col overflow-hidden">

      {/* ── Background ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-dot-grid opacity-25" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-violet-900/[0.06] rounded-full blur-[140px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-900/[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-800/[0.04] rounded-full blur-[80px]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-4
                      border-b border-white/[0.05] bg-[#06060f]/70 backdrop-blur-xl">
        <Link to="/dashboard"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors group">
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center
                          group-hover:border-white/[0.14] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium hidden sm:inline">{t('voice.back')}</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Mic className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-white text-sm tracking-tight">{t('voice.title')}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />

          <AnimatePresence mode="wait">
            {isConnected ? (
              <motion.div key="live"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
                           bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline font-medium">Live</span>  {/* "Live" is a technical indicator — intentionally not translated */}
                <CallTimer running={isConnected} />
              </motion.div>
            ) : (
              <motion.div key="offline"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
                           bg-white/[0.03] border border-white/[0.07] text-slate-600 text-xs">
                <WifiOff className="w-3 h-3" />
                <span className="hidden sm:inline">{user?.username}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* ── LiveKit context (audio only, no visual) ── */}
      {isInRoom && (
        <LiveKitRoom
          token={token!}
          serverUrl={livekitUrl!}
          connect audio video={false}
          options={{ audioCaptureDefaults: { noiseSuppression: true, echoCancellation: true } }}
          onDisconnected={() => store.reset()}
          onError={(e) => console.error('LiveKit error', e)}
          style={{ display: 'none' }}
        >
          <VoiceRoomContent />
        </LiveKitRoom>
      )}

      {/* ── Main ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center w-full max-w-sm">

          {/* ── Orb column ── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="flex flex-col items-center gap-0 w-full"
          >
            {/* Hint text */}
            <AnimatePresence mode="wait">
              <motion.p
                key={agentState}
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-slate-600 mb-8 tracking-wide text-center">
                {agentState === 'idle'
                  ? t('voice.hint_idle')
                  : agentState === 'connecting' || agentState === 'initializing'
                  ? t('voice.hint_connecting')
                  : agentState === 'thinking'
                  ? t('voice.hint_thinking')
                  : agentState === 'speaking'
                  ? t('voice.hint_speaking')
                  : t('voice.hint_listening')}
              </motion.p>
            </AnimatePresence>

            {/* Orb with rings */}
            <OrbStage />

            {/* State badge */}
            <motion.div
              key={agentState}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full
                         bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm"
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
              <span className={`text-xs font-medium ${cfg.text}`}>{t(cfg.labelKey)}</span>
              {isConnected && agentState === 'listening' && (
                <Radio className="w-2.5 h-2.5 text-emerald-400/60 ml-0.5" />
              )}
            </motion.div>

            {/* Mic waveform */}
            <AnimatePresence>
              {isConnected && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-2xl
                             bg-white/[0.025] border border-white/[0.05]">
                  <Mic className="w-3 h-3 text-violet-400/50 flex-shrink-0" />
                  <span className="text-[11px] text-slate-600 mr-1">{t('voice.mic')}</span>
                  <div className="flex items-end gap-px" style={{ height: 16 }}>
                    {Array.from({ length: 16 }).map((_, i) => {
                      const threshold = (i + 1) / 16
                      const active = audioLevel > threshold
                      return (
                        <motion.div key={i}
                          className={`w-[2px] rounded-full transition-colors duration-100 ${
                            active ? 'bg-violet-400/70' : 'bg-white/[0.08]'
                          }`}
                          animate={{ height: active ? 4 + Math.sin((i / 15) * Math.PI) * 11 : 2 }}
                          transition={{ duration: 0.06 }}
                        />
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Call button */}
            <div className="mt-6">
              <CallButton
                state={agentState}
                onStart={startCall}
                onEnd={endCall}
              />
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  )
}
