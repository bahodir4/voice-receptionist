import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AuthLayout } from '@/components/shared/AuthLayout'
import { Card } from '@/components/shared/Card'
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
      .catch((err) => { setStatus('error'); setErrorMsg(extractError(err)) })
  }, [params])

  return (
    <AuthLayout>
      <Card>
        <div className="text-center space-y-5 py-4">
          {status === 'checking' && (
            <>
              <Loader2 className="w-14 h-14 text-brand-400 animate-spin mx-auto" />
              <p className="text-slate-300 text-lg font-medium">{t('auth.verify.checking')}</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Email Verified!</h2>
                <p className="text-slate-400 text-sm">{t('auth.verify.success')}</p>
              </div>
              <Link to="/login">
                <Button fullWidth>Go to Login</Button>
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-9 h-9 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">{t('auth.verify.invalid')}</h2>
                <p className="text-slate-500 text-sm">{errorMsg}</p>
              </div>
              <div className="space-y-3">
                <Link to="/login">
                  <Button fullWidth variant="outline">Back to Login</Button>
                </Link>
                <p className="text-xs text-slate-600">
                  <Mail className="w-3 h-3 inline mr-1" />
                  {t('auth.verify.resend')} — contact support
                </p>
              </div>
            </>
          )}
        </div>
      </Card>
    </AuthLayout>
  )
}
