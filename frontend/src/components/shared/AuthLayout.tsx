import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mic, Sparkles, Shield, Zap } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'

interface Props { children: ReactNode }

const FEATURES = [
  { icon: Mic,      text: 'Natural voice conversations' },
  { icon: Zap,      text: 'Real-time AI responses' },
  { icon: Shield,   text: 'Secure & private sessions' },
  { icon: Sparkles, text: 'Multilingual support' },
]

export function AuthLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#06060f] flex">

      {/* ── Left branding panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] relative flex-col justify-between p-12 overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0 bg-dot-grid opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/80 via-[#06060f] to-blue-950/40" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-600/20 rounded-full blur-[80px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-600/15 rounded-full blur-[60px] animate-float-delay" />
        <div className="absolute top-3/4 left-1/6 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] animate-float" style={{ animationDelay: '1s' }} />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <Link to="/" className="flex items-center gap-3 group w-fit">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/50 group-hover:shadow-violet-500/30 transition-shadow">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-xl tracking-tight">VoiceReceptionist</span>
          </Link>
        </motion.div>

        {/* Hero copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative z-10 space-y-8"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
              AI-Powered Reception
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
              Your intelligent<br />
              <span className="text-gradient">voice assistant</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Handle calls, answer questions, and book appointments — automatically, 24/7.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-center gap-3 text-sm text-slate-400"
              >
                <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-3.5 h-3.5 text-violet-400" />
                </div>
                {f.text}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="relative z-10"
        >
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-slate-400 text-sm italic leading-relaxed">
              "It feels like having a full-time receptionist — without the overhead."
            </p>
            <p className="text-slate-600 text-xs mt-2">— Early access user</p>
          </div>
        </motion.div>
      </div>

      {/* ── Right form panel ── */}
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
          <div className="w-full max-w-sm">

            {/* Desktop lang switcher */}
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

        {/* Footer */}
        <footer className="px-6 pb-6 text-center">
          <p className="text-slate-700 text-xs">© 2026 VoiceReceptionist. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
