import { useState, useMemo } from 'react'
import { useStudyStore } from '@/stores/studyStore'
import { useTopicStore } from '@/stores/topicStore'
import { StudyCalendar } from '@/features/study/StudyCalendar'
import { StudySessionForm } from '@/features/study/StudySessionForm'
import { StreakDisplay } from '@/features/study/StreakDisplay'
import { formatDuration } from '@/lib/utils'
import type { TabType } from '@/components/layout/Sidebar'

export function StudyLogPage({ onTabChange }: { onTabChange?: (tab: TabType) => void }) {
  const sessions = useStudyStore((s) => s.sessions)
  const getTotalMinutesThisWeek = useStudyStore((s) => s.getTotalMinutesThisWeek)
  const getTotalMinutesThisMonth = useStudyStore((s) => s.getTotalMinutesThisMonth)
  const topics = useTopicStore((s) => s.topics)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const displayDate = selectedDate || today
  const displaySessions = useMemo(() => sessions.filter((s) => s.date === displayDate), [sessions, displayDate])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Calendar + Streak */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-surface-2 border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-text mb-4">Study Calendar</h3>
          <StudyCalendar onDayClick={(dateStr) => setSelectedDate(dateStr)} />
        </div>

        {/* Today's Sessions */}
        <div className="bg-surface-2 border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text">
              {selectedDate ? new Date(selectedDate).toLocaleDateString() : "Today's"} Sessions
            </h3>
            {selectedDate && (
              <button onClick={() => setSelectedDate(null)} className="text-xs text-primary hover:text-primary-light">
                Show today
              </button>
            )}
          </div>
          {displaySessions.length > 0 ? (
            <div className="space-y-2">
              {displaySessions.map((s) => {
                const topic = topics.find((t) => t.id === s.topicId)
                return (
                  <div key={s.id} className="flex items-center justify-between bg-surface rounded-lg p-3 cursor-pointer hover:border-primary/50 transition-colors border border-transparent">
                    <div>
                      <p className="text-sm text-text">{topic?.name || 'Unknown'}</p>
                      {s.notes && <p className="text-xs text-text-muted mt-0.5">{s.notes}</p>}
                    </div>
                    <span className="text-sm font-medium text-text">{formatDuration(s.durationMinutes)}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-text-muted text-sm">
              No sessions logged {selectedDate ? 'on this date' : 'today'}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Stats + Log Form */}
      <div className="space-y-6">
        <StreakDisplay />

        <div className="bg-surface-2 border border-border rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-text">Weekly Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div onClick={() => onTabChange?.('dashboard')} className="bg-surface rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors border border-transparent">
              <p className="text-lg font-bold text-text">{formatDuration(getTotalMinutesThisWeek())}</p>
              <p className="text-xs text-text-muted">This Week</p>
            </div>
            <div onClick={() => onTabChange?.('dashboard')} className="bg-surface rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors border border-transparent">
              <p className="text-lg font-bold text-text">{formatDuration(getTotalMinutesThisMonth())}</p>
              <p className="text-xs text-text-muted">This Month</p>
            </div>
          </div>
        </div>

        <StudySessionForm />
      </div>
    </div>
  )
}