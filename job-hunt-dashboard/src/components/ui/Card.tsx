import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ title, actions, children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-surface-2 border border-border rounded-lg p-4 ${onClick ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h3 className="text-sm font-semibold text-text">{title}</h3>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}