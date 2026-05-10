import { useMemo } from 'react'
import { useDeadlineStore } from '@/stores/deadlineStore'
import { useTopicStore } from '@/stores/topicStore'
import { daysUntil } from '@/lib/utils'
import type { TabType } from '@/components/layout/Sidebar'

export function TimelineView({ onNavigate }: { onNavigate?: (tab: TabType) => void }) {
  const setSelectedTopicId = useTopicStore((s) => s.setSelectedTopicId)
  const allDeadlines = useDeadlineStore((s) => s.deadlines)
  const topics = useTopicStore((s) => s.topics)

  const sorted = useMemo(() => {
    return allDeadlines
      .filter((d) => d.status === 'active')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [allDeadlines])

  if (sorted.length === 0) {
    return (
      <div className="text-xs text-text-muted/50 text-center py-4">
        No deadlines set
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-4">
        {sorted.map((d) => {
          const topic = topics.find((t) => t.id === d.topicId)
          const remaining = daysUntil(d.dueDate)
          const color = remaining < 0 ? 'bg-danger' : remaining <= 3 ? 'bg-warning' : 'bg-primary'
          return (
            <div key={d.id} className="relative pl-8 cursor-pointer" onClick={() => { setSelectedTopicId(d.topicId); onNavigate?.('topics') }}>
              <div className={`absolute left-2.5 w-2.5 h-2.5 rounded-full ${color} border-2 border-surface`} style={{ top: 5 }} />
              <div>
                <p className="text-sm text-text">{topic?.name || 'Unknown Topic'}</p>
                <p className="text-xs text-text-muted">
                  {remaining < 0 ? `Overdue by ${Math.abs(remaining)}d` : `${remaining}d remaining`}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}