import { motion, AnimatePresence } from 'framer-motion'
import { Mic, PhoneOff, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { type AgentState } from '@/store/voiceStore'

interface Props {
  state: AgentState
  onStart: () => void
  onEnd: () => void
}

export function CallButton({ state, onStart, onEnd }: Props) {
  const { t } = useTranslation()
  const isIdle       = state === 'idle' || state === 'disconnected'
  const isConnecting = state === 'connecting' || state === 'initializing'
  const isActive     = !isIdle && !isConnecting

  return (
    <div className="flex flex-col items-center gap-3">
      <AnimatePresence mode="wait">

        {isIdle && (
          <motion.button key="start" onClick={onStart}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="relative flex items-center gap-3 px-8 py-3.5 rounded-2xl font-semibold text-sm text-white
                       bg-gradient-to-r from-violet-600 to-blue-600
                       shadow-[0_0_32px_rgba(124,58,237,0.35)] hover:shadow-[0_0_48px_rgba(124,58,237,0.5)]
                       transition-shadow duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-violet-500" />
            <Mic className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{t('voice.start_call')}</span>
          </motion.button>
        )}

        {isConnecting && (
          <motion.div key="connecting"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="flex items-center gap-3 px-8 py-3.5 rounded-2xl text-sm font-medium text-slate-400
                       bg-white/[0.04] border border-white/[0.08]">
            <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
            <span>{t('voice.connecting')}</span>
          </motion.div>
        )}

        {isActive && (
          <motion.button key="end" onClick={onEnd}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-semibold text-sm text-white
                       bg-gradient-to-r from-red-600 to-rose-600
                       shadow-[0_0_28px_rgba(220,38,38,0.3)] hover:shadow-[0_0_40px_rgba(220,38,38,0.45)]
                       transition-shadow duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <PhoneOff className="w-4 h-4" />
            {t('voice.end_call')}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
