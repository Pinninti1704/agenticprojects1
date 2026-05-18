import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useApplicationStore } from '@/stores/applicationStore'
import { useStudyStore } from '@/stores/studyStore'

export function WeeklyVolumeChart() {
  const applications = useApplicationStore((s) => s.applications)
  const sessions = useStudyStore((s) => s.sessions)

  const data = useMemo(() => {
    const weeks = 8
    return Array.from({ length: weeks }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (weeks - 1 - i) * 7)
      const weekStart = d.toISOString().slice(0, 10)
      const weekEnd = new Date(d)
      weekEnd.setDate(weekEnd.getDate() + 6)
      const weekEndStr = weekEnd.toISOString().slice(0, 10)
      return {
        week: `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        applications: applications.filter((a) => a.createdAt.slice(0, 10) >= weekStart && a.createdAt.slice(0, 10) <= weekEndStr).length,
        study: sessions.filter((s) => s.date >= weekStart && s.date <= weekEndStr).length,
      }
    })
  }, [applications, sessions])

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#312e81" />
        <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 10 }} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} allowDecimals={false} />
        <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid #312e81', borderRadius: 8 }} />
        <Area type="monotone" dataKey="applications" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} name="Applications" />
        <Area type="monotone" dataKey="study" stackId="2" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Study Sessions" />
      </AreaChart>
    </ResponsiveContainer>
  )
}