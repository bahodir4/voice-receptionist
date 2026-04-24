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
    <div className="flex items-center justify-center py-24">
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

      {/* ── Background ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-dot-grid opacity-25" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[700px] h-[700px] bg-orange-900/[0.05] rounded-full blur-[140px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-900/[0.04] rounded-full blur-[100px]" />
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
          <span className="text-xs font-medium hidden sm:inline">{t('admin.back')}</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-rose-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-3 h-3 text-white" />
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
              className="w-7 h-7 flex items-center justify-center rounded-xl text-slate-500
                         hover:text-slate-300 bg-white/[0.04] border border-white/[0.07]
                         hover:bg-white/[0.07] transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </motion.button>
          )}
        </div>
      </nav>

      {/* ── Tab bar ── */}
      <div className="relative z-10 flex gap-1 px-4 sm:px-6 py-3 border-b border-white/[0.05]
                      bg-[#06060f]/50 backdrop-blur-xl overflow-x-auto flex-shrink-0
                      [scrollbar-width:none]">
        {TABS.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium
                        transition-all whitespace-nowrap flex-shrink-0
                        ${tab === id
                          ? 'bg-white/[0.07] border border-white/[0.12] text-white'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-6
                       [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.06)_transparent]">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
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
                  : <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
                        <span className="text-xs font-semibold text-slate-300">{t('admin.tab_calls')}</span>
                        {callsTotal > 0 && (
                          <span className="text-[10px] text-slate-600 px-2 py-0.5 rounded-full
                                           bg-white/[0.04] border border-white/[0.06]">{callsTotal}</span>
                        )}
                      </div>
                      <CallLogsTable items={calls} total={callsTotal} />
                    </div>
              )}

              {tab === 'chats' && (
                isLoading && chats.length === 0
                  ? <Loader />
                  : <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
                        <span className="text-xs font-semibold text-slate-300">{t('admin.tab_chats')}</span>
                        {chatsTotal > 0 && (
                          <span className="text-[10px] text-slate-600 px-2 py-0.5 rounded-full
                                           bg-white/[0.04] border border-white/[0.06]">{chatsTotal}</span>
                        )}
                      </div>
                      <div className="p-2">
                        <ConversationsPanel items={chats} total={chatsTotal} />
                      </div>
                    </div>
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
