import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ErrorFallbackProps {
  title?: string
  message?: string
  onRetry?: () => void
  onClearData?: () => void
}

export function ErrorFallback({ title = 'Something went wrong', message = 'An unexpected error occurred. Please try again.', onRetry, onClearData }: ErrorFallbackProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-8 text-center space-y-4 max-w-md mx-auto">
      <AlertTriangle className="w-12 h-12 text-danger mx-auto" />
      <h3 className="text-text font-semibold">{title}</h3>
      <p className="text-text-muted text-sm">{message}</p>
      <div className="flex items-center justify-center gap-3 pt-2">
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </Button>
        )}
        {onClearData && (
          <Button variant="ghost" onClick={onClearData}>
            <Trash2 className="w-3.5 h-3.5" /> Clear Data
          </Button>
        )}
      </div>
    </div>
  )
}