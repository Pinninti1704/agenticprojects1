import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useQuestionStore } from '@/stores/questionStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useToast } from '@/components/ui/Toast'

interface QuestionScraperPanelProps {
  topicId: string
}

const sampleQuestions = [
  { text: 'Explain how you would design a URL shortening service like TinyURL.', difficulty: 'medium' as const, type: 'technical' as const },
  { text: 'Describe your approach to debugging a production issue.', difficulty: 'easy' as const, type: 'behavioral' as const },
  { text: 'How would you scale a database to handle 10x traffic?', difficulty: 'hard' as const, type: 'technical' as const },
  { text: 'Tell me about a time you had a conflict with a teammate.', difficulty: 'easy' as const, type: 'behavioral' as const },
  { text: 'Implement a function to detect a cycle in a linked list.', difficulty: 'medium' as const, type: 'coding' as const },
  { text: 'How would you design a real-time chat application?', difficulty: 'hard' as const, type: 'situational' as const },
  { text: 'What strategies do you use to stay updated with industry trends?', difficulty: 'easy' as const, type: 'behavioral' as const },
  { text: 'Explain the CAP theorem and its trade-offs.', difficulty: 'medium' as const, type: 'technical' as const },
]

export function QuestionScraperPanel({ topicId }: QuestionScraperPanelProps) {
  const [scraping, setScraping] = useState(false)
  const addQuestionSet = useQuestionStore((s) => s.addQuestionSet)
  const sourceLabel = useSettingsStore((s) => s.scraper.sourceLabel)
  const scrapeDelayMs = useSettingsStore((s) => s.scraper.scrapeDelayMs)
  const { addToast } = useToast()

  const handleScrape = async () => {
    setScraping(true)
    await new Promise((r) => setTimeout(r, scrapeDelayMs))
    const questions = sampleQuestions.map((q) => ({ ...q, hints: [] }))
    addQuestionSet(topicId, sourceLabel, questions)
    addToast('success', `Found ${questions.length} questions for review!`)
    setScraping(false)
  }

  return (
    <div className="bg-surface rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-text-muted">AI Question Scraper</span>
        </div>
        <Button size="sm" onClick={handleScrape} loading={scraping}>
          {scraping ? 'Searching...' : 'Scrape Questions'}
        </Button>
      </div>
      {scraping && (
        <div className="mt-3 text-xs text-text-muted animate-pulse">
          Searching top sources for interview questions...
        </div>
      )}
    </div>
  )
}