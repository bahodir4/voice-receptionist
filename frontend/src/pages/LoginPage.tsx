import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

import { AuthLayout } from '@/components/shared/AuthLayout'
import { Card } from '@/components/shared/Card'
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
      <Card title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label={t('auth.login.email')}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label={t('auth.login.password')}
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
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

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-brand-500 rounded"
                {...register('remember_me')}
              />
              <span className="text-sm text-slate-400">{t('auth.login.remember')}</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
              {t('auth.login.forgot')}
            </Link>
          </div>

          <Button type="submit" fullWidth loading={loading} size="lg">
            {t('auth.login.submit')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t('auth.login.no_account')}{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            {t('auth.login.register_link')}
          </Link>
        </p>
      </Card>
    </AuthLayout>
  )
}
