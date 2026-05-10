import { useMemo } from 'react'
import { BookOpen, Briefcase, Clock, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfidenceRadar } from '@/components/charts/ConfidenceRadar'
import { DeadlineList } from '@/features/deadlines/DeadlineList'
import { TimelineView } from '@/features/deadlines/TimelineView'
import { StatsBar } from '@/components/layout/StatsBar'
import { useTopicStore } from '@/stores/topicStore'
import { useStudyStore } from '@/stores/studyStore'
import { useQuestionStore } from '@/stores/questionStore'
import { formatDuration } from '@/lib/utils'
import type { TabType } from '@/components/layout/Sidebar'

export function DashboardPage({ onTabChange }: { onTabChange?: (tab: TabType) => void }) {
  const topics = useTopicStore((s) => s.topics)
  const sessions = useStudyStore((s) => s.sessions)
  const acceptedQuestions = useQuestionStore((s) => s.acceptedQuestions)
  const getTotalMinutesToday = useStudyStore((s) => s.getTotalMinutesToday)
  const getTotalMinutesThisWeek = useStudyStore((s) => s.getTotalMinutesThisWeek)

  const todayMinutes = getTotalMinutesToday()
  const weekMinutes = getTotalMinutesThisWeek()
  const todaySessions = useMemo(() => sessions.filter((s) => s.date === new Date().toISOString().slice(0, 10)), [sessions])

  const recentQuestions = useMemo(() => {
    const all: { text: string; difficulty: string; type: string; topicName: string }[] = []
    for (const [topicId, qs] of Object.entries(acceptedQuestions)) {
      const topic = topics.find((t) => t.id === topicId)
      for (const q of qs) {
        all.push({ text: q.text, difficulty: q.difficulty, type: q.type, topicName: topic?.name || 'Unknown' })
      }
    }
    return all.reverse().slice(0, 5)
  }, [acceptedQuestions, topics])

  return (
    <div className="space-y-6">
      <StatsBar onStatClick={onTabChange} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confidence Radar */}
        <div onClick={() => onTabChange?.('topics')} className="cursor-pointer">
          <Card title="Confidence Overview">
            <ConfidenceRadar />
          </Card>
        </div>

        {/* Study Activity */}
        <Card title="Today's Study">
          <div onClick={() => onTabChange?.('study')}>
            {todaySessions.length > 0 ? (
              <div className="space-y-2">
                {todaySessions.slice(0, 5).map((s) => {
                  const topic = topics.find((t) => t.id === s.topicId)
                  return (
                    <div key={s.id} className="flex items-center justify-between bg-surface rounded-lg p-2.5 cursor-pointer hover:border-primary/50 transition-colors border border-transparent">
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
              <div className="flex flex-col items-center justify-center py-8 text-text-muted gap-3 cursor-pointer">
                <Clock className="w-8 h-8 opacity-30" />
                <p className="text-sm">No study sessions logged today — click to log one</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deadlines */}
        <Card title="Upcoming Deadlines">
          <DeadlineList onNavigate={onTabChange} />
        </Card>

        {/* Timeline */}
        <Card title="Deadline Timeline">
          <TimelineView onNavigate={onTabChange} />
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        <Button variant="secondary" className="h-20 flex-col gap-1" onClick={() => onTabChange?.('topics')}>
          <BookOpen className="w-5 h-5" />
          <span className="text-xs">Add Topic</span>
        </Button>
        <Button variant="secondary" className="h-20 flex-col gap-1" onClick={() => onTabChange?.('topics')}>
          <Sparkles className="w-5 h-5" />
          <span className="text-xs">Scrape Questions</span>
        </Button>
        <Button variant="secondary" className="h-20 flex-col gap-1" onClick={() => onTabChange?.('applications')}>
          <Briefcase className="w-5 h-5" />
          <span className="text-xs">Log Application</span>
        </Button>
        <Button variant="secondary" className="h-20 flex-col gap-1" onClick={() => onTabChange?.('study')}>
          <Clock className="w-5 h-5" />
          <span className="text-xs">Log Study</span>
        </Button>
      </div>

      {/* Recent Questions */}
      {recentQuestions.length > 0 && (
        <Card title="Recent Accepted Questions">
          <div className="space-y-2">
            {recentQuestions.map((q, i) => (
              <div key={i} className="bg-surface rounded-lg border border-border p-3 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onTabChange?.('topics')}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-text line-clamp-2">{q.text}</p>
                  <Badge variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'medium' ? 'warning' : 'danger'}>{q.difficulty}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-text-muted">{q.topicName}</span>
                  <Badge variant="info">{q.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}