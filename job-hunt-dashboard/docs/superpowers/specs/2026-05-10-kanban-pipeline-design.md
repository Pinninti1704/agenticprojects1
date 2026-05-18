# Kanban Job Pipeline Design

## Overview

Add pipeline visibility to the job hunt dashboard via two touchpoints: a compact Dashboard widget showing pipeline state with quick-advance, and drag-and-drop + metrics enhancements on the existing Applications page. No new sidebar tabs, no new data model, no new storage keys.

## Architecture

All changes are additive — new components in `src/features/pipeline/`, modifications to existing components in `src/features/applications/` and `src/pages/`. The ApplicationStore (`useApplicationStore`) already provides everything needed: `applications`, `updateStage`, `getByStage`.

## Components

### PipelineWidget (new)

Location: `src/features/pipeline/PipelineWidget.tsx`

Rendered on DashboardPage in the top grid row alongside Confidence Radar and Today's Study.

Contents:
- **Horizontal pipeline bar**: A row of colored segments, one per active stage, where each segment's width is proportional to the number of applications in that stage. Each segment is clickable — clicking navigates to the Applications page (via `onTabChange('applications')`). Terminal stages (rejected/withdrawn) are excluded unless `showTerminalStages` setting is enabled.
- **Quick-advance mini-cards**: Shows up to 3 applications from the latest non-terminal stages (technical_interview, onsite, phone_screen). Each mini-card shows company, role, stage color dot. A ">" button on each card calls `updateStage(appId, nextStage)`. If the app is in "offer" (last non-terminal stage), the button is hidden.
- **Pipeline stats line**: "12 in pipeline | 3 offers | Avg stage time: 4.2d" — computed from store data.
- **Empty state**: "No applications in your pipeline yet" with a CTA button that navigates to the Applications page.

### PipelineMetrics (new)

Location: `src/features/pipeline/PipelineMetrics.tsx`

Rendered on ApplicationsPage above the Kanban board (between `ApplicationSearchBar` and `ApplicationList`).

Contents:
- **Avg time per stage**: For each stage that has applications, compute average days since `updatedAt`. Show top 5 stages with data.
- **Conversion rates**: For each adjacent stage pair (e.g., phone_screen → technical_interview), compute `count(stage=N+1) / count(stage=N) * 100`. Show as a micro-progress bar with percentage label.
- All metrics are derived in `useMemo` from `useApplicationStore` — no additional state or storage.

### ApplicationList (modified)

Changes to `src/features/applications/ApplicationList.tsx`:
- Each stage column `<div>` becomes a drop target:
  - `onDragOver`: `e.preventDefault()` + set a visual state flag
  - `onDragLeave`: clear the visual state flag
  - `onDrop`: read `applicationId` and `sourceStage` from `e.dataTransfer`, call `updateStage(applicationId, thisColumnStage)`
- When a column is the active drop target, it gets a highlighted border (`border-primary/50 + bg-primary/5`)

### ApplicationCard (modified)

Changes to `src/features/applications/ApplicationCard.tsx`:
- Add `draggable="true"` attribute
- Add `onDragStart`: store application ID and current stage in `e.dataTransfer`
- Add `onDragEnd`: remove visual drag state
- When dragging, the card gets reduced opacity (`opacity-50`)

### DashboardPage (modified)

- Add `<PipelineWidget onTabChange={onTabChange} />` to the top grid row

### ApplicationsPage (modified)

- Add `<PipelineMetrics />` between `<ApplicationSearchBar>` and `<ApplicationList>`

## Data Model

No changes. All data is already in `useApplicationStore`.

## Edge Cases

- **Empty pipeline**: PipelineWidget shows empty state with CTA button
- **Single application**: Bar renders as a single full-width segment; mini-cards show the single app
- **All apps terminal**: PipelineWidget shows terminal stages only if `showTerminalStages` enabled, else empty state
- **Drag to same column**: `updateStage` is a no-op (Stage A → Stage A), and the store's `appsEqual` optimization skips re-render
- **Quick advance beyond offer**: No next stage — button is hidden for apps in "offer" stage
- **Touch devices**: HTML5 drag-and-drop has limited mobile support. Added `onTouchStart`/`onTouchEnd` handlers as a polyfill (stores dragged element in a ref, triggers drop logic on touchend over the target column)
- **Terminal stage drag**: Apps can still be dragged to/from rejected/withdrawn — no restrictions, the user decides

## Testing

- PipelineWidget: unit test with mocked store — verify bar renders correct widths, quick-advance fires `updateStage`, empty state renders without data
- PipelineMetrics: unit test with known stage distribution — verify conversion rates and avg time calculations
- Drag-and-drop: manual QA, no automated tests for drag interaction

## Files Changed

| File | Action |
|---|---|
| `src/features/pipeline/PipelineWidget.tsx` | Create |
| `src/features/pipeline/PipelineMetrics.tsx` | Create |
| `src/features/applications/ApplicationList.tsx` | Modify (add drop zones) |
| `src/features/applications/ApplicationCard.tsx` | Modify (add draggable) |
| `src/pages/DashboardPage.tsx` | Modify (add PipelineWidget) |
| `src/pages/ApplicationsPage.tsx` | Modify (add PipelineMetrics) |