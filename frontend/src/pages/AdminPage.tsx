import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, BarChart3, Phone, MessageSquare, Settings, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { OverviewPanel } from '@/components/Admin/OverviewPanel'
import { CallLogsTable } from '@/components/Admin/CallLogsTable'
import { ConversationsPanel } from '@/components/Admin/ConversationsPanel'
import { BusinessSettings } from '@/components/Admin/BusinessSettings'
import { useAdmin } from '@/hooks/useAdmin'

type Tab = 'overview' | 'calls' | 'chats' | 'settings'

const TABS: { id: Tab; labelKey: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'overview',  labelKey: 'admin.tab_overview',  icon: BarChart3 },
  { id: 'calls',     labelKey: 'admin.tab_calls',     icon: Phone },
  { id: 'chats',     labelKey: 'admin.tab_chats',     icon: MessageSquare },
  { id: 'settings',  labelKey: 'admin.tab_settings',  icon: Settings },
]

function Loader() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span key={i}
            className="w-2 h-2 rounded-full bg-slate-700"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
            transition={{ duration: 0.75, delay: i * 0.15, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  )
}

export function AdminPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('overview')

  const {
    overview, calls, callsTotal, chats, chatsTotal,
    settings, isLoading, isSaving,
    loadOverview, loadCalls, loadChats, loadSettings, saveSettings,
  } = useAdmin()

  useEffect(() => {
    if (tab === 'overview') loadOverview()
    if (tab === 'calls')    loadCalls()
    if (tab === 'chats')    loadChats()
    if (tab === 'settings') loadSettings()
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  function refresh() {
    if (tab === 'overview') loadOverview()
    if (tab === 'calls')    loadCalls()
    if (tab === 'chats')    loadChats()
  }

  return (
    <div className="min-h-screen bg-[#06060f] flex flex-col overflow-hidden">

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-dot-grid opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[700px] h-[700px] bg-orange-900/[0.05] rounded-full blur-[150px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-900/[0.04] rounded-full blur-[110px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-6 h-14
                      border-b border-white/[0.06] bg-[#06060f]/80 backdrop-blur-xl flex-shrink-0">
        <Link to="/dashboard"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors group">
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center
                          group-hover:border-white/[0.14] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-medium hidden sm:inline">{t('admin.back')}</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/30">
            <BarChart3 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-white text-sm tracking-tight">{t('admin.title')}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          {tab !== 'settings' && (
            <motion.button
              onClick={refresh}
              disabled={isLoading}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500
                         hover:text-slate-300 bg-white/[0.04] border border-white/[0.07]
                         hover:bg-white/[0.07] hover:border-white/[0.12] transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </motion.button>
          )}
        </div>
      </nav>

      {/* Tab bar — underline style */}
      <div className="relative z-10 flex-shrink-0 border-b border-white/[0.06]
                      bg-[#06060f]/60 backdrop-blur-xl overflow-x-auto [scrollbar-width:none]">
        <div className="flex px-4 sm:px-6 max-w-5xl mx-auto">
          {TABS.map(({ id, labelKey, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative flex items-center gap-2 px-4 py-3.5 text-xs font-semibold
                          transition-colors whitespace-nowrap flex-shrink-0 border-b-2
                          ${tab === id
                            ? 'text-white border-violet-500'
                            : 'text-slate-500 hover:text-slate-300 border-transparent hover:border-white/[0.1]'}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t(labelKey)}
              {tab === id && (
                <motion.div
                  layoutId="tab-glow"
                  className="absolute inset-0 bg-violet-500/[0.06] rounded-lg"
                  transition={{ duration: 0.2 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-6
                       [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.06)_transparent]">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {tab === 'overview' && (
                isLoading && !overview
                  ? <Loader />
                  : overview
                  ? <OverviewPanel data={overview} />
                  : null
              )}

              {tab === 'calls' && (
                isLoading && calls.length === 0
                  ? <Loader />
                  : (
                    <div className="bg-[#0c0c1a] border border-white/[0.07] rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-sm font-semibold text-slate-200">{t('admin.tab_calls')}</span>
                        </div>
                        {callsTotal > 0 && (
                          <span className="text-xs text-slate-500 px-2.5 py-1 rounded-lg
                                           bg-white/[0.04] border border-white/[0.06] font-medium">
                            {callsTotal}
                          </span>
                        )}
                      </div>
                      <CallLogsTable items={calls} total={callsTotal} />
                    </div>
                  )
              )}

              {tab === 'chats' && (
                isLoading && chats.length === 0
                  ? <Loader />
                  : (
                    <div className="bg-[#0c0c1a] border border-white/[0.07] rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-sm font-semibold text-slate-200">{t('admin.tab_chats')}</span>
                        </div>
                        {chatsTotal > 0 && (
                          <span className="text-xs text-slate-500 px-2.5 py-1 rounded-lg
                                           bg-white/[0.04] border border-white/[0.06] font-medium">
                            {chatsTotal}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <ConversationsPanel items={chats} total={chatsTotal} />
                      </div>
                    </div>
                  )
              )}

              {tab === 'settings' && (
                <BusinessSettings settings={settings} isSaving={isSaving} onSave={saveSettings} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
