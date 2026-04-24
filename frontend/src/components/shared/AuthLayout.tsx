import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'

interface Props {
  children: ReactNode
}

export function AuthLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-auth-gradient flex flex-col">
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-700/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 bg-blue-700/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/4 w-72 h-72 bg-brand-600/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-brand-500/30 transition-shadow">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">VoiceReceptionist</span>
        </Link>
        <LanguageSwitcher />
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-6">
        <p className="text-slate-500 text-sm">© 2026 VoiceReceptionist. All rights reserved.</p>
      </footer>
    </div>
  )
}
