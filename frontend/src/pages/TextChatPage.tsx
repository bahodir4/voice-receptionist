import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MessageSquare, Plus, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { MessageBubble } from '@/components/TextChat/MessageBubble'
import { ChatInput } from '@/components/TextChat/ChatInput'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { useChatStore } from '@/store/chatStore'
import { useChat } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'

const SUGGEST_KEYS = ['chat.suggest_1', 'chat.suggest_2', 'chat.suggest_3'] as const

export function TextChatPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { send, newChat } = useChat()

  const messages    = useChatStore(s => s.messages)
  const isStreaming = useChatStore(s => s.isStreaming)

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isEmpty = messages.length === 0

  return (
    <div className="min-h-screen bg-[#06060f] flex flex-col overflow-hidden">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-dot-grid opacity-20" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-900/[0.06] rounded-full blur-[150px]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-900/[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-900/[0.04] rounded-full blur-[90px]" />
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
          <span className="text-xs font-medium hidden sm:inline">{t('chat.back')}</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-white text-sm tracking-tight">{t('chat.title')}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />

          <motion.button
            onClick={newChat}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                       text-slate-400 hover:text-slate-200 bg-white/[0.04] border border-white/[0.07]
                       hover:bg-white/[0.07] hover:border-white/[0.12] transition-all">
            <Plus className="w-3 h-3" />
            <span className="hidden sm:inline">{t('chat.new_chat')}</span>
          </motion.button>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
                          bg-emerald-500/[0.06] border border-emerald-500/15 text-emerald-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{user?.username}</span>
          </div>
        </div>
      </nav>

      {/* Messages area */}
      <main className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6
                        [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.06)_transparent]">

          {/* Empty state */}
          <AnimatePresence>
            {isEmpty && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.45 }}
                className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] gap-6 text-center"
              >
                {/* Icon */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-3xl bg-blue-500/10 blur-2xl scale-150" />
                  <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10
                                  border border-blue-500/20 flex items-center justify-center">
                    <Sparkles className="w-9 h-9 text-blue-400/80" />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full
                                  bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2 max-w-sm">
                  <p className="text-white font-bold text-xl tracking-tight">{t('chat.empty_title')}</p>
                  <p className="text-slate-500 text-sm leading-relaxed">{t('chat.empty_desc')}</p>
                </div>

                {/* Suggestion chips */}
                <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 mt-1">
                  {SUGGEST_KEYS.map((key) => (
                    <motion.button
                      key={key}
                      onClick={() => send(t(key))}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 rounded-xl text-xs text-slate-300 font-medium
                                 bg-white/[0.04] border border-white/[0.08]
                                 hover:bg-white/[0.07] hover:border-white/[0.15] hover:text-white
                                 transition-all duration-200"
                    >
                      {t(key)}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message list */}
          <div className="max-w-3xl mx-auto space-y-1">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </AnimatePresence>

            {/* Thinking indicator */}
            <AnimatePresence>
              {isStreaming && messages[messages.length - 1]?.role === 'user' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-4 py-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/[0.07]">
                    {[0, 1, 2].map(i => (
                      <motion.span key={i}
                        className="w-1.5 h-1.5 rounded-full bg-slate-500"
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                        transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="relative z-10 flex-shrink-0 border-t border-white/[0.05]
                        bg-[#06060f]/90 backdrop-blur-xl px-4 sm:px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={send} disabled={isStreaming} />
            <p className="text-center text-[10px] text-slate-700 mt-2 font-medium">
              {t('chat.hint')}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
