import { useState, useCallback } from 'react'
import { Sidebar, type TabType } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { DarkModeProvider } from '@/components/layout/DarkModeProvider'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { SettingsPanel } from '@/features/settings/SettingsPanel'
import { DashboardPage } from '@/pages/DashboardPage'
import { TopicsPage } from '@/pages/TopicsPage'
import { ApplicationsPage } from '@/pages/ApplicationsPage'
import { StudyLogPage } from '@/pages/StudyLogPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { ResumePage } from '@/pages/ResumePage'
import { AgentPage } from '@/pages/AgentPage'

const tabTitles: Record<TabType, string> = {
  dashboard: 'Dashboard',
  topics: 'Topics',
  applications: 'Applications',
  study: 'Study Log',
  analytics: 'Analytics',
  resume: 'Resume Builder',
  agent: 'Agent Tools',
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [showSettings, setShowSettings] = useState(false)
  const { addToast } = useToast()

  const handleClearData = useCallback(() => {
    const keys = ['topics', 'applications', 'study', 'deadlines', 'questions', 'settings']
    keys.forEach((key) => localStorage.removeItem(`huntboard-${key}`))
    addToast('success', 'All data cleared. Refreshing...')
    setTimeout(() => window.location.reload(), 1000)
  }, [addToast])

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage onTabChange={setActiveTab} />
      case 'topics': return <TopicsPage />
      case 'applications': return <ApplicationsPage />
      case 'study': return <StudyLogPage onTabChange={setActiveTab} />
      case 'analytics': return <AnalyticsPage onTabChange={setActiveTab} />
      case 'resume': return <ResumePage />
      case 'agent': return <AgentPage />
    }
  }

  return (
    <div className="flex h-screen bg-surface text-text">
      <DarkModeProvider />
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onOpenSettings={() => setShowSettings(true)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={tabTitles[activeTab]} />
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} onClearData={handleClearData} />
    </div>
  )
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}

export default App