import { useState, useRef, type KeyboardEvent } from 'react'
import { motion } from 'framer-motion'
import { Send, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  onSend: (content: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled = false }: Props) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const canSend = value.trim().length > 0 && !disabled

  const submit = () => {
    const content = value.trim()
    if (!content || disabled) return
    onSend(content)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const onInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  return (
    <div className="flex items-end gap-3">
      {/* Textarea */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onInput={onInput}
          disabled={disabled}
          rows={1}
          placeholder={disabled ? t('chat.thinking') : t('chat.placeholder')}
          className="w-full resize-none rounded-2xl px-4 py-3 text-sm text-slate-200
                     bg-white/[0.04] border border-white/[0.08] placeholder-slate-600
                     focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06]
                     transition-all duration-200 leading-relaxed
                     disabled:opacity-50 disabled:cursor-not-allowed
                     [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ minHeight: 44, maxHeight: 120 }}
        />
      </div>

      {/* Send button */}
      <motion.button
        onClick={submit}
        disabled={!canSend}
        whileHover={canSend ? { scale: 1.06 } : {}}
        whileTap={canSend ? { scale: 0.94 } : {}}
        className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center
                   transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
                   ${canSend
                     ? 'bg-gradient-to-br from-violet-600 to-blue-600 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.45)]'
                     : 'bg-white/[0.04] border border-white/[0.07] cursor-not-allowed'
                   }`}
      >
        {disabled
          ? <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
          : <Send className={`w-4 h-4 ${canSend ? 'text-white' : 'text-slate-600'}`} />
        }
      </motion.button>
    </div>
  )
}
