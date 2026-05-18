import { useState, useCallback, useMemo } from 'react'
import {
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  Trash2,
  Download,
  Send,
  MessageCircle,
  UserCheck,
  CalendarCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { createAiProvider } from '@/services/ai'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAgentStore } from '@/stores/agentStore'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { formatDate, isOverdue, todayISO } from '@/lib/utils'
import type { OutreachEntry, OutreachParams, OutreachVariant } from '@/types/agent'

const OUTREACH_TYPES = [
  { value: 'connection', label: 'Connection Request' },
  { value: 'followup', label: 'Follow-up' },
  { value: 'thankyou', label: 'Thank You' },
  { value: 'referral', label: 'Referral Request' },
] as const

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'warm', label: 'Warm' },
  { value: 'direct', label: 'Direct' },
] as const

const STATUSES: OutreachEntry['status'][] = ['sent', 'replied', 'connected', 'booked']

const STATUS_BADGE: Record<OutreachEntry['status'], { label: string; variant: 'info' | 'success' | 'warning' | 'default' }> = {
  sent: { label: 'Sent', variant: 'info' },
  replied: { label: 'Replied', variant: 'success' },
  connected: { label: 'Connected', variant: 'warning' },
  booked: { label: 'Booked', variant: 'default' },
}

const CONNECTION_MAX_CHARS = 300
const INMAIL_MAX_CHARS = 2000
const CHAR_WARN_THRESHOLD = 0.8

const FUNNEL_STAGES = [
  { key: 'sent' as const, icon: Send, label: 'Sent' },
  { key: 'replied' as const, icon: MessageCircle, label: 'Replied' },
  { key: 'connected' as const, icon: UserCheck, label: 'Connected' },
  { key: 'booked' as const, icon: CalendarCheck, label: 'Booked' },
]

function nextStatus(current: OutreachEntry['status']): OutreachEntry['status'] {
  const idx = STATUSES.indexOf(current)
  return STATUSES[(idx + 1) % STATUSES.length]
}

function generateFollowUpDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

