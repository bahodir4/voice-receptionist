import { Mic, MessageSquare, Phone, BarChart3, LogOut, Settings, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

const CARDS = [
  {
    to: '/voice',
    icon: Mic,
    title: 'Voice Chat',
    desc: 'Talk to your AI receptionist via browser mic',
    gradient: 'from-brand-600 to-purple-600',
    glow: 'group-hover:shadow-brand-600/30',
    badge: 'Live',
    badgeColor: 'bg-emerald-500',
  },
  {
    to: '/chat',
    icon: MessageSquare,
    title: 'Text Chat',
    desc: 'Chat with your AI receptionist via text',
    gradient: 'from-blue-600 to-cyan-600',
    glow: 'group-hover:shadow-blue-600/30',
    badge: 'Live',
    badgeColor: 'bg-emerald-500',
  },
  {
    to: '/phone',
    icon: Phone,
    title: 'Phone Calls',
    desc: 'Handle inbound calls via Twilio integration',
    gradient: 'from-emerald-600 to-teal-600',
    glow: 'group-hover:shadow-emerald-600/30',
    badge: 'Phase 4',
    badgeColor: 'bg-slate-500',
  },
  {
    to: '/admin',
    icon: BarChart3,
    title: 'Analytics',
    desc: 'Call logs, transcripts, bookings & FAQs',
    gradient: 'from-orange-600 to-rose-600',
    glow: 'group-hover:shadow-orange-600/30',
    badge: 'Phase 5',
    badgeColor: 'bg-slate-500',
  },
]

export function DashboardPage() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-auth-gradient">
      {/* Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-700/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-700/10 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-slate-800/60 bg-slate-900/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">VoiceReceptionist</span>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm text-slate-300 font-medium">{user?.username}</span>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-800/60"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">
              Good {getGreeting()}, {user?.username} 👋
            </h1>
            <p className="text-slate-400">Your AI receptionist is ready. What would you like to do?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CARDS.map((card, i) => (
              <motion.div
                key={card.to}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
              >
                <Link to={card.to} className={`group block h-full`}>
                  <div className={`relative h-full bg-slate-900/70 border border-slate-700/60 rounded-2xl p-6
                    hover:border-slate-600 transition-all duration-300 hover:-translate-y-1
                    shadow-xl ${card.glow} hover:shadow-2xl`}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                      <card.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white text-base">{card.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${card.badgeColor}`}>
                        {card.badge}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Status panel */}
          <div className="mt-8 bg-slate-900/60 border border-slate-700/60 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">System Status</h2>
              <Settings className="w-4 h-4 text-slate-500" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Backend API', ok: true },
                { label: 'MongoDB', ok: true },
                { label: 'LiveKit', ok: false },
                { label: 'ElevenLabs', ok: false },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${s.ok ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span className="text-sm text-slate-400">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
