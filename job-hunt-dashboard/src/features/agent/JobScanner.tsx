import { useState, useMemo } from 'react'
import { Scan, Download, Trash2, ChevronDown, ChevronUp, FileText, Star, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { useToast } from '@/components/ui/Toast'
import { createAiProvider } from '@/services/ai'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAgentStore } from '@/stores/agentStore'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { formatDate } from '@/lib/utils'
import type { ScannedJob, JobMatchResult } from '@/types/agent'

function dedupeSkills(skills: string[]): string[] {
  return Array.from(new Set(skills.map((s) => s.trim()).filter(Boolean)))
}

function extractSkillsFromText(text: string, lexicon: string[]): string[] {
  const lower = text.toLowerCase()
  return lexicon.filter((skill) => lower.includes(skill.toLowerCase()))
}

function skillFrequency(jdText: string, skills: string[]): { skill: string; count: number }[] {
  const lower = jdText.toLowerCase()
  return skills
    .map((skill) => {
      const regex = new RegExp(skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
      const matches = jdText.match(regex)
      return { skill, count: matches ? matches.length : 0 }
    })
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
}

function matchColor(value: number): string {
  if (value >= 80) return 'bg-success'
  if (value >= 50) return 'bg-warning'
  return 'bg-danger'
}

const SKILL_LEXICON = [
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'Go', 'Rust',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'GitHub Actions',
  'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'GraphQL', 'REST', 'gRPC',
  'Microservices', 'System Design', 'Distributed Systems', 'Event-Driven Architecture',
  'Kafka', 'RabbitMQ', 'NGINX', 'Linux', 'Shell', 'SQL', 'NoSQL',
  'HTML', 'CSS', 'Tailwind', 'SASS', 'Webpack', 'Vite', 'Jest', 'Cypress',
  'Playwright', 'Next.js', 'Vue.js', 'Angular',
  'Machine Learning', 'Deep Learning', 'NLP', 'LLM', 'TensorFlow', 'PyTorch',
  'Data Engineering', 'Spark', 'Airflow', 'Snowflake', 'BigQuery',
  'Observability', 'Prometheus', 'Grafana', 'Datadog',
  'Security', 'OAuth', 'JWT', 'API Gateway', 'Load Balancing', 'CDN',
]

interface ResumeBullet {
  skill: string
  bullets: string[]
  loading: boolean
  expanded: boolean
}

function JobScannerInner() {
  const settings = useSettingsStore((s) => s.app)
  const provider = useMemo(() => createAiProvider(settings.agentProvider), [settings.agentProvider])
  const { scannedJobs, addScannedJob, deleteScannedJob } = useAgentStore()
  const { addToast } = useToast()
  const trackEvent = useAnalyticsStore((s) => s.trackEvent)

  /* ---- form state ---- */
  const [jdText, setJdText] = useState('')
  const [skillsInput, setSkillsInput] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [scanning, setScanning] = useState(false)
  const [autoExtracted, setAutoExtracted] = useState(false)

  /* ---- results state ---- */
  const [matchResult, setMatchResult] = useState<JobMatchResult | null>(null)
  const [scannedRoles, setScannedRoles] = useState<{ company: string; role: string; location: string; matchScore: number; url: string; reason: string }[]>([])
  const [showRoles, setShowRoles] = useState(false)

  /* ---- resume bullet state ---- */
  const [bulletStates, setBulletStates] = useState<ResumeBullet[]>([])

  /* ---- history state ---- */
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)

  const skills = useMemo(() => dedupeSkills(skillsInput.split(',').concat(autoExtracted && resumeText ? extractSkillsFromText(resumeText, SKILL_LEXICON) : [])), [skillsInput, autoExtracted, resumeText])

  const extractedInfo = useMemo(() => {
    if (!autoExtracted || !resumeText.trim()) return null
    const found = extractSkillsFromText(resumeText, SKILL_LEXICON)
    return { skills: found }
  }, [resumeText, autoExtracted])

  const freqData = useMemo(() => {
    if (!matchResult) return []
    return skillFrequency(jdText, matchResult.matchedSkills)
  }, [jdText, matchResult])

  const handleExtract = () => {
    if (!resumeText.trim()) return
    setAutoExtracted(true)
    const found = extractSkillsFromText(resumeText, SKILL_LEXICON)
    addToast('success', `Extracted ${found.length} skills from resume`)
    trackEvent('resume_skills_extracted', { count: found.length })
  }

  const handleScan = async () => {
    if (!jdText.trim()) return
    setScanning(true)
    setMatchResult(null)
    setScannedRoles([])
    setBulletStates([])
    await new Promise((r) => setTimeout(r, 600))

    const skillsToUse = skills.length > 0 ? skills : SKILL_LEXICON.slice(0, 8)

    const result = provider.analyzeJobMatch(jdText, skillsToUse)
    setMatchResult(result)

    const roles = provider.generateInterviewQuestions(jdText, 4).map((q, i) => ({
      company: ['TechCorp', 'StartupXYZ', 'DataFlow Inc', 'CloudBase'][i % 4],
      role: q.question.replace(/.*?/g, '').slice(0, 40),
      location: ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA'][i % 4],
      matchScore: Math.min(100, result.matchPercent + Math.round((Math.random() - 0.3) * 30)),
      url: '',
      reason: result.suggestions[i % result.suggestions.length] || 'Skills alignment with job requirements',
    }))
    setScannedRoles(roles)

    const newScannedJob: ScannedJob = {
      id: `job-${Date.now()}`,
      jdText,
      extractedSkills: skillsToUse,
      matchResult: result,
      scannedRoles: roles.map((r) => ({ ...r, matchScore: r.matchScore })),
      createdAt: new Date().toISOString(),
    }
    addScannedJob(newScannedJob)

    setScanning(false)
    setShowRoles(true)
    addToast('success', `Job scan complete — ${result.matchPercent}% match`)
    trackEvent('job_scanned', { matchPercent: result.matchPercent, skillsCount: skillsToUse.length, criticalGaps: result.criticalMissingSkills.length })
  }

  const handleLoadBullets = (skill: string) => {
    setBulletStates((prev) => {
      const existing = prev.find((b) => b.skill === skill)
      if (existing) {
        return prev.map((b) => b.skill === skill ? { ...b, expanded: !b.expanded } : b)
      }
      return [...prev, { skill, bullets: [], loading: true, expanded: true }]
    })

    setTimeout(() => {
      const bullets = provider.generateResumeBullets(skill)
      setBulletStates((prev) =>
        prev.map((b) => b.skill === skill ? { ...b, bullets, loading: false } : b)
      )
    }, 400)
  }

  const handleRestore = (job: ScannedJob) => {
    setJdText(job.jdText)
    setSkillsInput(job.extractedSkills.join(', '))
    setMatchResult(job.matchResult)
    setScannedRoles(job.scannedRoles)
    trackEvent('job_scanned_restored', { jobId: job.id })
    addToast('success', 'Restored previous scan')
  }

  const handleExportJson = () => {
    if (!matchResult) return
    const data = JSON.stringify({ matchResult, scannedRoles, jdText: jdText.slice(0, 200) }, null, 2)
    navigator.clipboard.writeText(data)
    addToast('success', 'Copied results as JSON')
  }

  const handleExportMarkdown = () => {
    if (!matchResult) return
    const lines = [
      '# Job Scan Results',
      '',
      `**Match:** ${matchResult.matchPercent}%`,
      '',
      '## Matched Skills',
      ...matchResult.matchedSkills.map((s) => `- ${s}`),
      '',
      '## Missing Skills',
      ...matchResult.missingSkills.map((s) => `- ${s}`),
      '',
      matchResult.criticalMissingSkills.length > 0 ? '## Critical Gaps' : '',
      ...matchResult.criticalMissingSkills.map((s) => `- ${s} ⚠️`),
      '',
      matchResult.niceToHaveMissingSkills.length > 0 ? '## Nice-to-Have Gaps' : '',
      ...matchResult.niceToHaveMissingSkills.map((s) => `- ${s}`),
      '',
      '## Suggestions',
      ...matchResult.suggestions.map((s) => `- ${s}`),
    ]
    navigator.clipboard.writeText(lines.filter(Boolean).join('\n'))
    addToast('success', 'Copied as Markdown')
  }

  const sortedHistory = useMemo(
    () => [...scannedJobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [scannedJobs],
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Paste a job description to analyze your fit. Add skills or paste a resume to auto-extract them.
      </p>

      {/* Resume Textarea + Extract */}
      <div>
        <Textarea
          label="Resume (paste to auto-extract skills)"
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={3}
          placeholder="Paste your resume text here to auto-extract skills..."
        />
        <div className="mt-1.5 flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleExtract} disabled={!resumeText.trim() || autoExtracted}>
            <FileText className="w-3.5 h-3.5" /> Extract Skills
          </Button>
          {extractedInfo && (
            <span className="text-xs text-text-muted">
              Found {extractedInfo.skills.length} skills — auto-appended to skills list
            </span>
          )}
        </div>
        {extractedInfo && extractedInfo.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {extractedInfo.skills.map((s) => (
              <Badge key={s} variant="info">{s}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Skills Input */}
      <Textarea
        label="Your Skills (comma separated)"
        value={skillsInput}
        onChange={(e) => setSkillsInput(e.target.value)}
        rows={2}
        placeholder="e.g. React, TypeScript, AWS, PostgreSQL"
      />

      {/* JD Textarea */}
      <Textarea
        label="Job Description"
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
        rows={4}
        placeholder="Paste a job description here..."
      />

      <Button onClick={handleScan} loading={scanning} disabled={!jdText.trim()}>
        <Scan className="w-3.5 h-3.5" /> Scan & Match
      </Button>

      {/* Skill Frequency Bar Chart */}
      {freqData.length > 0 && (
        <Card title="Skill Frequency in JD">
          <div className="space-y-1.5">
            {freqData.slice(0, 10).map(({ skill, count }) => {
              const maxCount = freqData[0].count
              const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
              return (
                <div key={skill} className="flex items-center gap-2">
                  <span className="text-xs text-text-muted w-24 truncate shrink-0" title={skill}>{skill}</span>
                  <div className="flex-1 bg-surface-2 rounded-full h-2">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-text-muted w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Results */}
      {matchResult && (
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

            {/* Critical vs Nice-to-Have Gap Analysis */}
            {matchResult.criticalMissingSkills.length > 0 && (
              <div>
                <p className="text-xs text-text-muted mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-danger" />
                  Critical Missing Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.criticalMissingSkills.map((s) => (
                    <Badge key={s} variant="danger">
                      {s}
                      <button
                        onClick={() => handleLoadBullets(s)}
                        className="ml-1.5 text-[10px] underline hover:text-white transition-colors"
                        title="Get resume bullet suggestions"
                      >
                        fix
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {matchResult.niceToHaveMissingSkills.length > 0 && (
              <div>
                <p className="text-xs text-text-muted mb-1.5 uppercase tracking-wider">Nice-to-Have Missing</p>
                <div className="flex flex-wrap gap-1.5">
                  {matchResult.niceToHaveMissingSkills.map((s) => (
                    <Badge key={s} variant="warning">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Bullet Suggestions */}
            {bulletStates.filter((b) => b.expanded).map((bs) => (
              <div key={bs.skill} className="bg-surface-2 rounded-lg border border-border p-3 space-y-2">
                <p className="text-xs font-semibold text-text">Resume Bullets for {bs.skill}</p>
                {bs.loading ? (
                  <p className="text-xs text-text-muted animate-pulse">Generating...</p>
                ) : (
                  <ul className="space-y-1">
                    {bs.bullets.map((bullet, i) => (
                      <li key={i} className="text-xs text-text flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

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

            {/* Export Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button size="sm" variant="secondary" onClick={handleExportJson}>
                <Download className="w-3.5 h-3.5" /> Copy JSON
              </Button>
              <Button size="sm" variant="secondary" onClick={handleExportMarkdown}>
                <Download className="w-3.5 h-3.5" /> Copy Markdown
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Matching Roles */}
      {scannedRoles.length > 0 && (
        <Card title="Matching Roles">
          <div className="space-y-2">
            <button
              onClick={() => setShowRoles(!showRoles)}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text transition-colors"
            >
              {showRoles ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showRoles ? 'Hide' : 'Show'} {scannedRoles.length} matching roles
            </button>
            {showRoles && scannedRoles.map((role, i) => {
              const scoreColor = role.matchScore >= 80 ? 'text-success' : role.matchScore >= 50 ? 'text-warning' : 'text-danger'
              return (
                <div key={i} className="bg-surface rounded-lg border border-border p-3 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text">{role.role}</p>
                    <p className="text-xs text-text-muted">{role.company} — {role.location}</p>
                    <p className="text-xs text-text-muted mt-0.5">{role.reason}</p>
                  </div>
                  <div className="text-center shrink-0">
                    <div className={`text-lg font-bold ${scoreColor}`}>{role.matchScore}%</div>
                    <div className="text-[10px] text-text-muted">match</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Scan History */}
      {sortedHistory.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
            Scan History ({sortedHistory.length})
          </p>
          <div className="space-y-2">
            {sortedHistory.map((job) => {
              const isExpanded = expandedHistoryId === job.id
              return (
                <div key={job.id} className="bg-surface border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-text">{job.matchResult.matchPercent}% match</span>
                      <span className="text-xs text-text-muted">{job.extractedSkills.length} skills</span>
                      <span className="text-xs text-text-muted">{formatDate(job.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleRestore(job)} className="text-text-muted hover:text-text p-1" title="Restore this scan">
                        <Star className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { deleteScannedJob(job.id); trackEvent('job_scanned_deleted', { jobId: job.id }) }} className="text-text-muted hover:text-danger p-1" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setExpandedHistoryId(isExpanded ? null : job.id)} className="text-text-muted hover:text-text p-1">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {job.matchResult.matchedSkills.map((s) => (
                          <Badge key={s} variant="success">{s}</Badge>
                        ))}
                        {job.matchResult.criticalMissingSkills.map((s) => (
                          <Badge key={s} variant="danger">{s}</Badge>
                        ))}
                      </div>
                      {job.matchResult.suggestions.length > 0 && (
                        <ul className="space-y-0.5">
                          {job.matchResult.suggestions.map((s, i) => (
                            <li key={i} className="text-xs text-text-muted flex items-start gap-1.5">
                              <span className="text-primary mt-0.5">•</span>{s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function JobScanner() {
  return (
    <ErrorBoundary>
      <JobScannerInner />
    </ErrorBoundary>
  )
}