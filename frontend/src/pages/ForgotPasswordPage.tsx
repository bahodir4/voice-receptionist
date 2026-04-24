import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

import { AuthLayout } from '@/components/shared/AuthLayout'
import { Card } from '@/components/shared/Card'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import { api, extractError } from '@/services/api'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      await api.forgotPassword(data.email)
      setSentEmail(data.email)
      setSent(true)
    } catch (err) {
      toast.error(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <Card>
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-9 h-9 text-brand-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
              <p className="text-slate-400 text-sm">
                We sent a reset link to <span className="text-slate-200 font-medium">{sentEmail}</span>
              </p>
            </div>
            <Link to="/login">
              <Button fullWidth variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                {t('auth.forgot.back_login')}
              </Button>
            </Link>
          </div>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card title={t('auth.forgot.title')} subtitle={t('auth.forgot.subtitle')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label={t('auth.forgot.email')}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Button type="submit" fullWidth loading={loading} size="lg" leftIcon={<Send className="w-4 h-4" />}>
            {t('auth.forgot.submit')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('auth.forgot.back_login')}
          </Link>
        </div>
      </Card>
    </AuthLayout>
  )
}
