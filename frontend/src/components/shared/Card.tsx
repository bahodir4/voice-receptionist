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
        'relative rounded-2xl p-8',
        'bg-white/[0.03] border border-white/[0.08]',
        'shadow-[0_24px_64px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]',
        'backdrop-blur-xl',
        className,
      )}
    >
      {(title || subtitle) && (
        <div className="mb-7 space-y-1">
          {title && (
            <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
          )}
          {subtitle && (
            <p className="text-slate-500 text-sm">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
