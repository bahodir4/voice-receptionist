import { useEffect } from 'react'
import { Mic, MessageSquare, Phone, BarChart3, LogOut, User, Activity, Clock, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useAdmin } from '@/hooks/useAdmin'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

export function DashboardPage() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { overview, loadOverview } = useAdmin()

  useEffect(() => { loadOverview() }, [loadOverview])

  const CARDS = [
    {
      to: '/voice',
      icon: Mic,
      title: t('dashboard.cards.voice_title'),
      desc:  t('dashboard.cards.voice_desc'),
      gradient:    'from-violet-600 to-purple-600',
      borderHover: 'hover:border-violet-500/40',
      glowHover:   'hover:shadow-[0_8px_32px_rgba(124,58,237,0.2)]',
      badge:    'Live',
      badgeCls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot:      'bg-emerald-400',
    },
    {
      to: '/chat',
      icon: MessageSquare,
      title: t('dashboard.cards.text_title'),
      desc:  t('dashboard.cards.text_desc'),
      gradient:    'from-blue-600 to-cyan-600',
      borderHover: 'hover:border-blue-500/40',
      glowHover:   'hover:shadow-[0_8px_32px_rgba(59,130,246,0.2)]',
      badge:    'Live',
      badgeCls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot:      'bg-emerald-400',
    },
    {
      to: '/phone',
      icon: Phone,
      title: t('dashboard.cards.phone_title'),
      desc:  t('dashboard.cards.phone_desc'),
      gradient:    'from-teal-600 to-emerald-600',
      borderHover: 'hover:border-teal-500/30',
      glowHover:   'hover:shadow-[0_8px_32px_rgba(20,184,166,0.15)]',
      badge:    'Live',
      badgeCls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot:      'bg-emerald-400',
    },
    {
      to: '/admin',
      icon: BarChart3,
      title: t('dashboard.cards.analytics_title'),
      desc:  t('dashboard.cards.analytics_desc'),
      gradient:    'from-orange-600 to-rose-600',
      borderHover: 'hover:border-orange-500/30',
      glowHover:   'hover:shadow-[0_8px_32px_rgba(234,88,12,0.15)]',
      badge:    'Live',
      badgeCls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot:      'bg-emerald-400',
    },
  ]

  function fmtDuration(s: number) {
    if (s === 0) return '—'
    const m = Math.floor(s / 60)
    return m > 0 ? `${m}m` : `${s}s`
  }

  const STATS = [
    {
      icon: Activity,
      label: t('dashboard.sessions_today'),
      value: overview ? String(overview.today.total) : '—',
      sub: overview ? t('dashboard.no_data') : t('dashboard.no_data'),
    },
    {
      icon: Clock,
      label: t('dashboard.avg_duration'),
      value: overview ? fmtDuration(overview.avg_call_duration) : '—',
      sub: t('dashboard.no_data'),
    },
    {
      icon: Layers,
      label: t('dashboard.total_sessions'),
      value: overview ? String(overview.all_time.total) : '0',
      sub: t('dashboard.all_time'),
    },
  ]

  const SERVICES = [
    { label: 'Backend API', ok: true },
    { label: 'MongoDB',     ok: true },
    { label: 'LiveKit',     ok: true },
    { label: 'ElevenLabs',  ok: true },
  ]

  return (
    <div className="min-h-screen bg-[#06060f]">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid opacity-40" />
        <div className="absolute -top-64 -left-64 w-[500px] h-[500px] bg-violet-800/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-48 w-96 h-96 bg-blue-800/[0.08] rounded-full blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 border-b border-white/[0.06] bg-[#06060f]/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Mic className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">VoiceReceptionist</span>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                <User className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-xs text-slate-300 font-medium">{user?.username}</span>
            </div>
            <button onClick={() => logout()}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors px-2.5 py-1.5 rounded-xl hover:bg-white/[0.04]">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="mb-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-slate-500 text-sm mb-1">{getTimeGreeting(t)}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {user?.username}
                <span className="text-slate-600 font-normal">{t('dashboard.workspace')}</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">{t('dashboard.system_online')}</span>
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {STATS.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl px-5 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                <s.icon className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {CARDS.map((card, i) => (
            <motion.div key={card.to}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}>
              <Link to={card.to} className="group block h-full">
                <div className={`relative h-full bg-white/[0.025] border border-white/[0.07] rounded-2xl p-5
                  ${card.borderHover} ${card.glowHover}
                  hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-0.5`}>

                  <div className={`w-11 h-11 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3 className="font-semibold text-white text-sm leading-tight">{card.title}</h3>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${card.badgeCls}`}>
                      <span className={`w-1 h-1 rounded-full ${card.dot}`} />
                      {card.badge}
                    </span>
                  </div>

                  <p className="text-slate-500 text-xs leading-relaxed">{card.desc}</p>

                  <div className="mt-4 flex items-center gap-1 text-xs text-slate-600 group-hover:text-slate-400 transition-colors">
                    <span>{t('dashboard.open')}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* System status */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
          className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-300">{t('dashboard.system_status')}</p>
            <span className="text-xs text-slate-600">{t('dashboard.all_operational')}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SERVICES.map(s => (
              <div key={s.label}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.ok ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <span className="text-xs text-slate-400">{s.label}</span>
                {s.ok && <span className="ml-auto text-xs text-emerald-500/60">OK</span>}
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}

function getTimeGreeting(t: (k: string) => string) {
  const h = new Date().getHours()
  if (h < 12) return t('dashboard.greeting_morning')
  if (h < 17) return t('dashboard.greeting_afternoon')
  return t('dashboard.greeting_evening')
}
