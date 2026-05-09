import { useState } from 'react'
import { useApplicationStore } from '@/stores/applicationStore'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { APPLICATION_STAGES, STAGE_LABELS } from '@/types/application'

interface ApplicationFormProps {
  onClose: () => void
  editId?: string
}

export function ApplicationForm({ onClose, editId }: ApplicationFormProps) {
  const addApplication = useApplicationStore((s) => s.addApplication)
  const updateApplication = useApplicationStore((s) => s.updateApplication)
  const apps = useApplicationStore((s) => s.applications)
  const existing = editId ? apps.find((a) => a.id === editId) : null

  const [company, setCompany] = useState(existing?.company || '')
  const [role, setRole] = useState(existing?.role || '')
  const [stage, setStage] = useState<string>(existing?.stage || 'wishlist')
  const [notes, setNotes] = useState(existing?.notes || '')
  const [url, setUrl] = useState(existing?.url || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!company.trim() || !role.trim()) return

    if (editId && existing) {
      updateApplication(editId, { company: company.trim(), role: role.trim(), stage: stage as any, notes, url: url || undefined })
    } else {
      addApplication({ company: company.trim(), role: role.trim(), stage: stage as any, notes, url: url || undefined })
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Google" autoFocus />
      <Input label="Role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Senior Software Engineer" />
      <Select
        label="Stage"
        value={stage}
        onChange={(e) => setStage(e.target.value)}
        options={APPLICATION_STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] }))}
      />
      <Input label="Job URL (optional)" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
      <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={!company.trim() || !role.trim()}>
          {editId ? 'Update' : 'Add Application'}
        </Button>
      </div>
    </form>
  )
}