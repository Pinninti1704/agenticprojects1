import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useStudyStore } from '@/stores/studyStore'

export function StudyTimeChart() {
  const sessions = useStudyStore((s) => s.sessions)

  const data = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    const dateStr = d.toISOString().slice(0, 10)
    const minutes = sessions
      .filter((s) => s.date === dateStr)
      .reduce((sum, s) => sum + s.durationMinutes, 0)
    return {
      date: dateStr.slice(5),
      minutes,
    }
  })

  if (sessions.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-text-muted text-sm">
        Log study sessions to see your study time trend
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#312e81" />
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
        <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid #312e81', borderRadius: 8 }} />
        <Line type="monotone" dataKey="minutes" stroke="#6366f1" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}