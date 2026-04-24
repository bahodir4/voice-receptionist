import { type ReactNode } from 'react'
import { clsx } from 'clsx'

interface Props {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
}

export function Card({ children, className, title, subtitle }: Props) {
  return (
    <div
      className={clsx(
        'bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40',
        'p-8',
        className,
      )}
    >
      {(title || subtitle) && (
        <div className="mb-8 text-center">
          {title && <h1 className="text-2xl font-bold text-white mb-1.5">{title}</h1>}
          {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
