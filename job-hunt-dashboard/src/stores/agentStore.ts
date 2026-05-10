import { create } from 'zustand'
import type { StarStory, MockInterviewSession, OutreachEntry, ScannedJob } from '@/types/agent'
import { generateId, nowISO } from '@/lib/utils'
import { loadFromStorage, saveToStorage } from '@/services/storage'

const STORAGE_KEY = 'agent'

interface AgentState {
  stories: StarStory[]
  sessions: MockInterviewSession[]
  outreachMessages: OutreachEntry[]
  scannedJobs: ScannedJob[]
  storyFavorites: string[]
}

interface AgentActions {
  addStory: (story: Omit<StarStory, 'id' | 'createdAt'>) => void
  deleteStory: (id: string) => void
  updateStory: (id: string, updates: Partial<Omit<StarStory, 'id' | 'createdAt'>>) => void
  toggleStoryFavorite: (id: string) => void
  addSession: (session: MockInterviewSession) => void
  updateSession: (id: string, updates: Partial<MockInterviewSession>) => void
  addOutreachMessage: (msg: Omit<OutreachEntry, 'id' | 'createdAt'>) => void
  updateOutreachStatus: (id: string, status: OutreachEntry['status']) => void
  deleteOutreachMessage: (id: string) => void
  addScannedJob: (job: ScannedJob) => void
  deleteScannedJob: (id: string) => void
}

export const useAgentStore = create<AgentState & AgentActions>((set) => ({
  ...loadFromStorage<AgentState>(STORAGE_KEY, {
    stories: [],
    sessions: [],
    outreachMessages: [],
    scannedJobs: [],
    storyFavorites: [],
  }),

  addStory: (story) => set((s) => {
    const stories = [...s.stories, { ...story, id: generateId(), createdAt: nowISO() }]
    saveToStorage(STORAGE_KEY, { ...s, stories })
    return { stories }
  }),

  deleteStory: (id) => set((s) => {
    const stories = s.stories.filter((st) => st.id !== id)
    const storyFavorites = s.storyFavorites.filter((fid) => fid !== id)
    saveToStorage(STORAGE_KEY, { ...s, stories, storyFavorites })
    return { stories, storyFavorites }
  }),

  updateStory: (id, updates) => set((s) => {
    const stories = s.stories.map((st) => st.id === id ? { ...st, ...updates } : st)
    saveToStorage(STORAGE_KEY, { ...s, stories })
    return { stories }
  }),

  toggleStoryFavorite: (id) => set((s) => {
    const storyFavorites = s.storyFavorites.includes(id)
      ? s.storyFavorites.filter((fid) => fid !== id)
      : [...s.storyFavorites, id]
    saveToStorage(STORAGE_KEY, { ...s, storyFavorites })
    return { storyFavorites }
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

  addOutreachMessage: (msg) => set((s) => {
    const outreachMessages = [...s.outreachMessages, { ...msg, id: generateId(), createdAt: nowISO() }]
    saveToStorage(STORAGE_KEY, { ...s, outreachMessages })
    return { outreachMessages }
  }),

  updateOutreachStatus: (id, status) => set((s) => {
    const outreachMessages = s.outreachMessages.map((m) => m.id === id ? { ...m, status } : m)
    saveToStorage(STORAGE_KEY, { ...s, outreachMessages })
    return { outreachMessages }
  }),

  deleteOutreachMessage: (id) => set((s) => {
    const outreachMessages = s.outreachMessages.filter((m) => m.id !== id)
    saveToStorage(STORAGE_KEY, { ...s, outreachMessages })
    return { outreachMessages }
  }),

  addScannedJob: (job) => set((s) => {
    const scannedJobs = [...s.scannedJobs, job]
    saveToStorage(STORAGE_KEY, { ...s, scannedJobs })
    return { scannedJobs }
  }),

  deleteScannedJob: (id) => set((s) => {
    const scannedJobs = s.scannedJobs.filter((j) => j.id !== id)
    saveToStorage(STORAGE_KEY, { ...s, scannedJobs })
    return { scannedJobs }
  }),
}))