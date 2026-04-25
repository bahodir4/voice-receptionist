import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Mic, WifiOff, Radio, CheckCircle, MessageSquare, RotateCcw, Bot, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  LiveKitRoom,
  useVoiceAssistant,
  useLocalParticipant,
  useTrackTranscription,
  useRoomContext,
  RoomAudioRenderer,
} from '@livekit/components-react'
import { Track, RoomEvent } from 'livekit-client'
import '@livekit/components-styles'

import { OrbAnimation } from '@/components/VoiceChat/OrbAnimation'
import { CallButton } from '@/components/VoiceChat/CallButton'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { useVoiceStore, type AgentState } from '@/store/voiceStore'
import { useLiveKit } from '@/hooks/useLiveKit'
import { useAuth } from '@/hooks/useAuth'

const STATE_STYLE: Record<AgentState, {
  labelKey: string
  dot: string
  text: string
  ring: string
  glow: string
}> = {
  idle:         { labelKey: 'voice.state_ready',        dot: 'bg-slate-600',               text: 'text-slate-500',     ring: '',                     glow: '' },
  connecting:   { labelKey: 'voice.state_connecting',   dot: 'bg-amber-400 animate-pulse', text: 'text-amber-400',     ring: 'border-amber-400/25',  glow: 'bg-amber-600/8' },
  initializing: { labelKey: 'voice.state_initializing', dot: 'bg-amber-400 animate-pulse', text: 'text-amber-400',     ring: 'border-amber-400/25',  glow: 'bg-amber-600/8' },
  listening:    { labelKey: 'voice.state_listening',    dot: 'bg-emerald-400 animate-pulse', text: 'text-emerald-400', ring: 'border-emerald-400/30', glow: 'bg-emerald-600/8' },
  thinking:     { labelKey: 'voice.state_thinking',     dot: 'bg-violet-400 animate-pulse', text: 'text-violet-400',  ring: 'border-violet-400/30',  glow: 'bg-violet-600/10' },
  speaking:     { labelKey: 'voice.state_speaking',     dot: 'bg-blue-400 animate-pulse',   text: 'text-blue-400',    ring: 'border-blue-400/30',    glow: 'bg-blue-600/10' },
  disconnected: { labelKey: 'voice.state_disconnected', dot: 'bg-slate-600',               text: 'text-slate-500',     ring: '',                     glow: '' },
}

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

