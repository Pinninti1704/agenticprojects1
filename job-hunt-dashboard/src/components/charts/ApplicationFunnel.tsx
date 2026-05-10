import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useApplicationStore } from '@/stores/applicationStore'
import { APPLICATION_STAGES, STAGE_LABELS } from '@/types/application'

export function ApplicationFunnel() {
  const applications = useApplicationStore((s) => s.applications)

  const data = useMemo(() => {
    const stages = APPLICATION_STAGES.filter((s) => s !== 'rejected' && s !== 'withdrawn')
    return stages.map((stage) => ({
      stage: STAGE_LABELS[stage].split(' ')[0],
      count: applications.filter((a) => a.stage === stage).length,
    }))
  }, [applications])

  if (applications.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-text-muted text-sm">
        Add applications to see your pipeline funnel
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#312e81" />
        <XAxis dataKey="stage" tick={{ fill: '#6b7280', fontSize: 11 }} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
        <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid #312e81', borderRadius: 8 }} />
        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}