# Kanban Job Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add pipeline visibility via a Dashboard widget, pipeline metrics on the Applications page, and drag-and-drop stage advancement on the Kanban board.

**Architecture:** All changes are additive â€” new components in `src/features/pipeline/`, modifications to existing components. No new types, stores, or storage keys. The `useApplicationStore` already provides `applications`, `updateStage`, `getByStage`.

**Tech Stack:** React 19, Zustand 5, TypeScript 5, Tailwind CSS 4, Vitest 3 + @testing-library/react, HTML5 Drag-and-Drop API

---

## File Structure

### New files
| File | Responsibility |
|---|---|
| `src/features/pipeline/PipelineWidget.tsx` | Dashboard widget: horizontal proportional bar, quick-advance mini-cards, pipeline stats line, empty state |
| `src/features/pipeline/PipelineMetrics.tsx` | Metrics row: avg time per stage, conversion rates between adjacent stages |
| `src/features/pipeline/__tests__/PipelineWidget.test.tsx` | Unit tests for PipelineWidget |
| `src/features/pipeline/__tests__/PipelineMetrics.test.tsx` | Unit tests for PipelineMetrics |
| `src/features/pipeline/index.ts` | Barrel export for PipelineWidget and PipelineMetrics |

### Modified files
| File | Changes |
|---|---|
| `src/features/applications/ApplicationCard.tsx` | Add `draggable="true"`, `onDragStart`, `onDragEnd`, reduced opacity when dragging |
| `src/features/applications/ApplicationList.tsx` | Add `onDragOver`/`onDragLeave`/`onDrop` to each stage column div, highlight on drag-over |
| `src/pages/DashboardPage.tsx` | Add `<PipelineWidget onTabChange={onTabChange} />` to the top grid row |
| `src/pages/ApplicationsPage.tsx` | Add `<PipelineMetrics />` between `ApplicationSearchBar` and `ApplicationList` |

### Data flow
```
useApplicationStore
  â”œâ”€â”€ applications â”€â”€â–º PipelineWidget (bar widths, stats, mini-cards)
  â”‚                   â””â”€â”€ PipelineMetrics (avg time, conversion rates)
  â”œâ”€â”€ updateStage â”€â”€â”€â–º PipelineWidget (quick-advance button onClick)
  â”‚                   â””â”€â”€ ApplicationList (onDrop handler)
  â””â”€â”€ getByStage â”€â”€â”€â”€â–º (used only if needed for direct lookups)
```

---

### Task 1: Create PipelineWidget component

**Files:**
- Create: `src/features/pipeline/PipelineWidget.tsx`
- Create: `src/features/pipeline/index.ts`
- Test: `src/features/pipeline/__tests__/PipelineWidget.test.tsx`

This component renders on the DashboardPage. It needs:
- A next-stage lookup map (local constant `STAGE_NEXT_MAP`) for the quick-advance logic
- Terminal stages are rejected/withdrawn
- Proportional bar segments: each active stage gets a colored segment whose width = `(count in stage / total non-terminal) * 100` as percentage
- Quick-advance mini-cards: up to 3 apps from the latest non-terminal stages (phone_screen, technical_interview, onsite). Each card: company, role, stage dot, ">" button calling updateStage(id, nextStage). Hidden for 'offer' stage.
- Pipeline stats line: "X in pipeline | Y offers | Avg stage time: Z.Zd"
- Empty state: message + CTA navigating to Applications page

Stage order constants needed:
- NON_TERMINAL_STAGES = wishlist, applied, phone_screen, online_assessment, technical_interview, onsite, offer
- STAGE_NEXT_MAP: wishlist->applied, applied->phone_screen, phone_screen->online_assessment, online_assessment->technical_interview, technical_interview->onsite, onsite->offer
- QUICK_ADVANCE_STAGES = phone_screen, technical_interview, onsite
- 'offer' has no next stage entry â€” the ">" button is hidden

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/pipeline/__tests__/PipelineWidget.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PipelineWidget } from '../PipelineWidget'

const mockApplications = vi.hoisted(() => [])
const mockUpdateStage = vi.hoisted(() => vi.fn())

vi.mock('@/stores/applicationStore', () => ({
  useApplicationStore: (selector: any) => {
    const state = {
      applications: mockApplications,
      updateStage: mockUpdateStage,
      getByStage: (stage: string) => mockApplications.filter((a: any) => a.stage === stage),
    }
    return selector(state)
  },
}))

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: (selector: any) => selector({
    applications: { showTerminalStages: false },
    app: { followUpDays: 7 },
  }),
}))

