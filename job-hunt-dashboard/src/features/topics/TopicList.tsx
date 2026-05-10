import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useTopicStore } from '@/stores/topicStore'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'

export function TopicList() {
  const topics = useTopicStore((s) => s.topics)
  const categories = useTopicStore((s) => s.categories)
  const selectedTopicId = useTopicStore((s) => s.selectedTopicId)
  const setSelectedTopicId = useTopicStore((s) => s.setSelectedTopicId)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggleCategory = (catId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  const isCollapsed = (catId: string) => collapsed.has(catId)

  const confidenceToPercent = (c: number) => (c / 5) * 100

  return (
    <div className="space-y-2">
      {categories.map((cat) => {
        const catTopics = topics.filter((t) => t.categoryId === cat.id)
        const collapsed = isCollapsed(cat.id)
        return (
          <div key={cat.id}>
            <button
              onClick={() => toggleCategory(cat.id)}
              className="flex items-center justify-between px-2 py-1.5 w-full text-left cursor-pointer hover:text-text transition-colors"
            >
              <span className="flex items-center gap-1 text-xs font-semibold text-text-muted uppercase tracking-wider">
                {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {cat.name}
              </span>
              <span className="text-xs text-text-muted">{catTopics.length}</span>
            </button>
            {!collapsed && catTopics.length === 0 && (
              <p className="text-xs text-text-muted/50 px-2 pb-2">No topics yet</p>
            )}
            {!collapsed && catTopics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => setSelectedTopicId(topic.id)}
                className={`px-3 py-2.5 rounded-lg cursor-pointer transition-colors mb-1 ${
                  selectedTopicId === topic.id
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-surface border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-text">{topic.name}</span>
                  <Badge
                    variant={
                      topic.confidence >= 4 ? 'success' :
                      topic.confidence >= 3 ? 'info' :
                      topic.confidence >= 2 ? 'warning' : 'danger'
                    }
                  >
                    {`${topic.confidence}/5`}
                  </Badge>
                </div>
                <ProgressBar value={confidenceToPercent(topic.confidence)} size="sm" />
              </div>
            ))}
          </div>
        )
      })}
      {topics.length === 0 && (
        <div className="text-center py-8 text-text-muted text-sm">
          No topics yet. Click "Add Topic" to get started.
        </div>
      )}
    </div>
  )
}