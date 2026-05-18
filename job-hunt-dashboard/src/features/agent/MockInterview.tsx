import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Send, Sparkles, RotateCcw, Download, Timer, SkipForward, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useToast } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { useAgentStore } from '@/stores/agentStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { createAiProvider } from '@/services/ai'
import type { MockInterviewSession, InterviewQuestion, AnswerScore } from '@/types/agent'

const difficultyColor = (d: string) => {
  if (d === 'easy') return 'success' as const
  if (d === 'medium') return 'warning' as const
  return 'danger' as const
}

function scoreColor(value: number): string {
  if (value >= 80) return 'bg-success'
  if (value >= 50) return 'bg-warning'
  return 'bg-danger'
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted w-24 shrink-0">{label}</span>
      <div className="flex-1 bg-surface-2 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${scoreColor(value)}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-medium w-8 text-right ${value >= 80 ? 'text-success' : value >= 50 ? 'text-warning' : 'text-danger'}`}>{value}</span>
    </div>
  )
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

function exportToMarkdown(session: MockInterviewSession): string {
  const lines = [`# Mock Interview: ${session.jdTitle}`, `Date: ${formatTimestamp(session.startedAt)}`, '']
  session.questions.forEach((q, i) => {
    lines.push(`## Q${i + 1}: ${q.question}`, `Difficulty: ${q.difficulty} | Type: ${q.type}`, '')
    if (q.answer) lines.push(`**Answer:** ${q.answer}`, '')
    if (q.feedback) lines.push(`**Feedback:**`, `- Structure: ${q.feedback.structure}/100`, `- Depth: ${q.feedback.depth}/100`, `- Quantifiable: ${q.feedback.quantifiable}/100`, `- Overall: ${q.feedback.overall}/100`, '')
  })
  return lines.join('\n')
}

function exportToJson(session: MockInterviewSession): string {
  return JSON.stringify(session, null, 2)
}

const PAUSE_OPTIONS = [
  { value: '0', label: 'No pause' },
  { value: '15', label: '15s pause' },
  { value: '30', label: '30s pause' },
  { value: '60', label: '60s pause' },
] as const

