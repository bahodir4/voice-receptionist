import { useCallback } from 'react'
import { useAdminStore, type BusinessSettings } from '@/store/adminStore'
import { api } from '@/services/api'

export function useAdmin() {
  const store = useAdminStore()

  const loadOverview = useCallback(async () => {
    store.setLoading(true)
    try {
      const data = await api.getAnalyticsOverview()
      store.setOverview(data)
    } finally {
      store.setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadCalls = useCallback(async (skip = 0) => {
    const data = await api.getAnalyticsCalls(skip)
    store.setCalls(data.items, data.total)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadChats = useCallback(async (skip = 0) => {
    const data = await api.getAnalyticsChats(skip)
    store.setChats(data.items, data.total)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSettings = useCallback(async () => {
    const data = await api.getBusinessSettings()
    store.setSettings(data)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const saveSettings = useCallback(async (body: BusinessSettings) => {
    store.setSaving(true)
    try {
      const data = await api.updateBusinessSettings(body)
      store.setSettings(data)
    } finally {
      store.setSaving(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...store,
    loadOverview,
    loadCalls,
    loadChats,
    loadSettings,
    saveSettings,
  }
}
