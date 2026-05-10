import { useState, useMemo } from 'react'
import { Plus, Sparkles, Trash2, Star, Search, Edit3, Download, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { useAgentStore } from '@/stores/agentStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { createAiProvider } from '@/services/ai'
import type { StarStory } from '@/types/agent'

type SortMode = 'newest' | 'oldest' | 'alpha' | 'score'

function ScoreBarSmall({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'bg-success' : value >= 50 ? 'bg-warning' : 'bg-danger'
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-text-muted w-6">{label}</span>
      <div className="flex-1 bg-surface-2 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] text-text-muted w-6 text-right">{value}</span>
    </div>
  )
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString() } catch { return iso }
}

function StoryBankInner() {
  const stories = useAgentStore((s) => s.stories)
  const addStory = useAgentStore((s) => s.addStory)
  const deleteStory = useAgentStore((s) => s.deleteStory)
  const updateStory = useAgentStore((s) => s.updateStory)
  const storyFavorites = useAgentStore((s) => s.storyFavorites)
  const toggleStoryFavorite = useAgentStore((s) => s.toggleStoryFavorite)
  const settings = useSettingsStore((s) => s.app)
  const { addToast } = useToast()
  const provider = createAiProvider(settings.agentProvider)

  const [showForm, setShowForm] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const [situation, setSituation] = useState('')
  const [task, setTask] = useState('')
  const [action, setAction] = useState('')
  const [result, setResult] = useState('')
  const [reflection, setReflection] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [genPrompt, setGenPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('newest')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editField, setEditField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [scores, setScores] = useState<Record<string, { situation: number; task: number; action: number; result: number; overall: number }>>({})

  const allTags = useMemo(() => {
    const all = new Set<string>()
    stories.forEach((s) => s.tags.forEach((t) => all.add(t)))
    return Array.from(all).sort()
  }, [stories])

  const filtered = useMemo(() => {
    let result = [...stories]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((s) =>
        s.situation.toLowerCase().includes(q) ||
        s.task.toLowerCase().includes(q) ||
        s.action.toLowerCase().includes(q) ||
        s.result.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    if (tagFilter) result = result.filter((s) => s.tags.includes(tagFilter))
    const favIds = new Set(storyFavorites)
    result.sort((a, b) => {
      const aFav = favIds.has(a.id) ? 0 : 1
      const bFav = favIds.has(b.id) ? 0 : 1
      if (aFav !== bFav) return aFav - bFav
      if (sortMode === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortMode === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortMode === 'alpha') return (a.situation || '').localeCompare(b.situation || '')
      if (sortMode === 'score') return (scores[b.id]?.overall || 0) - (scores[a.id]?.overall || 0)
      return 0
    })
    return result
  }, [stories, search, tagFilter, sortMode, storyFavorites, scores])

  const tagsJoined = tagInput.split(',').map((t) => t.trim()).filter(Boolean)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!situation || !task || !action || !result) return
    addStory({ situation, task, action, result, reflection, tags: tagsJoined })
    useAnalyticsStore.getState().trackEvent('story_created', { tags: tagsJoined.join(',') })
    if (settings.storyAutoScore) {
      const score = provider.scoreStarStory({ situation, task, action, result, reflection, tags: tagsJoined })
      const latestStory = useAgentStore.getState().stories[useAgentStore.getState().stories.length - 1]
      if (latestStory) setScores((prev) => ({ ...prev, [latestStory.id]: score }))
    }
    addToast('success', 'STAR story saved!')
    setSituation(''); setTask(''); setAction(''); setResult(''); setReflection(''); setTagInput('')
    setShowForm(false)
  }

  const handleGenerate = async () => {
    if (!genPrompt.trim()) return
    setGenerating(true)
    await new Promise((r) => setTimeout(r, 2000))
    const story = provider.generateStarStory(genPrompt)
    addStory(story)
    useAnalyticsStore.getState().trackEvent('story_generated', { prompt: genPrompt })
    addToast('success', 'AI-generated STAR story saved!')
    setGenPrompt('')
    setGenerating(false)
    setShowGenerator(false)
  }

  const startEdit = (id: string, field: string, value: string) => {
    setEditingId(id)
    setEditField(field)
    setEditValue(value)
  }

  const saveEdit = (id: string) => {
    if (!editField || !editingId) return
    const updates: Partial<Omit<StarStory, 'id' | 'createdAt'>> = {}
    if (editField === 'tags') updates.tags = editValue.split(',').map((t) => t.trim()).filter(Boolean)
    else (updates as Record<string, string>)[editField] = editValue
    updateStory(id, updates)
    if (settings.storyAutoScore && editField && editField !== 'reflection' && editField !== 'tags') {
      const story = stories.find((s) => s.id === id)
      if (story) {
        const updatedStory = { ...story, ...updates }
        const score = provider.scoreStarStory({ situation: updatedStory.situation, task: updatedStory.task, action: updatedStory.action, result: updatedStory.result, reflection: updatedStory.reflection, tags: updatedStory.tags })
        setScores((prev) => ({ ...prev, [id]: score }))
      }
    }
    setEditingId(null)
    setEditField(null)
    setEditValue('')
    addToast('success', 'Story updated!')
  }

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteStory(id))
    useAnalyticsStore.getState().trackEvent('story_bulk_deleted', { count: selectedIds.size })
    setSelectedIds(new Set())
    addToast('success', `${selectedIds.size} stories deleted!`)
  }

  const handleBulkExport = () => {
    const selected = stories.filter((s) => selectedIds.has(s.id))
    const json = JSON.stringify(selected, null, 2)
    navigator.clipboard.writeText(json)
    addToast('success', `Copied ${selected.length} stories as JSON!`)
  }

  const handleExportOne = (story: StarStory) => {
    const md = `## ${story.tags.join(', ') || 'STAR Story'}\n\n**Situation:** ${story.situation}\n\n**Task:** ${story.task}\n\n**Action:** ${story.action}\n\n**Result:** ${story.result}\n\n${story.reflection ? `**Reflection:** ${story.reflection}\n\n` : ''}*Created: ${formatDate(story.createdAt)}*`
    navigator.clipboard.writeText(md)
    addToast('success', 'Copied as Markdown!')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-3.5 h-3.5" /> Add Story
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setShowGenerator(true)}>
          <Sparkles className="w-3.5 h-3.5" /> AI Generate
        </Button>
        <span className="text-xs text-text-muted">{stories.length} stories</span>
        {selectedIds.size > 0 && (
          <>
            <Button size="sm" variant="danger" onClick={handleBulkDelete}>
              <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedIds.size})
            </Button>
            <Button size="sm" variant="secondary" onClick={handleBulkExport}>
              <Download className="w-3.5 h-3.5" /> Export ({selectedIds.size})
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stories..."
            className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        {allTags.length > 0 && (
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All tags</option>
            {allTags.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
        )}
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="alpha">Alphabetical</option>
          <option value="score">Highest Score</option>
        </select>
      </div>

      {stories.length === 0 && (
        <div className="text-center py-8 text-text-muted text-sm">
          No stories yet. Add your first STAR method story or use AI to generate one from a prompt.
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((story) => {
          const isFav = storyFavorites.includes(story.id)
          const isSelected = selectedIds.has(story.id)
          const isEditing = editingId === story.id
          const storyScore = scores[story.id]

          return (
            <div key={story.id} className={`bg-surface border rounded-lg p-4 group ${isSelected ? 'border-primary' : 'border-border'}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => handleSelect(story.id)} className={`p-0.5 rounded ${isSelected ? 'text-primary' : 'text-text-muted hover:text-primary'}`}>
                    <CheckSquare className="w-4 h-4" />
                  </button>
                  <button onClick={() => { toggleStoryFavorite(story.id); useAnalyticsStore.getState().trackEvent('story_favorited', { storyId: story.id, favorite: !isFav }) }} className={`p-0.5 ${isFav ? 'text-warning' : 'text-text-muted hover:text-warning'}`}>
                    <Star className={`w-4 h-4 ${isFav ? 'fill-warning' : ''}`} />
                  </button>
                  <div className="flex flex-wrap gap-1.5">
                    {story.tags.map((t, i) => (<span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary">{t}</span>))}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => handleExportOne(story)} className="text-text-muted hover:text-text p-1"><Download className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteStory(story.id)} className="text-text-muted hover:text-danger p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {(['situation', 'task', 'action', 'result'] as const).map((field) => (
                  <div key={field} className="group/edit">
                    {isEditing && editField === field ? (
                      <div className="flex gap-2">
                        <span className="font-semibold text-text shrink-0">{field.charAt(0).toUpperCase()}:</span>
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 bg-surface-2 border border-border rounded px-2 py-1 text-sm text-text resize-none"
                          rows={2}
                          onBlur={() => saveEdit(story.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(story.id) } }}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <span className="font-semibold text-text shrink-0">{field.charAt(0).toUpperCase()}:</span>
                        <span className="text-text">{story[field]}</span>
                        <button onClick={() => startEdit(story.id, field, story[field])} className="text-text-muted hover:text-text opacity-0 group-hover/edit:opacity-100 transition-all p-0.5">
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {story.reflection && <div className="text-text-muted italic text-xs mt-1">Reflection: {story.reflection}</div>}
                <div className="text-[10px] text-text-muted">{formatDate(story.createdAt)}</div>
              </div>

              {storyScore && settings.storyAutoScore && (
                <div className="mt-3 pt-3 border-t border-border space-y-1">
                  <ScoreBarSmall label="S" value={storyScore.situation} />
                  <ScoreBarSmall label="T" value={storyScore.task} />
                  <ScoreBarSmall label="A" value={storyScore.action} />
                  <ScoreBarSmall label="R" value={storyScore.result} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add STAR Story">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea label="Situation" value={situation} onChange={(e) => setSituation(e.target.value)} rows={2} placeholder="Describe the context..." />
          <Textarea label="Task" value={task} onChange={(e) => setTask(e.target.value)} rows={2} placeholder="What was your responsibility?" />
          <Textarea label="Action" value={action} onChange={(e) => setAction(e.target.value)} rows={2} placeholder="What did you do?" />
          <Textarea label="Result" value={result} onChange={(e) => setResult(e.target.value)} rows={2} placeholder="What was the outcome?" />
          <Textarea label="Reflection (optional)" value={reflection} onChange={(e) => setReflection(e.target.value)} rows={1} placeholder="What did you learn?" />
          <Input label="Tags (comma separated)" value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="e.g. leadership, conflict, delivery" />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">Save Story</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showGenerator} onClose={() => setShowGenerator(false)} title="AI Story Generator">
        <p className="text-sm text-text-muted mb-3">Describe an experience and AI will generate a STAR story from it.</p>
        <Textarea value={genPrompt} onChange={(e) => setGenPrompt(e.target.value)} rows={4} placeholder="e.g. A time I led a team to deliver a critical feature under a tight deadline..." />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={() => setShowGenerator(false)}>Cancel</Button>
          <Button onClick={handleGenerate} loading={generating} disabled={!genPrompt.trim()}>
            <Sparkles className="w-3.5 h-3.5" /> Generate
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export function StoryBank() {
  return (
    <ErrorBoundary>
      <StoryBankInner />
    </ErrorBoundary>
  )
}