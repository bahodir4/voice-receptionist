import { motion } from 'framer-motion'
import { PhoneCall, Delete } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  number: string
  isDialing: boolean
  onChange: (v: string) => void
  onDial: () => void
}

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['+', '0', '#'],
]

export function OutboundDialer({ number, isDialing, onChange, onDial }: Props) {
  const { t } = useTranslation()

  function press(key: string) {
    if (number.length < 18) onChange(number + key)
  }

  function del() {
    onChange(number.slice(0, -1))
  }

  const canCall = number.trim().length >= 7 && !isDialing

  return (
    <div className="flex flex-col gap-4">

      {/* Number display */}
      <div className="relative flex items-center justify-center px-4 py-4 rounded-2xl
                      bg-white/[0.03] border border-white/[0.07] min-h-[64px]">
        {number ? (
          <span className="text-2xl font-light tracking-widest text-white tabular-nums">
            {number}
          </span>
        ) : (
          <span className="text-sm text-slate-600">{t('phone.number_placeholder')}</span>
        )}
        {number && (
          <motion.button
            onClick={del}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            className="absolute right-4 text-slate-600 hover:text-slate-400 transition-colors"
          >
            <Delete className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {KEYS.flat().map((key) => (
          <motion.button
            key={key}
            onClick={() => press(key)}
            disabled={isDialing}
            whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.07)' }}
            whileTap={{ scale: 0.94 }}
            className="flex flex-col items-center justify-center py-3.5 rounded-xl
                       bg-white/[0.04] border border-white/[0.06]
                       text-white font-medium text-lg select-none
                       disabled:opacity-40 transition-colors"
          >
            <span className="leading-none">{key}</span>
            <span className="text-[8px] text-slate-600 mt-0.5 tracking-widest">
              {SUB[key] ?? ''}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Call button */}
      <motion.button
        onClick={onDial}
        disabled={!canCall}
        whileHover={{ scale: canCall ? 1.02 : 1 }}
        whileTap={{ scale: canCall ? 0.97 : 1 }}
        className="flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-medium
                   bg-emerald-500/[0.15] border border-emerald-500/30 text-emerald-300 text-sm
                   hover:bg-emerald-500/[0.25] hover:border-emerald-500/50
                   disabled:opacity-35 disabled:cursor-not-allowed transition-all"
      >
        {isDialing ? (
          <span className="flex items-center gap-2">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ duration: 0.75, delay: i * 0.15, repeat: Infinity }}
                />
              ))}
            </span>
            {t('phone.calling')}
          </span>
        ) : (
          <>
            <PhoneCall className="w-4 h-4" />
            {t('phone.call_button')}
          </>
        )}
      </motion.button>
    </div>
  )
}

const SUB: Record<string, string> = {
  '+': 'INTL',
  '2': 'ABC',  '3': 'DEF',  '4': 'GHI',
  '5': 'JKL',  '6': 'MNO',  '7': 'PQRS',
  '8': 'TUV',  '9': 'WXYZ',
}
