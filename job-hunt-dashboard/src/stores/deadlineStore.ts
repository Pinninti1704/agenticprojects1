import { create } from 'zustand'
import type { Deadline, DeadlineStatus } from '@/types/deadline'
import { generateId, nowISO, isOverdue, daysUntil } from '@/lib/utils'
import { loadFromStorage, saveToStorage } from '@/services/storage'

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

const STORAGE_KEY = 'deadlines'

export const useDeadlineStore = create<DeadlineState & DeadlineActions>((set, get) => ({
  ...loadFromStorage<DeadlineState>(STORAGE_KEY, { deadlines: [] }),

  setDeadline: (topicId, dueDate, reminderDays = [3, 1]) => {
    const deadline: Deadline = {
      id: generateId(),
      topicId,
      dueDate,
      status: 'active',
      reminderDays,
      createdAt: nowISO(),
    }
    set((s) => {
      // Remove any existing deadline for this topic
      const filtered = s.deadlines.filter((d) => d.topicId !== topicId)
      const next = { deadlines: [...filtered, deadline] }
      saveToStorage(STORAGE_KEY, next)
      return next
    })
    return deadline
  },

  completeDeadline: (id) => {
    set((s) => {
      const deadlines = s.deadlines.map((d) =>
        d.id === id ? { ...d, status: 'completed' as DeadlineStatus } : d
      )
      saveToStorage(STORAGE_KEY, { deadlines })
      return { deadlines }
    })
  },

  rescheduleDeadline: (id, newDueDate) => {
    set((s) => {
      const deadlines = s.deadlines.map((d) =>
        d.id === id
          ? { ...d, dueDate: newDueDate, status: 'rescheduled' as DeadlineStatus }
          : d
      )
      saveToStorage(STORAGE_KEY, { deadlines })
      return { deadlines }
    })
  },

  deleteDeadline: (id) => {
    set((s) => {
      const deadlines = s.deadlines.filter((d) => d.id !== id)
      saveToStorage(STORAGE_KEY, { deadlines })
      return { deadlines }
    })
  },

  getDeadlineForTopic: (topicId) => get().deadlines.find((d) => d.topicId === topicId),
  getUpcoming: (days = 14) => get().deadlines.filter((d) => {
    if (d.status !== 'active') return false
    const remaining = daysUntil(d.dueDate)
    return remaining >= 0 && remaining <= days
  }),
  getOverdue: () => get().deadlines.filter((d) => d.status === 'active' && isOverdue(d.dueDate)),

  checkAndUpdateStatus: () => {
    set((s) => {
      const deadlines = s.deadlines.map((d) => {
        if (d.status === 'active' && isOverdue(d.dueDate)) {
          return { ...d, status: 'overdue' as DeadlineStatus }
        }
        return d
      })
      saveToStorage(STORAGE_KEY, { deadlines })
      return { deadlines }
    })
  },
}))