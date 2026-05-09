import { create } from 'zustand'
import type { StudySession, StreakData } from '@/types/study'
import { generateId, todayISO } from '@/lib/utils'
import { loadFromStorage, saveToStorage } from '@/services/storage'

interface StudyState {
  sessions: StudySession[]
  streak: StreakData
}

interface StudyActions {
  addSession: (session: Omit<StudySession, 'id' | 'date'> & { date?: string }) => void
  getSessionsForDate: (date: string) => StudySession[]
  getTotalMinutesThisWeek: () => number
  getTotalMinutesToday: () => number
  getTotalMinutesThisMonth: () => number
  getSessionsInRange: (start: string, end: string) => StudySession[]
  recalculateStreak: () => void
}

const STORAGE_KEY = 'study'

function computeStreak(datesStudied: string[]): StreakData {
  const sorted = [...new Set(datesStudied)].sort().reverse()
  if (sorted.length === 0) return { current: 0, longest: 0, datesStudied: [] }

  let current = 0
  const checkDate = new Date(todayISO())

  for (const dateStr of sorted) {
    const d = new Date(dateStr)
    const diff = Math.round((checkDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === current) {
      current++
    } else if (diff > current) {
      break
    }
  }

  let longest = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round(
      (new Date(sorted[i - 1]).getTime() - new Date(sorted[i]).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (diff === 1) {
      run++
      longest = Math.max(longest, run)
    } else {
      run = 1
    }
  }

  return { current, longest, datesStudied: sorted }
}

export const useStudyStore = create<StudyState & StudyActions>((set, get) => ({
  ...loadFromStorage<StudyState>(STORAGE_KEY, { sessions: [], streak: { current: 0, longest: 0, datesStudied: [] } }),

  addSession: (sessionData) => {
    const session: StudySession = {
      ...sessionData,
      id: generateId(),
      date: sessionData.date || todayISO(),
    }
    set((s) => {
      const sessions = [...s.sessions, session]
      const datesStudied = [...new Set([...s.streak.datesStudied, session.date])]
      const streak = computeStreak(datesStudied)
      const next = { sessions, streak }
      saveToStorage(STORAGE_KEY, next)
      return next
    })
  },

  getSessionsForDate: (date) => get().sessions.filter((s) => s.date === date),
  getTotalMinutesToday: () => get().sessions.filter((s) => s.date === todayISO()).reduce((sum, s) => sum + s.durationMinutes, 0),
  getTotalMinutesThisWeek: () => {
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    const startStr = start.toISOString().slice(0, 10)
    return get().sessions.filter((s) => s.date >= startStr).reduce((sum, s) => sum + s.durationMinutes, 0)
  },
  getTotalMinutesThisMonth: () => {
    const monthStart = todayISO().slice(0, 7)
    return get().sessions.filter((s) => s.date.startsWith(monthStart)).reduce((sum, s) => sum + s.durationMinutes, 0)
  },
  getSessionsInRange: (start, end) => get().sessions.filter((s) => s.date >= start && s.date <= end),
  recalculateStreak: () => {
    set((s) => {
      const datesStudied = [...new Set(s.sessions.map((ses) => ses.date))]
      const streak = computeStreak(datesStudied)
      saveToStorage(STORAGE_KEY, { ...s, streak })
      return { streak }
    })
  },
}))