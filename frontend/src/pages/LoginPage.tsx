import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

import { AuthLayout } from '@/components/shared/AuthLayout'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import { useAuth } from '@/hooks/useAuth'
import { extractError } from '@/services/api'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  remember_me: z.boolean().optional(),
})
type FormData = z.infer<typeof schema>

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { remember_me: false },
  })

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      await login(data.email, data.password, data.remember_me)
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

        {/* Header */}
        <motion.div variants={item} className="space-y-1.5">
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
          <p className="text-slate-500 text-sm">Sign in to your account to continue</p>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <motion.div variants={item}>
            <Input
              label={t('auth.login.email')}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />
          </motion.div>

          <motion.div variants={item}>
            <Input
              label={t('auth.login.password')}
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              rightElement={
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...register('password')}
            />
          </motion.div>

          <motion.div variants={item} className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input type="checkbox" className="sr-only peer" {...register('remember_me')} />
                <div className="w-4 h-4 rounded border border-white/15 bg-white/[0.04] peer-checked:bg-violet-600 peer-checked:border-violet-600 transition-all" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                    <path d="M1.5 5l2.5 2.5L8.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                {t('auth.login.remember')}
              </span>
            </label>
            <Link to="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              {t('auth.login.forgot')}
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Button type="submit" fullWidth loading={loading} size="lg">
              {t('auth.login.submit')}
            </Button>
          </motion.div>
        </form>

        <motion.div variants={item}>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative text-center">
              <span className="bg-[#06060f] px-3 text-xs text-slate-600">or</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="text-center">
          <p className="text-sm text-slate-600">
            {t('auth.login.no_account')}{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              {t('auth.login.register_link')}
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </AuthLayout>
  )
}
