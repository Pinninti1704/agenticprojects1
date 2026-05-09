import { useStudyStore } from '@/stores/studyStore'

export function StudyCalendar() {
  const sessions = useStudyStore((s) => s.sessions)

  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const getIntensity = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const total = sessions.filter((s) => s.date === dateStr).reduce((sum, s) => sum + s.durationMinutes, 0)
    if (total === 0) return ''
    if (total < 30) return 'bg-primary/20'
    if (total < 60) return 'bg-primary/40'
    if (total < 90) return 'bg-primary/60'
    return 'bg-primary/80'
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div>
      <p className="text-xs text-text-muted mb-2">{monthNames[month]} {year}</p>
      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-text-muted font-medium py-1">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const isToday = day === today.getDate()
          return (
            <div
              key={day}
              className={`aspect-square rounded flex items-center justify-center text-[11px] ${getIntensity(day)} ${isToday ? 'ring-1 ring-primary' : ''}`}
            >
              <span className={isToday ? 'text-white font-bold' : 'text-text-muted'}>{day}</span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-2 mt-2 justify-end">
        <span className="text-[10px] text-text-muted">Less</span>
        <div className="w-3 h-3 rounded bg-surface border border-border" />
        <div className="w-3 h-3 rounded bg-primary/20" />
        <div className="w-3 h-3 rounded bg-primary/40" />
        <div className="w-3 h-3 rounded bg-primary/60" />
        <div className="w-3 h-3 rounded bg-primary/80" />
        <span className="text-[10px] text-text-muted">More</span>
      </div>
    </div>
  )
}