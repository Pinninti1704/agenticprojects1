import { useMemo, useState } from 'react'
import { useApplicationStore } from '@/stores/applicationStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ApplicationCard } from './ApplicationCard'
import { APPLICATION_STAGES, STAGE_LABELS, STAGE_COLORS } from '@/types/application'
import { daysUntil } from '@/lib/utils'

export function ApplicationList({ search = '' }: { search?: string }) {
  const applications = useApplicationStore((s) => s.applications)
  const updateStage = useApplicationStore((s) => s.updateStage)
  const deleteApplication = useApplicationStore((s) => s.deleteApplication)
  const showTerminalStages = useSettingsStore((s) => s.applications.showTerminalStages)
  const followUpDays = useSettingsStore((s) => s.app.followUpDays)
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)

  const activeStages = useMemo(() => {
    if (showTerminalStages) return APPLICATION_STAGES
    return APPLICATION_STAGES.filter((s) => s !== 'rejected' && s !== 'withdrawn')
  }, [showTerminalStages])

  const filtered = useMemo(() => {
    if (!search.trim()) return applications
    const q = search.toLowerCase()
    return applications.filter((a) =>
      a.company.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q) ||
      a.notes.toLowerCase().includes(q)
    )
  }, [applications, search])

  return (
    <div>
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
        {activeStages.map((stage) => {
          const stageApps = useMemo(() => filtered.filter((a) => a.stage === stage), [filtered, stage])
          return (
            <div key={stage} className="min-w-[220px] flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage] }} />
                <span className="text-sm font-medium text-text">{STAGE_LABELS[stage]}</span>
                <span className="text-xs text-text-muted">{stageApps.length}</span>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {stageApps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onClick={() => { setSelectedApp(app.id); setShowEditForm(true) }}
                    staleDays={(() => { const d = Math.max(0, -daysUntil(app.updatedAt.slice(0, 10))); return d >= followUpDays ? d : undefined })()}
                  />
                ))}
                {stageApps.length === 0 && (
                  <div className="text-xs text-text-muted/50 text-center py-6 border border-dashed border-border rounded-lg">
                    No applications
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={showEditForm && !!selectedApp} onClose={() => { setShowEditForm(false); setSelectedApp(null) }} title="Application Details">
        {selectedApp && (
          <div>
            {(() => {
              const app = applications.find((a) => a.id === selectedApp)
              if (!app) return null
              return (
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-bold text-text">{app.company}</p>
                    <p className="text-sm text-text-muted">{app.role}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Stage</p>
                    <select
                      value={app.stage}
                      onChange={(e) => updateStage(app.id, e.target.value as any)}
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text"
                    >
                      {APPLICATION_STAGES.map((s) => (
                        <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                  {app.notes && (
                    <div>
                      <p className="text-xs text-text-muted mb-1">Notes</p>
                      <p className="text-sm text-text bg-surface rounded-lg p-3">{app.notes}</p>
                    </div>
                  )}
                  <div className="flex justify-between pt-2">
                    <Button variant="danger" size="sm" onClick={() => { deleteApplication(app.id); setShowEditForm(false) }}>
                      Delete
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setShowEditForm(false)}>Close</Button>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </Modal>
    </div>
  )
}