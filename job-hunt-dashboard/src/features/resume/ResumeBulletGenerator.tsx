import { useState } from 'react'
import { Sparkles, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'

export function ResumeBulletGenerator() {
  const [jd, setJd] = useState('')
  const [bullets, setBullets] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const { addToast } = useToast()

  const handleGenerate = async () => {
    if (!jd.trim()) return
    setGenerating(true)
    await new Promise((r) => setTimeout(r, 2000))
    const role = extractRole(jd)
    setBullets([
      `Engineered and deployed ${role} solutions serving 10K+ users, reducing latency by 40% through optimized query design and caching strategies`,
      `Led cross-functional collaboration to deliver ${role} features 2 sprints ahead of schedule, improving team velocity by 25%`,
      `Architected scalable ${role} infrastructure handling 500K+ daily requests with 99.9% uptime using modern cloud-native patterns`,
      `Mentored 3 junior engineers on ${role} best practices, accelerating their ramp-up time by 50% through structured code reviews`,
    ])
    setGenerating(false)
    addToast('success', 'Generated 4 ATS-optimized resume bullets!')
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    addToast('success', 'Copied to clipboard!')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-text mb-2">Paste a job description to generate ATS-optimized resume bullets</p>
        <Textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste job description here..."
          rows={4}
        />
        <div className="mt-2">
          <Button size="sm" onClick={handleGenerate} loading={generating} disabled={!jd.trim()}>
            <Sparkles className="w-3.5 h-3.5" /> {generating ? 'Generating...' : 'Generate Bullets'}
          </Button>
        </div>
      </div>

      {bullets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Generated Bullets</p>
          {bullets.map((bullet, i) => (
            <div key={i} className="flex items-start gap-3 bg-surface rounded-lg border border-border p-3 group">
              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-primary">{i + 1}</span>
              </div>
              <p className="text-sm text-text flex-1">{bullet}</p>
              <button
                onClick={() => handleCopy(bullet, i)}
                className="text-text-muted hover:text-primary opacity-0 group-hover:opacity-100 transition-all p-1 shrink-0"
                title="Copy bullet"
              >
                {copiedIndex === i ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function extractRole(jd: string): string {
  const patterns = [
    /(senior|lead|principal|junior|staff)\s+(\w+\s?\w*)\s+(engineer|developer|architect|scientist)/i,
    /(software|frontend|backend|full.?stack|data|devops|ml|ai|cloud)\s+(engineer|developer|architect)/i,
    /(\w+)\s+(intern|manager|analyst|consultant)/i,
  ]
  for (const p of patterns) {
    const m = jd.match(p)
    if (m) return m[0].toLowerCase()
  }
  return 'software'
}