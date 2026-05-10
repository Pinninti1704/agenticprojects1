import { Card } from '@/components/ui/Card'
import { ConfidenceRadar } from '@/components/charts/ConfidenceRadar'
import { StudyTimeChart } from '@/components/charts/StudyTimeChart'
import { ApplicationFunnel } from '@/components/charts/ApplicationFunnel'

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Confidence by Category">
          <ConfidenceRadar />
        </Card>
        <Card title="Application Pipeline">
          <ApplicationFunnel />
        </Card>
      </div>
      <Card title="Study Time (Last 30 Days)">
        <StudyTimeChart />
      </Card>
    </div>
  )
}