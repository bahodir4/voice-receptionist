import { create } from 'zustand'

export type CallStatus =
  | 'initiated' | 'ringing' | 'in-progress'
  | 'completed' | 'failed' | 'no-answer' | 'busy' | 'canceled'

export type CallDirection = 'inbound' | 'outbound'

export interface PhoneCall {
  call_id: string
  direction: CallDirection
  from_number: string
  to_number: string
  status: CallStatus
  duration_seconds: number
  room_name: string
  created_at: string
  updated_at: string
}

interface PhoneState {
  calls: PhoneCall[]
  total: number
  isLoading: boolean
  isDialing: boolean
  activeCall: PhoneCall | null
  setCalls: (calls: PhoneCall[], total: number) => void
  setLoading: (v: boolean) => void
  setDialing: (v: boolean) => void
  setActiveCall: (call: PhoneCall | null) => void
  upsertCall: (call: PhoneCall) => void
}

export const usePhoneStore = create<PhoneState>((set) => ({
  calls: [],
  total: 0,
  isLoading: false,
  isDialing: false,
  activeCall: null,
  setCalls: (calls, total) => set({ calls, total }),
  setLoading: (v) => set({ isLoading: v }),
  setDialing: (v) => set({ isDialing: v }),
  setActiveCall: (call) => set({ activeCall: call }),
  upsertCall: (call) =>
    set((s) => {
      const idx = s.calls.findIndex((c) => c.call_id === call.call_id)
      if (idx === -1) return { calls: [call, ...s.calls], total: s.total + 1 }
      const updated = [...s.calls]
      updated[idx] = call
      return { calls: updated }
    }),
}))
