import { useState, useMemo } from 'react'
import { Plus, Star, Trash2 } from 'lucide-react'
import { useTopicStore } from '@/stores/topicStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { QuestionScraperPanel } from '@/features/questions/QuestionScraperPanel'
import { QuestionReviewQueue } from '@/features/questions/QuestionReviewQueue'
import { QuestionList } from '@/features/questions/QuestionList'
import { DeadlineCountdown } from '@/features/deadlines/DeadlineCountdown'
import { useDeadlineStore } from '@/stores/deadlineStore'
import { Modal } from '@/components/ui/Modal'

export function TopicDetail() {
  const selectedTopicId = useTopicStore((s) => s.selectedTopicId)
  const topics = useTopicStore((s) => s.topics)
  const deadlines = useDeadlineStore((s) => s.deadlines)
  const updateConfidence = useTopicStore((s) => s.updateConfidence)
  const addMaterial = useTopicStore((s) => s.addMaterial)
  const removeMaterial = useTopicStore((s) => s.removeMaterial)

  const topic = useMemo(() => topics.find((t) => t.id === selectedTopicId), [topics, selectedTopicId])
  const deadline = useMemo(() => deadlines.find((d) => d.topicId === selectedTopicId), [deadlines, selectedTopicId])

  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [materialTitle, setMaterialTitle] = useState('')
  const [materialType, setMaterialType] = useState<'article' | 'video' | 'book' | 'course' | 'note' | 'link'>('article')
  const [materialUrl, setMaterialUrl] = useState('')
  const [materialNotes, setMaterialNotes] = useState('')

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [deadlineDate, setDeadlineDate] = useState('')

  if (!topic) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        Select a topic to view details
      </div>
    )
  }

  const handleConfidenceClick = (value: 1 | 2 | 3 | 4 | 5) => {
    updateConfidence(topic.id, value)
  }

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault()
    if (!materialTitle.trim()) return
    addMaterial(topic.id, {
      type: materialType,
      title: materialTitle.trim(),
      url: materialUrl || undefined,
      notes: materialNotes,
    })
    setMaterialTitle('')
    setMaterialUrl('')
    setMaterialNotes('')
    setShowMaterialForm(false)
  }

  const handleSetDeadline = () => {
    if (!deadlineDate) return
    useDeadlineStore.getState().setDeadline(topic.id, deadlineDate)
    setShowDatePicker(false)
  }

  return (
    <div className="space-y-5">
      {/* Topic Header */}
      <div>
        <h2 className="text-lg font-bold text-text">{topic.name}</h2>
        <p className="text-xs text-text-muted mt-0.5">
          Created {new Date(topic.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Confidence Rating */}
      <div>
        <p className="text-xs text-text-muted mb-2 font-medium">Confidence Level</p>
        <div className="flex gap-1">
          {([1, 2, 3, 4, 5] as const).map((v) => (
            <button
              key={v}
              onClick={() => handleConfidenceClick(v)}
              className={`p-1 transition-colors ${v <= topic.confidence ? 'text-primary' : 'text-border'}`}
            >
              <Star className={`w-5 h-5 ${v <= topic.confidence ? 'fill-primary' : ''}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Deadlines */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-text-muted font-medium">Deadline</p>
          {!deadline && (
            <button
              onClick={() => setShowDatePicker(true)}
              className="text-xs text-primary hover:text-primary-light"
            >
              + Set Deadline
            </button>
          )}
        </div>
        {deadline && <DeadlineCountdown deadline={deadline} />}
      </div>

      {/* Study Materials */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-text-muted font-medium">Study Materials</p>
          <button
            onClick={() => setShowMaterialForm(!showMaterialForm)}
            className="text-xs text-primary hover:text-primary-light flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Material
          </button>
        </div>

        {showMaterialForm && (
          <form onSubmit={handleAddMaterial} className="bg-surface rounded-lg p-3 border border-border mb-3 space-y-3">
            <Input label="Title" value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} placeholder="Material title" />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Type"
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value as typeof materialType)}
                options={[
                  { value: 'article', label: 'Article' },
                  { value: 'video', label: 'Video' },
                  { value: 'book', label: 'Book' },
                  { value: 'course', label: 'Course' },
                  { value: 'note', label: 'Note' },
                  { value: 'link', label: 'Link' },
                ]}
              />
              <Input label="URL (optional)" value={materialUrl} onChange={(e) => setMaterialUrl(e.target.value)} placeholder="https://" />
            </div>
            <Textarea label="Notes" value={materialNotes} onChange={(e) => setMaterialNotes(e.target.value)} rows={2} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => setShowMaterialForm(false)}>Cancel</Button>
              <Button size="sm" type="submit">Save</Button>
            </div>
          </form>
        )}

        {topic.materials.length === 0 && !showMaterialForm && (
          <p className="text-xs text-text-muted/50">No materials added yet</p>
        )}
        <div className="space-y-2">
          {topic.materials.map((mat) => (
            <div key={mat.id} className="flex items-start gap-3 bg-surface rounded-lg p-3 border border-border group">
              <Badge variant="info">{mat.type}</Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text truncate">{mat.title}</p>
                {mat.url && (
                  <a href={mat.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block">
                    {mat.url}
                  </a>
                )}
                {mat.notes && <p className="text-xs text-text-muted mt-1">{mat.notes}</p>}
              </div>
              <button
                onClick={() => removeMaterial(topic.id, mat.id)}
                className="text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Questions Section */}
      <div>
        <p className="text-xs text-text-muted font-medium mb-2">Interview Questions</p>
        <QuestionScraperPanel topicId={topic.id} />
        <div className="mt-3">
          <QuestionReviewQueue topicId={topic.id} />
        </div>
        <div className="mt-3">
          <QuestionList topicId={topic.id} />
        </div>
      </div>

      {/* Deadline Date Picker Modal */}
      <Modal open={showDatePicker} onClose={() => setShowDatePicker(false)} title="Set Deadline">
        <Input
          label="Due Date"
          type="date"
          value={deadlineDate}
          onChange={(e) => setDeadlineDate(e.target.value)}
        />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={() => setShowDatePicker(false)}>Cancel</Button>
          <Button onClick={handleSetDeadline} disabled={!deadlineDate}>Set Deadline</Button>
        </div>
      </Modal>
    </div>
  )
}