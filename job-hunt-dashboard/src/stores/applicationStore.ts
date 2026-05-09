import { create } from 'zustand'
import type { JobApplication, ApplicationStage } from '@/types/application'
import { generateId, nowISO } from '@/lib/utils'
import { loadFromStorage, saveToStorage } from '@/services/storage'

interface ApplicationState {
  applications: JobApplication[]
}

interface ApplicationActions {
  addApplication: (app: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateApplication: (id: string, updates: Partial<JobApplication>) => void
  deleteApplication: (id: string) => void
  updateStage: (id: string, stage: ApplicationStage) => void
  getByStage: (stage: ApplicationStage) => JobApplication[]
}

const STORAGE_KEY = 'applications'

export const useApplicationStore = create<ApplicationState & ApplicationActions>((set, get) => ({
  ...loadFromStorage<ApplicationState>(STORAGE_KEY, { applications: [] }),

  addApplication: (app) => {
    const newApp: JobApplication = { ...app, id: generateId(), createdAt: nowISO(), updatedAt: nowISO() }
    set((s) => {
      const next = { applications: [...s.applications, newApp] }
      saveToStorage(STORAGE_KEY, next)
      return next
    })
  },

  updateApplication: (id, updates) => {
    set((s) => {
      const applications = s.applications.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: nowISO() } : a
      )
      saveToStorage(STORAGE_KEY, { applications })
      return { applications }
    })
  },

  deleteApplication: (id) => {
    set((s) => {
      const applications = s.applications.filter((a) => a.id !== id)
      saveToStorage(STORAGE_KEY, { applications })
      return { applications }
    })
  },

  updateStage: (id, stage) => {
    set((s) => {
      const applications = s.applications.map((a) =>
        a.id === id ? { ...a, stage, updatedAt: nowISO() } : a
      )
      saveToStorage(STORAGE_KEY, { applications })
      return { applications }
    })
  },

  getByStage: (stage) => get().applications.filter((a) => a.stage === stage),
}))