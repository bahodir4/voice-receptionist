import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { api } from '@/services/api'
import { useChatStore, type ChatMessage } from '@/store/chatStore'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function useChat() {
  const { t } = useTranslation()

  // ── Create a fresh session ─────────────────────────────────────────────

  const newSession = useCallback(async (): Promise<string> => {
    const { data } = await api.createChatSession()
    useChatStore.getState().setSessionId(data.session_id)
    return data.session_id
  }, [])

  // ── Start a new chat (reset UI + new session) ──────────────────────────

  const newChat = useCallback(async () => {
    useChatStore.getState().reset()
    try {
      await newSession()
    } catch {
      toast.error(t('common.error'))
    }
  }, [newSession, t])

  // ── Send a message ─────────────────────────────────────────────────────

  const send = useCallback(async (content: string) => {
    const store = useChatStore.getState()
    if (store.isStreaming) return

    // Ensure we have a session
    let sessionId = store.sessionId
    if (!sessionId) {
      try {
        sessionId = await newSession()
      } catch {
        toast.error(t('common.error'))
        return
      }
    }

    // Optimistic user bubble
    const userMsg: ChatMessage = {
      id: makeId(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    store.addMessage(userMsg)

    // Placeholder assistant bubble (streaming)
    store.addMessage({
      id: makeId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    })

    const token = localStorage.getItem('access_token')

    try {
      const response = await fetch(
        `${BASE_URL}/api/chat/sessions/${sessionId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({ content }),
        },
      )

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          try {
            const event = JSON.parse(raw) as {
              type: 'delta' | 'done' | 'error'
              content?: string
              message_id?: string
              message?: string
            }

            if (event.type === 'delta' && event.content) {
              useChatStore.getState().appendToLastAssistant(event.content)
            } else if (event.type === 'done' && event.message_id) {
              useChatStore.getState().finalizeLastAssistant(event.message_id)
            } else if (event.type === 'error') {
              throw new Error(event.message ?? t('common.error'))
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') {
              throw parseErr
            }
          }
        }
      }
    } catch (err) {
      // Remove the empty assistant placeholder on error
      useChatStore.setState((s) => ({
        messages: s.messages.filter((m) => !(m.role === 'assistant' && m.isStreaming)),
        isStreaming: false,
      }))
      toast.error(err instanceof Error ? err.message : t('common.error'))
    }
  }, [newSession, t])

  return { send, newChat }
}
