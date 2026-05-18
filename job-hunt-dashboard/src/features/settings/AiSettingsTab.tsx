import { Sparkles, Timer, Brain, CheckSquare, MessageSquare, Scan, Star } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { useSettingsStore } from '@/stores/settingsStore'

export function AiSettingsTab() {
  const settings = useSettingsStore()

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-text flex items-center gap-2">
        <Brain className="w-4 h-4" />
        AI Provider
      </h4>
      <Select
        label="AI Provider"
        value={settings.app.agentProvider}
        onChange={(e) => settings.updateApp({ agentProvider: e.target.value as 'mock' | 'openai' | 'nim' })}
        options={[
          { value: 'mock', label: 'Mock (offline, deterministic)' },
          { value: 'openai', label: 'OpenAI' },
          { value: 'nim', label: 'NVIDIA NIM' },
        ]}
      />

      <hr className="border-border" />

      <h4 className="text-sm font-semibold text-text flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        Mock Interview
      </h4>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.app.mockInterviewTimedMode}
          onChange={(e) => settings.updateApp({ mockInterviewTimedMode: e.target.checked })}
          className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary/50"
        />
        <span className="text-sm text-text">Timed mode (per-question countdown)</span>
      </label>
      <Select
        label="Questions per Interview"
        value={String(settings.app.mockInterviewQuestionCount)}
        onChange={(e) => settings.updateApp({ mockInterviewQuestionCount: Number(e.target.value) as 3 | 6 | 10 })}
        options={[
          { value: '3', label: '3 questions (quick)' },
          { value: '6', label: '6 questions (standard)' },
          { value: '10', label: '10 questions (deep dive)' },
        ]}
      />
      <Input
        label="Time Limit per Question (seconds)"
        type="number"
        min={60}
        max={600}
        value={settings.app.mockInterviewTimeLimit}
        onChange={(e) => settings.updateApp({ mockInterviewTimeLimit: Number(e.target.value) })}
      />

      <hr className="border-border" />

      <h4 className="text-sm font-semibold text-text flex items-center gap-2">
        <Star className="w-4 h-4" />
        Story Bank
      </h4>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.app.storyAutoScore}
          onChange={(e) => settings.updateApp({ storyAutoScore: e.target.checked })}
          className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary/50"
        />
        <span className="text-sm text-text">Auto-score STAR stories on save</span>
      </label>

      <hr className="border-border" />

      <h4 className="text-sm font-semibold text-text flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        LinkedIn Outreach
      </h4>
      <Select
        label="Default Tone"
        value={settings.app.outreachDefaultTone}
        onChange={(e) => settings.updateApp({ outreachDefaultTone: e.target.value as 'professional' | 'warm' | 'direct' })}
        options={[
          { value: 'professional', label: 'Professional' },
          { value: 'warm', label: 'Warm & Friendly' },
          { value: 'direct', label: 'Direct & Concise' },
        ]}
      />

      <hr className="border-border" />

      <h4 className="text-sm font-semibold text-text flex items-center gap-2">
        <Scan className="w-4 h-4" />
        Job Scanner
      </h4>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.app.jobScannerAutoExtract}
          onChange={(e) => settings.updateApp({ jobScannerAutoExtract: e.target.checked })}
          className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary/50"
        />
        <span className="text-sm text-text">Auto-extract skills from resume text</span>
      </label>
    </div>
  )
}