import { useState } from 'react'
import { Sidebar, type TabType } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { ToastProvider } from '@/components/ui/Toast'
import { DashboardPage } from '@/pages/DashboardPage'
import { TopicsPage } from '@/pages/TopicsPage'
import { ApplicationsPage } from '@/pages/ApplicationsPage'
import { StudyLogPage } from '@/pages/StudyLogPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'

const tabTitles: Record<TabType, string> = {
  dashboard: 'Dashboard',
  topics: 'Topics',
  applications: 'Applications',
  study: 'Study Log',
  analytics: 'Analytics',
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage />
      case 'topics': return <TopicsPage />
      case 'applications': return <ApplicationsPage />
      case 'study': return <StudyLogPage />
      case 'analytics': return <AnalyticsPage />
    }
  }

  return (
    <ToastProvider>
      <div className="flex h-screen bg-surface text-text">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col min-w-0">
          <Header title={tabTitles[activeTab]} />
          <main className="flex-1 overflow-y-auto p-6">
            {renderPage()}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}

export default App