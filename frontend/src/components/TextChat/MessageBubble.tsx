import { motion } from 'framer-motion'
import { Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { type ChatMessage } from '@/store/chatStore'

interface Props {
  message: ChatMessage
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5
        ${isUser
          ? 'bg-violet-500/15 border border-violet-500/25'
          : 'bg-white/[0.06] border border-white/[0.10]'}`}>
        {isUser
          ? <User className="w-3 h-3 text-violet-400" />
          : <Bot  className="w-3 h-3 text-slate-400" />}
      </div>

      {/* Bubble */}
      <div className={`group max-w-[78%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-violet-600/[0.18] text-slate-200 rounded-tr-[4px] border border-violet-500/20'
            : 'bg-white/[0.05] text-slate-300 rounded-tl-[4px] border border-white/[0.08]'}`}>

          {/* Typing dots when content is still empty */}
          {message.isStreaming && message.content === '' ? (
            <span className="inline-flex gap-1 align-middle py-0.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="inline-block w-1.5 h-1.5 rounded-full bg-slate-500"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ duration: 0.75, delay: i * 0.15, repeat: Infinity }}
                />
              ))}
            </span>
          ) : (
            <>
              {isUser ? (
                <span className="whitespace-pre-wrap">{message.content}</span>
              ) : (
                <div className="prose prose-sm prose-invert max-w-none
                                prose-p:my-0.5 prose-p:leading-relaxed
                                prose-ul:my-1 prose-ul:pl-4 prose-li:my-0
                                prose-strong:text-slate-200 prose-strong:font-semibold
                                prose-headings:text-slate-200 prose-headings:font-semibold
                                prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
              {/* Streaming cursor */}
              {message.isStreaming && (
                <span className="inline-block ml-0.5 w-[2px] h-[14px] bg-violet-400/60 animate-pulse align-middle" />
              )}
            </>
          )}
        </div>

        {/* Timestamp — visible on hover */}
        <span className="text-[10px] text-slate-700 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  )
}
