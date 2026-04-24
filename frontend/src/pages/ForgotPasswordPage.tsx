import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

import { AuthLayout } from '@/components/shared/AuthLayout'
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

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {sent ? 'Check your inbox' : t('auth.forgot.title')}
          </h2>
          <p className="text-slate-500 text-sm">
            {sent
              ? `We sent a reset link to ${sentEmail}`
              : t('auth.forgot.subtitle')}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key="form"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label={t('auth.forgot.email')} type="email" autoComplete="email"
                  placeholder="you@example.com" leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message} {...register('email')} />

                <Button type="submit" fullWidth loading={loading} size="lg" leftIcon={<Send className="w-4 h-4" />}>
                  {t('auth.forgot.submit')}
                </Button>
              </form>

              <Link to="/login"
                className="flex items-center justify-center gap-1.5 text-sm text-slate-600 hover:text-slate-400 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                {t('auth.forgot.back_login')}
              </Link>
            </motion.div>
          ) : (
            <motion.div key="sent"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="space-y-5">

              {/* Animated email icon */}
              <div className="flex flex-col items-center gap-4 py-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <motion.div
                  initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-violet-400" />
                </motion.div>
                <div className="text-center">
                  <p className="text-white font-semibold text-sm mb-1">Email sent successfully</p>
                  <p className="text-slate-500 text-xs max-w-[200px] leading-relaxed">
                    If that address exists, you'll receive a link within a few minutes
                  </p>
                </div>
                {/* Progress dots */}
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i}
                      className="w-1.5 h-1.5 rounded-full bg-violet-500/40"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
                    />
                  ))}
                </div>
              </div>

              <Link to="/login">
                <Button fullWidth variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  {t('auth.forgot.back_login')}
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  )
}
