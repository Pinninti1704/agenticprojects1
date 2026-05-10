import { create } from 'zustand'
import type { StarStory, MockInterviewSession } from '@/types/agent'
import { generateId, nowISO } from '@/lib/utils'
import { loadFromStorage, saveToStorage } from '@/services/storage'

const STORAGE_KEY = 'agent'

interface AgentState {
  stories: StarStory[]
  sessions: MockInterviewSession[]
}

interface AgentActions {
  addStory: (story: Omit<StarStory, 'id' | 'createdAt'>) => void
  deleteStory: (id: string) => void
  addSession: (session: MockInterviewSession) => void
  updateSession: (id: string, updates: Partial<MockInterviewSession>) => void
}

export const useAgentStore = create<AgentState & AgentActions>((set) => ({
  ...loadFromStorage<AgentState>(STORAGE_KEY, { stories: [], sessions: [] }),

  addStory: (story) => set((s) => {
    const stories = [...s.stories, { ...story, id: generateId(), createdAt: nowISO() }]
    saveToStorage(STORAGE_KEY, { ...s, stories })
    return { stories }
  }),

  deleteStory: (id) => set((s) => {
    const stories = s.stories.filter((st) => st.id !== id)
    saveToStorage(STORAGE_KEY, { ...s, stories })
    return { stories }
  }),

  addSession: (session) => set((s) => {
    const sessions = [...s.sessions, session]
    saveToStorage(STORAGE_KEY, { ...s, sessions })
    return { sessions }
  }),

  updateSession: (id, updates) => set((s) => {
    const sessions = s.sessions.map((se) => se.id === id ? { ...se, ...updates } : se)
    saveToStorage(STORAGE_KEY, { ...s, sessions })
    return { sessions }
  }),
}))