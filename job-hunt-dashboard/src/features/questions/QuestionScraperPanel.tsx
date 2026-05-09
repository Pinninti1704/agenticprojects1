import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useQuestionStore } from '@/stores/questionStore'
import { useToast } from '@/components/ui/Toast'

interface QuestionScraperPanelProps {
  topicId: string
}

const sampleQuestions: Record<string, { text: string; difficulty: 'easy' | 'medium' | 'hard'; type: 'technical' | 'behavioral' | 'situational' | 'coding' }[]> = {
  default: [
    { text: 'Explain how you would design a URL shortening service like TinyURL.', difficulty: 'medium', type: 'technical' },
    { text: 'Describe your approach to debugging a production issue.', difficulty: 'easy', type: 'behavioral' },
    { text: 'How would you scale a database to handle 10x traffic?', difficulty: 'hard', type: 'technical' },
    { text: 'Tell me about a time you had a conflict with a teammate.', difficulty: 'easy', type: 'behavioral' },
    { text: 'Implement a function to detect a cycle in a linked list.', difficulty: 'medium', type: 'coding' },
    { text: 'How would you design a real-time chat application?', difficulty: 'hard', type: 'situational' },
    { text: 'What strategies do you use to stay updated with industry trends?', difficulty: 'easy', type: 'behavioral' },
    { text: 'Explain the CAP theorem and its trade-offs.', difficulty: 'medium', type: 'technical' },
  ],
}

export function QuestionScraperPanel({ topicId }: QuestionScraperPanelProps) {
  const [scraping, setScraping] = useState(false)
  const addQuestionSet = useQuestionStore((s) => s.addQuestionSet)
  const { addToast } = useToast()

  const handleScrape = async () => {
    setScraping(true)
    // Simulate scraping delay
    await new Promise((r) => setTimeout(r, 1500))
    const questions = sampleQuestions.default.map((q) => ({
      ...q,
      hints: [],
    }))
    addQuestionSet(topicId, 'Web Search', questions)
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