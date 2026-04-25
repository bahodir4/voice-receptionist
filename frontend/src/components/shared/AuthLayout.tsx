import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mic, Zap, Shield, Clock, PhoneCall } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'

interface Props { children: ReactNode }

const FEATURES = [
  { icon: PhoneCall, text: 'Handles calls 24/7 automatically' },
  { icon: Zap,       text: 'Real-time AI voice responses' },
  { icon: Shield,    text: 'Secure and private sessions' },
  { icon: Clock,     text: 'Sub-second response latency' },
]

const STATS = [
  { value: '24/7', label: 'Always on' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<1s', label: 'Response time' },
]

export function AuthLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#06060f] flex">

      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[44%] relative flex-col justify-between p-12 overflow-hidden border-r border-white/[0.05]">

        {/* Background layers */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-dot-grid opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-br from-violet-950/60 via-[#06060f]/40 to-blue-950/30" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
        </div>

        {/* Ambient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-80 h-80 bg-violet-600/[0.12] rounded-full blur-[90px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-blue-600/[0.10] rounded-full blur-[70px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <div className="absolute top-3/4 left-1/6 w-32 h-32 bg-purple-500/[0.08] rounded-full blur-[50px]" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <Link to="/" className="flex items-center gap-3 group w-fit">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-blue-500 rounded-xl flex items-center justify-center
                            shadow-lg shadow-violet-900/50 group-hover:shadow-violet-500/30 transition-shadow">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-xl tracking-tight">VoiceReceptionist</span>
          </Link>
        </motion.div>

        {/* Hero content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative z-10 space-y-8"
        >
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                            bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
              AI-Powered Reception
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight">
              Your intelligent<br />
              <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                voice assistant
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Handle calls, answer questions, and book appointments — automatically, around the clock.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-2.5">
            {FEATURES.map((f, i) => (
              <motion.div key={f.text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-center gap-3 text-sm text-slate-400">
                <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-3.5 h-3.5 text-violet-400" />
                </div>
                {f.text}
              </motion.div>
            ))}
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="flex gap-3"
          >
            {STATS.map((s) => (
              <div key={s.label}
                className="flex-1 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07] text-center">
                <p className="text-white font-bold text-lg leading-tight">{s.value}</p>
                <p className="text-slate-600 text-[10px] mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative z-10"
        >
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-amber-400 text-xs">★</span>
              ))}
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              "It feels like having a full-time receptionist — without the overhead."
            </p>
            <p className="text-slate-600 text-xs mt-2.5 font-medium">— Early access user</p>
          </div>
        </motion.div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">VoiceReceptionist</span>
          </Link>
          <LanguageSwitcher />
        </header>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[380px]">
            <div className="hidden lg:flex justify-end mb-8">
              <LanguageSwitcher />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </div>
        </div>

        <footer className="px-6 pb-6 text-center">
          <p className="text-slate-700 text-xs">© 2026 VoiceReceptionist. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
