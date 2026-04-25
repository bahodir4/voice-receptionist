import { useEffect } from 'react'
import { Mic, MessageSquare, Phone, BarChart3, LogOut, User, Activity, Clock, Layers, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useAdmin } from '@/hooks/useAdmin'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

const stagger = {
  show: { transition: { staggerChildren: 0.07 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

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
      accent: 'from-violet-500 to-purple-600',
      glow:   'rgba(124,58,237,0.18)',
      hoverBorder: 'hover:border-violet-500/30',
      badge:    'Live',
      badgeCls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot:      'bg-emerald-400',
    },
    {
      to: '/chat',
      icon: MessageSquare,
      title: t('dashboard.cards.text_title'),
      desc:  t('dashboard.cards.text_desc'),
      accent: 'from-blue-500 to-cyan-500',
      glow:   'rgba(59,130,246,0.15)',
      hoverBorder: 'hover:border-blue-500/30',
      badge:    'Live',
      badgeCls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot:      'bg-emerald-400',
    },
    {
      to: null,
      icon: Phone,
      title: t('dashboard.cards.phone_title'),
      desc:  t('dashboard.cards.phone_desc'),
      accent: 'from-slate-600 to-slate-700',
      glow:   'transparent',
      hoverBorder: '',
      badge:    t('dashboard.coming_soon'),
      badgeCls: 'bg-slate-500/10 text-slate-500 border-slate-600/20',
      dot:      'bg-slate-600',
    },
    {
      to: '/admin',
      icon: BarChart3,
      title: t('dashboard.cards.analytics_title'),
      desc:  t('dashboard.cards.analytics_desc'),
      accent: 'from-orange-500 to-rose-500',
      glow:   'rgba(234,88,12,0.15)',
      hoverBorder: 'hover:border-orange-500/25',
      badge:    'Live',
      badgeCls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot:      'bg-emerald-400',
    },
  ]

  function fmtDuration(s: number) {
    if (s === 0) return '—'
    const m = Math.floor(s / 60)
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`
  }

  const STATS = [
    {
      icon: Activity,
      label: t('dashboard.sessions_today'),
      value: overview ? String(overview.today.total) : '—',
      delta: overview?.yesterday != null ? overview.today.total - overview.yesterday.total : null,
      sub: overview ? `${overview.all_time.total} ${t('dashboard.all_time').toLowerCase()}` : null,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      icon: Clock,
      label: t('dashboard.avg_duration'),
      value: overview ? fmtDuration(overview.avg_call_duration) : '—',
      delta: null as number | null,
      sub: t('dashboard.calls_and_voice'),
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      icon: Layers,
      label: t('dashboard.total_sessions'),
      value: overview ? String(overview.all_time.total) : '0',
      delta: null as number | null,
      sub: overview ? `${t('dashboard.today_label')}: ${overview.today.total}` : null,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
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
        <div className="absolute inset-0 bg-dot-grid opacity-30" />
        <div className="absolute -top-80 -left-80 w-[600px] h-[600px] bg-violet-800/[0.08] rounded-full blur-[130px]" />
        <div className="absolute top-1/3 -right-64 w-[450px] h-[450px] bg-blue-800/[0.06] rounded-full blur-[110px]" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-violet-900/[0.05] rounded-full blur-[90px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 border-b border-white/[0.06] bg-[#06060f]/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/40 group-hover:shadow-violet-500/25 transition-shadow">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">VoiceReceptionist</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <LanguageSwitcher />
            <div className="h-5 w-px bg-white/[0.07]" />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                <User className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-xs text-slate-300 font-medium">{user?.username}</span>
            </div>
            <button onClick={() => logout()}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-400 transition-colors px-2.5 py-1.5 rounded-xl hover:bg-rose-500/[0.06]">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Hero section */}
        <motion.div
          variants={stagger} initial="hidden" animate="show"
          className="mb-10">
          <motion.div variants={fadeUp} className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-slate-500 text-sm mb-2 font-medium">{getTimeGreeting(t)}</p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                <span className="text-white">{user?.username}</span>
                <span className="text-slate-600 font-normal text-2xl sm:text-3xl">{t('dashboard.workspace')}</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-xs text-emerald-400 font-medium">{t('dashboard.system_online')}</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={stagger} initial="hidden" animate="show"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {STATS.map((s) => (
            <motion.div key={s.label} variants={fadeUp}
              className="group relative overflow-hidden bg-[#0c0c1a] border border-white/[0.07] rounded-2xl px-5 py-5
                         hover:border-white/[0.12] transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-4.5 h-4.5 ${s.color}`} style={{ width: 18, height: 18 }} />
                </div>
                {s.delta !== null && s.delta !== 0 && (
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    s.delta > 0
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {s.delta > 0
                      ? <TrendingUp className="w-3 h-3" />
                      : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(s.delta)}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-white tracking-tight mb-1">{s.value}</p>
              <p className="text-xs font-medium text-slate-400">{s.label}</p>
              {s.sub && <p className="text-[11px] text-slate-600 mt-1">{s.sub}</p>}
            </motion.div>
          ))}
        </motion.div>

        {/* Feature cards */}
        <motion.div
          variants={stagger} initial="hidden" animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {CARDS.map((card) => (
            <motion.div key={card.title} variants={fadeUp}>
              {card.to ? (
                <Link to={card.to} className="group block h-full">
                  <div className={`relative h-full bg-[#0c0c1a] border border-white/[0.07] rounded-2xl p-5
                    ${card.hoverBorder} transition-all duration-300 hover:-translate-y-1
                    hover:shadow-[0_12px_40px_var(--card-glow)]`}
                    style={{ '--card-glow': card.glow } as React.CSSProperties}>

                    <div className={`w-12 h-12 bg-gradient-to-br ${card.accent} rounded-2xl flex items-center justify-center mb-5
                                    shadow-lg`}>
                      <card.icon className="w-5.5 h-5.5 text-white" style={{ width: 22, height: 22 }} />
                    </div>

                    <div className="flex items-start justify-between mb-2.5 gap-2">
                      <h3 className="font-semibold text-white text-sm leading-tight">{card.title}</h3>
                      <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 font-medium ${card.badgeCls}`}>
                        <span className={`w-1 h-1 rounded-full ${card.dot} ${card.dot === 'bg-emerald-400' ? 'animate-pulse' : ''}`} />
                        {card.badge}
                      </span>
                    </div>

                    <p className="text-slate-500 text-xs leading-relaxed mb-5">{card.desc}</p>

                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 group-hover:text-violet-400 transition-colors">
                      <span>{t('dashboard.open')}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="group block h-full cursor-not-allowed">
                  <div className="relative h-full bg-[#0a0a14] border border-white/[0.04] rounded-2xl p-5 opacity-50">
                    <div className={`w-12 h-12 bg-gradient-to-br ${card.accent} rounded-2xl flex items-center justify-center mb-5`}>
                      <card.icon className="w-5.5 h-5.5 text-white/70" style={{ width: 22, height: 22 }} />
                    </div>
                    <div className="flex items-start justify-between mb-2.5 gap-2">
                      <h3 className="font-semibold text-slate-500 text-sm leading-tight">{card.title}</h3>
                      <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 font-medium ${card.badgeCls}`}>
                        <span className={`w-1 h-1 rounded-full ${card.dot}`} />
                        {card.badge}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* System status */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-[#0c0c1a] border border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-200">{t('dashboard.system_status')}</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t('dashboard.all_operational')}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {SERVICES.map(s => (
              <div key={s.label}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/[0.025] border border-white/[0.05]">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.ok ? 'bg-emerald-400' : 'bg-slate-600'} ${s.ok ? 'shadow-[0_0_6px_rgba(52,211,153,0.6)]' : ''}`} />
                <span className="text-xs text-slate-400 font-medium">{s.label}</span>
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
