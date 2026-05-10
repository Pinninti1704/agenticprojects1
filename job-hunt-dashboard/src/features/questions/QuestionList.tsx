import { useQuestionStore } from '@/stores/questionStore'
import { Badge } from '@/components/ui/Badge'
import type { QuestionDifficulty } from '@/types/question'

interface QuestionListProps {
  topicId: string
}

const difficultyVariant = (d: QuestionDifficulty) => {
  if (d === 'easy') return 'success' as const
  if (d === 'medium') return 'warning' as const
  return 'danger' as const
}

export function QuestionList({ topicId }: QuestionListProps) {
  const questions = useQuestionStore((s) => s.getQuestionsForTopic(topicId))

  if (questions.length === 0) {
    return (
      <div className="text-xs text-text-muted/50">
        No accepted questions yet. Scrape and accept questions to build your question bank.
      </div>
    )
  }

  const grouped = {
    easy: questions.filter((q) => q.difficulty === 'easy'),
    medium: questions.filter((q) => q.difficulty === 'medium'),
    hard: questions.filter((q) => q.difficulty === 'hard'),
  }

  return (
    <div className="space-y-3">
      {(['easy', 'medium', 'hard'] as const).map((diff) => {
        if (grouped[diff].length === 0) return null
        return (
          <div key={diff}>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant={difficultyVariant(diff)}>{diff}</Badge>
              <span className="text-xs text-text-muted">{grouped[diff].length} questions</span>
            </div>
            <div className="space-y-1.5">
              {grouped[diff].map((q) => (
                <div key={q.id} className="bg-surface rounded-lg border border-border p-2.5">
                  <p className="text-sm text-text">{q.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="info">{q.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}