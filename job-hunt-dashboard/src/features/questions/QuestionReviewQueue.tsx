import { useState } from 'react'
import { Check, X, ChevronDown, ChevronRight } from 'lucide-react'
import { useQuestionStore } from '@/stores/questionStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'

interface QuestionReviewQueueProps {
  topicId: string
}

const difficultyVariant = (d: string) => {
  if (d === 'easy') return 'success' as const
  if (d === 'medium') return 'warning' as const
  return 'danger' as const
}

export function QuestionReviewQueue({ topicId }: QuestionReviewQueueProps) {
  const questionSets = useQuestionStore((s) => s.questionSets.filter((qs) => qs.topicId === topicId && qs.status === 'pending_review'))
  const acceptQuestionSet = useQuestionStore((s) => s.acceptQuestionSet)
  const rejectQuestionSet = useQuestionStore((s) => s.rejectQuestionSet)
  const acceptSingleQuestion = useQuestionStore((s) => s.acceptSingleQuestion)
  const rejectSingleQuestion = useQuestionStore((s) => s.rejectSingleQuestion)
  const { addToast } = useToast()
  const [expandedSet, setExpandedSet] = useState<string | null>(null)

  if (questionSets.length === 0) return null

  const handleAcceptAll = (setId: string) => {
    acceptQuestionSet(setId)
    addToast('success', 'Questions accepted! Set a deadline to cover them.')
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-warning">Pending Review ({questionSets.length} sets)</p>
      {questionSets.map((set) => (
        <div key={set.id} className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="flex items-center justify-between p-3">
            <button
              onClick={() => setExpandedSet(expandedSet === set.id ? null : set.id)}
              className="flex items-center gap-2 text-sm text-text"
            >
              {expandedSet === set.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span>{set.questions.length} questions from {set.source}</span>
            </button>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="primary" onClick={() => handleAcceptAll(set.id)}>
                <Check className="w-3.5 h-3.5" /> Accept All
              </Button>
              <Button size="sm" variant="danger" onClick={() => rejectQuestionSet(set.id)}>
                <X className="w-3.5 h-3.5" /> Reject
              </Button>
            </div>
          </div>
          {expandedSet === set.id && (
            <div className="border-t border-border divide-y divide-border">
              {set.questions.map((q) => (
                <div key={q.id} className="flex items-start gap-3 p-3 pl-6">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text">{q.text}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={difficultyVariant(q.difficulty)}>{q.difficulty}</Badge>
                      <Badge variant="info">{q.type}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => acceptSingleQuestion(set.id, q.id)}
                      className="p-1 text-success hover:bg-success/10 rounded transition-colors"
                      title="Accept"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => rejectSingleQuestion(set.id, q.id)}
                      className="p-1 text-danger hover:bg-danger/10 rounded transition-colors"
                      title="Reject"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}