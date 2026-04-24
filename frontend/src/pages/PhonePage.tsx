import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Phone, PhoneIncoming, PhoneOutgoing,
  PhoneMissed, RefreshCw, Activity,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { OutboundDialer } from '@/components/Phone/OutboundDialer'
import { CallCard } from '@/components/Phone/CallCard'
import { ActiveCallBanner } from '@/components/Phone/ActiveCallBanner'
import { usePhone } from '@/hooks/usePhone'

// ── Group calls by date label ──────────────────────────────────────────────────

function dateLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function groupByDate(calls: ReturnType<typeof usePhone>['calls']) {
  const groups: { label: string; items: typeof calls }[] = []
  for (const call of calls) {
    const label = dateLabel(call.created_at)
    const existing = groups.find((g) => g.label === label)
    if (existing) existing.items.push(call)
    else groups.push({ label, items: [call] })
  }
  return groups
}

// ── Mini stat pill ─────────────────────────────────────────────────────────────

function StatPill({ icon: Icon, label, value, color }: {
  icon: React.FC<{ className?: string }>
  label: string
  value: number
  color: string
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl
                    bg-white/[0.03] border border-white/[0.06]">
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-3 h-3 text-white" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white leading-none">{value}</p>
        <p className="text-[10px] text-slate-600 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function PhonePage() {
  const { t } = useTranslation()
  const { calls, total, isLoading, isDialing, activeCall, loadCalls, dialOut, clearActiveCall } = usePhone()

  const [dialNumber, setDialNumber] = useState('')

  useEffect(() => { loadCalls() }, [loadCalls])

  function handleDial() {
    if (dialNumber.trim().length >= 7) dialOut(dialNumber.trim())
  }

  const groups = groupByDate(calls)
  const inboundCount  = calls.filter((c) => c.direction === 'inbound').length
  const outboundCount = calls.filter((c) => c.direction === 'outbound').length
  const missedCount   = calls.filter((c) => c.status === 'no-answer' || c.status === 'failed').length

  return (
    <div className="min-h-screen bg-[#06060f] flex flex-col overflow-hidden">

      {/* ── Background ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-dot-grid opacity-25" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[700px] h-[700px] bg-emerald-900/[0.06] rounded-full blur-[140px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-900/[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-800/[0.04] rounded-full blur-[80px]" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-4
                      border-b border-white/[0.05] bg-[#06060f]/70 backdrop-blur-xl flex-shrink-0">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors group"
        >
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center
                          group-hover:border-white/[0.14] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium hidden sm:inline">{t('phone.back')}</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Phone className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-white text-sm tracking-tight">{t('phone.title')}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
                          bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline font-medium">Live</span>
          </div>

          <motion.button
            onClick={loadCalls}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="w-7 h-7 flex items-center justify-center rounded-xl text-slate-500
                       hover:text-slate-300 bg-white/[0.04] border border-white/[0.07]
                       hover:bg-white/[0.07] hover:border-white/[0.12] transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </nav>

      {/* ── Active call banner ── */}
      <div className="relative z-20">
        <ActiveCallBanner call={activeCall} onDismiss={clearActiveCall} />
      </div>

      {/* ── Main ── */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-6
                       [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.06)_transparent]">
        <div className="max-w-5xl mx-auto flex flex-col gap-6">

          {/* ── Stats row ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            <StatPill icon={Activity}       label={t('phone.stat_total')}    value={total}         color="bg-teal-600" />
            <StatPill icon={PhoneIncoming}  label={t('phone.inbound')}       value={inboundCount}  color="bg-blue-600" />
            <StatPill icon={PhoneOutgoing}  label={t('phone.outbound')}      value={outboundCount} color="bg-violet-600" />
            <StatPill icon={PhoneMissed}    label={t('phone.stat_missed')}   value={missedCount}   color="bg-red-700" />
          </motion.div>

          {/* ── Two-column layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">

            {/* ── Left: Dialer ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="rounded-2xl bg-white/[0.025] border border-white/[0.07] p-5"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/15
                                border border-teal-500/25 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <h2 className="text-sm font-semibold text-white">{t('phone.outbound_title')}</h2>
              </div>

              <OutboundDialer
                number={dialNumber}
                isDialing={isDialing}
                onChange={setDialNumber}
                onDial={handleDial}
              />

              <p className="text-[11px] text-slate-700 mt-4 leading-relaxed text-center">
                {t('phone.dialer_hint')}
              </p>
            </motion.div>

            {/* ── Right: Call history ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl bg-white/[0.02] border border-white/[0.06]
                         flex flex-col overflow-hidden min-h-[400px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <PhoneIncoming className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-300">{t('phone.history_title')}</span>
                </div>
                {total > 0 && (
                  <span className="text-[10px] text-slate-600 px-2 py-0.5 rounded-full
                                   bg-white/[0.04] border border-white/[0.06]">
                    {total}
                  </span>
                )}
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-2 py-2
                              [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.05)_transparent]">
                <AnimatePresence initial={false}>
                  {isLoading && calls.length === 0 ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-slate-600"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 0.75, delay: i * 0.15, repeat: Infinity }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : calls.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-20 gap-4 text-center"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06]
                                      flex items-center justify-center">
                        <Phone className="w-7 h-7 text-slate-700" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium text-slate-400">{t('phone.no_calls')}</p>
                        <p className="text-xs text-slate-600 max-w-[220px] leading-relaxed">
                          {t('phone.no_calls_desc')}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {groups.map((group) => (
                        <div key={group.label}>
                          <div className="px-3 py-1.5">
                            <span className="text-[10px] font-semibold tracking-widest uppercase
                                             text-slate-600">
                              {group.label}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            {group.items.map((call) => (
                              <CallCard key={call.call_id} call={call} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
