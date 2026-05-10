import { useState } from 'react'
import { MessageSquare, BookOpen, Linkedin, Scan } from 'lucide-react'
import { MockInterview } from '@/features/agent/MockInterview'
import { StoryBank } from '@/features/agent/StoryBank'
import { LinkedInOutreach } from '@/features/agent/LinkedInOutreach'
import { JobScanner } from '@/features/agent/JobScanner'

const agentTabs = [
  { id: 'interview', label: 'Mock Interview', icon: MessageSquare },
  { id: 'stories', label: 'Story Bank', icon: BookOpen },
  { id: 'outreach', label: 'LinkedIn Outreach', icon: Linkedin },
  { id: 'scanner', label: 'Job Scanner', icon: Scan },
] as const

type AgentTab = (typeof agentTabs)[number]['id']

export function AgentPage() {
  const [activeTab, setActiveTab] = useState<AgentTab>('interview')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {agentTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'text-text-muted hover:text-text hover:bg-surface'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'interview' && <MockInterview />}
      {activeTab === 'stories' && <StoryBank />}
      {activeTab === 'outreach' && <LinkedInOutreach />}
      {activeTab === 'scanner' && <JobScanner />}
    </div>
  )
}