describe('PipelineWidget', () => {
  beforeEach(() => {
    mockApplications.length = 0
    mockUpdateStage.mockClear()
  })

  it('renders empty state when no applications', () => {
    render(<PipelineWidget onTabChange={vi.fn()} />)
    expect(screen.getByText(/no applications in your pipeline/i)).toBeTruthy()
  })

  it('renders the CTA button that calls onTabChange', () => {
    const onTabChange = vi.fn()
    render(<PipelineWidget onTabChange={onTabChange} />)
    const cta = screen.getByRole('button', { name: /go to applications/i })
    fireEvent.click(cta)
    expect(onTabChange).toHaveBeenCalledWith('applications')
  })

  it('renders proportional bar segments', () => {
    mockApplications.push(
      { id: '1', company: 'Co', role: 'Dev', stage: 'applied', updatedAt: '2026-05-01T00:00:00Z' },
      { id: '2', company: 'Co2', role: 'Dev2', stage: 'applied', updatedAt: '2026-05-02T00:00:00Z' },
      { id: '3', company: 'Co3', role: 'Dev3', stage: 'phone_screen', updatedAt: '2026-05-03T00:00:00Z' },
    )
    render(<PipelineWidget onTabChange={vi.fn()} />)
    expect(screen.getByText(/3 in pipeline/i)).toBeTruthy()
    expect(screen.queryByText(/no applications in your pipeline/i)).toBeNull()
  })

  it('shows quick-advance mini-cards for latest stages', () => {
    mockApplications.push(
      { id: '10', company: 'Alpha', role: 'Engineer', stage: 'technical_interview', updatedAt: '2026-05-04T00:00:00Z' },
    )
    render(<PipelineWidget onTabChange={vi.fn()} />)
    expect(screen.getByText('Alpha')).toBeTruthy()
    expect(screen.getByText('Engineer')).toBeTruthy()
  })

  it('calls updateStage when quick-advance button is clicked', () => {
    mockApplications.push(
      { id: '99', company: 'Beta', role: 'Dev', stage: 'phone_screen', updatedAt: '2026-05-05T00:00:00Z' },
    )
    render(<PipelineWidget onTabChange={vi.fn()} />)
    const advanceButtons = screen.getAllByRole('button', { name: '>' })
    expect(advanceButtons.length).toBeGreaterThan(0)
    fireEvent.click(advanceButtons[0])
    expect(mockUpdateStage).toHaveBeenCalledWith('99', 'online_assessment')
  })

  it('hides quick-advance button for offer stage', () => {
    mockApplications.push(
      { id: '50', company: 'Gamma', role: 'Sr Dev', stage: 'offer', updatedAt: '2026-05-06T00:00:00Z' },
    )
    render(<PipelineWidget onTabChange={vi.fn()} />)
    const advanceButtons = screen.queryAllByRole('button', { name: '>' })
    expect(advanceButtons.length).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd job-hunt-dashboard && npx vitest run src/features/pipeline/__tests__/PipelineWidget.test.tsx
```
Expected: FAIL â€” module not found for `../PipelineWidget`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/features/pipeline/PipelineWidget.tsx
import { useMemo } from 'react'
import { ArrowRight, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useApplicationStore } from '@/stores/applicationStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { STAGE_LABELS, STAGE_COLORS } from '@/types/application'
import type { ApplicationStage } from '@/types/application'

const NON_TERMINAL_STAGES: ApplicationStage[] = [
  'wishlist', 'applied', 'phone_screen', 'online_assessment',
  'technical_interview', 'onsite', 'offer',
]

const STAGE_NEXT_MAP: Partial<Record<ApplicationStage, ApplicationStage>> = {
  wishlist: 'applied',
  applied: 'phone_screen',
  phone_screen: 'online_assessment',
  online_assessment: 'technical_interview',
  technical_interview: 'onsite',
  onsite: 'offer',
}

const QUICK_ADVANCE_STAGES: ApplicationStage[] = [
  'phone_screen', 'technical_interview', 'onsite',
]

function daysInStage(updatedAt: string): number {
  const diff = Date.now() - new Date(updatedAt).getTime()
  return Math.max(0, Math.round((diff / (1000 * 60 * 60 * 24)) * 10) / 10)
}

interface PipelineWidgetProps {
  onTabChange?: (tab: string) => void
}

export function PipelineWidget({ onTabChange }: PipelineWidgetProps) {
  const applications = useApplicationStore((s) => s.applications)
  const updateStage = useApplicationStore((s) => s.updateStage)
  const showTerminalStages = useSettingsStore((s) => s.applications.showTerminalStages)

  const { pipelineApps, stats, stageCounts, totalPipeline } = useMemo(() => {
    const pipeline = showTerminalStages
      ? applications
      : applications.filter((a) => a.stage !== 'rejected' && a.stage !== 'withdrawn')
    const counts: Record<string, number> = {}
    for (const app of pipeline) counts[app.stage] = (counts[app.stage] || 0) + 1
    const total = pipeline.length
    const offerCount = pipeline.filter((a) => a.stage === 'offer').length

    let totalDays = 0
    let daysCounted = 0
    for (const app of pipeline) {
      if (app.stage !== 'offer' && app.stage !== 'wishlist') {
        totalDays += daysInStage(app.updatedAt)
        daysCounted++
      }
    }
    const avgDays = daysCounted > 0 ? Math.round((totalDays / daysCounted) * 10) / 10 : 0

    return {
      pipelineApps: pipeline,
      stats: { total, offerCount, avgDays },
      stageCounts: counts,
      totalPipeline: total,
    }
  }, [applications, showTerminalStages])

  const quickAdvanceApps = useMemo(
    () => pipelineApps.filter((a) => QUICK_ADVANCE_STAGES.includes(a.stage)).slice(0, 3),
    [pipelineApps],
  )

  const stagesWithApps = useMemo(
    () => NON_TERMINAL_STAGES.filter((s) => stageCounts[s] > 0),
    [stageCounts],
  )

  if (pipelineApps.length === 0) {
    return (
      <Card title="Pipeline Overview">
        <div className="flex flex-col items-center justify-center py-8 text-text-muted gap-3">
          <BarChart3 className="w-8 h-8 opacity-30" />
          <p className="text-sm">No applications in your pipeline yet</p>
          <Button size="sm" onClick={() => onTabChange?.('applications')}>
            Go to Applications
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card title="Pipeline Overview">
      <div className="space-y-3">
        {/* Horizontal proportional bar */}
        <div className="flex h-3 rounded-full overflow-hidden">
          {stagesWithApps.map((stage) => {
            const pct = Math.round((stageCounts[stage] / totalPipeline) * 100)
            if (pct < 1) return null
            return (
              <div
                key={stage}
                className="cursor-pointer transition-opacity hover:opacity-80"
                style={{ width: `${pct}%`, backgroundColor: STAGE_COLORS[stage] }}
                title={`${STAGE_LABELS[stage]}: ${stageCounts[stage]}`}
                onClick={() => onTabChange?.('applications')}
              />
            )
          })}
        </div>

        {/* Pipeline stats line */}
        <p className="text-xs text-text-muted">
          {stats.total} in pipeline
          {stats.offerCount > 0 && ` | ${stats.offerCount} offers`}
          {stats.avgDays > 0 && ` | Avg stage time: ${stats.avgDays}d`}
        </p>

        {/* Quick-advance mini-cards */}
        {quickAdvanceApps.length > 0 && (
          <div className="space-y-1.5">
            {quickAdvanceApps.map((app) => {
              const nextStage = STAGE_NEXT_MAP[app.stage]
              return (
                <div
                  key={app.id}
                  className="flex items-center justify-between bg-surface rounded-lg px-3 py-2 border border-border"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STAGE_COLORS[app.stage] }} />
                    <div className="min-w-0">
                      <p className="text-sm text-text truncate">{app.company}</p>
                      <p className="text-xs text-text-muted truncate">{app.role}</p>
                    </div>
                  </div>
                  {nextStage && (
                    <button
                      type="button"
                      onClick={() => updateStage(app.id, nextStage)}
                      className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-text hover:bg-surface-2 transition-colors"
                      title={`Advance to ${STAGE_LABELS[nextStage]}`}
                    >
                      <ArrowRight className="w-3.5 h-3.5" aria-label=">" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd job-hunt-dashboard && npx vitest run src/features/pipeline/__tests__/PipelineWidget.test.tsx
```
Expected: PASS â€” all tests green

- [ ] **Step 5: Create barrel export**

```typescript
// src/features/pipeline/index.ts
export { PipelineWidget } from './PipelineWidget'
export { PipelineMetrics } from './PipelineMetrics'
```

- [ ] **Step 6: Commit**

```bash
git add src/features/pipeline/PipelineWidget.tsx src/features/pipeline/__tests__/PipelineWidget.test.tsx src/features/pipeline/index.ts
git commit -m "feat: add PipelineWidget component for dashboard pipeline visibility"
```

---

### Task 2: Create PipelineMetrics component

**Files:**
- Create: `src/features/pipeline/PipelineMetrics.tsx`
- Test: `src/features/pipeline/__tests__/PipelineMetrics.test.tsx`

This component renders on the ApplicationsPage above the Kanban board. It shows two columns of metrics:
- **Avg time per stage**: For each stage with applications, compute average days since updatedAt. Show top 5 stages sorted by avg days descending. Each row: stage label, proportional bar, numeric label.
- **Conversion rates**: For adjacent stage pairs (wishlistâ†’applied, appliedâ†’phone_screen, etc.), compute `count(to) / count(from) * 100`. Show as success-color bar with percentage. Only show pairs where source stage has >= 1 app.

All metrics derived in useMemo from useApplicationStore. Returns null when no applications exist.

- [ ] **Step 1: Write the failing test**

```typescript
// src/features/pipeline/__tests__/PipelineMetrics.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PipelineMetrics } from '../PipelineMetrics'

const mockApplications = vi.hoisted(() => [])
vi.mock('@/stores/applicationStore', () => ({
  useApplicationStore: (selector: any) => {
    const state = { applications: mockApplications }
    return selector(state)
  },
}))

describe('PipelineMetrics', () => {
  beforeEach(() => { mockApplications.length = 0 })

  it('renders nothing when no applications exist', () => {
    const { container } = render(<PipelineMetrics />)
    expect(container.innerHTML).toBe('')
  })

  it('shows avg time per stage', () => {
    mockApplications.push(
      { id: '1', company: 'Co', role: 'R', stage: 'applied', updatedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: '2', company: 'Co2', role: 'R2', stage: 'phone_screen', updatedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
    )
    render(<PipelineMetrics />)
    expect(screen.getByText(/applied/i)).toBeTruthy()
    expect(screen.getByText(/phone screen/i)).toBeTruthy()
  })

  it('shows conversion rate progress bars', () => {
    mockApplications.push(
      { id: '1', company: 'Co', role: 'R', stage: 'applied', updatedAt: '2026-05-01T00:00:00Z' },
      { id: '2', company: 'Co2', role: 'R2', stage: 'applied', updatedAt: '2026-05-02T00:00:00Z' },
      { id: '3', company: 'Co3', role: 'R3', stage: 'phone_screen', updatedAt: '2026-05-03T00:00:00Z' },
    )
    render(<PipelineMetrics />)
    expect(screen.getByText(/50%/)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd job-hunt-dashboard && npx vitest run src/features/pipeline/__tests__/PipelineMetrics.test.tsx
```
Expected: FAIL -- module not found for `../PipelineMetrics`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/features/pipeline/PipelineMetrics.tsx
import { useMemo } from 'react'
import { APPLICATION_STAGES, STAGE_LABELS } from '@/types/application'
import type { ApplicationStage } from '@/types/application'
import { useApplicationStore } from '@/stores/applicationStore'

function daysSince(iso: string): number {
  const diff = Date.now() - new Date(iso).getTime()
  return Math.round((diff / (1000 * 60 * 60 * 24)) * 10) / 10
}

const STAGE_PAIRS = [
  { from: 'wishlist' as const, to: 'applied' as const },
  { from: 'applied' as const, to: 'phone_screen' as const },
  { from: 'phone_screen' as const, to: 'online_assessment' as const },
  { from: 'online_assessment' as const, to: 'technical_interview' as const },
  { from: 'technical_interview' as const, to: 'onsite' as const },
  { from: 'onsite' as const, to: 'offer' as const },
]

export function PipelineMetrics() {
  const applications = useApplicationStore((s) => s.applications)

  const { stageMetrics, conversionMetrics, maxAvgDays } = useMemo(() => {
    const counts: Record<string, number> = {}
    const days: Record<string, number> = {}
    for (const app of applications) {
      counts[app.stage] = (counts[app.stage] || 0) + 1
      days[app.stage] = (days[app.stage] || 0) + daysSince(app.updatedAt)
    }

    const sorted = APPLICATION_STAGES
      .filter((s) => (counts[s] || 0) > 0)
      .map((stage) => ({
        stage,
        label: STAGE_LABELS[stage],
        avgDays: Math.round((days[stage] / counts[stage]) * 10) / 10,
        count: counts[stage],
      }))
      .sort((a, b) => b.avgDays - a.avgDays)
      .slice(0, 5)

    const conversions = STAGE_PAIRS
      .filter((p) => (counts[p.from] || 0) > 0)
      .map((p) => ({
        from: p.from, to: p.to,
        fromLabel: STAGE_LABELS[p.from], toLabel: STAGE_LABELS[p.to],
        rate: Math.round(((counts[p.to] || 0) / counts[p.from]) * 100),
      }))

    const max = sorted.length > 0 ? sorted[0].avgDays : 1
    return { stageMetrics: sorted, conversionMetrics: conversions, maxAvgDays: max }
  }, [applications])

  if (applications.length === 0) return null

  return (
    <div className="mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface rounded-lg border border-border p-3">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2 font-medium">Avg Time per Stage</p>
          <div className="space-y-1.5">
            {stageMetrics.length === 0 && <p className="text-xs text-text-muted text-center py-2">No stage data yet</p>}
            {stageMetrics.map((m) => (
              <div key={m.stage} className="flex items-center gap-2">
                <span className="text-xs text-text w-28 shrink-0 truncate">{m.label}</span>
                <div className="flex-1 bg-surface-2 rounded-full h-2">
                  <div className="h-2 rounded-full bg-primary/60" style={{ width: `${Math.max(2, (m.avgDays / maxAvgDays) * 100)}%` }} />
                </div>
                <span className="text-xs text-text-muted w-14 text-right shrink-0">{m.avgDays}d</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface rounded-lg border border-border p-3">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2 font-medium">Conversion Rates</p>
          <div className="space-y-1.5">
            {conversionMetrics.length === 0 && <p className="text-xs text-text-muted text-center py-2">No conversion data yet</p>}
            {conversionMetrics.map((m) => (
              <div key={m.from} className="flex items-center gap-2">
                <span className="text-xs text-text w-16 shrink-0 truncate">{m.fromLabel}</span>
                <div className="flex-1 bg-surface-2 rounded-full h-2">
                  <div className="h-2 rounded-full bg-success" style={{ width: `${m.rate}%` }} />
                </div>
                <span className="text-xs text-text-muted w-10 text-right shrink-0">{m.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd job-hunt-dashboard && npx vitest run src/features/pipeline/__tests__/PipelineMetrics.test.tsx
```
Expected: PASS -- all tests green

- [ ] **Step 5: Commit**

```bash
git add src/features/pipeline/PipelineMetrics.tsx src/features/pipeline/__tests__/PipelineMetrics.test.tsx
git commit -m "feat: add PipelineMetrics component for stage time and conversion rates"
```

---

### Task 3: Modify ApplicationCard to support dragging

**Files:**
- Modify: `src/features/applications/ApplicationCard.tsx`

Changes:
- Add `useState` import, `isDragging` local state
- Root div gets `draggable="true"`, `onDragStart` (stores id + stage in dataTransfer), `onDragEnd` (clears isDragging)
- When `isDragging` is true, `opacity-50` class is added

- [ ] **Step 1: Write the modified ApplicationCard**

```typescript
// src/features/applications/ApplicationCard.tsx
import { useState } from 'react'
import { Building2, Bell } from 'lucide-react'
import type { JobApplication } from '@/types/application'
import { STAGE_LABELS, STAGE_COLORS } from '@/types/application'

interface ApplicationCardProps {
  application: JobApplication
  onClick: () => void
  staleDays?: number
}

export function ApplicationCard({ application, onClick, staleDays }: ApplicationCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const isStale = staleDays !== undefined && staleDays > 0

  return (
    <div
      draggable="true"
      onClick={onClick}
      onDragStart={(e) => {
        e.dataTransfer.setData('applicationId', application.id)
        e.dataTransfer.setData('sourceStage', application.stage)
        setIsDragging(true)
      }}
      onDragEnd={() => setIsDragging(false)}
      className={`bg-surface-2 border rounded-lg p-3 cursor-pointer transition-colors relative ${
        isStale ? 'border-warning/50 hover:border-warning' : 'border-border hover:border-primary/50'
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      {isStale && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-warning">
          <Bell className="w-3 h-3" />
          <span>{staleDays}d</span>
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text truncate">{application.company}</p>
          <p className="text-xs text-text-muted truncate">{application.role}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_COLORS[application.stage] }} />
            <span className="text-xs text-text-muted">{STAGE_LABELS[application.stage]}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build compiles**

```bash
cd job-hunt-dashboard && npx tsc --noEmit
```
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/features/applications/ApplicationCard.tsx
git commit -m "feat: add draggable support to ApplicationCard"
```
---

### Task 4: Modify ApplicationList to support drop zones

**Files:**
- Modify: `src/features/applications/ApplicationList.tsx`

Changes to the existing ApplicationList:
- Add `useState` import and `dragOverStage: ApplicationStage | null` state
- Each stage column div gets `onDragOver` (preventDefault + set dragOverStage), `onDragLeave` (clear if target), `onDrop` (read applicationId from dataTransfer, call updateStage, clear state)
- Visual: when `dragOverStage === stage`, column gets `border border-primary/50 bg-primary/5`; otherwise `border border-transparent`

- [ ] **Step 1: Write the modified ApplicationList**

The changes are additive to the existing file. Key modifications:
1. Add `useState` to import
2. Add `ApplicationStage` to imports
3. Add `[dragOverStage, setDragOverStage] = useState<ApplicationStage | null>(null)`
4. Each column div gets handlers + conditional border/bg classes
5. onDrop: `const appId = e.dataTransfer.getData('applicationId'); if (appId) updateStage(appId, stage); setDragOverStage(null)`

Full modified file:

```typescript
// src/features/applications/ApplicationList.tsx
import { useMemo, useState } from 'react'
import { useApplicationStore } from '@/stores/applicationStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ApplicationCard } from './ApplicationCard'
import { APPLICATION_STAGES, STAGE_LABELS, STAGE_COLORS } from '@/types/application'
import { daysUntil } from '@/lib/utils'
import type { ApplicationStage } from '@/types/application'

export function ApplicationList({ search = '' }: { search?: string }) {
  const applications = useApplicationStore((s) => s.applications)
  const updateStage = useApplicationStore((s) => s.updateStage)
  const deleteApplication = useApplicationStore((s) => s.deleteApplication)
  const showTerminalStages = useSettingsStore((s) => s.applications.showTerminalStages)
  const followUpDays = useSettingsStore((s) => s.app.followUpDays)
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [dragOverStage, setDragOverStage] = useState<ApplicationStage | null>(null)

  const activeStages = useMemo(() => {
    if (showTerminalStages) return APPLICATION_STAGES
    return APPLICATION_STAGES.filter((s) => s !== 'rejected' && s !== 'withdrawn')
  }, [showTerminalStages])

  const filtered = useMemo(() => {
    if (!search.trim()) return applications
    const q = search.toLowerCase()
    return applications.filter((a) =>
      a.company.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q) ||
      a.notes.toLowerCase().includes(q)
    )
  }, [applications, search])

  return (
    <div>
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
        {activeStages.map((stage) => {
          const stageApps = useMemo(() => filtered.filter((a) => a.stage === stage), [filtered, stage])
          const isOver = dragOverStage === stage
          return (
            <div
              key={stage}
              className={`min-w-[220px] flex-shrink-0 rounded-lg transition-all ${
                isOver ? 'border border-primary/50 bg-primary/5' : 'border border-transparent'
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverStage(stage)
              }}
              onDragLeave={() => {
                if (dragOverStage === stage) setDragOverStage(null)
              }}
              onDrop={(e) => {
                e.preventDefault()
                const appId = e.dataTransfer.getData('applicationId')
                if (appId) updateStage(appId, stage)
                setDragOverStage(null)
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage] }} />
                <span className="text-sm font-medium text-text">{STAGE_LABELS[stage]}</span>
                <span className="text-xs text-text-muted">{stageApps.length}</span>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {stageApps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onClick={() => { setSelectedApp(app.id); setShowEditForm(true) }}
                    staleDays={(() => {
                      const d = Math.max(0, -daysUntil(app.updatedAt.slice(0, 10)))
                      return d >= followUpDays ? d : undefined
                    })()}
                  />
                ))}
                {stageApps.length === 0 && (
                  <div className="text-xs text-text-muted/50 text-center py-6 border border-dashed border-border rounded-lg">
                    No applications
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={showEditForm && !!selectedApp} onClose={() => { setShowEditForm(false); setSelectedApp(null) }} title="Application Details">
        {selectedApp && (() => {
          const app = applications.find((a) => a.id === selectedApp)
          if (!app) return null
          return (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-bold text-text">{app.company}</p>
                <p className="text-sm text-text-muted">{app.role}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Stage</p>
                <select
                  value={app.stage}
                  onChange={(e) => updateStage(app.id, e.target.value as any)}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text"
                >
                  {APPLICATION_STAGES.map((s) => (
                    <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              {app.notes && (
                <div>
                  <p className="text-xs text-text-muted mb-1">Notes</p>
                  <p className="text-sm text-text bg-surface rounded-lg p-3">{app.notes}</p>
                </div>
              )}
              <div className="flex justify-between pt-2">
                <Button variant="danger" size="sm" onClick={() => { deleteApplication(app.id); setShowEditForm(false) }}>
                  Delete
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowEditForm(false)}>Close</Button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
```

- [ ] **Step 2: Verify build compiles**

```bash
cd job-hunt-dashboard && npx tsc --noEmit
```
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/features/applications/ApplicationList.tsx
git commit -m "feat: add drop zone support to ApplicationList stage columns"
```

---

### Task 5: Integrate PipelineWidget into DashboardPage

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

Add `<PipelineWidget onTabChange={onTabChange} />` to the top of the Dashboard, in the first grid row alongside ConfidenceRadar and Today's Study. Since DashboardPage already has a 2-column grid (`grid-cols-1 lg:grid-cols-2`), we need to change the layout:

- Replace the single 2-column first grid row with a 3-column layout: PipelineWidget in column 1 (spanning 1), then ConfidenceRadar + Today's Study side-by-side in columns 2-3
- Or more simply: add PipelineWidget as a full-width section above the existing first grid row

Simplest approach: insert PipelineWidget above the existing grid rows as a full-width element. This avoids disrupting the existing 2-column grid layout.

- [ ] **Step 1: Modify DashboardPage**

Add the PipelineWidget import and render it as a full-width section above the first grid row:

```typescript
// Add to imports at top:
import { PipelineWidget } from '@/features/pipeline'

// Insert after <StatsBar onStatClick={onTabChange} /> and before the first grid:
{PipelineWidget && (
  <PipelineWidget onTabChange={onTabChange} />
)}
```

The full file after changes:

```typescript
// src/pages/DashboardPage.tsx
import { useMemo } from 'react'
import { BookOpen, Briefcase, Clock, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfidenceRadar } from '@/components/charts/ConfidenceRadar'
import { DeadlineList } from '@/features/deadlines/DeadlineList'
import { TimelineView } from '@/features/deadlines/TimelineView'
import { StatsBar } from '@/components/layout/StatsBar'
import { PipelineWidget } from '@/features/pipeline'
import { useTopicStore } from '@/stores/topicStore'
import { useStudyStore } from '@/stores/studyStore'
import { useQuestionStore } from '@/stores/questionStore'
import { formatDuration } from '@/lib/utils'
import type { TabType } from '@/components/layout/Sidebar'

export function DashboardPage({ onTabChange }: { onTabChange?: (tab: TabType) => void }) {
  const topics = useTopicStore((s) => s.topics)
  const sessions = useStudyStore((s) => s.sessions)
  const acceptedQuestions = useQuestionStore((s) => s.acceptedQuestions)
  const getTotalMinutesToday = useStudyStore((s) => s.getTotalMinutesToday)
  const getTotalMinutesThisWeek = useStudyStore((s) => s.getTotalMinutesThisWeek)

  const todayMinutes = getTotalMinutesToday()
  const weekMinutes = getTotalMinutesThisWeek()
  const todaySessions = useMemo(() => sessions.filter((s) => s.date === new Date().toISOString().slice(0, 10)), [sessions])

  const recentQuestions = useMemo(() => {
    const all: { text: string; difficulty: string; type: string; topicName: string }[] = []
    for (const [topicId, qs] of Object.entries(acceptedQuestions)) {
      const topic = topics.find((t) => t.id === topicId)
      for (const q of qs) {
        all.push({ text: q.text, difficulty: q.difficulty, type: q.type, topicName: topic?.name || 'Unknown' })
      }
    }
    return all.reverse().slice(0, 5)
  }, [acceptedQuestions, topics])

  return (
    <div className="space-y-6">
      <StatsBar onStatClick={onTabChange} />

      <PipelineWidget onTabChange={onTabChange} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div onClick={() => onTabChange?.('topics')} className="cursor-pointer">
          <Card title="Confidence Overview">
            <ConfidenceRadar />
          </Card>
        </div>
        <Card title="Today's Study">
          <div onClick={() => onTabChange?.('study')}>
            {todaySessions.length > 0 ? (
              <div className="space-y-2">
                {todaySessions.slice(0, 5).map((s) => {
                  const topic = topics.find((t) => t.id === s.topicId)
                  return (
                    <div key={s.id} className="flex items-center justify-between bg-surface rounded-lg p-2.5 cursor-pointer hover:border-primary/50 transition-colors border border-transparent">
                      <span className="text-sm text-text">{topic?.name || 'Unknown'}</span>
                      <span className="text-xs text-text-muted">{formatDuration(s.durationMinutes)}</span>
                    </div>
                  )
                })}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-text-muted">Today: {formatDuration(todayMinutes)}</span>
                  <span className="text-xs text-text-muted">Week: {formatDuration(weekMinutes)}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-text-muted gap-3 cursor-pointer">
                <Clock className="w-8 h-8 opacity-30" />
                <p className="text-sm">No study sessions logged today -- click to log one</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Upcoming Deadlines">
          <DeadlineList onNavigate={onTabChange} />
        </Card>
        <Card title="Deadline Timeline">
          <TimelineView onNavigate={onTabChange} />
        </Card>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Button variant="secondary" className="h-20 flex-col gap-1" onClick={() => onTabChange?.('topics')}>
          <BookOpen className="w-5 h-5" />
          <span className="text-xs">Add Topic</span>
        </Button>
        <Button variant="secondary" className="h-20 flex-col gap-1" onClick={() => onTabChange?.('topics')}>
          <Sparkles className="w-5 h-5" />
          <span className="text-xs">Scrape Questions</span>
        </Button>
        <Button variant="secondary" className="h-20 flex-col gap-1" onClick={() => onTabChange?.('applications')}>
          <Briefcase className="w-5 h-5" />
          <span className="text-xs">Log Application</span>
        </Button>
        <Button variant="secondary" className="h-20 flex-col gap-1" onClick={() => onTabChange?.('study')}>
          <Clock className="w-5 h-5" />
          <span className="text-xs">Log Study</span>
        </Button>
      </div>

      {recentQuestions.length > 0 && (
        <Card title="Recent Accepted Questions">
          <div className="space-y-2">
            {recentQuestions.map((q, i) => (
              <div key={i} className="bg-surface rounded-lg border border-border p-3 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onTabChange?.('topics')}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-text line-clamp-2">{q.text}</p>
                  <Badge variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'medium' ? 'warning' : 'danger'}>{q.difficulty}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-text-muted">{q.topicName}</span>
                  <Badge variant="info">{q.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build compiles**

```bash
cd job-hunt-dashboard && npx tsc --noEmit
```
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/DashboardPage.tsx
git commit -m "feat: integrate PipelineWidget into DashboardPage"
```

---

### Task 6: Integrate PipelineMetrics into ApplicationsPage

**Files:**
- Modify: `src/pages/ApplicationsPage.tsx`

Add `<PipelineMetrics />` between `<ApplicationSearchBar>` and `<ApplicationList>`.

- [ ] **Step 1: Modify ApplicationsPage**

```typescript
// src/pages/ApplicationsPage.tsx
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ApplicationList } from '@/features/applications/ApplicationList'
import { ApplicationForm } from '@/features/applications/ApplicationForm'
import { ApplicationSearchBar } from '@/features/applications/ApplicationSearchBar'
import { PipelineMetrics } from '@/features/pipeline'
import { useApplicationStore } from '@/stores/applicationStore'

export function ApplicationsPage() {
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const applications = useApplicationStore((s) => s.applications)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-muted">{applications.length} total applications</p>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Add Application
        </Button>
      </div>
      <div className="mb-4">
        <ApplicationSearchBar search={search} onSearchChange={setSearch} />
      </div>
      <PipelineMetrics />
      <ApplicationList search={search} />
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Application">
<ApplicationForm onClose={() => setShowForm(false)} />
      </Modal>
    </div>
  )
}
```

- [ ] **Step 2: Verify build compiles**

```bash
cd job-hunt-dashboard && npx tsc --noEmit
```
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/ApplicationsPage.tsx
git commit -m "feat: integrate PipelineMetrics into ApplicationsPage"
```

---

## Self-Review

### 1. Spec Coverage

Checking each section of the spec against plan tasks:

| Spec Section | Plan Task(s) | Status |
|---|---|---|
| PipelineWidget: horizontal proportional bar | Task 1 | Covered |
| PipelineWidget: quick-advance mini-cards | Task 1 | Covered |
| PipelineWidget: pipeline stats line | Task 1 | Covered |
| PipelineWidget: empty state with CTA | Task 1 | Covered |
| PipelineMetrics: avg time per stage | Task 2 | Covered |
| PipelineMetrics: conversion rates | Task 2 | Covered |
| PipelineMetrics: derived in useMemo | Task 2 | Covered |
| ApplicationCard: draggable, onDragStart, onDragEnd | Task 3 | Covered |
| ApplicationCard: opacity-50 when dragging | Task 3 | Covered |
| ApplicationList: onDragOver, onDragLeave, onDrop | Task 4 | Covered |
| ApplicationList: highlighted border when drag-over | Task 4 | Covered |
| DashboardPage: add PipelineWidget | Task 5 | Covered |
| ApplicationsPage: add PipelineMetrics | Task 6 | Covered |
| Edge case: empty pipeline | Task 1 (empty state) | Covered |
| Edge case: single application | Task 1 (bar renders 100% width) | Covered |
| Edge case: all apps terminal | Task 1 (filters by showTerminalStages) | Covered |
| Edge case: drag to same column | Handled by store's appsEqual optimization | Covered (no-op) |
| Edge case: quick advance beyond offer | Task 1 (STAGE_NEXT_MAP has no 'offer' entry, button hidden) | Covered |
| Edge case: touch devices | Not in plan (spec says limited mobile support, manual QA only) | Not covered by automated tests per spec |

**Gaps found:** None. All spec requirements map to a task.

### 2. Placeholder Scan

Checking for "TBD", "TODO", "implement later", "add appropriate error handling", "similar to above":

- All code blocks contain complete, compilable TypeScript
- No TODO or TBD markers present
- No vague descriptions ("handle edge cases", "add validation")
- Every step has actual code, not descriptions of what to write

**Issues found:** None.

### 3. Type Consistency

Checking that types, function names, and property names match across tasks:

- `useApplicationStore` â€” uses same selector pattern across all tasks (Task 1, 2, 3, 4)
- `updateStage(appId, stage)` â€” called the same way in Task 1 (quick-advance), Task 4 (onDrop), and matches the store's `updateStage: (id: string, stage: ApplicationStage) => void`
- `ApplicationStage` â€” imported from `@/types/application` in all tasks
- `STAGE_LABELS`, `STAGE_COLORS` â€” imported from `@/types/application` consistently
- `PipelineWidget` â€” exported from `PipelineWidget.tsx`, re-exported from `index.ts`, imported in DashboardPage as `import { PipelineWidget } from '@/features/pipeline'`
- `PipelineMetrics` â€” same pattern, imported in ApplicationsPage
- `onTabChange` â€” typed as `(tab: string) => void` in PipelineWidget props, passed from DashboardPage's `onTabChange?: (tab: TabType) => void` (TabType extends string, so compatible)
- `e.dataTransfer.setData('applicationId', ...)` / `e.dataTransfer.getData('applicationId')` â€” consistent key names in Task 3 and Task 4
- `ArrowRight` with `aria-label=">"` â€” matches test's `getAllByRole('button', { name: '>' })` pattern

**Issues found:** None.

---

**Plan complete.** Ready for execution.
