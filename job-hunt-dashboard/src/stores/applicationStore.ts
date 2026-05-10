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

function appsEqual(a: JobApplication[], b: JobApplication[]): boolean {
  if (a.length !== b.length) return false
  return a.every((item, i) => item.id === b[i].id && item.stage === b[i].stage)
}

export const useApplicationStore = create<ApplicationState & ApplicationActions>((set, get) => ({
  ...loadFromStorage<ApplicationState>(STORAGE_KEY, { applications: [] }),

  addApplication: (app) => {
    const newApp: JobApplication = { ...app, id: generateId(), createdAt: nowISO(), updatedAt: nowISO() }
    set((s) => {
      const applications = [...s.applications, newApp]
      saveToStorage(STORAGE_KEY, { applications })
      return { applications }
    })
  },

  updateApplication: (id, updates) => {
    set((s) => {
      const applications = s.applications.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: nowISO() } : a
      )
      if (appsEqual(s.applications, applications)) return {}
      saveToStorage(STORAGE_KEY, { applications })
      return { applications }
    })
  },

  deleteApplication: (id) => {
    set((s) => {
      const applications = s.applications.filter((a) => a.id !== id)
      if (appsEqual(s.applications, applications)) return {}
      saveToStorage(STORAGE_KEY, { applications })
      return { applications }
    })
  },

  updateStage: (id, stage) => {
    set((s) => {
      const applications = s.applications.map((a) =>
        a.id === id ? { ...a, stage, updatedAt: nowISO() } : a
      )
      if (appsEqual(s.applications, applications)) return {}
      saveToStorage(STORAGE_KEY, { applications })
      return { applications }
    })
  },

  getByStage: (stage) => get().applications.filter((a) => a.stage === stage),
}))