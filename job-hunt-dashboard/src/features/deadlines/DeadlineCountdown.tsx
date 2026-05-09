import { useEffect, useState } from 'react'
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import type { Deadline } from '@/types/deadline'
import { daysUntil, isOverdue } from '@/lib/utils'

interface DeadlineCountdownProps {
  deadline: Deadline
}

export function DeadlineCountdown({ deadline }: DeadlineCountdownProps) {
  const [remaining, setRemaining] = useState(daysUntil(deadline.dueDate))
  const overdue = isOverdue(deadline.dueDate)

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(daysUntil(deadline.dueDate))
    }, 60000)
    return () => clearInterval(interval)
  }, [deadline.dueDate])

  if (deadline.status === 'completed') {
    return (
      <div className="flex items-center gap-2 text-success text-sm bg-success/10 rounded-lg px-3 py-2 border border-success/30">
        <CheckCircle className="w-4 h-4" />
        <span>Completed</span>
      </div>
    )
  }

  const colorClass = overdue
    ? 'text-danger bg-danger/10 border-danger/30'
    : remaining <= 3
    ? 'text-warning bg-warning/10 border-warning/30'
    : 'text-text bg-surface border-border'

  return (
    <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border ${colorClass}`}>
      {overdue ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
      <span>
        {overdue
          ? `Overdue by ${Math.abs(remaining)} days`
          : remaining === 0
          ? 'Due today!'
          : `${remaining} days remaining`
        }
      </span>
      <span className="text-xs opacity-60 ml-auto">{new Date(deadline.dueDate).toLocaleDateString()}</span>
    </div>
  )
}