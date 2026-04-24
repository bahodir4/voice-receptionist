import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

import { AuthLayout } from '@/components/shared/AuthLayout'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import { useAuth } from '@/hooks/useAuth'
import { extractError } from '@/services/api'

const schema = z.object({
  username: z.string().min(3, 'Min 3 characters').max(50).regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscores only'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Min 8 characters').regex(/[A-Z]/, 'One uppercase letter').regex(/[0-9]/, 'One digit'),
})
type FormData = z.infer<typeof schema>

const RULES = [
  { label: '8+ characters',     test: (v: string) => v.length >= 8 },
  { label: 'Uppercase',         test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Number',            test: (v: string) => /[0-9]/.test(v) },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export function RegisterPage() {
  const { t } = useTranslation()
  const { register: registerUser } = useAuth()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  const password = watch('password', '')

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      await registerUser(data.username, data.email, data.password)
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

        <motion.div variants={item} className="space-y-1.5">
          <h2 className="text-2xl font-bold text-white tracking-tight">Create account</h2>
          <p className="text-slate-500 text-sm">Join thousands using AI for their reception</p>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <motion.div variants={item}>
            <Input label={t('auth.register.username')} type="text" autoComplete="username"
              placeholder="johndoe" leftIcon={<User className="w-4 h-4" />}
              error={errors.username?.message} {...register('username')} />
          </motion.div>

          <motion.div variants={item}>
            <Input label={t('auth.register.email')} type="email" autoComplete="email"
              placeholder="you@example.com" leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message} {...register('email')} />
          </motion.div>

          <motion.div variants={item} className="space-y-2">
            <Input label={t('auth.register.password')} type={showPass ? 'text' : 'password'}
              autoComplete="new-password" placeholder="••••••••"
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

            {/* Password strength */}
            {password.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="flex gap-2 pt-1">
                {RULES.map(rule => {
                  const ok = rule.test(password)
                  return (
                    <span key={rule.label}
                      className={`flex items-center gap-1 text-xs transition-all duration-200 ${ok ? 'text-emerald-400' : 'text-slate-600'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200
                        ${ok ? 'bg-emerald-500/20' : 'bg-white/[0.04]'}`}>
                        {ok && <Check className="w-2 h-2" />}
                      </span>
                      {rule.label}
                    </span>
                  )
                })}
              </motion.div>
            )}
          </motion.div>

          <motion.div variants={item}>
            <Button type="submit" fullWidth loading={loading} size="lg">
              {t('auth.register.submit')}
            </Button>
          </motion.div>
        </form>

        <motion.div variants={item} className="text-center">
          <p className="text-sm text-slate-600">
            {t('auth.register.have_account')}{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              {t('auth.register.login_link')}
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </AuthLayout>
  )
}
