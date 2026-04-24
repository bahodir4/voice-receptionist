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

  // ── Voice ─────────────────────────────────────────────────────────────────

  async getVoiceToken(roomName?: string) {
    return this.http.post<{ token: string; room_name: string; livekit_url: string }>(
      '/api/voice/token',
      { room_name: roomName ?? null },
    )
  }

  async endVoiceSession(roomName: string) {
    return this.http.post<{ session_id: string; duration_seconds: number }>(
      '/api/voice/session/end',
      { room_name: roomName },
    )
  }

  // ── Text Chat ─────────────────────────────────────────────────────────────

  async createChatSession() {
    return this.http.post<{ session_id: string; created_at: string }>('/api/chat/sessions')
  }

  async getChatSession(sessionId: string) {
    return this.http.get<{
      session_id: string
      title: string
      created_at: string
      updated_at: string
      messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: string }>
    }>(`/api/chat/sessions/${sessionId}`)
  }

  async deleteChatSession(sessionId: string) {
    return this.http.delete(`/api/chat/sessions/${sessionId}`)
  }

  // ── Phone ─────────────────────────────────────────────────────────────────

  async initiateOutboundCall(toNumber: string) {
    const res = await this.http.post<{
      call_id: string
      room_name: string
      status: string
      created_at: string
    }>('/api/phone/calls/outbound', { to_number: toNumber })
    return res.data
  }

  async listPhoneCalls(skip = 0, limit = 50) {
    const res = await this.http.get<{
      calls: import('@/store/phoneStore').PhoneCall[]
      total: number
    }>('/api/phone/calls', { params: { skip, limit } })
    return res.data
  }

  async getPhoneCall(callId: string) {
    const res = await this.http.get<import('@/store/phoneStore').PhoneCall>(
      `/api/phone/calls/${callId}`,
    )
    return res.data
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  async getAnalyticsOverview() {
    const res = await this.http.get<import('@/store/adminStore').OverviewData>('/api/analytics/overview')
    return res.data
  }

  async getAnalyticsCalls(skip = 0, limit = 50) {
    const res = await this.http.get<{
      items: import('@/store/adminStore').CallLogItem[]
      total: number
    }>('/api/analytics/calls', { params: { skip, limit } })
    return res.data
  }

  async getAnalyticsChats(skip = 0, limit = 50) {
    const res = await this.http.get<{
      items: import('@/store/adminStore').ChatSessionItem[]
      total: number
    }>('/api/analytics/chats', { params: { skip, limit } })
    return res.data
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  async getBusinessSettings() {
    const res = await this.http.get<import('@/store/adminStore').BusinessSettings>('/api/settings/business')
    return res.data
  }

  async updateBusinessSettings(body: import('@/store/adminStore').BusinessSettings) {
    const res = await this.http.put<import('@/store/adminStore').BusinessSettings>('/api/settings/business', body)
    return res.data
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
