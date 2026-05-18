import { Search } from 'lucide-react'

interface ApplicationSearchBarProps {
  search: string
  onSearchChange: (value: string) => void
}

export function ApplicationSearchBar({ search, onSearchChange }: ApplicationSearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by company, role, or notes..."
        className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
      />
    </div>
  )
}