import { motion } from 'framer-motion'
import { MessageSquare, Hash } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { type ChatSessionItem } from '@/store/adminStore'

interface Props {
  items: ChatSessionItem[]
  total: number
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function ConversationsPanel({ items, total }: Props) {
  const { t } = useTranslation()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <MessageSquare className="w-8 h-8 text-slate-700" />
        <p className="text-sm text-slate-500">{t('admin.no_chats')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {items.map((item, i) => (
        <motion.div
          key={item.session_id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.025 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl
                     hover:bg-white/[0.04] transition-colors group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/15
                          flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-200 truncate font-medium">
              {item.title || t('admin.untitled_chat')}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <Hash className="w-2.5 h-2.5 text-slate-600" />
              <span className="text-[11px] text-slate-600">
                {item.message_count} {t('admin.messages')}
              </span>
            </div>
          </div>

          <span className="text-[11px] text-slate-600 flex-shrink-0
                           opacity-60 group-hover:opacity-100 transition-opacity">
            {fmtTime(item.updated_at)}
          </span>
        </motion.div>
      ))}

      {total > items.length && (
        <p className="text-center text-xs text-slate-700 py-3">
          {t('admin.showing', { count: items.length, total })}
        </p>
      )}
    </div>
  )
}
