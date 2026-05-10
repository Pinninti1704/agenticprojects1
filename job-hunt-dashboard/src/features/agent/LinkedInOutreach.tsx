import { useState } from 'react'
import { Sparkles, Copy, Check, Linkedin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'

interface OutreachMessage {
  id: string
  type: 'connection' | 'followup' | 'thankyou' | 'referral'
  recipient: string
  context: string
  message: string
  copied: boolean
}

function generateOutreach(type: OutreachMessage['type'], recipient: string, context: string): string {
  const intro = `Hi ${recipient},`

  const bodies: Record<OutreachMessage['type'], string> = {
    connection: `I came across your profile while researching ${context || 'your work in the industry'} and was really impressed by your background. I'm currently exploring opportunities in the field and would love to connect, learn from your journey, and grow my professional network.

I'm particularly interested in how you've approached ${context || 'career growth and skill development'} — your insights would be invaluable to someone at my stage.`,
    followup: `I hope this message finds you well. I'm following up on our recent connection — I really enjoyed learning about your experience with ${context || 'your recent projects'}.

I wanted to reach out because I'm actively exploring new opportunities and would greatly appreciate any advice you might have for someone transitioning into ${context || 'this space'}. Even a brief chat would be incredibly helpful.`,
    thankyou: `I wanted to send a sincere thank you for taking the time to ${context || 'speak with me and share your insights'}. Your perspective on ${context ? `the ${context} space` : 'the industry'} was incredibly helpful and has given me a much clearer direction for my job search.

I'll keep you updated on my progress and hope to pay it forward someday!`,
    referral: `I hope you're doing well! I'm currently exploring ${context || 'new career opportunities'} and was wondering if you know of any openings or teams that might be a good fit for my background.

I'm specifically looking for roles where I can ${context ? `leverage my experience with ${context}` : 'make an impact and grow professionally'}. If any opportunities come to mind, I'd greatly appreciate a warm introduction or a referral.`,
  }

  return `${intro}\n\n${bodies[type]}\n\nBest regards,\n[Your Name]`
}

const outreachTypes: { id: OutreachMessage['type']; label: string }[] = [
  { id: 'connection', label: 'Connection Request' },
  { id: 'followup', label: 'Follow-up' },
  { id: 'thankyou', label: 'Thank You' },
  { id: 'referral', label: 'Referral Request' },
]

export function LinkedInOutreach() {
  const { addToast } = useToast()
  const [recipient, setRecipient] = useState('')
  const [context, setContext] = useState('')
  const [messageType, setMessageType] = useState<OutreachMessage['type']>('connection')
  const [generated, setGenerated] = useState<OutreachMessage[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleGenerate = () => {
    if (!recipient.trim()) return
    const message = generateOutreach(messageType, recipient.trim(), context.trim())
    const entry: OutreachMessage = {
      id: `msg-${Date.now()}`,
      type: messageType,
      recipient: recipient.trim(),
      context: context.trim(),
      message,
      copied: false,
    }
    setGenerated((prev) => [entry, ...prev])
    addToast('success', 'Outreach message generated!')
  }

  const handleCopy = async (index: number) => {
    await navigator.clipboard.writeText(generated[index].message)
    setCopiedIndex(index)
    addToast('success', 'Copied to clipboard!')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Generate LinkedIn outreach messages for networking, follow-ups, thank-yous, and referral requests.
      </p>

      <div className="flex flex-wrap gap-2">
        {outreachTypes.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={messageType === t.id ? 'primary' : 'secondary'}
            onClick={() => setMessageType(t.id)}
          >
            <Linkedin className="w-3.5 h-3.5" /> {t.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Recipient name (e.g. John)"
        />
        <Input
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Context (e.g. SDE role at Google, mutual connection)"
        />
      </div>

      <Button onClick={handleGenerate} disabled={!recipient.trim()}>
        <Sparkles className="w-3.5 h-3.5" /> Generate Message
      </Button>

      {generated.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Generated Messages</p>
          {generated.map((msg, i) => (
            <Card key={msg.id} title={`${msg.type.charAt(0).toUpperCase() + msg.type.slice(1)} — ${msg.recipient}`}>
              <div className="space-y-3">
                <div className="bg-surface-2 rounded-lg p-4 text-sm text-text whitespace-pre-line font-mono text-[13px] leading-relaxed">
                  {msg.message}
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="secondary" onClick={() => handleCopy(i)}>
                    {copiedIndex === i ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedIndex === i ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}