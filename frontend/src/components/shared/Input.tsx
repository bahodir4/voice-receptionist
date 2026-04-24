import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightElement?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, leftIcon, rightElement, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-xs font-medium text-slate-400 tracking-wide uppercase">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none
                            group-focus-within:text-violet-400 transition-colors duration-200">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-slate-100',
              'placeholder:text-slate-600 text-sm',
              'focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06]',
              'hover:border-white/[0.13] hover:bg-white/[0.05]',
              'transition-all duration-200',
              'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
              leftIcon && 'pl-10',
              rightElement && 'pr-10',
              error && 'border-red-500/60 focus:border-red-500/80 focus:bg-red-500/[0.04]',
              className,
            )}
            {...props}
          />
          {/* Focus glow ring */}
          <div className={clsx(
            'absolute inset-0 rounded-xl pointer-events-none opacity-0 transition-opacity duration-200',
            'group-focus-within:opacity-100',
            error
              ? 'shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
              : 'shadow-[0_0_0_3px_rgba(124,58,237,0.12)]',
          )} />
          {rightElement && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightElement}</div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-400/90 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
            {error}
          </p>
        )}
        {hint && !error && <p className="text-xs text-slate-600">{hint}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'
