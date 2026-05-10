# Job Hunt Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade SPA for tracking interview preparedness, job applications, study sessions, and AI-curated interview questions.

**Architecture:** React 19 + TypeScript SPA. Zustand stores with localStorage persistence. Tailwind CSS 4 with custom design tokens. Recharts for data viz. Component architecture: atomic UI → feature modules → pages.

**Tech Stack:** React 19, TypeScript 5, Vite 8, Tailwind CSS 4, Zustand, Recharts, Lucide React, Vitest + Testing Library

**Location:** `c:\Users\satya\Localagent\free-claude-code\job-hunt-dashboard`

---

### Task 1: Scaffold Vite + React + TypeScript + Tailwind

**Files:** `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `src/index.css`

- [ ] **Step 1: Create project directory**

```bash
mkdir -p "c:\Users\satya\Localagent\free-claude-code\job-hunt-dashboard\src"
```

- [ ] **Step 2: Write package.json**

```json
{
  "name": "job-hunt-dashboard",
  "private": true, "version": "0.1.0", "type": "module",
  "scripts": {
    "dev": "vite", "build": "tsc -b && vite build", "preview": "vite preview",
    "lint": "eslint .", "test": "vitest run", "test:watch": "vitest"
  },
  "dependencies": {
    "lucide-react": "^0.487.0", "react": "^19.2.5", "react-dom": "^19.2.5",
    "recharts": "^3.8.1", "zustand": "^5.0.4"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.0", "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0", "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3", "@vitejs/plugin-react": "^6.0.1",
    "jsdom": "^26.0.0", "tailwindcss": "^4.1.0", "typescript": "~5.8.3",
    "vite": "^8.0.10", "vitest": "^3.1.0"
  }
}
```

- [ ] **Step 3: Write tsconfig files** — `tsconfig.json` references, `tsconfig.app.json` (strict, paths `@/*` → `./src/*`), `tsconfig.node.json`

- [ ] **Step 4: Write vite.config.ts** — plugins: `react()`, `tailwindcss()`, alias `@` → `./src`

- [ ] **Step 5: Write index.html** — standard Vite entry, title "HuntBoard — Job Interview Prep Dashboard"

- [ ] **Step 6: Write src/vite-env.d.ts** — `/// <reference types="vite/client" />`

- [ ] **Step 7: Write src/index.css** — `@import "tailwindcss"`, `@theme` block with custom colors (primary indigo, success green, danger red, surface navy, border indigo-900), body defaults

- [ ] **Step 8: Write src/main.tsx** — StrictMode + createRoot + App

- [ ] **Step 9: Write src/App.tsx** — minimal shell: `flex min-h-screen` layout with header

- [ ] **Step 10: Install deps and verify build**

```bash
cd "c:\Users\satya\Localagent\free-claude-code\job-hunt-dashboard"
npm install
npx tsc -b --noEmit && npx vite build
```

- [ ] **Step 11: Commit**

```bash
git add job-hunt-dashboard/ && git commit -m "feat: scaffold job-hunt-dashboard"
```

---

### Task 2: TypeScript types, constants, utilities

**Files:** `src/types/topic.ts`, `src/types/application.ts`, `src/types/study.ts`, `src/types/question.ts`, `src/types/deadline.ts`, `src/lib/constants.ts`, `src/lib/utils.ts`

- [ ] **Step 1: Create type files** with the exact interfaces from the design spec (Topic, TopicCategory, StudyMaterial, JobApplication, ApplicationStage, StudySession, StreakData, InterviewQuestion, ScrapedQuestionSet, Deadline, etc.)

- [ ] **Step 2: Write src/lib/constants.ts** — `DEFAULT_CATEGORIES`, `APPLICATION_STAGES`, `STAGE_LABELS`, `STAGE_COLORS`, `STUDY_TIME_SLOTS`

- [ ] **Step 3: Write src/lib/utils.ts** — `generateId()`, `todayISO()`, `nowISO()`, `daysUntil()`, `isOverdue()`, `clamp()`

- [ ] **Step 4: Verify**

```bash
npx tsc -b --noEmit
git add src/types/ src/lib/ && git commit -m "feat: add types, constants, utils"
```

---

### Task 3: Storage service + Zustand stores

**Files:** `src/services/storage.ts`, `src/stores/topicStore.ts`, `src/stores/applicationStore.ts`, `src/stores/studyStore.ts`, `src/stores/questionStore.ts`, `src/stores/deadlineStore.ts`

- [ ] **Step 1: Write src/services/storage.ts** — generic `loadFromStorage<T>(key, fallback)` and `saveToStorage<T>(key, data)` functions wrapping localStorage with JSON parse/stringify

- [ ] **Step 2: Write topicStore.ts** — Zustand store with state `{ topics: Topic[], categories: TopicCategory[] }`, actions `addTopic`, `updateTopic`, `deleteTopic`, `updateConfidence`, `addMaterial`, `removeMaterial`. Auto-save to localStorage on state change.

- [ ] **Step 3: Write applicationStore.ts** — state `{ applications: JobApplication[] }`, actions `addApplication`, `updateApplication`, `deleteApplication`, `updateStage`. Auto-save.

- [ ] **Step 4: Write studyStore.ts** — state `{ sessions: StudySession[], streak: StreakData }`, actions `addSession`, computed selectors `getStreak()`, `getTotalTimeThisWeek()`. Auto-save.

- [ ] **Step 5: Write questionStore.ts** — state `{ questionSets: ScrapedQuestionSet[], acceptedQuestions: Record<string, InterviewQuestion[]> }`, actions `addQuestionSet`, `acceptQuestionSet`, `rejectQuestionSet`, `acceptSingleQuestion`. Auto-save.

- [ ] **Step 6: Write deadlineStore.ts** — state `{ deadlines: Deadline[] }`, actions `setDeadline`, `completeDeadline`, `rescheduleDeadline`, computed `getOverdue()`, `getUpcoming()`. Auto-save.

- [ ] **Step 7: Verify compilation and commit**

---

### Task 4: Atomic UI components

**Files:** `src/components/ui/Button.tsx`, `Card.tsx`, `Modal.tsx`, `Badge.tsx`, `ProgressBar.tsx`, `Input.tsx`, `Textarea.tsx`, `Toast.tsx`

- [ ] **Step 1: Button.tsx** — variants: `primary`, `secondary`, `ghost`, `danger`; sizes: `sm`, `md`, `lg`; loading state with spinner; disabled state; full-width option. TypeScript props: `ButtonProps extends ButtonHTMLAttributes`

- [ ] **Step 2: Card.tsx** — glassmorphism card with `surface-2` bg, `border` border, `rounded-lg`, padded. Props: `title?`, `actions?` (header right area), `children`

- [ ] **Step 3: Modal.tsx** — portal-based overlay with backdrop, Escape key closes, focus trap, animation. Props: `open`, `onClose`, `title`, `children`, `footer?`

- [ ] **Step 4: Badge.tsx** — small pill with color variants for confidence levels, difficulty, types. Props: `variant: 'success' | 'warning' | 'danger' | 'info' | 'default'`

- [ ] **Step 5: ProgressBar.tsx** — horizontal bar with label, percentage, color based on value. Props: `value` (0-100), `label?`, `size?: 'sm' | 'md'`

- [ ] **Step 6: Input.tsx + Textarea.tsx** — styled inputs with label, error state, dark theme. Props extend native input/textarea.

- [ ] **Step 7: Toast.tsx** — notification system. ToastProvider context, useToast() hook. Auto-dismiss after 3s. Types: success, error, info. Fixed bottom-right positioning.

- [ ] **Step 8: Verify no TS errors and commit**

---

### Task 5: Layout shell — Sidebar, Header, StatsBar

**Files:** `src/components/layout/Sidebar.tsx`, `Header.tsx`, `StatsBar.tsx`, modify `src/App.tsx`

- [ ] **Step 1: Sidebar.tsx** — Vertical nav with icon + label items: Dashboard, Topics, Applications, Study Log, Analytics. Active state highlighting. Logo at top with "HuntBoard" brand. Uses `lucide-react` icons. Props: `activeTab`, `onTabChange`.

- [ ] **Step 2: Header.tsx** — Top bar with page title matching active tab, right side empty (for future actions).

- [ ] **Step 3: StatsBar.tsx** — 4 summary cards grid. Each card: icon, label, value. All values computed from store selectors. Topics Covered (completed/total), Active Applications, Study Streak, Avg Confidence.

- [ ] **Step 4: Wire layout in App.tsx** — Tab state management. Sidebar left (w-64), Header top, content area with StatsBar at top of each page. Render correct page component based on `activeTab`.

- [ ] **Step 5: Verify and commit**

---

### Task 6: Dashboard page

**Files:** `src/pages/DashboardPage.tsx`, `src/components/charts/ConfidenceRadar.tsx`

- [ ] **Step 1: ConfidenceRadar.tsx** — Recharts RadarChart with 5 axes (one per category). Fill with primary color at 0.2 opacity, stroke primary. Data computed from topicStore (average confidence per category).

- [ ] **Step 2: DashboardPage.tsx** — Grid layout: left column (radar chart + recent deadlines list), right column (recent study activity + quick actions buttons). Empty states for new users with CTA buttons. StatsBar shown at top.

- [ ] **Step 3: Read store data, display real values throughout. Verify and commit.**

---

### Task 7: Topics page with materials

**Files:** `src/pages/TopicsPage.tsx`, `src/features/topics/TopicList.tsx`, `TopicDetail.tsx`, `TopicForm.tsx`, `MaterialList.tsx`, `MaterialForm.tsx`

- [ ] **Step 1: TopicForm.tsx** — Modal form with: category select, name input, optional initial confidence. Calls `addTopic` from store.

- [ ] **Step 2: TopicList.tsx** — Left sidebar listing categories as collapsible groups. Each topic shown as a row with name, confidence badge, progress bar. Click to select.

- [ ] **Step 3: TopicDetail.tsx** — Right panel shown on topic selection. Sections: confidence star-rating (click to set 1-5), materials list, questions section (delegated to QuestionList + ScraperPanel), deadline section.

- [ ] **Step 4: MaterialList.tsx + MaterialForm.tsx** — List study materials with type icon, title, url. Add form as inline or modal with type dropdown, title, url, notes.

- [ ] **Step 5: TopicsPage.tsx** — Three-column layout: category sidebar | topic list | topic detail. Wire together. Empty state when no topic selected.

- [ ] **Step 6: Verify and commit**

---

### Task 8: Question scraping + review queue

**Files:** `src/features/questions/QuestionScraperPanel.tsx`, `QuestionReviewQueue.tsx`, `QuestionList.tsx`

- [ ] **Step 1: QuestionScraperPanel.tsx** — Button "Scrape Questions" → triggers simulated scraping (generates sample questions since this is client-side). Shows loading state with animation. On completion, adds questions as pending_review set to questionStore.

- [ ] **Step 2: QuestionReviewQueue.tsx** — Table of pending question sets. Each row: source, count, status. Expand to see individual questions. "Accept All", "Reject All", or accept/reject individually. On accept → prompt for deadline.

- [ ] **Step 3: QuestionList.tsx** — Display accepted questions for a topic. Group by difficulty. Show type badges. Expand to see hints.

- [ ] **Step 4: Wire into TopicDetail.tsx** — Show ScraperPanel + ReviewQueue + QuestionList in the questions section.

- [ ] **Step 5: Verify and commit**

---

### Task 9: Deadline system

**Files:** `src/features/deadlines/DeadlineList.tsx`, `DeadlineCountdown.tsx`, `TimelineView.tsx`

- [ ] **Step 1: DeadlineCountdown.tsx** — Large countdown timer showing days/hours remaining. Color changes: green (>7 days), yellow (3-7 days), red (<3 days). Shows "OVERDUE" in red when past due.

- [ ] **Step 2: DeadlineList.tsx** — List of all deadlines with topic name, due date, countdown, status badge. Sort by urgency. "Mark Complete" and "Reschedule" buttons.

- [ ] **Step 3: TimelineView.tsx** — Simple horizontal timeline showing upcoming deadlines as milestones. Show today marker.

- [ ] **Step 4: Wire deadline creation into TopicDetail** — After accepting questions, show date picker → creates deadline. Deadline countdown shown on topic card.

- [ ] **Step 5: Verify and commit**

---

### Task 10: Applications page (kanban pipeline)

**Files:** `src/pages/ApplicationsPage.tsx`, `src/features/applications/ApplicationList.tsx`, `ApplicationCard.tsx`, `ApplicationForm.tsx`

- [ ] **Step 1: ApplicationForm.tsx** — Modal form: company, role, stage select, notes textarea, follow-up date, URL. Validation: company and role required.

- [ ] **Step 2: ApplicationCard.tsx** — Compact card: company name, role, stage badge, date. Stage color dot on left border.

- [ ] **Step 3: ApplicationList.tsx** — Horizontal scrollable kanban columns: one per stage. Each column shows cards for that stage. Empty column state.

- [ ] **Step 4: ApplicationsPage.tsx** — "Add Application" button in header. Kanban layout. Click card to edit stage or details. Stats summary at top (total, by stage counts).

- [ ] **Step 5: Verify and commit**

---

### Task 11: Study Log page

**Files:** `src/pages/StudyLogPage.tsx`, `src/features/study/StudySessionForm.tsx`, `StudyCalendar.tsx`, `StreakDisplay.tsx`

- [ ] **Step 1: StudyCalendar.tsx** — GitHub-style calendar heatmap. 12 months of squares. Color intensity based on study minutes that day. Current month highlighted.

- [ ] **Step 2: StreakDisplay.tsx** — Current streak count with fire icon, best streak below, progress bar to next milestone (7, 14, 21, 30 days).

- [ ] **Step 3: StudySessionForm.tsx** — Inline form: topic select (from topics store), duration quick-select buttons (15, 30, 45, 60, 90, 120 min) or custom input, notes textarea.

- [ ] **Step 4: StudyLogPage.tsx** — Top: calendar heatmap. Below left: streak + weekly stats. Below right: today's sessions list + "Log Session" button. Empty state for no sessions.

- [ ] **Step 5: Verify and commit**

---

### Task 12: Analytics page

**Files:** `src/pages/AnalyticsPage.tsx`, `src/components/charts/StudyTimeChart.tsx`, `ApplicationFunnel.tsx`

- [ ] **Step 1: StudyTimeChart.tsx** — Recharts LineChart. X-axis: last 30 days. Y-axis: minutes studied. Smooth line with gradient fill. Tooltip shows date + minutes.

- [ ] **Step 2: ApplicationFunnel.tsx** — Recharts BarChart. X-axis: stage names (applied → phone → OA → interview → onsite → offer). Y-axis: count per stage. Decreasing bars in primary color gradient.

- [ ] **Step 3: AnalyticsPage.tsx** — Grid: top row (radar chart + funnel chart), bottom row (study time line chart + deadline calendar). All charts read from stores. Empty state fallbacks.

- [ ] **Step 4: Verify and commit**

---

## Self-Review Checks

1. **Spec coverage:** Every section from the spec has a corresponding task: scaffold (T1), types (T2), stores (T3), UI kit (T4), layout (T5), dashboard (T6), topics + materials (T