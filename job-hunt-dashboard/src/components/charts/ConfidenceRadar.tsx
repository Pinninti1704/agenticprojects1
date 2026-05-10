import { useMemo } from 'react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip,
} from 'recharts'
import { useTopicStore } from '@/stores/topicStore'

export function ConfidenceRadar() {
  const topics = useTopicStore((s) => s.topics)
  const categories = useTopicStore((s) => s.categories)

  const data = useMemo(() => categories.map((cat) => {
    const catTopics = topics.filter((t) => t.categoryId === cat.id)
    const avg = catTopics.length > 0
      ? catTopics.reduce((sum, t) => sum + t.confidence, 0) / catTopics.length
      : 0
    return { category: cat.name, value: +avg.toFixed(1), fullMark: 5 }
  }), [topics, categories])

  if (topics.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-text-muted text-sm">
        Add topics to see confidence radar
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <RadarChart data={data}>
        <PolarGrid stroke="#312e81" />
        <PolarAngleAxis dataKey="category" tick={{ fill: '#a5b4fc', fontSize: 11 }} />
        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#6b7280', fontSize: 10 }} />
        <Tooltip contentStyle={{ background: '#1e1b4b', border: '1px solid #312e81', borderRadius: 8 }} />
        <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
      </RadarChart>
    </ResponsiveContainer>
  )
}