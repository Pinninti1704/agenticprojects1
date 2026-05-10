import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ApplicationList } from '@/features/applications/ApplicationList'
import { ApplicationForm } from '@/features/applications/ApplicationForm'
import { useApplicationStore } from '@/stores/applicationStore'

export function ApplicationsPage() {
  const [showForm, setShowForm] = useState(false)
  const applications = useApplicationStore((s) => s.applications)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-muted">{applications.length} total applications</p>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Add Application
        </Button>
      </div>
      <ApplicationList />
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Application">
        <ApplicationForm onClose={() => setShowForm(false)} />
      </Modal>
    </div>
  )
}