function MockInterviewInner() {
  const addSession = useAgentStore((s) => s.addSession)
  const updateSession = useAgentStore((s) => s.updateSession)
  const sessions = useAgentStore((s) => s.sessions)
  const settings = useSettingsStore((s) => s.app)
  const { addToast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [jdTitle, setJdTitle] = useState('')
  const [session, setSession] = useState<MockInterviewSession | null>(null)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [pauseDuration, setPauseDuration] = useState(0)
  const [pausing, setPausing] = useState(false)
  const [pauseCountdown, setPauseCountdown] = useState(0)
  const pauseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [sessionFilter, setSessionFilter] = useState<'all' | 'completed' | 'in-progress'>('all')
  const [sessionSearch, setSessionSearch] = useState('')

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const clearPauseTimer = useCallback(() => {
    if (pauseTimerRef.current) { clearInterval(pauseTimerRef.current); pauseTimerRef.current = null }
  }, [])

  useEffect(() => {
    return () => { clearTimer(); clearPauseTimer() }
  }, [clearTimer, clearPauseTimer])

  useEffect(() => {
    if (textareaRef.current && session && !session.completedAt && !pausing) {
      textareaRef.current.focus()
    }
  }, [session?.currentIndex, session?.completedAt, pausing])

  const startTimer = useCallback((limitSeconds: number) => {
    clearTimer()
    setTimeLeft(limitSeconds)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearTimer()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [clearTimer])

  useEffect(() => {
    if (timeLeft === 0 && session && !session.completedAt && settings.mockInterviewTimedMode) {
      handleSubmit()
    }
  }, [timeLeft])

  const provider = createAiProvider(settings.agentProvider)

  const handleStart = () => {
    if (!jdTitle.trim()) return
    const questions = provider.generateInterviewQuestions(jdTitle.trim(), settings.mockInterviewQuestionCount)
    const newSession: MockInterviewSession = {
      id: `session-${Date.now()}`,
      jdTitle: jdTitle.trim(),
      questions,
      currentIndex: 0,
      startedAt: new Date().toISOString(),
    }
    setSession(newSession)
    addSession(newSession)
    if (settings.mockInterviewTimedMode) startTimer(settings.mockInterviewTimeLimit)
    useAnalyticsStore.getState().trackEvent('mock_interview_started', { jdTitle: jdTitle.trim(), questionCount: questions.length })
    addToast('success', `Mock interview started for ${jdTitle.trim()}`)
  }

  const handleSubmit = async () => {
    if (!session || !currentAnswer.trim()) return
    clearTimer()
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))
    const feedback = provider.generateFeedback(session.questions[session.currentIndex].question, currentAnswer)
    const updatedQuestions = [...session.questions]
    updatedQuestions[session.currentIndex] = {
      ...updatedQuestions[session.currentIndex],
      answer: currentAnswer,
      feedback,
    }
    const nextIndex = session.currentIndex + 1
    const isComplete = nextIndex >= updatedQuestions.length
    const updated: MockInterviewSession = {
      ...session,
      questions: updatedQuestions,
      currentIndex: isComplete ? session.currentIndex : nextIndex,
      completedAt: isComplete ? new Date().toISOString() : undefined,
    }
    setSession(updated)
    updateSession(session.id, updated)
    setCurrentAnswer('')
    setSubmitting(false)
    useAnalyticsStore.getState().trackEvent(isComplete ? 'mock_interview_completed' : 'mock_interview_answer_submitted', {
      sessionId: session.id,
      questionIndex: session.currentIndex,
      answerLength: currentAnswer.length,
    })
    if (!isComplete && pauseDuration > 0) {
      setPausing(true)
      setPauseCountdown(pauseDuration)
      pauseTimerRef.current = setInterval(() => {
        setPauseCountdown((prev) => {
          if (prev <= 1) {
            clearPauseTimer()
            setPausing(false)
            if (settings.mockInterviewTimedMode) startTimer(settings.mockInterviewTimeLimit)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (!isComplete && settings.mockInterviewTimedMode) {
      startTimer(settings.mockInterviewTimeLimit)
    }
  }

  const handleSkip = useCallback(() => {
    if (!session) return
    clearTimer()
    clearPauseTimer()
    const nextIndex = Math.min(session.currentIndex + 1, session.questions.length - 1)
    const updated = { ...session, currentIndex: nextIndex }
    setSession(updated)
    setCurrentAnswer('')
    setPausing(false)
    setPauseCountdown(0)
    if (settings.mockInterviewTimedMode) startTimer(settings.mockInterviewTimeLimit)
  }, [session, clearTimer, clearPauseTimer, settings.mockInterviewTimedMode, startTimer])

  const handleReset = () => {
    clearTimer()
    clearPauseTimer()
    setSession(null)
    setCurrentAnswer('')
    setJdTitle('')
    setTimeLeft(null)
    setPausing(false)
    setPauseCountdown(0)
  }

  const filteredSessions = useMemo(() => {
    let result = [...sessions]
    if (sessionFilter === 'completed') result = result.filter((s) => s.completedAt)
    if (sessionFilter === 'in-progress') result = result.filter((s) => !s.completedAt)
    if (sessionSearch.trim()) {
      const q = sessionSearch.toLowerCase()
      result = result.filter((s) => s.jdTitle.toLowerCase().includes(q))
    }
    return result
  }, [sessions, sessionFilter, sessionSearch])

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-muted">Start a mock interview by entering a job title. AI will generate relevant questions and provide structured feedback on your answers.</p>
        <Input
          value={jdTitle}
          onChange={(e) => setJdTitle(e.target.value)}
          placeholder="e.g. Senior Software Engineer"
          onKeyDown={(e) => e.key === 'Enter' && handleStart()}
        />
        <div className="flex items-center gap-2">
          <Button onClick={handleStart} disabled={!jdTitle.trim()}>
            <Sparkles className="w-3.5 h-3.5" /> Start Interview
          </Button>
          <span className="text-xs text-text-muted">{settings.mockInterviewQuestionCount} questions | {settings.mockInterviewTimedMode ? `${settings.mockInterviewTimeLimit}s per question` : 'untimed'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Pause between questions:</span>
          <select
            value={String(pauseDuration)}
            onChange={(e) => setPauseDuration(Number(e.target.value))}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {PAUSE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        {sessions.length > 0 && (
          <div className="pt-4">
            <p className="text-xs text-text-muted mb-2 uppercase tracking-wider">Past Sessions</p>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  placeholder="Search by title..."
                  className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <select
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value as typeof sessionFilter)}
                className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
              </select>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredSessions.length === 0 && sessions.length > 0 && (
                <p className="text-xs text-text-muted text-center py-4">No sessions match your filter.</p>
              )}
              {[...filteredSessions].reverse().slice(0, 10).map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSession(s); setCurrentAnswer('') }}
                  className="w-full text-left bg-surface rounded-lg border border-border p-3 text-sm text-text hover:border-primary/50 transition-colors"
                >
                  <span className="font-medium">{s.jdTitle}</span>
                  <span className="text-xs text-text-muted ml-2">
                    {s.completedAt ? '(Completed)' : `${s.currentIndex}/${s.questions.length} answered`}
                  </span>
                  <span className="text-xs text-text-muted block">{formatTimestamp(s.startedAt)}</span>
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

      <ProgressBar value={Math.round((answeredCount / session.questions.length) * 100)} />

      {isComplete ? (
        <div className="space-y-4">
          <div className="bg-success/10 border border-success/30 rounded-lg p-4 text-center">
            <p className="text-lg font-bold text-success">Interview Complete!</p>
            <p className="text-sm text-text-muted mt-1">Review your answers and feedback below.</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(exportToMarkdown(session)); addToast('success', 'Copied as Markdown!') }}>
                <Download className="w-3.5 h-3.5" /> Copy Markdown
              </Button>
              <Button size="sm" variant="secondary" onClick={() => {
                const blob = new Blob([exportToJson(session)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a'); a.href = url; a.download = `mock-interview-${session.jdTitle.replace(/\s+/g, '-')}.json`; a.click()
                URL.revokeObjectURL(url)
                addToast('success', 'Exported as JSON!')
              }}>
                <Download className="w-3.5 h-3.5" /> Export JSON
              </Button>
            </div>
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
                  <p className="text-sm text-text whitespace-pre-wrap">{q.answer}</p>
                </div>
              )}
              {q.feedback && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                  <p className="text-xs text-primary mb-1">Feedback Scores:</p>
                  <ScoreBar label="Structure" value={q.feedback.structure} />
                  <ScoreBar label="Depth" value={q.feedback.depth} />
                  <ScoreBar label="Quantifiable" value={q.feedback.quantifiable} />
                  <div className="border-t border-primary/10 pt-2 mt-2">
                    <ScoreBar label="Overall" value={q.feedback.overall} />
                  </div>
                  {q.feedback.suggestions.length > 0 && (
                    <ul className="space-y-1 mt-2">
                      {q.feedback.suggestions.map((s, si) => (
                        <li key={si} className="text-xs text-text-muted flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : pausing ? (
        <Card title={`Next question in ${pauseCountdown}...`}>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-3">
              <p className="text-4xl font-bold text-primary">{pauseCountdown}</p>
              <p className="text-sm text-text-muted">Take a moment to prepare for the next question</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card title={`Question ${session.currentIndex + 1} of ${session.questions.length}`}>
          <div className="space-y-4">
            {settings.mockInterviewTimedMode && timeLeft !== null && (
              <div className={`flex items-center justify-end gap-2 text-sm font-mono ${timeLeft <= 30 ? 'text-danger animate-pulse' : 'text-text-muted'}`}>
                <Timer className="w-3.5 h-3.5" />
                {formatTime(timeLeft)}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Badge variant={difficultyColor(currentQ.difficulty)}>{currentQ.difficulty}</Badge>
              <Badge variant="info">{currentQ.type}</Badge>
            </div>
            <p className="text-base text-text font-medium">{currentQ.question}</p>
            <Textarea
              ref={textareaRef}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              rows={4}
              placeholder="Type your answer here..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
                  e.preventDefault()
                  handleSkip()
                } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">Ctrl+Enter to submit • Ctrl+Shift+Enter to skip</span>
              <div className="flex gap-3">
                <Button variant="secondary" size="sm" onClick={handleSkip} disabled={session.currentIndex >= session.questions.length - 1}>
                  <SkipForward className="w-3.5 h-3.5" /> Skip
                </Button>
                <Button onClick={handleSubmit} loading={submitting} disabled={!currentAnswer.trim()}>
                  <Send className="w-3.5 h-3.5" /> Submit
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export function MockInterview() {
  return (
    <ErrorBoundary>
      <MockInterviewInner />
    </ErrorBoundary>
  )
}