function OrbStage() {
  const agentState = useVoiceStore(s => s.agentState)
  const audioLevel = useVoiceStore(s => s.audioLevel)
  const agentLevel = useVoiceStore(s => s.agentLevel)

  const cfg = STATE_STYLE[agentState]
  const showRings = ['listening', 'thinking', 'speaking', 'connecting', 'initializing'].includes(agentState)
  const ringSpeed = agentState === 'speaking' ? 0.65 : agentState === 'thinking' ? 1.0 : 1.8

  return (
    <div className="relative flex items-center justify-center select-none">
      <AnimatePresence>
        {showRings && (
          <motion.div key="glow"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={`absolute w-72 h-72 rounded-full blur-[80px] ${cfg.glow}`}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRings && (
          <motion.div key="ring-outer"
            className={`absolute rounded-full border ${cfg.ring}`}
            style={{ width: 320, height: 320 }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: [0, 0.6, 0], scale: [0.95, 1.1, 0.95] }}
            exit={{ opacity: 0 }}
            transition={{ duration: ringSpeed, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRings && (
          <motion.div key="ring-inner"
            className={`absolute rounded-full border ${cfg.ring}`}
            style={{ width: 272, height: 272 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: [0, 0.4, 0], scale: [0.98, 1.07, 0.98] }}
            exit={{ opacity: 0 }}
            transition={{ duration: ringSpeed, delay: ringSpeed * 0.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      <div style={{ '--orb-size': '220px' } as React.CSSProperties}>
        <OrbAnimation state={agentState} audioLevel={audioLevel} agentLevel={agentLevel} />
      </div>
    </div>
  )
}

function VoiceRoomContent({ onConversationEnd }: { onConversationEnd: () => void }) {
  const setAgentState = useVoiceStore(s => s.setAgentState)
  const setConnected  = useVoiceStore(s => s.setConnected)
  const { startMicAnalyser } = useLiveKit()
  const room = useRoomContext()

  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      if (new TextDecoder().decode(payload) === 'CONVERSATION_ENDED') {
        onConversationEnd()
      }
    }
    room.on(RoomEvent.DataReceived, handleData)
    return () => { room.off(RoomEvent.DataReceived, handleData) }
  }, [room, onConversationEnd])

  const { state: lkState, agentTranscriptions } = useVoiceAssistant()
  const { localParticipant } = useLocalParticipant()

  const micTrackRef = localParticipant
    ? { participant: localParticipant, source: Track.Source.Microphone }
    : undefined
  const { segments: userSegments } = useTrackTranscription(micTrackRef)

  useEffect(() => {
    const map: Record<string, AgentState> = {
      connecting: 'connecting', initializing: 'initializing',
      listening: 'listening', thinking: 'thinking', speaking: 'speaking',
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

export function VoiceChatPage() {
  const store          = useVoiceStore()
  const agentState     = useVoiceStore(s => s.agentState)
  const isConnected    = useVoiceStore(s => s.isConnected)
  const sessionEnded   = useVoiceStore(s => s.sessionEnded)
  const sessionDuration = useVoiceStore(s => s.sessionDuration)
  const transcript     = useVoiceStore(s => s.transcript)
  const token          = useVoiceStore(s => s.token)
  const livekitUrl     = useVoiceStore(s => s.livekitUrl)
  const audioLevel     = useVoiceStore(s => s.audioLevel)

  const callStartRef  = useRef<number | null>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)

  const { startCall, endCall } = useLiveKit()
  const { user } = useAuth()
  const { t } = useTranslation()

  useEffect(() => {
    if (isConnected && !callStartRef.current) callStartRef.current = Date.now()
    if (!isConnected) callStartRef.current = null
  }, [isConnected])

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' })
  }, [transcript])

  const isInRoom = !!token
  const cfg      = STATE_STYLE[agentState]

  function handleDisconnect() {
    const dur = callStartRef.current ? Math.floor((Date.now() - callStartRef.current) / 1000) : 0
    store.endSession(dur)
  }

  const hintText = agentState === 'idle' ? t('voice.hint_idle')
    : agentState === 'connecting' || agentState === 'initializing' ? t('voice.hint_connecting')
    : agentState === 'thinking' ? t('voice.hint_thinking')
    : agentState === 'speaking' ? t('voice.hint_speaking')
    : t('voice.hint_listening')

  return (
    <div className="min-h-screen bg-[#06060f] flex flex-col">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-dot-grid opacity-20" />
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-violet-900/[0.07] rounded-full blur-[140px]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-900/[0.05] rounded-full blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-6 h-14
                      border-b border-white/[0.05] bg-[#06060f]/70 backdrop-blur-xl flex-shrink-0">
        <Link to="/dashboard"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors group">
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center
                          group-hover:border-white/[0.14] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium hidden sm:inline">{t('voice.back')}</span>
        </Link>

        <div className="flex items-center gap-2.5">
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
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
                           bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline font-medium">Live</span>
                <CallTimer running={isConnected} />
              </motion.div>
            ) : (
              <motion.div key="offline"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
                           bg-white/[0.03] border border-white/[0.07] text-slate-600 text-xs">
                <WifiOff className="w-3 h-3" />
                <span className="hidden sm:inline">{user?.username}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* LiveKit */}
      {isInRoom && (
        <LiveKitRoom
          token={token!} serverUrl={livekitUrl!}
          connect audio video={false}
          options={{ audioCaptureDefaults: { noiseSuppression: true, echoCancellation: true } }}
          onDisconnected={handleDisconnect}
          onError={(e) => console.error('LiveKit error', e)}
          style={{ display: 'none' }}
        >
          <VoiceRoomContent onConversationEnd={handleDisconnect} />
        </LiveKitRoom>
      )}

      {/* Session ended overlay */}
      <AnimatePresence>
        {sessionEnded && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center bg-[#06060f]/95 backdrop-blur-xl px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
              className="w-full max-w-sm bg-[#0c0c1a] border border-white/[0.09] rounded-3xl p-8 flex flex-col items-center gap-6">

              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-900/20">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="text-center">
                <h2 className="text-white font-bold text-xl mb-1.5">{t('voice.session_ended')}</h2>
                <p className="text-slate-500 text-sm leading-relaxed">{t('voice.session_ended_desc')}</p>
              </div>

              <div className="w-full grid grid-cols-2 gap-3">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3.5 text-center">
                  <p className="text-white font-bold text-2xl tracking-tight">
                    {Math.floor(sessionDuration / 60)}:{String(sessionDuration % 60).padStart(2, '0')}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5 font-medium">{t('voice.duration')}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3.5 text-center">
                  <p className="text-white font-bold text-2xl tracking-tight">{transcript.filter(t => t.isFinal).length}</p>
                  <p className="text-slate-500 text-xs mt-0.5 font-medium">{t('voice.messages')}</p>
                </div>
              </div>

              <div className="w-full flex flex-col gap-2">
                <button onClick={() => store.reset()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
                             bg-violet-600 hover:bg-violet-500 transition-colors text-white text-sm font-semibold
                             shadow-lg shadow-violet-900/30">
                  <RotateCcw className="w-4 h-4" />
                  {t('voice.new_conversation')}
                </button>
                <Link to="/dashboard"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
                             bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] transition-colors text-slate-400 hover:text-slate-200 text-sm font-medium">
                  <MessageSquare className="w-4 h-4" />
                  {t('voice.back')}
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main — two column on desktop */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden">

        {/* ── Left: Orb + controls ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 lg:py-0 lg:max-w-[520px] lg:mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="flex flex-col items-center gap-0 w-full"
          >
            {/* Hint */}
            <AnimatePresence mode="wait">
              <motion.p key={agentState}
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-slate-600 mb-8 tracking-wide text-center max-w-[240px] leading-relaxed">
                {hintText}
              </motion.p>
            </AnimatePresence>

            <OrbStage />

            {/* State badge */}
            <motion.div key={agentState}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="mt-7 flex items-center gap-2 px-4 py-2 rounded-full
                         bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm">
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

            <div className="mt-6">
              <CallButton state={agentState} onStart={startCall} onEnd={endCall} />
            </div>
          </motion.div>
        </div>

        {/* ── Right: Transcript panel (desktop only) ── */}
        <div className="hidden lg:flex flex-col w-[380px] xl:w-[420px] flex-shrink-0 border-l border-white/[0.05]">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-300">{t('voice.transcript_title')}</span>
            </div>
            {isConnected && (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {agentState === 'thinking' ? t('voice.transcript_thinking') : t('voice.transcript_speaking')}
              </div>
            )}
          </div>

          <div ref={transcriptRef}
            className="flex-1 overflow-y-auto p-4 space-y-3
                       [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.05)_transparent]">
            <AnimatePresence initial={false}>
              {transcript.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">{t('voice.transcript_empty')}</p>
                    <p className="text-xs text-slate-700 leading-relaxed max-w-[200px] mx-auto">{t('voice.transcript_empty_desc')}</p>
                  </div>
                </motion.div>
              ) : (
                transcript.map((entry) => (
                  <motion.div key={entry.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex gap-2.5 ${entry.role === 'user' ? 'flex-row-reverse' : ''}`}>

                    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${
                      entry.role === 'agent'
                        ? 'bg-gradient-to-br from-violet-500 to-blue-500'
                        : 'bg-gradient-to-br from-slate-600 to-slate-700'
                    }`}>
                      {entry.role === 'agent'
                        ? <Bot className="w-3 h-3 text-white" />
                        : <User className="w-3 h-3 text-white" />}
                    </div>

                    <div className={`flex-1 min-w-0 ${entry.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                      <div className={`inline-block px-3 py-2 rounded-2xl text-xs leading-relaxed max-w-[280px] ${
                        entry.role === 'agent'
                          ? 'bg-white/[0.05] border border-white/[0.07] text-slate-300 rounded-tl-sm'
                          : 'bg-violet-600/20 border border-violet-500/20 text-violet-200 rounded-tr-sm'
                      } ${!entry.isFinal ? 'opacity-70' : ''}`}>
                        {entry.text}
                        {!entry.isFinal && (
                          <span className="inline-flex items-end gap-px ml-1">
                            {[0, 1, 2].map(i => (
                              <motion.span key={i}
                                className="w-0.5 h-0.5 rounded-full bg-current inline-block"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                              />
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
}
