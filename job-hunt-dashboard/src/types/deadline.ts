export type DeadlineStatus = 'active' | 'completed' | 'overdue' | 'rescheduled'

export interface Deadline {
  id: string
  topicId: string
  dueDate: string
  status: DeadlineStatus
  reminderDays: number[]
  createdAt: string
}