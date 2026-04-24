import { motion } from 'framer-motion'
import { Phone, Mic, MessageSquare, Clock, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { type OverviewData, type ChartPoint } from '@/store/adminStore'

interface Props { data: OverviewData }

function StatCard({ icon: Icon, label, today, allTime, color }: {
  icon: React.FC<{ className?: string }>
  label: string
  today: number
  allTime: number
  color: string
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-xs text-slate-500 font-medium">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-white leading-none">{today}</p>
          <p className="text-[10px] text-slate-600 mt-1">today</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-400">{allTime}</p>
          <p className="text-[10px] text-slate-600 mt-0.5">all time</p>
        </div>
      </div>
    </div>
  )
}

function BarChart({ points }: { points: ChartPoint[] }) {
  const maxVal = Math.max(...points.map((p) => p.phone_calls + p.voice_sessions + p.chat_sessions), 1)

  return (
    <div className="flex items-end gap-1.5 h-24">
      {points.map((p, i) => {
        const total = p.phone_calls + p.voice_sessions + p.chat_sessions
        const heightPct = (total / maxVal) * 100

        return (
          <div key={p.date} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full flex flex-col justify-end" style={{ height: 80 }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(heightPct, 2)}%` }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
                className="w-full rounded-t-sm bg-gradient-to-t from-teal-600/60 to-emerald-500/40
                           border border-teal-500/20 relative group-hover:from-teal-500/80 transition-colors"
              >
                {total > 0 && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2
                                   text-[9px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {total}
                  </span>
                )}
              </motion.div>
            </div>
            <span className="text-[8px] text-slate-700 tabular-nums">
              {new Date(p.date).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function OverviewPanel({ data }: Props) {
  const { t } = useTranslation()

  function fmtDuration(s: number) {
    if (s === 0) return '—'
    const m = Math.floor(s / 60)
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Phone}        label={t('admin.phone_calls')}    today={data.today.phone_calls}    allTime={data.all_time.phone_calls}    color="bg-teal-600" />
        <StatCard icon={Mic}          label={t('admin.voice_sessions')} today={data.today.voice_sessions} allTime={data.all_time.voice_sessions} color="bg-violet-600" />
        <StatCard icon={MessageSquare} label={t('admin.chat_sessions')} today={data.today.chat_sessions}  allTime={data.all_time.chat_sessions}  color="bg-blue-600" />
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-orange-700">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs text-slate-500 font-medium">{t('admin.avg_duration')}</span>
          </div>
          <p className="text-2xl font-bold text-white leading-none">{fmtDuration(data.avg_call_duration)}</p>
        </div>
      </div>

      {/* Chart */}
      {data.chart.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-semibold text-slate-300">{t('admin.chart_title')}</span>
          </div>
          <BarChart points={data.chart} />
          <div className="flex items-center gap-4 mt-3 justify-end">
            {[
              { color: 'bg-teal-500', label: t('admin.phone_calls') },
              { color: 'bg-violet-500', label: t('admin.voice_sessions') },
              { color: 'bg-blue-500', label: t('admin.chat_sessions') },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${l.color}`} />
                <span className="text-[10px] text-slate-600">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
