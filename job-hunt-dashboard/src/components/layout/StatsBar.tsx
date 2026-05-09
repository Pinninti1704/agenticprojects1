import { BookOpen, Briefcase, Flame, TrendingUp } from 'lucide-react'
import { useTopicStore } from '@/stores/topicStore'
import { useApplicationStore } from '@/stores/applicationStore'
import { useStudyStore } from '@/stores/studyStore'

export function StatsBar() {
  const topics = useTopicStore((s) => s.topics)
  const applications = useApplicationStore((s) => s.applications)
  const streak = useStudyStore((s) => s.streak)
  
  const coveredCount = topics.filter((t) => t.confidence >= 3).length
  const avgConfidence = topics.length > 0
    ? (topics.reduce((sum, t) => sum + t.confidence, 0) / topics.length).toFixed(1)
    : '—'

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-surface-2 border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Topics Covered</p>
            <p className="text-lg font-bold text-text">{coveredCount}/{topics.length}</p>
          </div>
        </div>
      </div>
      <div className="bg-surface-2 border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Applications</p>
            <p className="text-lg font-bold text-text">{applications.length}</p>
          </div>
        </div>
      </div>
      <div className="bg-surface-2 border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center">
            <Flame className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Study Streak</p>
            <p className="text-lg font-bold text-text">{streak.current} days</p>
          </div>
        </div>
      </div>
      <div className="bg-surface-2 border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Avg Confidence</p>
            <p className="text-lg font-bold text-text">{avgConfidence}/5</p>
          </div>
        </div>
      </div>
    </div>
  )
}