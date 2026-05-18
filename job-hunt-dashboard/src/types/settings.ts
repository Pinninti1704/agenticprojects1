export interface AppSettings {
  /** Default study duration in minutes */
  defaultStudyDuration: number
  /** Deadline reminder days before due */
  reminderDays: number[]
  /** Number of days to show in upcoming deadlines view */
  upcomingDeadlineWindow: number
  /** Default study time slots in minutes */
  studyTimeSlots: number[]
  /** Whether to show confirmation dialogs on destructive actions */
  confirmBeforeDelete: boolean
  /** Dark mode */
  darkMode: boolean
  /** Follow-up reminder threshold in days */
  followUpDays: number
  /** AI provider type */
  agentProvider: 'mock' | 'openai' | 'nim'
  /** Whether mock interview has per-question countdown timer */
  mockInterviewTimedMode: boolean
  /** Number of questions per mock interview */
  mockInterviewQuestionCount: 3 | 6 | 10
  /** Time limit per question in seconds */
  mockInterviewTimeLimit: number
  /** Whether to auto-score STAR stories on save */
  storyAutoScore: boolean
  /** Default tone for outreach messages */
  outreachDefaultTone: 'professional' | 'warm' | 'direct'
  /** Whether to auto-extract skills from resume text */
  jobScannerAutoExtract: boolean
}

export interface ScraperSettings {
  /** Source label for scraped questions */
  sourceLabel: string
  /** Simulated scrape delay in ms */
  scrapeDelayMs: number
}

export interface ApplicationSettings {
  /** Whether rejected/withdrawn stages appear in kanban columns */
  showTerminalStages: boolean
}

export type SettingsTab = 'app' | 'scraper' | 'applications' | 'data' | 'ai'