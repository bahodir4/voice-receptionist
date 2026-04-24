import { motion } from 'framer-motion'
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { type CallLogItem } from '@/store/adminStore'

interface Props {
  items: CallLogItem[]
  total: number
}

function fmtDuration(s: number) {
  if (s === 0) return '—'
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_COLOR: Record<string, string> = {
  completed:     'text-emerald-400',
  'in-progress': 'text-emerald-400',
  ringing:       'text-yellow-400',
  initiated:     'text-yellow-400',
  failed:        'text-red-400',
  'no-answer':   'text-orange-400',
  busy:          'text-orange-400',
  canceled:      'text-slate-500',
}

export function CallLogsTable({ items, total }: Props) {
  const { t } = useTranslation()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <PhoneIncoming className="w-8 h-8 text-slate-700" />
        <p className="text-sm text-slate-500">{t('admin.no_calls')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0 overflow-x-auto">
      {/* Header */}
      <div className="grid grid-cols-[1fr_1fr_1fr_100px_80px] gap-3 px-4 py-2.5 border-b border-white/[0.05]">
        {['admin.col_from', 'admin.col_to', 'admin.col_status', 'admin.col_duration', 'admin.col_time'].map((k) => (
          <span key={k} className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">{t(k)}</span>
        ))}
      </div>

      {items.map((item, i) => {
        const isInbound = item.direction === 'inbound'
        const isMissed  = item.status === 'no-answer' || item.status === 'failed'
        const Icon = isMissed ? PhoneMissed : isInbound ? PhoneIncoming : PhoneOutgoing
        const iconColor = isMissed ? 'text-red-400' : isInbound ? 'text-blue-400' : 'text-violet-400'

        return (
          <motion.div
            key={item.call_id}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            className="grid grid-cols-[1fr_1fr_1fr_100px_80px] gap-3 px-4 py-3
                       border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon className={`w-3 h-3 flex-shrink-0 ${iconColor}`} />
              <span className="text-xs text-slate-300 truncate font-mono">{item.from_number}</span>
            </div>
            <span className="text-xs text-slate-400 truncate font-mono self-center">{item.to_number}</span>
            <span className={`text-xs self-center ${STATUS_COLOR[item.status] ?? 'text-slate-500'}`}>
              {t(`phone.status_${item.status.replace('-', '_') as 'completed'}`)}
            </span>
            <div className="flex items-center gap-1 self-center">
              <Clock className="w-3 h-3 text-slate-600" />
              <span className="text-xs text-slate-500">{fmtDuration(item.duration_seconds)}</span>
            </div>
            <span className="text-[11px] text-slate-600 self-center">{fmtTime(item.created_at)}</span>
          </motion.div>
        )
      })}

      {total > items.length && (
        <p className="text-center text-xs text-slate-700 py-3">
          {t('admin.showing', { count: items.length, total })}
        </p>
      )}
    </div>
  )
}
