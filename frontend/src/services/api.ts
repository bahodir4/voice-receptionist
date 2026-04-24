import axios, { type AxiosInstance, type AxiosError } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

class ApiClient {
  private readonly http: AxiosInstance

  constructor() {
    this.http = axios.create({
      baseURL: BASE_URL,
      timeout: 15_000,
      headers: { 'Content-Type': 'application/json' },
    })

    this.http.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token')
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })

    this.http.interceptors.response.use(
      (res) => res,
      (error: AxiosError<{ detail?: string }>) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      },
    )
  }

  // ── Auth ─────────────────────────────────────────────────────────────────

  async register(data: { username: string; email: string; password: string }) {
    return this.http.post<{ message: string; success: boolean }>('/api/auth/register', data)
  }

  async verifyEmail(token: string) {
    return this.http.post<{ message: string }>('/api/auth/verify-email', { token })
  }

  async login(data: { email: string; password: string; remember_me: boolean }) {
    return this.http.post<{
      access_token: string
      token_type: string
      user: User
    }>('/api/auth/login', data)
  }

  async logout() {
    return this.http.post('/api/auth/logout')
  }

  async forgotPassword(email: string) {
    return this.http.post<{ message: string }>('/api/auth/forgot-password', { email })
  }

  async resetPassword(data: { token: string; password: string }) {
    return this.http.post<{ message: string }>('/api/auth/reset-password', data)
  }

  async getMe() {
    return this.http.get<User>('/api/auth/me')
  }

  async healthCheck() {
    return this.http.get<{ status: string }>('/health')
  }
}

export interface User {
  id: string
  email: string
  username: string
  is_verified: boolean
  created_at: string
}

export const api = new ApiClient()

export function extractError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.map((d) => d.msg ?? d).join(', ')
  }
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}
