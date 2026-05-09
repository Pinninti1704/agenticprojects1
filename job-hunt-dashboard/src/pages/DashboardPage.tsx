import { BookOpen, Briefcase, Clock, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfidenceRadar } from '@/components/charts/ConfidenceRadar'
import { DeadlineList } from '@/features/deadlines/DeadlineList'
import { TimelineView } from '@/features/deadlines/TimelineView'
import { StatsBar } from '@/components/layout/StatsBar'
import { useTopicStore } from '@/stores/topicStore'
import { useStudyStore } from '@/stores/studyStore'
import { formatDuration } from '@/lib/utils'

export function DashboardPage() {
  const topics = useTopicStore((s) => s.topics)
  const sessions = useStudyStore((s) => s.sessions)
  const getTotalMinutesToday = useStudyStore((s) => s.getTotalMinutesToday)
  const getTotalMinutesThisWeek = useStudyStore((s) => s.getTotalMinutesThisWeek)

  const todayMinutes = getTotalMinutesToday()
  const weekMinutes = getTotalMinutesThisWeek()
  const todaySessions = sessions.filter((s) => s.date === new Date().toISOString().slice(0, 10))

  return (
    <div className="space-y-6">
      <StatsBar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confidence Radar */}
        <Card title="Confidence Overview">
          <ConfidenceRadar />
        </Card>

        {/* Study Activity */}
        <Card title="Today's Study">
          {todaySessions.length > 0 ? (
            <div className="space-y-2">
              {todaySessions.slice(0, 5).map((s) => {
                const topic = topics.find((t) => t.id === s.topicId)
                return (
                  <div key={s.id} className="flex items-center justify-between bg-surface rounded-lg p-2.5">
                    <span className="text-sm text-text">{topic?.name || 'Unknown'}</span>
                    <span className="text-xs text-text-muted">{formatDuration(s.durationMinutes)}</span>
                  </div>
                )
              })}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-text-muted">Today: {formatDuration(todayMinutes)}</span>
                <span className="text-xs text-text-muted">Week: {formatDuration(weekMinutes)}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-text-muted gap-3">
              <Clock className="w-8 h-8 opacity-30" />
              <p className="text-sm">No study sessions logged today</p>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deadlines */}
        <Card title="Upcoming Deadlines">
          <DeadlineList />
        </Card>

        {/* Timeline */}
        <Card title="Deadline Timeline">
          <TimelineView />
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        <Button variant="secondary" className="h-20 flex-col gap-1" onClick={() => {}}>
          <BookOpen className="w-5 h-5" />
          <span className="text-xs">Add Topic</span>
        </Button>
        <Button variant="secondary" className="h-20 flex-col gap-1" onClick={() => {}}>
          <Sparkles className="w-5 h-5" />
          <span className="text-xs">Scrape Questions</span>
        </Button>
        <Button variant="secondary" className="h-20 flex-col gap-1" onClick={() => {}}>
          <Briefcase className="w-5 h-5" />
          <span className="text-xs">Log Application</span>
        </Button>
        <Button variant="secondary" className="h-20 flex-col gap-1" onClick={() => {}}>
          <Clock className="w-5 h-5" />
          <span className="text-xs">Log Study</span>
        </Button>
      </div>
    </div>
  )
}