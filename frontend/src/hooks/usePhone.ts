import { useCallback } from 'react'
import { usePhoneStore } from '@/store/phoneStore'
import { api } from '@/services/api'

export function usePhone() {
  const store = usePhoneStore()

  const loadCalls = useCallback(async () => {
    store.setLoading(true)
    try {
      const data = await api.listPhoneCalls()
      store.setCalls(data.calls, data.total)
    } finally {
      store.setLoading(false)
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const dialOut = useCallback(async (toNumber: string) => {
    store.setDialing(true)
    try {
      const result = await api.initiateOutboundCall(toNumber)
      // Reload full list so the new record (with all fields) appears
      const data = await api.listPhoneCalls()
      store.setCalls(data.calls, data.total)
      const fullCall = data.calls.find((c) => c.call_id === result.call_id) ?? null
      store.setActiveCall(fullCall)
      return result
    } finally {
      store.setDialing(false)
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  return {
    calls: store.calls,
    total: store.total,
    isLoading: store.isLoading,
    isDialing: store.isDialing,
    activeCall: store.activeCall,
    loadCalls,
    dialOut,
    clearActiveCall: () => store.setActiveCall(null),
  }
}
