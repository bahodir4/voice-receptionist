import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

import { AuthLayout } from '@/components/shared/AuthLayout'
import { Card } from '@/components/shared/Card'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import { api, extractError } from '@/services/api'

const schema = z.object({
  password: z
    .string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Must contain one uppercase letter')
    .regex(/[0-9]/, 'Must contain one digit'),
})

type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const password = watch('password', '')

  const onSubmit = async (data: FormData) => {
    const token = params.get('token')
    if (!token) { toast.error('Invalid reset link'); return }

    try {
      setLoading(true)
      await api.resetPassword({ token, password: data.password })
      toast.success('Password reset successfully!')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  const RULES = [
    { label: '8+ chars', test: (v: string) => v.length >= 8 },
    { label: 'Uppercase', test: (v: string) => /[A-Z]/.test(v) },
    { label: 'Number', test: (v: string) => /[0-9]/.test(v) },
  ]

  return (
    <AuthLayout>
      <Card title={t('auth.reset.title')} subtitle={t('auth.reset.subtitle')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Input
              label={t('auth.reset.password')}
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
                {RULES.map((rule) => (
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
            {t('auth.reset.submit')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Back to login
          </Link>
        </div>
      </Card>
    </AuthLayout>
  )
}
