import { Routes, Route, Navigate } from 'react-router-dom'

import { LoginPage }          from '@/pages/LoginPage'
import { RegisterPage }       from '@/pages/RegisterPage'
import { VerifyEmailPage }    from '@/pages/VerifyEmailPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ResetPasswordPage }  from '@/pages/ResetPasswordPage'
import { DashboardPage }      from '@/pages/DashboardPage'
import { VoiceChatPage }      from '@/pages/VoiceChatPage'
import { TextChatPage }       from '@/pages/TextChatPage'
import { ProtectedRoute }     from '@/components/shared/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/verify-email"    element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/voice"     element={<VoiceChatPage />} />
        <Route path="/chat"      element={<TextChatPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
