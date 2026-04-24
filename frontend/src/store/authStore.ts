import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/services/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
  updateUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (token, user) => {
        localStorage.setItem('access_token', token)
        set({ token, user, isAuthenticated: true })
      },

      clearAuth: () => {
        localStorage.removeItem('access_token')
        set({ token: null, user: null, isAuthenticated: false })
      },

      updateUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    },
  ),
)
