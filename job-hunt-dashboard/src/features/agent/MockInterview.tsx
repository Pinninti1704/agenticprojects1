import { useState } from 'react'
import { Send, Sparkles, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useAgentStore } from '@/stores/agentStore'
import type { MockInterviewSession, InterviewQuestion } from '@/types/agent'

function generateQuestions(jdTitle: string): InterviewQuestion[] {
  const base = [
    { question: `Tell me about your experience with ${jdTitle.replace(/senior|lead|junior|principal/gi, '').trim() || 'software development'}`, type: 'behavioral' as const, difficulty: 'easy' as const },
    { question: 'Describe a challenging technical problem you solved recently.', type: 'behavioral' as const, difficulty: 'medium' as const },
    { question: `How would you design a scalable system for ${jdTitle.includes('full') ? 'a real-time collaborative editor' : 'handling millions of daily requests'}?`, type: 'technical' as const, difficulty: 'hard' as const },
    { question: 'Tell me about a time you disagreed with a technical decision.', type: 'behavioral' as const, difficulty: 'medium' as const },
    { question: 'How do you stay updated with industry trends and new technologies?', type: 'situational' as const, difficulty: 'easy' as const },
    { question: 'Walk me through your approach to debugging a production issue.', type: 'situational' as const, difficulty: 'medium' as const },
  ]
  return base.map((q, i) => ({ ...q, id: `q-${i}` }))
}

function generateFeedback(answer: string): string {
  const len = answer.length
  if (len < 50) return 'Your answer is quite brief. Try expanding with a specific example using the STAR method (Situation, Task, Action, Result) to make your response more compelling.'
  if (len < 150) return 'Good start! Consider adding more concrete metrics or outcomes to strengthen your answer. Interviewers respond well to quantified results.'
  if (!answer.includes('because') && !answer.includes('since') && !answer.includes('therefore')) {
    return 'Solid response. To make it even stronger, add reasoning behind your decisions — explaining the "why" demonstrates deeper understanding.'
  }
  return 'Great answer! You provided a detailed response with clear reasoning. This demonstrates the level of depth interviewers are looking for.'
}

const difficultyColor = (d: string) => {
  if (d === 'easy') return 'success' as const
  if (d === 'medium') return 'warning' as const
  return 'danger' as const
}

export function MockInterview() {
  const addSession = useAgentStore((s) => s.addSession)
  const updateSession = useAgentStore((s) => s.updateSession)
  const { addToast } = useToast()
  const [jdTitle, setJdTitle] = useState('')
  const [session, setSession] = useState<MockInterviewSession | null>(null)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleStart = () => {
    if (!jdTitle.trim()) return
    const questions = generateQuestions(jdTitle)
    const newSession: MockInterviewSession = {
      id: `session-${Date.now()}`,
      jdTitle: jdTitle.trim(),
      questions,
      currentIndex: 0,
      startedAt: new Date().toISOString(),
    }
    setSession(newSession)
    addSession(newSession)
    addToast('success', `Mock interview started for ${jdTitle.trim()}`)
  }

  const handleSubmit = async () => {
    if (!session || !currentAnswer.trim()) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))
    const feedback = generateFeedback(currentAnswer)
    const updatedQuestions = [...session.questions]
    updatedQuestions[session.currentIndex] = {
      ...updatedQuestions[session.currentIndex],
      answer: currentAnswer,
      feedback,
    }
    const nextIndex = session.currentIndex + 1
    const isComplete = nextIndex >= updatedQuestions.length
    const updated = {
      ...session,
      questions: updatedQuestions,
      currentIndex: isComplete ? session.currentIndex : nextIndex,
      completedAt: isComplete ? new Date().toISOString() : undefined,
    }
    setSession(updated)
    updateSession(session.id, updated)
    setCurrentAnswer('')
    setSubmitting(false)
  }

  const handleReset = () => {
    setSession(null)
    setCurrentAnswer('')
    setJdTitle('')
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-muted">Start a mock interview by entering a job title. AI will generate relevant questions and provide feedback on your answers.</p>
        <Input
          value={jdTitle}
          onChange={(e) => setJdTitle(e.target.value)}
          placeholder="e.g. Senior Software Engineer"
          onKeyDown={(e) => e.key === 'Enter' && handleStart()}
        />
        <Button onClick={handleStart} disabled={!jdTitle.trim()}>
          <Sparkles className="w-3.5 h-3.5" /> Start Interview
        </Button>
        {useAgentStore.getState().sessions.length > 0 && (
          <div className="pt-4">
            <p className="text-xs text-text-muted mb-2 uppercase tracking-wider">Past Sessions</p>
            <div className="space-y-2">
              {useAgentStore.getState().sessions.slice().reverse().slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSession(s)}
                  className="w-full text-left bg-surface rounded-lg border border-border p-3 text-sm text-text hover:border-primary/50 transition-colors"
                >
                  <span className="font-medium">{s.jdTitle}</span>
                  <span className="text-xs text-text-muted ml-2">
                    {s.completedAt ? '(Completed)' : `${s.currentIndex}/${s.questions.length} answered`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const currentQ = session.questions[session.currentIndex]
  const isComplete = !!session.completedAt
  const answeredCount = session.questions.filter((q) => q.answer).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text">{session.jdTitle}</p>
          <p className="text-xs text-text-muted">{answeredCount}/{session.questions.length} answered {isComplete ? '• Completed' : ''}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={handleReset}>
          <RotateCcw className="w-3.5 h-3.5" /> New
        </Button>
      </div>

      {isComplete ? (
        <div className="space-y-4">
          <div className="bg-success/10 border border-success/30 rounded-lg p-4 text-center">
            <p className="text-lg font-bold text-success">Interview Complete!</p>
            <p className="text-sm text-text-muted mt-1">Review your answers and feedback below.</p>
          </div>
          {session.questions.map((q, i) => (
            <div key={q.id} className="bg-surface border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Q{i + 1}</span>
                <Badge variant={difficultyColor(q.difficulty)}>{q.difficulty}</Badge>
                <Badge variant="info">{q.type}</Badge>
              </div>
              <p className="text-sm text-text">{q.question}</p>
              {q.answer && (
                <div className="bg-surface-2 rounded-lg p-3 mt-2">
                  <p className="text-xs text-text-muted mb-1">Your answer:</p>
                  <p className="text-sm text-text">{q.answer}</p>
                </div>
              )}
              {q.feedback && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-xs text-primary mb-1">Feedback:</p>
                  <p className="text-sm text-text">{q.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card title={`Question ${session.currentIndex + 1} of ${session.questions.length}`}>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={difficultyColor(currentQ.difficulty)}>{currentQ.difficulty}</Badge>
              <Badge variant="info">{currentQ.type}</Badge>
            </div>
            <p className="text-base text-text font-medium">{currentQ.question}</p>
            <Textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              rows={4}
              placeholder="Type your answer here..."
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => {
                const next = { ...session, currentIndex: Math.min(session.currentIndex + 1, session.questions.length - 1) }
                setSession(next)
              }} disabled={session.currentIndex >= session.questions.length - 1}>
                Skip
              </Button>
              <Button onClick={handleSubmit} loading={submitting} disabled={!currentAnswer.trim()}>
                <Send className="w-3.5 h-3.5" /> Submit
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}