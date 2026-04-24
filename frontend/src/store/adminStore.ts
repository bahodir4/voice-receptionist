import { create } from 'zustand'

export interface ChartPoint {
  date: string
  phone_calls: number
  voice_sessions: number
  chat_sessions: number
}

export interface OverviewData {
  today: { phone_calls: number; voice_sessions: number; chat_sessions: number; total: number }
  all_time: { phone_calls: number; voice_sessions: number; chat_sessions: number; total: number }
  avg_call_duration: number
  chart: ChartPoint[]
}

export interface CallLogItem {
  call_id: string
  direction: string
  from_number: string
  to_number: string
  status: string
  duration_seconds: number
  created_at: string
}

export interface ChatSessionItem {
  session_id: string
  title: string
  message_count: number
  created_at: string
  updated_at: string
}

export interface BusinessSettings {
  business_name: string
  business_hours: string
  business_address: string
  business_phone: string
  business_email: string
  business_description: string
  custom_instructions: string
  faqs: { question: string; answer: string }[]
  updated_at: string | null
}

interface AdminState {
  overview: OverviewData | null
  calls: CallLogItem[]
  callsTotal: number
  chats: ChatSessionItem[]
  chatsTotal: number
  settings: BusinessSettings | null
  isLoading: boolean
  isSaving: boolean
  setOverview: (v: OverviewData) => void
  setCalls: (items: CallLogItem[], total: number) => void
  setChats: (items: ChatSessionItem[], total: number) => void
  setSettings: (v: BusinessSettings) => void
  setLoading: (v: boolean) => void
  setSaving: (v: boolean) => void
}

export const useAdminStore = create<AdminState>((set) => ({
  overview: null,
  calls: [],
  callsTotal: 0,
  chats: [],
  chatsTotal: 0,
  settings: null,
  isLoading: false,
  isSaving: false,
  setOverview: (v) => set({ overview: v }),
  setCalls: (items, total) => set({ calls: items, callsTotal: total }),
  setChats: (items, total) => set({ chats: items, chatsTotal: total }),
  setSettings: (v) => set({ settings: v }),
  setLoading: (v) => set({ isLoading: v }),
  setSaving: (v) => set({ isSaving: v }),
}))
