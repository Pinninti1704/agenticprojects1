import { create } from 'zustand'
import type { Deadline, DeadlineStatus } from '@/types/deadline'
import { generateId, nowISO, isOverdue, daysUntil } from '@/lib/utils'
import { loadFromStorage, saveToStorage } from '@/services/storage'

const STORAGE_KEY = 'deadlines'

function deadlinesEqual(a: Deadline[], b: Deadline[]): boolean {
  if (a.length !== b.length) return false
  return a.every((item, i) => {
    const other = b[i]
    return item.id === other.id && item.status === other.status && item.dueDate === other.dueDate
  })
}

interface DeadlineState {
  deadlines: Deadline[]
}

interface DeadlineActions {
  setDeadline: (topicId: string, dueDate: string, reminderDays?: number[]) => Deadline
  completeDeadline: (id: string) => void
  rescheduleDeadline: (id: string, newDueDate: string) => void
  deleteDeadline: (id: string) => void
  getDeadlineForTopic: (topicId: string) => Deadline | undefined
  getUpcoming: (days?: number) => Deadline[]
  getOverdue: () => Deadline[]
  checkAndUpdateStatus: () => void
}

export const useDeadlineStore = create<DeadlineState & DeadlineActions>((set, get) => ({
  ...loadFromStorage<DeadlineState>(STORAGE_KEY, { deadlines: [] }),

  setDeadline: (topicId, dueDate, reminderDays) => {
    // Try to read reminder days from settings in localStorage
    let days = reminderDays
    if (!days) {
      try {
        const raw = localStorage.getItem('huntboard-settings')
        if (raw) {
          const parsed = JSON.parse(raw)
          days = parsed.app?.reminderDays || [3, 1]
        } else {
          days = [3, 1]
        }
      } catch {
        days = [3, 1]
      }
    }
    const deadline: Deadline = {
      id: generateId(), topicId, dueDate, status: 'active', reminderDays: days!, createdAt: nowISO(),
    }
    set((s) => {
      const filtered = s.deadlines.filter((d) => d.topicId !== topicId)
      const deadlines = [...filtered, deadline]
      if (deadlinesEqual(s.deadlines, deadlines)) return {}
      saveToStorage(STORAGE_KEY, { deadlines })
      return { deadlines }
    })
    return deadline
  },

  completeDeadline: (id) => set((s) => {
    const deadlines = s.deadlines.map((d) =>
      d.id === id ? { ...d, status: 'completed' as DeadlineStatus } : d
    )
    if (deadlinesEqual(s.deadlines, deadlines)) return {}
    saveToStorage(STORAGE_KEY, { deadlines })
    return { deadlines }
  }),

  rescheduleDeadline: (id, newDueDate) => set((s) => {
    const deadlines = s.deadlines.map((d) =>
      d.id === id ? { ...d, dueDate: newDueDate, status: 'rescheduled' as DeadlineStatus } : d
    )
    if (deadlinesEqual(s.deadlines, deadlines)) return {}
    saveToStorage(STORAGE_KEY, { deadlines })
    return { deadlines }
  }),

  deleteDeadline: (id) => set((s) => {
    const deadlines = s.deadlines.filter((d) => d.id !== id)
    if (deadlinesEqual(s.deadlines, deadlines)) return {}
    saveToStorage(STORAGE_KEY, { deadlines })
    return { deadlines }
  }),

  getDeadlineForTopic: (topicId) => get().deadlines.find((d) => d.topicId === topicId),
  getUpcoming: (days = 14) => get().deadlines.filter((d) => {
    if (d.status !== 'active') return false
    return daysUntil(d.dueDate) >= 0 && daysUntil(d.dueDate) <= days
  }),
  getOverdue: () => get().deadlines.filter((d) => d.status === 'active' && isOverdue(d.dueDate)),
  checkAndUpdateStatus: () => set((s) => {
    const deadlines = s.deadlines.map((d) => {
      if (d.status === 'active' && isOverdue(d.dueDate)) {
        return { ...d, status: 'overdue' as DeadlineStatus }
      }
      return d
    })
    if (deadlinesEqual(s.deadlines, deadlines)) return {}
    saveToStorage(STORAGE_KEY, { deadlines })
    return { deadlines }
  }),
}))