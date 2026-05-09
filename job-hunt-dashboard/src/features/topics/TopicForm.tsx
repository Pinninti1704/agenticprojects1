import { useState } from 'react'
import { useTopicStore } from '@/stores/topicStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
interface TopicFormProps {
  onClose: () => void
}

export function TopicForm({ onClose }: TopicFormProps) {
  const addTopic = useTopicStore((s) => s.addTopic)
  const categories = useTopicStore((s) => s.categories)
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addTopic(categoryId, name.trim())
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Topic Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Arrays & Hashing"
        autoFocus
      />
      <Select
        label="Category"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={!name.trim()}>Add Topic</Button>
      </div>
    </form>
  )
}