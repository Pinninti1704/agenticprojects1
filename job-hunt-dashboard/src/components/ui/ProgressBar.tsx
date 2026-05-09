interface ProgressBarProps {
  value: number
  label?: string
  size?: 'sm' | 'md'
}

export function ProgressBar({ value, label, size = 'md' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const color = clamped >= 80 ? 'bg-success' : clamped >= 50 ? 'bg-primary' : clamped >= 25 ? 'bg-warning' : 'bg-danger'

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-text-muted">{label}</span>
          <span className="text-xs text-text-muted">{Math.round(clamped)}%</span>
        </div>
      )}
      <div className={`w-full bg-border rounded-full ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}>
        <div className={`${color} rounded-full transition-all duration-500 ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  )
}