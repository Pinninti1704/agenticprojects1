import { BarChart3, BookOpen, Briefcase, Clock, LineChart, Target } from 'lucide-react'

export type TabType = 'dashboard' | 'topics' | 'applications' | 'study' | 'analytics'

interface SidebarProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs: { id: TabType; label: string; icon: typeof BarChart3 }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'topics', label: 'Topics', icon: BookOpen },
  { id: 'applications', label: 'Applications', icon: Briefcase },
  { id: 'study', label: 'Study Log', icon: Clock },
  { id: 'analytics', label: 'Analytics', icon: LineChart },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-surface-2 border-r border-border flex flex-col shrink-0">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <Target className="w-7 h-7 text-primary" />
        <span className="text-lg font-bold text-text">HuntBoard</span>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === id
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'text-text-muted hover:bg-surface hover:text-text'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface/50 text-xs text-text-muted">
          <Target className="w-3.5 h-3.5" />
          Job Hunt Dashboard v0.1
        </div>
      </div>
    </aside>
  )
}