import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      const { data } = await api.login({ email, password, remember_me: rememberMe })
      setAuth(data.access_token, data.user)
      toast.success(`Welcome back, ${data.user.username}!`)
      navigate('/dashboard')
    },
    [setAuth, navigate],
  )

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      await api.register({ username, email, password })
      toast.success('Account created! Check your email to verify.')
      navigate('/login')
    },
    [navigate],
  )

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      // token may already be invalid — clear locally regardless
    }
    clearAuth()
    navigate('/login')
  }, [clearAuth, navigate])

  return { user, isAuthenticated, login, register, logout }
}
