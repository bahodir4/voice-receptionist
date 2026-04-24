import { create } from 'zustand'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface ChatState {
  sessionId: string | null
  messages: ChatMessage[]
  isStreaming: boolean

  setSessionId: (id: string | null) => void
  addMessage: (msg: ChatMessage) => void
  appendToLastAssistant: (delta: string) => void
  finalizeLastAssistant: (messageId: string) => void
  reset: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  sessionId: null,
  messages: [],
  isStreaming: false,

  setSessionId: (sessionId) => set({ sessionId }),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg], isStreaming: msg.isStreaming ?? false })),

  appendToLastAssistant: (delta) =>
    set((s) => {
      const messages = [...s.messages]
      const last = messages[messages.length - 1]
      if (last?.role === 'assistant') {
        messages[messages.length - 1] = { ...last, content: last.content + delta }
      }
      return { messages }
    }),

  finalizeLastAssistant: (messageId) =>
    set((s) => {
      const messages = s.messages.map((m) =>
        m.role === 'assistant' && m.isStreaming
          ? { ...m, id: messageId, isStreaming: false }
          : m,
      )
      return { messages, isStreaming: false }
    }),

  reset: () => set({ sessionId: null, messages: [], isStreaming: false }),
}))
