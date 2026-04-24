import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: ReactNode
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',

        variant === 'primary' && [
          'bg-gradient-to-r from-brand-600 to-blue-600 text-white',
          'hover:from-brand-500 hover:to-blue-500 active:scale-[.98]',
          'shadow-lg shadow-brand-900/40 hover:shadow-brand-600/30',
          'focus:ring-brand-500',
        ],
        variant === 'ghost' && [
          'text-slate-300 hover:text-white hover:bg-slate-700/60',
          'focus:ring-slate-500',
        ],
        variant === 'outline' && [
          'border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white',
          'focus:ring-slate-500',
        ],

        size === 'sm' && 'text-xs px-3 py-2',
        size === 'md' && 'text-sm px-5 py-3',
        size === 'lg' && 'text-base px-6 py-3.5',

        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
    </button>
  )
}
