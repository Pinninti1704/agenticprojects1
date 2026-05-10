import { Flame } from 'lucide-react'
import { useStudyStore } from '@/stores/studyStore'
import { ProgressBar } from '@/components/ui/ProgressBar'

export function StreakDisplay() {
  const streak = useStudyStore((s) => s.streak)
  const milestones = [7, 14, 21, 30, 60, 90]
  const nextMilestone = milestones.find((m) => m > streak.current) || streak.current
  const progressToNext = (streak.current / nextMilestone) * 100

  return (
    <div className="bg-surface-2 border border-border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-warning/15 flex items-center justify-center">
          <Flame className="w-5 h-5 text-warning" />
        </div>
        <div>
          <p className="text-2xl font-bold text-text">{streak.current} days</p>
          <p className="text-xs text-text-muted">Best: {streak.longest} days</p>
        </div>
      </div>
      <ProgressBar value={progressToNext} label={`Next milestone: ${nextMilestone} days`} />
    </div>
  )
}