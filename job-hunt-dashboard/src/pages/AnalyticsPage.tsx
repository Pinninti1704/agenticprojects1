import { BookOpen, Briefcase, Clock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ConfidenceRadar } from '@/components/charts/ConfidenceRadar'
import { StudyTimeChart } from '@/components/charts/StudyTimeChart'
import { ApplicationFunnel } from '@/components/charts/ApplicationFunnel'
import { StageConversionChart } from '@/features/analytics/StageConversionChart'
import { WeeklyVolumeChart } from '@/features/analytics/WeeklyVolumeChart'
import type { TabType } from '@/components/layout/Sidebar'

export function AnalyticsPage({ onTabChange }: { onTabChange?: (tab: TabType) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Confidence by Category">
          <ConfidenceRadar />
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={() => onTabChange?.('topics')}>
              <BookOpen className="w-3.5 h-3.5" /> Manage Topics
            </Button>
          </div>
        </Card>
        <Card title="Application Pipeline">
          <ApplicationFunnel />
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={() => onTabChange?.('applications')}>
              <Briefcase className="w-3.5 h-3.5" /> Manage Applications
            </Button>
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Stage Conversion">
          <StageConversionChart />
        </Card>
        <Card title="Weekly Activity (8 Weeks)">
          <WeeklyVolumeChart />
        </Card>
      </div>
      <Card title="Study Time (Last 30 Days)">
        <StudyTimeChart />
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={() => onTabChange?.('study')}>
            <Clock className="w-3.5 h-3.5" /> Log Study Session
          </Button>
        </div>
      </Card>
    </div>
  )
}