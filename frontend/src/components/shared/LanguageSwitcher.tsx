import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { clsx } from 'clsx'

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'uz', label: 'UZ' },
  { code: 'ru', label: 'RU' },
]

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation()

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      <Globe className="w-4 h-4 text-slate-400" />
      {LANGS.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={clsx(
            'px-2 py-0.5 text-xs font-medium rounded transition-all',
            i18n.language === lang.code
              ? 'bg-brand-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700',
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
