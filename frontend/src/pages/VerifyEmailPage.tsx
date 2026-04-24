import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AuthLayout } from '@/components/shared/AuthLayout'
import { Button } from '@/components/shared/Button'
import { api, extractError } from '@/services/api'

type Status = 'checking' | 'success' | 'error'

export function VerifyEmailPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const [status, setStatus] = useState<Status>('checking')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setStatus('error'); setErrorMsg('No verification token found.'); return }
    api.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(err => { setStatus('error'); setErrorMsg(extractError(err)) })
  }, [params])

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold text-white tracking-tight">Email verification</h2>
          <p className="text-slate-500 text-sm">We're confirming your email address</p>
        </div>

        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
          <AnimatePresence mode="wait">

            {status === 'checking' && (
              <motion.div key="checking"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-5 py-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Loader2 className="w-7 h-7 text-violet-400 animate-spin" />
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">{t('auth.verify.checking')}</p>
                  <p className="text-sm text-slate-500">This will only take a moment</p>
                </div>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div key="success"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-5 py-4 text-center">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
                  className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </motion.div>
                <div>
                  <p className="font-bold text-white text-lg mb-1">Email verified!</p>
                  <p className="text-sm text-slate-500">{t('auth.verify.success')}</p>
                </div>
                <Link to="/login" className="w-full">
                  <Button fullWidth>Continue to login</Button>
                </Link>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div key="error"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-5 py-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center">
                  <XCircle className="w-7 h-7 text-red-400" />
                </div>
                <div>
                  <p className="font-bold text-white text-lg mb-1">{t('auth.verify.invalid')}</p>
                  <p className="text-sm text-slate-500">{errorMsg}</p>
                </div>
                <Link to="/login" className="w-full">
                  <Button fullWidth variant="outline">Back to login</Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AuthLayout>
  )
}
