export interface StudySession {
  id: string
  topicId: string
  durationMinutes: number
  notes: string
  date: string
}

export interface StreakData {
  current: number
  longest: number
  datesStudied: string[]
}