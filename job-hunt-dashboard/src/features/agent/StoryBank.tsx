import { useState } from 'react'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useAgentStore } from '@/stores/agentStore'
import type { StarStory } from '@/types/agent'

export function StoryBank() {
  const stories = useAgentStore((s) => s.stories)
  const addStory = useAgentStore((s) => s.addStory)
  const deleteStory = useAgentStore((s) => s.deleteStory)
  const { addToast } = useToast()
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

  const tags = tagInput.split(',').map((t) => t.trim()).filter(Boolean)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!situation || !task || !action || !result) return
    addStory({ situation, task, action, result, reflection, tags })
    addToast('success', 'STAR story saved!')
    setSituation(''); setTask(''); setAction(''); setResult(''); setReflection(''); setTagInput('')
    setShowForm(false)
  }

  const handleGenerate = async () => {
    if (!genPrompt.trim()) return
    setGenerating(true)
    await new Promise((r) => setTimeout(r, 2000))
    const story = generateStarStory(genPrompt)
    addStory(story)
    addToast('success', 'AI-generated STAR story saved!')
    setGenPrompt('')
    setGenerating(false)
    setShowGenerator(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-3.5 h-3.5" /> Add Story
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setShowGenerator(true)}>
          <Sparkles className="w-3.5 h-3.5" /> AI Generate
        </Button>
        <span className="text-xs text-text-muted">{stories.length} stories</span>
      </div>

      {stories.length === 0 && (
        <div className="text-center py-8 text-text-muted text-sm">
          No stories yet. Add your first STAR method story or use AI to generate one from a prompt.
        </div>
      )}

      <div className="space-y-3">
        {stories.map((story) => (
          <div key={story.id} className="bg-surface border border-border rounded-lg p-4 group">
            <div className="flex items-start justify-between mb-2">
              <div className="flex flex-wrap gap-1.5">
                {story.tags.map((t, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary">{t}</span>
                ))}
              </div>
              <button onClick={() => deleteStory(story.id)} className="text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="font-semibold text-text">S:</span> {story.situation}</div>
              <div><span className="font-semibold text-text">T:</span> {story.task}</div>
              <div><span className="font-semibold text-text">A:</span> {story.action}</div>
              <div><span className="font-semibold text-text">R:</span> {story.result}</div>
              {story.reflection && <div className="text-text-muted italic text-xs mt-1">Reflection: {story.reflection}</div>}
            </div>
          </div>
        ))}
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

function generateStarStory(prompt: string): Omit<StarStory, 'id' | 'createdAt'> {
  const keywords = prompt.toLowerCase()
  let tags = ['leadership']
  if (keywords.includes('conflict') || keywords.includes('disagree')) tags = ['conflict-resolution', 'communication']
  else if (keywords.includes('deadline') || keywords.includes('ship')) tags = ['delivery', 'pressure']
  else if (keywords.includes('mentor') || keywords.includes('teach')) tags = ['mentorship', 'growth']
  else if (keywords.includes('bug') || keywords.includes('error') || keywords.includes('outage')) tags = ['incident', 'problem-solving']
  else if (keywords.includes('design') || keywords.includes('architect')) tags = ['architecture', 'design']
  else if (keywords.includes('customer') || keywords.includes('client')) tags = ['customer-success', 'communication']
  else if (keywords.includes('optimize') || keywords.includes('speed') || keywords.includes('perf')) tags = ['optimization', 'performance']

  return {
    situation: `While working on a ${extractDomain(prompt)} project, the team faced ${tags.includes('deadline') ? 'aggressive delivery timelines' : tags.includes('conflict') ? 'differing technical opinions' : 'a complex technical challenge'} that required immediate attention. ${tags.includes('incident') ? 'A critical production issue impacted user experience and needed rapid resolution.' : 'The scope was larger than initially estimated and required careful prioritization.'}`,
    task: `I was responsible for ${tags.includes('leadership') ? 'coordinating the team effort and ensuring' : 'architecting and implementing'} a solution that would ${tags.includes('deadline') ? 'meet the delivery deadline without compromising quality' : 'address the core issue while maintaining system stability'}. The key challenge was ${tags.includes('conflict') ? 'aligning stakeholders on the approach' : 'balancing speed with thoroughness'} given the constraints.`,
    action: `I ${tags.includes('leadership') ? 'organized daily sync meetings, broke down the work into parallel tracks, and assigned ownership' : 'prototyped three approaches, benchmarked each, and selected the optimal solution'}. I communicated progress transparently, ${tags.includes('conflict') ? 'facilitated a decision-making session where each viewpoint was heard' : 'solicited early feedback from senior engineers'}, and iterated quickly based on input. We ${tags.includes('deadline') ? 'prioritized the critical path and deferred nice-to-haves' : 'implemented comprehensive tests to catch regressions early'}.`,
    result: `The ${tags.includes('delivery') ? 'feature shipped on schedule with zero critical bugs' : tags.includes('incident') ? 'incident was resolved in under 2 hours with a post-mortem that prevented recurrence' : 'solution reduced processing time by 60% and scaled to handle 3x the original load'}. The team received recognition from leadership, and the approach was adopted as a pattern for future ${extractDomain(prompt)} projects.`,
    reflection: tags.includes('leadership') ? 'I learned that clear ownership and frequent check-ins are more effective than micromanagement.' : 'This reinforced the value of thorough analysis before diving into implementation.',
    tags,
  }
}

function extractDomain(prompt: string): string {
  const domains = ['frontend', 'backend', 'full-stack', 'data', 'ml', 'ai', 'devops', 'mobile', 'cloud', 'security']
  for (const d of domains) {
    if (prompt.toLowerCase().includes(d)) return d
  }
  return 'software'
}