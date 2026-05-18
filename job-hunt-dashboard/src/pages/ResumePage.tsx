import { Card } from '@/components/ui/Card'
import { ResumeBulletGenerator } from '@/features/resume/ResumeBulletGenerator'

export function ResumePage() {
  return (
    <div className="max-w-2xl">
      <Card title="Resume Bullet Generator">
        <ResumeBulletGenerator />
      </Card>
    </div>
  )
}