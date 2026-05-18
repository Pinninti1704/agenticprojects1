import { create } from 'zustand'
import { generateId, nowISO } from '@/lib/utils'
import { loadFromStorage, saveToStorage } from '@/services/storage'

export interface AnalyticsEvent {
  id: string
  name: string
  timestamp: string
  metadata: Record<string, string | number | boolean>
}

const STORAGE_KEY = 'analytics'

interface AnalyticsState {
  events: AnalyticsEvent[]
}

interface AnalyticsActions {
  trackEvent: (name: string, metadata?: Record<string, string | number | boolean>) => void
  getEventsByDate: (date: string) => AnalyticsEvent[]
  getEventsByName: (name: string) => AnalyticsEvent[]
  clearAll: () => void
}

export const useAnalyticsStore = create<AnalyticsState & AnalyticsActions>((set, get) => ({
  ...loadFromStorage<AnalyticsState>(STORAGE_KEY, { events: [] }),

  trackEvent: (name, metadata = {}) => set((s) => {
    const event: AnalyticsEvent = { id: generateId(), name, timestamp: nowISO(), metadata }
    const events = [...s.events, event]
    saveToStorage(STORAGE_KEY, { events })
    return { events }
  }),

  getEventsByDate: (date) => {
    return get().events.filter((e) => e.timestamp.startsWith(date))
  },

  getEventsByName: (name) => {
    return get().events.filter((e) => e.name === name)
  },

  clearAll: () => {
    saveToStorage(STORAGE_KEY, { events: [] })
    return { events: [] }
  },
}))