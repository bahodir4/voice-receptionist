import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger'
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
        'relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl',
        'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06060f]',
        'disabled:opacity-40 disabled:cursor-not-allowed select-none',
        'active:scale-[.97]',

        variant === 'primary' && [
          'bg-gradient-to-r from-violet-600 to-blue-600 text-white',
          'hover:from-violet-500 hover:to-blue-500',
          'shadow-lg shadow-violet-900/40 hover:shadow-violet-600/30 hover:shadow-xl',
          'focus-visible:ring-violet-500',
        ],
        variant === 'ghost' && [
          'text-slate-300 hover:text-white hover:bg-white/[0.07]',
          'focus-visible:ring-slate-500',
        ],
        variant === 'outline' && [
          'border border-white/10 text-slate-300 hover:border-white/20 hover:text-white hover:bg-white/[0.04]',
          'focus-visible:ring-slate-500',
        ],
        variant === 'danger' && [
          'bg-gradient-to-r from-red-600 to-rose-600 text-white',
          'hover:from-red-500 hover:to-rose-500',
          'shadow-lg shadow-red-900/40 hover:shadow-red-600/30 hover:shadow-xl',
          'focus-visible:ring-red-500',
        ],

        size === 'sm' && 'text-xs px-3 py-2 rounded-lg',
        size === 'md' && 'text-sm px-5 py-2.5',
        size === 'lg' && 'text-sm px-6 py-3.5 tracking-wide',

        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
      {children}
    </button>
  )
}
