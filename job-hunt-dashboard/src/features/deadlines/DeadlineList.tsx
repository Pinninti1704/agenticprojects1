import { useDeadlineStore } from '@/stores/deadlineStore'
import { useTopicStore } from '@/stores/topicStore'
import { daysUntil, isOverdue } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export function DeadlineList() {
  const deadlines = useDeadlineStore((s) => s.deadlines)
  const completeDeadline = useDeadlineStore((s) => s.completeDeadline)
  const topics = useTopicStore((s) => s.topics)

  const sorted = [...deadlines]
    .filter((d) => d.status === 'active')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  if (sorted.length === 0) {
    return (
      <div className="text-xs text-text-muted/50 text-center py-4">
        No active deadlines
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sorted.map((d) => {
        const topic = topics.find((t) => t.id === d.topicId)
        const remaining = daysUntil(d.dueDate)
        const overdue = isOverdue(d.dueDate)
        return (
          <div key={d.id} className="flex items-center justify-between bg-surface rounded-lg border border-border p-3">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${overdue ? 'bg-danger' : remaining <= 3 ? 'bg-warning' : 'bg-success'}`} />
              <div>
                <p className="text-sm text-text">{topic?.name || 'Unknown'}</p>
                <p className="text-xs text-text-muted">{new Date(d.dueDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={overdue ? 'danger' : remaining <= 3 ? 'warning' : 'success'}>
                {overdue ? 'Overdue' : `${remaining}d left`}
              </Badge>
              <Button size="sm" variant="ghost" onClick={() => completeDeadline(d.id)}>Done</Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}