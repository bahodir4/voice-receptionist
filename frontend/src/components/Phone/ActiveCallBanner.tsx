import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PhoneCall, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { type PhoneCall as IPhoneCall } from '@/store/phoneStore'

interface Props {
  call: IPhoneCall | null
  onDismiss: () => void
}

function useTimer(running: boolean) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    if (!running) { setSecs(0); return }
    const id = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])
  const mm = Math.floor(secs / 60).toString().padStart(2, '0')
  const ss = (secs % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
}

export function ActiveCallBanner({ call, onDismiss }: Props) {
  const { t } = useTranslation()
  const isActive = !!call && ['initiated', 'ringing', 'in-progress'].includes(call.status)
  const timer = useTimer(isActive)

  return (
    <AnimatePresence>
      {call && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22 }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5
                          bg-emerald-500/[0.07] border-b border-emerald-500/15">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-emerald-300 font-medium truncate">
                {t('phone.active_call')}
                {' — '}
                {call.direction === 'outbound' ? call.to_number : call.from_number}
              </span>
              {isActive && (
                <span className="text-xs text-emerald-500/60 font-mono tabular-nums">{timer}</span>
              )}
            </div>
            <button
              onClick={onDismiss}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full
                         text-slate-500 hover:text-slate-300 hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
