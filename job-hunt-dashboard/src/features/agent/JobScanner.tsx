import { useState } from 'react'
import { Scan } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useToast } from '@/components/ui/Toast'
import type { JobMatchResult, ScannedRole } from '@/types/agent'

const sampleSkills = [
  'React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker',
  'Kubernetes', 'PostgreSQL', 'GraphQL', 'CI/CD', 'Terraform',
  'Go', 'Rust', 'Java', 'System Design', 'Microservices',
]

function computeMatch(jdText: string, skills: string[]): JobMatchResult {
  const jdLower = jdText.toLowerCase()
  const matched: string[] = []
  const missing: string[] = []

  for (const skill of skills) {
    if (jdLower.includes(skill.toLowerCase())) {
      matched.push(skill)
    } else {
      missing.push(skill)
    }
  }

  const matchPercent = skills.length > 0 ? Math.round((matched.length / skills.length) * 100) : 0
  const suggestions: string[] = []

  if (matched.length === 0) {
    suggestions.push('Try adding more specific technical skills to your profile.')
  } else if (matchPercent < 50) {
    suggestions.push('Consider upskilling in the missing areas to increase your match rate.')
  }

  if (jdLower.includes('5+ years') || jdLower.includes('senior')) {
    suggestions.push('This role targets senior-level candidates. Highlight leadership experience.')
  }
  if (jdLower.includes('cloud') || jdLower.includes('aws') || jdLower.includes('gcp')) {
    suggestions.push('Cloud expertise is valued here. Emphasize your infrastructure experience.')
  }
  if (missing.length > 0) {
    suggestions.push(`Missing: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}. Add relevant keywords to your resume.`)
  }

  return { matchPercent, matchedSkills: matched, missingSkills: missing, suggestions }
}

function generateRoles(jdText: string): ScannedRole[] {
  const jdLower = jdText.toLowerCase()
  const isSenior = jdLower.includes('senior') || jdLower.includes('lead') || jdLower.includes('staff')
  const hasCloud = jdLower.includes('aws') || jdLower.includes('cloud') || jdLower.includes('gcp')
  const hasFullstack = jdLower.includes('full') || jdLower.includes('frontend') && jdLower.includes('backend')

  const roles: ScannedRole[] = [
    {
      company: 'TechCorp',
      role: `${isSenior ? 'Senior ' : ''}Software Engineer${hasFullstack ? ' (Full Stack)' : ''}`,
      location: 'San Francisco, CA (Remote)',
      matchScore: Math.floor(Math.random() * 30) + 60,
      url: '',
      reason: hasCloud ? 'Strong alignment with cloud infrastructure needs' : 'Solid engineering fundamentals required',
    },
    {
      company: 'StartupXYZ',
      role: `${hasFullstack ? 'Full Stack Developer' : 'Backend Engineer'}`,
      location: 'New York, NY (Hybrid)',
      matchScore: Math.floor(Math.random() * 25) + 55,
      url: '',
      reason: 'Fast-paced startup environment matches your adaptability',
    },
    {
      company: 'DataFlow Inc',
      role: 'Platform Engineer',
      location: 'Austin, TX',
      matchScore: Math.floor(Math.random() * 20) + 50,
      url: '',
      reason: 'Infrastructure and scalability focus aligns with your background',
    },
    {
      company: 'CloudBase',
      role: `${isSenior ? 'Senior ' : ''}Site Reliability Engineer`,
      location: 'Seattle, WA',
      matchScore: Math.floor(Math.random() * 25) + 45,
      url: '',
      reason: 'Strong systems engineering overlap with your skill set',
    },
  ]
  return roles
}

export function JobScanner() {
  const { addToast } = useToast()
  const [jdText, setJdText] = useState('')
  const [skillsInput, setSkillsInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null)
  const [scannedRoles, setScannedRoles] = useState<ScannedRole[]>([])

  const skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean)

  const handleScan = async () => {
    if (!jdText.trim()) return
    setScanning(true)
    await new Promise((r) => setTimeout(r, 1200))
    const skillsToUse = skills.length > 0 ? skills : sampleSkills.slice(0, Math.floor(Math.random() * 5) + 3)
    const result = computeMatch(jdText, skillsToUse)
    const roles = generateRoles(jdText)
    setMatchResult(result)
    setScannedRoles(roles)
    setScanning(false)
    addToast('success', `Match analysis complete — ${result.matchPercent}% match`)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Paste a job description to analyze your fit. Add your skills to get a personalized match score.
      </p>

      <Textarea
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
        rows={4}
        placeholder="Paste a job description here..."
      />
      <Input
        value={skillsInput}
        onChange={(e) => setSkillsInput(e.target.value)}
        placeholder="Your skills (comma separated, e.g. React, TypeScript, AWS)"
      />

      <Button onClick={handleScan} loading={scanning} disabled={!jdText.trim()}>
        <Scan className="w-3.5 h-3.5" /> Scan & Match
      </Button>

      {matchResult && (
        <>
          <Card title="Match Analysis">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-text font-medium">Overall Match</span>
                  <span className="text-lg font-bold text-primary">{matchResult.matchPercent}%</span>
                </div>
                <ProgressBar value={matchResult.matchPercent} />
              </div>

              {matchResult.matchedSkills.length > 0 && (
                <div>
                  <p className="text-xs text-text-muted mb-1.5 uppercase tracking-wider">Matched Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.matchedSkills.map((s) => (
                      <Badge key={s} variant="success">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {matchResult.missingSkills.length > 0 && (
                <div>
                  <p className="text-xs text-text-muted mb-1.5 uppercase tracking-wider">Missing Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {matchResult.missingSkills.map((s) => (
                      <Badge key={s} variant="danger">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {matchResult.suggestions.length > 0 && (
                <div>
                  <p className="text-xs text-text-muted mb-1.5 uppercase tracking-wider">Suggestions</p>
                  <ul className="space-y-1">
                    {matchResult.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-text flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          <Card title="Matching Roles">
            <div className="space-y-2">
              {scannedRoles.map((role, i) => (
                <div
                  key={i}
                  className="bg-surface rounded-lg border border-border p-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text">{role.role}</p>
                    <p className="text-xs text-text-muted">{role.company} — {role.location}</p>
                    <p className="text-xs text-text-muted mt-0.5">{role.reason}</p>
                  </div>
                  <div className="text-center shrink-0">
                    <div className="text-lg font-bold text-primary">{role.matchScore}%</div>
                    <div className="text-[10px] text-text-muted">match</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}