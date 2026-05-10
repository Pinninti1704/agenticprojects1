import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
import { useApplicationStore } from '@/stores/applicationStore'
import { APPLICATION_STAGES, STAGE_LABELS } from '@/types/application'

export function StageConversionChart() {
  const applications = useApplicationStore((s) => s.applications)

  const data = useMemo(() => {
    const active = applications.filter((a) => a.stage !== 'rejected' && a.stage !== 'withdrawn')
    return APPLICATION_STAGES.filter((s) => s !== 'rejected' && s !== 'withdrawn').map((stage) => ({
      stage: STAGE_LABELS[stage].split(' ')[0],
      count: applications.filter((a) => a.stage === stage).length,
      dropped: stage === 'offer' ? 0 :
        active.filter((a) => a.stage === stage).length -
        active.filter((a) => APPLICATION_STAGES.indexOf(a.stage) > APPLICATION_STAGES.indexOf(stage)).length,
    }))
  }, [applications])

  if (applications.length === 0) {
    return <div className="flex items-center justify-center h-[200px] text-text-muted text-sm">No applications yet</div>
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#312e81" />
        <XAxis dataKey="stage" tick={{ fill: '#6b7280', fontSize: 11 }} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
        <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid #312e81', borderRadius: 8 }} />
        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="count" position="top" fill="#a5b4fc" fontSize={11} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}