function buildCsvRow(values: string[]): string {
  return values
    .map((v) => {
      if (/[",\n\r]/.test(v)) {
        return `"${v.replace(/"/g, '""')}"`
      }
      return v
    })
    .join(',')
}

function exportMessagesToCsv(messages: OutreachEntry[]): void {
  const header = ['Type', 'Recipient', 'Company', 'Tone', 'Message', 'Status', 'Created']
  const rows = messages.map((m) => [
    m.type,
    m.recipient,
    m.context,
    m.tone,
    m.message,
    m.status,
    m.createdAt,
  ])
  const csv = [header, ...rows].map(buildCsvRow).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `linkedin-outreach-${todayISO()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function getMaxChars(type: OutreachParams['type']): number {
  return type === 'connection' ? CONNECTION_MAX_CHARS : INMAIL_MAX_CHARS
}

function LinkedInOutreachInner() {
  const settings = useSettingsStore((s) => s.app)
  const { outreachMessages, addOutreachMessage, updateOutreachStatus, deleteOutreachMessage } =
    useAgentStore()
  const trackEvent = useAnalyticsStore((s) => s.trackEvent)

  /* ---- form state ---- */
  const [messageType, setMessageType] = useState<OutreachParams['type']>('connection')
  const [tone, setTone] = useState<OutreachParams['tone']>(settings.outreachDefaultTone)
  const [recipient, setRecipient] = useState('')
  const [company, setCompany] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [mutualConnection, setMutualConnection] = useState('')
  const [sharedInterest, setSharedInterest] = useState('')
  const [notes, setNotes] = useState('')
  const [articleRef, setArticleRef] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  /* ---- generated state ---- */
  const [variants, setVariants] = useState<OutreachVariant[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  /* ---- history state ---- */
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  /* ---- derive max chars ---- */
  const maxChars = getMaxChars(messageType)

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? null,
    [variants, selectedVariantId],
  )

  const charCount = selectedVariant ? selectedVariant.message.length : 0
  const charWarning = charCount > maxChars * CHAR_WARN_THRESHOLD

  /* ---- funnel counts ---- */
  const funnelCounts = useMemo(
    () => ({
      sent: outreachMessages.filter((m) => m.status === 'sent').length,
      replied: outreachMessages.filter((m) => m.status === 'replied').length,
      connected: outreachMessages.filter((m) => m.status === 'connected').length,
      booked: outreachMessages.filter((m) => m.status === 'booked').length,
    }),
    [outreachMessages],
  )

  const handleGenerate = useCallback(async () => {
    if (!recipient.trim()) return
    setLoading(true)
    setError(null)
    setSelectedVariantId(null)

    const params: OutreachParams = {
      type: messageType,
      recipient: recipient.trim(),
      company: company.trim() || undefined,
      role: targetRole.trim() || undefined,
      mutualConnection: mutualConnection.trim() || undefined,
      sharedInterest: sharedInterest.trim() || undefined,
      articleRef: articleRef.trim() || undefined,
      tone,
    }

    try {
      const provider = createAiProvider(settings.agentProvider)
      const result = provider.generateOutreachMessage(params)
      setVariants(result)
      trackEvent('outreach_message_generated', { type: messageType, tone })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate outreach message')
    } finally {
      setLoading(false)
    }
  }, [
    recipient,
    messageType,
    company,
    targetRole,
    mutualConnection,
    sharedInterest,
    articleRef,
    tone,
    settings.agentProvider,
    trackEvent,
  ])

  const handleSaveVariant = useCallback(() => {
    if (!selectedVariant) return

    const followUpDate = generateFollowUpDate()

    addOutreachMessage({
      type: messageType,
      recipient: recipient.trim(),
      context: company.trim() || notes.trim() || '',
      message: selectedVariant.message,
      tone,
      status: 'sent',
      followUpDate,
    })

    trackEvent('outreach_message_saved', { type: messageType, tone })
    setVariants([])
    setSelectedVariantId(null)
  }, [selectedVariant, messageType, recipient, company, notes, tone, addOutreachMessage, trackEvent])

  const handleFollowUp = useCallback(
    (entry: OutreachEntry) => {
      setRecipient(entry.recipient)
      setCompany(entry.context || '')
      setMessageType('followup')
      setShowDetails(true)
      handleGenerate()
    },
    [handleGenerate],
  )

  const handleCycleStatus = useCallback(
    (entry: OutreachEntry) => {
      const newStatus = nextStatus(entry.status)
      updateOutreachStatus(entry.id, newStatus)
      trackEvent('outreach_message_status_changed', {
        from: entry.status,
        to: newStatus,
        id: entry.id,
      })
    },
    [updateOutreachStatus, trackEvent],
  )

  const handleDelete = useCallback(
    (id: string) => {
      deleteOutreachMessage(id)
      setDeleteConfirmId(null)
      if (expandedId === id) setExpandedId(null)
    },
    [deleteOutreachMessage, expandedId],
  )

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // clipboard not available
    }
  }, [])

  const sortedMessages = useMemo(
    () =>
      [...outreachMessages].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [outreachMessages],
  )

  return (
    <div className="space-y-6">
      {/* Funnel Dashboard */}
      {outreachMessages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FUNNEL_STAGES.map((stage, idx) => {
            const count = funnelCounts[stage.key]
            const Icon = stage.icon
            return (
              <div key={stage.key} className="bg-surface rounded-lg border border-border p-3 text-center">
                <Icon className="w-4 h-4 mx-auto text-text-muted mb-1" />
                <p className="text-lg font-bold text-text">{count}</p>
                <p className="text-xs text-text-muted">{stage.label}</p>
                {idx < FUNNEL_STAGES.length - 1 && (
                  <div className="hidden sm:block text-text-muted mt-1">
                    <ChevronDown className="w-3 h-3 mx-auto rotate-[-90deg]" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* description */}
      <p className="text-sm text-text-muted">
        Generate LinkedIn outreach messages for networking, follow-ups, thank-yous, and referral
        requests. Fill in the details below and choose from three AI-generated variants.
      </p>

      {/* type + tone row */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Message Type"
          value={messageType}
          onChange={(e) => {
            setMessageType(e.target.value as OutreachParams['type'])
            setVariants([])
            setSelectedVariantId(null)
          }}
          options={OUTREACH_TYPES.map((t) => ({ value: t.value, label: t.label }))}
        />
        <Select
          label="Tone"
          value={tone}
          onChange={(e) => {
            setTone(e.target.value as OutreachParams['tone'])
            setVariants([])
            setSelectedVariantId(null)
          }}
          options={TONE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
        />
      </div>

      {/* Recipient field (always visible) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Recipient name *"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="e.g. John Smith"
        />
      </div>

      {/* Add Details Toggle */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text transition-colors"
      >
        {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {showDetails ? 'Hide Details' : 'Add Details'}
      </button>

      {/* Personalization Details (collapsible) */}
      {showDetails && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Company name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp"
            />
            <Input
              label="Target role"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
            />
            <Input
              label="Mutual connection"
              value={mutualConnection}
              onChange={(e) => setMutualConnection(e.target.value)}
              placeholder="e.g. Jane Doe (optional)"
            />
            <Input
              label="Shared interest"
              value={sharedInterest}
              onChange={(e) => setSharedInterest(e.target.value)}
              placeholder="e.g. AI, open-source (optional)"
            />
            <Input
              label="Article reference"
              value={articleRef}
              onChange={(e) => setArticleRef(e.target.value)}
              placeholder="e.g. Your post on X (optional)"
            />
          </div>

          <Textarea
            label="Context / notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional context for the outreach message (optional)"
            rows={3}
          />
        </div>
      )}

      {/* generate */}
      <div className="flex items-center gap-3">
        <Button onClick={handleGenerate} disabled={!recipient.trim() || loading} loading={loading}>
          <Sparkles className="w-3.5 h-3.5" />
          Generate Messages
        </Button>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>

      {/* 3 variants */}
      {variants.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
            Choose a variant
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {variants.map((v) => (
              <Card
                key={v.id}
                title={v.hook}
                className={`cursor-pointer transition-all border ${
                  selectedVariantId === v.id
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedVariantId(v.id)}
              >
                <div className="space-y-2">
                  <p className="text-sm text-text whitespace-pre-line leading-relaxed line-clamp-6">
                    {v.message}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-text-muted">
                      {v.message.length} chars
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(v.message)
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* selected variant detail */}
          {selectedVariant && (
            <Card className="border-primary/30">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-text">
                    Selected: {selectedVariant.hook}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${
                        charWarning ? 'text-danger' : 'text-text-muted'
                      }`}
                    >
                      {charCount}/{maxChars}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopy(selectedVariant.message)
                      }}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Copy
                    </Button>
                    <Button size="sm" onClick={handleSaveVariant}>
                      Save Message
                    </Button>
                  </div>
                </div>
                {charWarning && (
                  <p className="text-xs text-danger">
                    Warning: Message is approaching LinkedIn&apos;s character limit.
                  </p>
                )}
                <div className="bg-surface rounded-lg p-4 text-sm text-text whitespace-pre-line font-mono text-[13px] leading-relaxed">
                  {selectedVariant.message}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* message history */}
      {sortedMessages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
              Message History ({sortedMessages.length})
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => exportMessagesToCsv(sortedMessages)}
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
          </div>

          <div className="space-y-2">
            {sortedMessages.map((entry) => {
              const isExpanded = expandedId === entry.id
              const overdue = isOverdue(entry.followUpDate)
              const label = STATUS_BADGE[entry.status]

              return (
                <Card key={entry.id}>
                  <div className="space-y-2">
                    {/* summary row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-sm font-semibold text-text truncate max-w-[160px]">
                          {entry.recipient}
                        </span>
                        {entry.context && (
                          <span className="text-xs text-text-muted truncate max-w-[120px]">
                            {entry.context}
                          </span>
                        )}
                        <span className="text-xs text-text-muted capitalize">{entry.type}</span>
                        <span className="text-xs text-text-muted capitalize">{entry.tone}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCycleStatus(entry)}
                          className="cursor-pointer"
                          title="Click to cycle status"
                        >
                          <Badge variant={label.variant}>{label.label}</Badge>
                        </button>
                        {overdue && (
                          <Badge variant="warning">Follow-up needed!</Badge>
                        )}
                        <span className="text-xs text-text-muted whitespace-nowrap">
                          {formatDate(entry.createdAt)}
                        </span>
                        <span
                          className={`text-xs ${
                            overdue ? 'text-danger' : 'text-text-muted'
                          } whitespace-nowrap`}
                        >
                          Follow-up: {formatDate(entry.followUpDate)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                          className="text-text-muted hover:text-text transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* expanded content */}
                    {isExpanded && (
                      <div className="space-y-3 pt-2 border-t border-border">
                        <div className="bg-surface rounded-lg p-3 text-sm text-text whitespace-pre-line font-mono text-[13px] leading-relaxed">
                          {entry.message}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleFollowUp(entry)}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Generate Follow-up
                          </Button>
                          {deleteConfirmId === entry.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-text-muted">Confirm delete?</span>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDelete(entry.id)}
                              >
                                Delete
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteConfirmId(entry.id)
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function LinkedInOutreach() {
  return (
    <ErrorBoundary fallbackTitle="LinkedIn Outreach Error" fallbackMessage="Something went wrong with the outreach generator. Please try again.">
      <LinkedInOutreachInner />
    </ErrorBoundary>
  );
}