import { useState } from 'react'
import { Settings, Sliders, Database, Globe, FileText, RefreshCw, Trash2, Brain } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useSettingsStore } from '@/stores/settingsStore'
import { AiSettingsTab } from './AiSettingsTab'
import type { SettingsTab } from '@/types/settings'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
  onClearData?: () => void
}

const tabs: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
  { id: 'app', label: 'General', icon: Sliders },
  { id: 'scraper', label: 'Question Scraper', icon: Globe },
  { id: 'applications', label: 'Applications', icon: FileText },
  { id: 'ai', label: 'AI Features', icon: Brain },
  { id: 'data', label: 'Data Management', icon: Database },
]

export function SettingsPanel({ open, onClose, onClearData }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('app')
  const settings = useSettingsStore()
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="flex gap-6 -mx-6 -mt-4">
        {/* Sidebar tabs */}
        <div className="w-40 shrink-0 border-r border-border pt-4 px-3 space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === id
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-muted hover:text-text hover:bg-surface'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 pt-4 pr-6 pb-2 space-y-5 min-h-[300px]">
          {activeTab === 'app' && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-text">Study Defaults</h4>
              <Select
                label="Default Study Duration"
                value={String(settings.app.defaultStudyDuration)}
                onChange={(e) => settings.updateApp({ defaultStudyDuration: Number(e.target.value) })}
                options={[
                  { value: '15', label: '15 min' },
                  { value: '30', label: '30 min' },
                  { value: '45', label: '45 min' },
                  { value: '60', label: '60 min' },
                  { value: '90', label: '90 min' },
                  { value: '120', label: '2 hours' },
                ]}
              />
              <Input
                label="Reminder Days (comma separated)"
                value={settings.app.reminderDays.join(', ')}
                onChange={(e) => {
                  const days = e.target.value.split(',').map((s) => parseInt(s.trim())).filter((n) => !isNaN(n))
                  settings.updateApp({ reminderDays: days })
                }}
              />
              <hr className="border-border" />
              <h4 className="text-sm font-semibold text-text">Deadlines</h4>
              <Input
                label="Upcoming Deadline Window (days)"
                type="number"
                min={1}
                value={settings.app.upcomingDeadlineWindow}
                onChange={(e) => settings.updateApp({ upcomingDeadlineWindow: Number(e.target.value) })}
              />
              <hr className="border-border" />
              <h4 className="text-sm font-semibold text-text">Appearance</h4>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.app.darkMode}
                  onChange={(e) => settings.updateApp({ darkMode: e.target.checked })}
                  className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary/50"
                />
                <span className="text-sm text-text">Dark Mode</span>
              </label>
              <hr className="border-border" />
              <h4 className="text-sm font-semibold text-text">Follow-up Reminders</h4>
              <Input
                label="Days without update before flagging"
                type="number"
                min={1}
                max={90}
                value={settings.app.followUpDays}
                onChange={(e) => settings.updateApp({ followUpDays: Number(e.target.value) })}
              />
              <hr className="border-border" />
              <h4 className="text-sm font-semibold text-text">Behavior</h4>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.app.confirmBeforeDelete}
                  onChange={(e) => settings.updateApp({ confirmBeforeDelete: e.target.checked })}
                  className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary/50"
                />
                <span className="text-sm text-text">Confirm before deleting items</span>
              </label>
            </div>
          )}

          {activeTab === 'scraper' && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-text">Question Scraper</h4>
              <Input
                label="Source Label"
                value={settings.scraper.sourceLabel}
                onChange={(e) => settings.updateScraper({ sourceLabel: e.target.value })}
                placeholder="e.g. Web Search"
              />
              <Select
                label="Scrape Delay"
                value={String(settings.scraper.scrapeDelayMs)}
                onChange={(e) => settings.updateScraper({ scrapeDelayMs: Number(e.target.value) })}
                options={[
                  { value: '0', label: 'Instant (no delay)' },
                  { value: '500', label: '0.5s' },
                  { value: '1000', label: '1s' },
                  { value: '1500', label: '1.5s' },
                  { value: '3000', label: '3s' },
                ]}
              />
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-text">Application Tracking</h4>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.applications.showTerminalStages}
                  onChange={(e) => settings.updateApplications({ showTerminalStages: e.target.checked })}
                  className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary/50"
                />
                <span className="text-sm text-text">Show Rejected / Withdrawn columns in Kanban</span>
              </label>
              <p className="text-xs text-text-muted">
                When disabled, rejected and withdrawn applications are hidden from the board but still stored.
              </p>
            </div>
          )}

          {activeTab === 'ai' && <AiSettingsTab />}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-text">Data Management</h4>
              <div className="bg-surface rounded-lg border border-border p-4 space-y-3">
                <p className="text-sm text-text">Clear all app data from localStorage</p>
                <p className="text-xs text-text-muted">This will reset topics, applications, study sessions, deadlines, questions, and settings to defaults. This cannot be undone.</p>
                {showClearConfirm ? (
                  <div className="flex items-center gap-3">
                    <Button variant="danger" size="sm" onClick={() => { onClearData?.(); setShowClearConfirm(false); onClose() }}>
                      <Trash2 className="w-3.5 h-3.5" /> Confirm Clear All Data
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setShowClearConfirm(true)}>
                    <Trash2 className="w-3.5 h-3.5" /> Clear All Data
                  </Button>
                )}
              </div>
              <hr className="border-border" />
              <h4 className="text-sm font-semibold text-text">Reset Settings</h4>
              <Button variant="secondary" size="sm" onClick={() => { settings.resetAll(); onClose() }}>
                <RefreshCw className="w-3.5 h-3.5" /> Reset to Defaults
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}