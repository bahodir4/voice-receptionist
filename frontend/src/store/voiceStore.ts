import { create } from 'zustand'

export type AgentState = 'idle' | 'connecting' | 'initializing' | 'listening' | 'thinking' | 'speaking' | 'disconnected'

export interface TranscriptEntry {
  id: string
  role: 'user' | 'agent'
  text: string
  timestamp: Date
  isFinal: boolean
}

interface VoiceState {
  agentState: AgentState
  transcript: TranscriptEntry[]
  roomName: string | null
  token: string | null
  livekitUrl: string | null
  isConnected: boolean
  audioLevel: number   // 0–1, driven by local mic
  agentLevel: number  // 0–1, driven by agent audio

  setAgentState: (state: AgentState) => void
  setRoomInfo: (token: string, roomName: string, livekitUrl: string) => void
  addTranscript: (entry: TranscriptEntry) => void
  updateLastTranscript: (id: string, text: string, isFinal: boolean) => void
  setAudioLevel: (level: number) => void
  setAgentLevel: (level: number) => void
  setConnected: (v: boolean) => void
  reset: () => void
}

export const useVoiceStore = create<VoiceState>((set) => ({
  agentState: 'idle',
  transcript: [],
  roomName: null,
  token: null,
  livekitUrl: null,
  isConnected: false,
  audioLevel: 0,
  agentLevel: 0,

  setAgentState: (agentState) => set({ agentState }),
  setRoomInfo: (token, roomName, livekitUrl) => set({ token, roomName, livekitUrl }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  setAgentLevel: (agentLevel) => set({ agentLevel }),
  setConnected: (isConnected) => set({ isConnected }),

  addTranscript: (entry) =>
    set((s) => ({ transcript: [...s.transcript, entry] })),

  updateLastTranscript: (id, text, isFinal) =>
    set((s) => ({
      transcript: s.transcript.map((t) =>
        t.id === id ? { ...t, text, isFinal } : t,
      ),
    })),

  reset: () =>
    set({
      agentState: 'idle',
      transcript: [],
      roomName: null,
      token: null,
      livekitUrl: null,
      isConnected: false,
      audioLevel: 0,
      agentLevel: 0,
    }),
}))
