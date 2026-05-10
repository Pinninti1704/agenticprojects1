import { useMemo } from 'react'
import { BookOpen, Briefcase, Flame, HelpCircle, TrendingUp } from 'lucide-react'
import { useTopicStore } from '@/stores/topicStore'
import { useApplicationStore } from '@/stores/applicationStore'
import { useStudyStore } from '@/stores/studyStore'
import { useQuestionStore } from '@/stores/questionStore'
import type { TabType } from '@/components/layout/Sidebar'

export function StatsBar({ onStatClick }: { onStatClick?: (tab: TabType) => void }) {
  const topics = useTopicStore((s) => s.topics)
  const applications = useApplicationStore((s) => s.applications)
  const streak = useStudyStore((s) => s.streak)
  const acceptedQuestions = useQuestionStore((s) => s.acceptedQuestions)

  const coveredCount = useMemo(() => topics.filter((t) => t.confidence >= 3).length, [topics])
  const avgConfidence = useMemo(() => topics.length > 0
    ? (topics.reduce((sum, t) => sum + t.confidence, 0) / topics.length).toFixed(1)
    : '—', [topics])
  const totalAcceptedQuestions = useMemo(() =>
    Object.values(acceptedQuestions).reduce((sum, arr) => sum + arr.length, 0),
    [acceptedQuestions]
  )

  return (
    <div className="grid grid-cols-5 gap-4 mb-6">
      <div onClick={() => onStatClick?.('topics')} className="bg-surface-2 border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
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
      <div onClick={() => onStatClick?.('topics')} className="bg-surface-2 border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-text-muted">Accepted Qs</p>
            <p className="text-lg font-bold text-text">{totalAcceptedQuestions}</p>
          </div>
        </div>
      </div>
      <div onClick={() => onStatClick?.('applications')} className="bg-surface-2 border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
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
      <div onClick={() => onStatClick?.('study')} className="bg-surface-2 border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
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
      <div onClick={() => onStatClick?.('analytics')} className="bg-surface-2 border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
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