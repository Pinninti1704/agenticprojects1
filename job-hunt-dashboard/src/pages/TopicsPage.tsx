import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TopicList } from '@/features/topics/TopicList'
import { TopicDetail } from '@/features/topics/TopicDetail'
import { TopicForm } from '@/features/topics/TopicForm'

export function TopicsPage() {
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <div className="flex h-full gap-6">
      {/* Left: Topic List */}
      <div className="w-80 shrink-0 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">All Topics</h2>
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4" /> Add Topic
          </Button>
        </div>
        <TopicList />
      </div>

      {/* Right: Topic Detail */}
      <div className="flex-1 overflow-y-auto border-l border-border pl-6">
        <TopicDetail />
      </div>

      <Modal open={showAddForm} onClose={() => setShowAddForm(false)} title="Add New Topic">
        <TopicForm onClose={() => setShowAddForm(false)} />
      </Modal>
    </div>
  )
}