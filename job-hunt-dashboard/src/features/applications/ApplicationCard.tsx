import { Building2, Bell } from 'lucide-react'
import type { JobApplication } from '@/types/application'
import { STAGE_LABELS, STAGE_COLORS } from '@/types/application'

interface ApplicationCardProps {
  application: JobApplication
  onClick: () => void
  staleDays?: number
}

export function ApplicationCard({ application, onClick, staleDays }: ApplicationCardProps) {
  const isStale = staleDays !== undefined && staleDays > 0
  return (
    <div
      onClick={onClick}
      className={`bg-surface-2 border rounded-lg p-3 cursor-pointer transition-colors relative ${
        isStale ? 'border-warning/50 hover:border-warning' : 'border-border hover:border-primary/50'
      }`}
    >
      {isStale && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-warning">
          <Bell className="w-3 h-3" />
          <span>{staleDays}d</span>
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text truncate">{application.company}</p>
          <p className="text-xs text-text-muted truncate">{application.role}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_COLORS[application.stage] }} />
            <span className="text-xs text-text-muted">{STAGE_LABELS[application.stage]}</span>
          </div>
        </div>
      </div>
    </div>
  )
}