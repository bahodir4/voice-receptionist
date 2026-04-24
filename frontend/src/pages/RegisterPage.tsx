import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

import { AuthLayout } from '@/components/shared/AuthLayout'
import { Card } from '@/components/shared/Card'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import { useAuth } from '@/hooks/useAuth'
import { extractError } from '@/services/api'

const schema = z.object({
  username: z
    .string()
    .min(3, 'Min 3 characters')
    .max(50, 'Max 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Must contain one uppercase letter')
    .regex(/[0-9]/, 'Must contain one digit'),
})

type FormData = z.infer<typeof schema>

const STRENGTH_RULES = [
  { label: '8+ characters', test: (v: string) => v.length >= 8 },
  { label: 'Uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Number', test: (v: string) => /[0-9]/.test(v) },
]

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
      <Card title={t('auth.register.title')} subtitle={t('auth.register.subtitle')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label={t('auth.register.username')}
            type="text"
            autoComplete="username"
            placeholder="johndoe"
            leftIcon={<User className="w-4 h-4" />}
            error={errors.username?.message}
            {...register('username')}
          />

          <Input
            label={t('auth.register.email')}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="space-y-1.5">
            <Input
              label={t('auth.register.password')}
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...register('password')}
            />
            {password.length > 0 && (
              <div className="flex gap-3 pt-1">
                {STRENGTH_RULES.map((rule) => (
                  <span
                    key={rule.label}
                    className={`flex items-center gap-1 text-xs transition-colors ${
                      rule.test(password) ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {rule.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" fullWidth loading={loading} size="lg">
            {t('auth.register.submit')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t('auth.register.have_account')}{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            {t('auth.register.login_link')}
          </Link>
        </p>
      </Card>
    </AuthLayout>
  )
}
