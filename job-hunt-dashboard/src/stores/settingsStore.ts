import { create } from 'zustand'
import type { AppSettings, ScraperSettings, ApplicationSettings } from '@/types/settings'
import { loadFromStorage, saveToStorage } from '@/services/storage'
import { STUDY_TIME_SLOTS } from '@/lib/constants'

const STORAGE_KEY = 'settings'

const defaultAppSettings: AppSettings = {
  defaultStudyDuration: 30,
  reminderDays: [3, 1],
  upcomingDeadlineWindow: 14,
  studyTimeSlots: STUDY_TIME_SLOTS,
  confirmBeforeDelete: true,
  darkMode: false,
  followUpDays: 7,
  agentProvider: 'mock',
  mockInterviewTimedMode: false,
  mockInterviewQuestionCount: 6,
  mockInterviewTimeLimit: 180,
  storyAutoScore: true,
  outreachDefaultTone: 'professional',
  jobScannerAutoExtract: true,
}

const defaultScraperSettings: ScraperSettings = {
  sourceLabel: 'Web Search',
  scrapeDelayMs: 1500,
}

const defaultApplicationSettings: ApplicationSettings = {
  showTerminalStages: false,
}

interface SettingsState {
  app: AppSettings
  scraper: ScraperSettings
  applications: ApplicationSettings
}

interface SettingsActions {
  updateApp: (updates: Partial<AppSettings>) => void
  updateScraper: (updates: Partial<ScraperSettings>) => void
  updateApplications: (updates: Partial<ApplicationSettings>) => void
  resetAll: () => void
}

export const useSettingsStore = create<SettingsState & SettingsActions>((set) => ({
  ...loadFromStorage<SettingsState>(STORAGE_KEY, {
    app: defaultAppSettings,
    scraper: defaultScraperSettings,
    applications: defaultApplicationSettings,
  }),

  updateApp: (updates) => set((s) => {
    const app = { ...s.app, ...updates }
    saveToStorage(STORAGE_KEY, { ...s, app })
    return { app }
  }),

  updateScraper: (updates) => set((s) => {
    const scraper = { ...s.scraper, ...updates }
    saveToStorage(STORAGE_KEY, { ...s, scraper })
    return { scraper }
  }),

  updateApplications: (updates) => set((s) => {
    const applications = { ...s.applications, ...updates }
    saveToStorage(STORAGE_KEY, { ...s, applications })
    return { applications }
  }),

  resetAll: () => {
    const state = { app: defaultAppSettings, scraper: defaultScraperSettings, applications: defaultApplicationSettings }
    saveToStorage(STORAGE_KEY, state)
    return state
  },
}))