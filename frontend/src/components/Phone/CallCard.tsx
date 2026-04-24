import { motion } from 'framer-motion'
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, PhoneCall } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { type PhoneCall as IPhoneCall, type CallStatus } from '@/store/phoneStore'

interface Props {
  call: IPhoneCall
}

function formatDuration(s: number): string {
  if (s === 0) return ''
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const STATUS_DOT: Record<CallStatus, string> = {
  initiated:     'bg-yellow-400/80 animate-pulse',
  ringing:       'bg-yellow-400/80 animate-pulse',
  'in-progress': 'bg-emerald-400 animate-pulse',
  completed:     'bg-slate-500',
  failed:        'bg-red-500',
  'no-answer':   'bg-orange-500',
  busy:          'bg-orange-500',
  canceled:      'bg-slate-600',
}

const ACTIVE: CallStatus[] = ['initiated', 'ringing', 'in-progress']

export function CallCard({ call }: Props) {
  const { t } = useTranslation()
  const isInbound = call.direction === 'inbound'
  const isActive  = ACTIVE.includes(call.status)
  const isMissed  = call.status === 'no-answer' || call.status === 'failed'

  const Icon = isActive
    ? PhoneCall
    : isMissed
    ? PhoneMissed
    : isInbound
    ? PhoneIncoming
    : PhoneOutgoing

  const iconColor = isActive
    ? 'text-emerald-400'
    : isMissed
    ? 'text-red-400'
    : isInbound
    ? 'text-blue-400'
    : 'text-violet-400'

  const iconBg = isActive
    ? 'bg-emerald-500/10 border-emerald-500/20'
    : isMissed
    ? 'bg-red-500/10 border-red-500/20'
    : isInbound
    ? 'bg-blue-500/10 border-blue-500/15'
    : 'bg-violet-500/10 border-violet-500/15'

  const peerNumber = isInbound ? call.from_number : call.to_number
  const duration   = formatDuration(call.duration_seconds)

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-colors
                  hover:bg-white/[0.04]
                  ${isActive ? 'bg-emerald-500/[0.04] border border-emerald-500/10' : ''}`}
    >
      {/* Direction icon */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>

      {/* Number + status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium tracking-wide truncate
                            ${isMissed ? 'text-red-400' : 'text-slate-200'}`}>
            {peerNumber}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[call.status]}`} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[11px]
                            ${isInbound ? 'text-blue-500/70' : 'text-violet-500/70'}`}>
            {t(isInbound ? 'phone.inbound' : 'phone.outbound')}
          </span>
          {duration && (
            <>
              <span className="text-slate-700 text-[11px]">·</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-600">
                <Clock className="w-2.5 h-2.5" />
                {duration}
              </span>
            </>
          )}
          {isActive && (
            <span className="text-[10px] text-emerald-400/80 font-medium tracking-wide">
              {call.status === 'in-progress' ? t('phone.status_in_progress')
                : call.status === 'ringing' ? t('phone.status_ringing')
                : t('phone.status_initiated')}
            </span>
          )}
        </div>
      </div>

      {/* Time */}
      <span className="flex-shrink-0 text-[11px] text-slate-600
                       opacity-60 group-hover:opacity-100 transition-opacity">
        {formatTime(call.created_at)}
      </span>
    </motion.div>
  )
}
