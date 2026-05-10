import { useState } from 'react'
import { Clock, Plus } from 'lucide-react'
import { useStudyStore } from '@/stores/studyStore'
import { useTopicStore } from '@/stores/topicStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { formatDuration } from '@/lib/utils'

export function StudySessionForm() {
  const addSession = useStudyStore((s) => s.addSession)
  const topics = useTopicStore((s) => s.topics)
  const studyTimeSlots = useSettingsStore((s) => s.app.studyTimeSlots)
  const defaultDuration = useSettingsStore((s) => s.app.defaultStudyDuration)
  const { addToast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [topicId, setTopicId] = useState(topics[0]?.id || '')
  const [duration, setDuration] = useState(defaultDuration)
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!topicId || !duration) return
    addSession({ topicId, durationMinutes: duration, notes })
    addToast('success', `Logged ${formatDuration(duration)} study session`)
    setNotes('')
    setShowForm(false)
  }

  if (!showForm) {
    return (
      <Button variant="secondary" fullWidth onClick={() => setShowForm(true)}>
        <Plus className="w-4 h-4" /> Log Study Session
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface-2 border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> New Session
        </span>
      </div>
      <Select
        label="Topic"
        value={topicId}
        onChange={(e) => setTopicId(e.target.value)}
        options={topics.map((t) => ({ value: t.id, label: t.name }))}
      />
      <div>
        <p className="text-xs text-text-muted mb-2">Duration</p>
        <div className="flex flex-wrap gap-2">
          {studyTimeSlots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setDuration(slot)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                duration === slot
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border text-text-muted hover:border-primary/50'
              }`}
            >
              {formatDuration(slot)}
            </button>
          ))}
        </div>
      </div>
      <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="What did you study?" />
      <div className="flex justify-end gap-3">
        <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
        <Button type="submit">Log Session</Button>
      </div>
    </form>
  )
}