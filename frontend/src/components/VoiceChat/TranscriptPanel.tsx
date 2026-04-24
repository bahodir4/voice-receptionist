import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Bot, User, Mic } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { type TranscriptEntry, type AgentState } from '@/store/voiceStore'

interface Props {
  transcript: TranscriptEntry[]
  visible: boolean
  agentState?: AgentState
}

export function TranscriptPanel({ transcript, visible, agentState }: Props) {
  const { t } = useTranslation()
  const bottomRef = useRef<HTMLDivElement>(null)
  const showTyping = agentState === 'thinking' || agentState === 'speaking'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript, showTyping])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 24, filter: 'blur(6px)' }}
          animate={{ opacity: 1, x: 0,  filter: 'blur(0px)' }}
          exit={{   opacity: 0, x: 24,  filter: 'blur(6px)' }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col w-full md:w-72 h-72 md:h-[520px] rounded-2xl overflow-hidden
                     bg-white/[0.025] border border-white/[0.08]
                     shadow-[0_24px_64px_rgba(0,0,0,0.6)]
                     backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/[0.06] flex-shrink-0">
            <div className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <MessageSquare className="w-3 h-3 text-violet-400" />
            </div>
            <span className="text-xs font-semibold text-slate-300 tracking-widest uppercase">{t('voice.transcript_title')}</span>
            <div className="ml-auto flex items-center gap-2">
              {showTyping && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-[10px] text-violet-400/80">
                  <span className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                  <span>{agentState === 'thinking' ? t('voice.transcript_thinking') : t('voice.transcript_speaking')}</span>
                </motion.div>
              )}
              <span className="text-[11px] text-slate-600 tabular-nums font-mono">{transcript.length}</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3
                          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

            {transcript.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <Mic className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1">{t('voice.transcript_empty')}</p>
                  <p className="text-[11px] text-slate-700 leading-relaxed max-w-[160px]">
                    {t('voice.transcript_empty_desc')}
                  </p>
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {transcript.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: entry.isFinal ? 1 : 0.75, y: 0, scale: 1 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className={`flex gap-2 ${entry.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5
                    ${entry.role === 'agent'
                      ? 'bg-violet-500/15 border border-violet-500/25'
                      : 'bg-white/[0.06] border border-white/[0.10]'}`}>
                    {entry.role === 'agent'
                      ? <Bot  className="w-2.5 h-2.5 text-violet-400" />
                      : <User className="w-2.5 h-2.5 text-slate-400" />}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-xs leading-relaxed
                    ${entry.role === 'agent'
                      ? 'bg-white/[0.04] text-slate-300 rounded-tl-[4px] border border-white/[0.07]'
                      : 'bg-violet-600/[0.14] text-slate-200 rounded-tr-[4px] border border-violet-500/[0.18]'}`}>
                    {entry.text}
                    {!entry.isFinal && (
                      <span className="ml-1.5 inline-flex gap-[3px] align-middle">
                        {[0, 1, 2].map(i => (
                          <motion.span key={i}
                            className="inline-block w-[3px] h-[3px] rounded-full bg-slate-500"
                            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                            transition={{ duration: 0.75, delay: i * 0.15, repeat: Infinity }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Agent typing indicator */}
            <AnimatePresence>
              {showTyping && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-2"
                >
                  <div className="w-5 h-5 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <Bot className="w-2.5 h-2.5 text-violet-400" />
                  </div>
                  <div className="px-3 py-2.5 rounded-2xl rounded-tl-[4px] bg-white/[0.04] border border-white/[0.07]">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i}
                          className="w-1.5 h-1.5 rounded-full bg-violet-400/50"
                          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                          transition={{ duration: 0.8, delay: i * 0.18, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottomRef} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
