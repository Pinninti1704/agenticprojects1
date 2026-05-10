# Job Hunt Dashboard — Design Spec

## Overview

A single-page application (SPA) for job seekers to track interview preparedness across topics, manage job applications, log study sessions, and leverage an AI agent to curate interview questions. Built with React, TypeScript, and Tailwind CSS. Data persisted via localStorage with an API layer for future backend integration.

## Architecture

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | React 19 + TypeScript | Type safety, enterprise patterns |
| Build | Vite 8 | Fast HMR, ESBuild bundling |
| Styling | Tailwind CSS 4 | Utility-first, consistent design tokens |
| Charts | Recharts | Declarative, composable chart components |
| Icons | Lucide React | Consistent icon set, tree-shakeable |
| State | Zustand | Lightweight, TypeScript-first, no boilerplate |
| Persistence | localStorage + API service layer | Offline-first, swappable backend |
| Accessibility | WAI-ARIA, focus management | Enterprise compliance |
| Testing | Vitest + Testing Library | Component + integration tests |
| Linting | ESLint + Prettier | Enforce consistent code style |

### Project Structure

```
job-hunt-dashboard/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── src/
│   ├── main.tsx                     # Entry point
│   ├── App.tsx                      # Root layout + routing
│   ├── index.css                    # Tailwind directives + design tokens
│   │
│   ├── components/                  # Shared UI components
│   │   ├── ui/                      # Atomic components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   └── Toast.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx          # Navigation sidebar
│   │   │   ├── Header.tsx           # Top bar with stats
│   │   │   └── StatsBar.tsx         # Summary stat cards
│   │   └── charts/
│   │       ├── ConfidenceRadar.tsx
│   │       ├── StudyTimeChart.tsx
│   │       └── ApplicationFunnel.tsx
│   │
│   ├── pages/                       # Route-level pages
│   │   ├── DashboardPage.tsx        # Overview + stats + charts
│   │   ├── TopicsPage.tsx           # Topic management + materials
│   │   ├── ApplicationsPage.tsx     # Application pipeline
│   │   ├── StudyLogPage.tsx         # Study logging + calendar heatmap
│   │   └── AnalyticsPage.tsx        # In-depth analytics
│   │
│   ├── features/                    # Feature modules (domain logic)
│   │   ├── topics/
│   │   │   ├── TopicList.tsx
│   │   │   ├── TopicDetail.tsx
│   │   │   ├── TopicForm.tsx
│   │   │   ├── MaterialList.tsx
│   │   │   └── MaterialForm.tsx
│   │   ├── questions/
│   │   │   ├── QuestionScraperPanel.tsx   # AI agent trigger + status
│   │   │   ├── QuestionReviewQueue.tsx    # Accept/Reject workflow
│   │   │   └── QuestionList.tsx
│   │   ├── applications/
│   │   │   ├── ApplicationList.tsx
│   │   │   ├── ApplicationCard.tsx
│   │   │   └── ApplicationForm.tsx
│   │   ├── study/
│   │   │   ├── StudySessionForm.tsx
│   │   │   ├── StudyCalendar.tsx
│   │   │   └── StreakDisplay.tsx
│   │   └── deadlines/
│   │       ├── DeadlineList.tsx
│   │       ├── DeadlineCountdown.tsx
│   │       └── TimelineView.tsx
│   │
│   ├── stores/                      # Zustand state stores
│   │   ├── topicStore.ts
│   │   ├── applicationStore.ts
│   │   ├── studyStore.ts
│   │   ├── questionStore.ts
│   │   └── deadlineStore.ts
│   │
│   ├── services/                    # API + data layer
│   │   ├── storage.ts              # localStorage abstraction
│   │   ├── questionScraper.ts      # AI agent / scraping service
│   │   └── api.ts                  # Future backend API client
│   │
│   ├── types/                       # TypeScript type definitions
│   │   ├── topic.ts
│   │   ├── application.ts
│   │   ├── study.ts
│   │   ├── question.ts
│   │   └── deadline.ts
│   │
│   └── lib/                         # Utility functions
│       ├── constants.ts
│       ├── utils.ts
│       └── formatters.ts
```

## Data Model

### Core Types

```typescript
// Topics
interface TopicCategory {
  id: string;
  name: string;
  icon: string;
}

interface Topic {
  id: string;
  categoryId: string;
  name: string;
  confidence: 1 | 2 | 3 | 4 | 5;
  materials: StudyMaterial[];
  acceptedQuestions: InterviewQuestion[];
  deadline?: Deadline;
  createdAt: string;
  updatedAt: string;
}

interface StudyMaterial {
  id: string;
  type: 'article' | 'video' | 'book' | 'course' | 'note' | 'link';
  title: string;
  url?: string;
  notes: string;
  createdAt: string;
}

// Interview Questions (scraped)
interface ScrapedQuestionSet {
  id: string;
  topicId: string;
  source: string;
  questions: InterviewQuestion[];
  status: 'pending_review' | 'accepted' | 'rejected';
  scrapedAt: string;
}

interface InterviewQuestion {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'technical' | 'behavioral' | 'situational' | 'coding';
  source?: string;
  hints?: string[];
}

// Deadlines
interface Deadline {
  topicId: string;
  dueDate: string; // ISO date
  status: 'active' | 'completed' | 'overdue' | 'rescheduled';
  reminderDays: number[];
}

// Applications
interface JobApplication {
  id: string;
  company: string;
  role: string;
  stage: ApplicationStage;
  stageOrder: ApplicationStage[];
  notes: string;
  nextFollowUp?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

type ApplicationStage =
  | 'wishlist'
  | 'applied'
  | 'phone_screen'
  | 'online_assessment'
  | 'technical_interview'
  | 'onsite'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

// Study Sessions
interface StudySession {
  id: string;
  topicId: string;
  durationMinutes: number;
  notes: string;
  date: string; // ISO date
}

// Streaks
interface StreakData {
  current: number;
  longest: number;
  log: string[]; // dates studied
}
```

## Page-by-Page Design

### 1. Dashboard Page

The landing page showing a high-level snapshot.

**Layout:**
- Stats bar across top (4 cards: Topics Covered, Active Applications, Study Streak, Avg Confidence)
- Left column: Confidence radar chart + Topic coverage progress bars
- Right column: Upcoming deadlines countdown + Recent study activity feed
- Bottom: Quick actions row ("Log Study", "Add Topic", "Scrape Questions", "Add Application")

**Enterprise considerations:**
- Skeleton loading states for each section
- Empty states with CTAs for first-time users
- Error boundaries per section

### 2. Topics Page

Full topic management with the AI question scraping workflow.

**Sections:**
- **Category sidebar** (left): Collapsible categories, click to filter
- **Topic list** (center): Cards showing name, confidence, progress bar, deadline countdown
- **Topic detail panel** (right, opens on click):
  - Confidence rating (1-5 star clicker)
  - Materials section (add/edit/remove links, notes, videos)
  - Questions section: "Scrape Questions" button → triggers AI agent
  - Review Queue: shows pending scraped question sets with Accept/Reject
  - Accepted questions display below with their deadline countdown
  - Deadline: "Set Deadline" button → date picker → countdown timer shown

**Question Scraping Flow:**
1. User clicks "Scrape Questions" on a topic
2. Modal shows: "Searching top sources for [topic] interview questions..."
3. Agent returns N questions → displayed in a review table
4. Each question row: text, difficulty badge, type badge, Accept/Reject buttons
5. User clicks "Accept All" or selects individually
6. Accepted → batch-add to topic → prompt: "Set a deadline to cover these?"
7. User picks a date → countdown starts

### 3. Applications Page

Kanban-style or list-view pipeline.

- Columns per stage (Wishlist → Applied → Phone Screen → OA → Technical → Onsite → Offer → Rejected)
- Cards: company name, role, date applied, next step
- Drag-to-move between stages (using HTML5 DnD or a lightweight library)
- "Add Application" button → form modal
- Each card clickable → detail view with full notes + timeline

### 4. Study Log Page

Daily study logging with calendar heatmap.

- Calendar heatmap (GitHub-style, 12 months)
- Below: List view of today's sessions + "Log Session" button
- Session form: topic selector, duration, notes
- Streak display: current streak, best streak, fire emoji for milestones
- Weekly summary stat cards

### 5. Analytics Page

Deep-dive charts.

- Confidence radar chart (all categories overlaid)
- Study time trend (line chart, daily/weekly/monthly)
- Application funnel (bar chart: applied → phone → interview → offer)
- Deadline calendar (month view showing due dates)
- Topic coverage pie chart

## Design System

### Theme

```css
/* Design Tokens */
--color-primary: #6366f1;        /* Indigo */
--color-primary-light: #818cf8;
--color-primary-dark: #4f46e5;
--color-success: #22c55e;
--color-warning: #f59e0b;
--color-danger: #ef4444;
--color-surface: #0f0d2e;       /* Dark navy */
--color-surface-2: #1e1b4b;     /* Lighter card */
--color-border: #312e81;
--color-text: #f8fafc;
--color-text-muted: #a5b4fc;
--font-family: 'Inter', system-ui, sans-serif;
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
```

- Dark theme default with light theme toggle
- Glassmorphism card style (backdrop-blur for overlays)
- Smooth transitions (200ms ease on interactions)
- Consistent 4px/8px/16px/24px/32px spacing scale

### Component Patterns

- All interactive elements support keyboard navigation (Tab, Enter, Escape)
- Focus visible ring styles for accessibility
- Tooltips for truncated text
- Toast notifications for actions (topic added, question accepted, deadline set)
- Confirmation dialogs for destructive actions (reject question set, delete topic)

## Data Flow

1. **Stores** (Zustand) are the single source of truth
2. Components read from stores, dispatch actions to update them
3. Store actions persist to localStorage via `storage.ts` service
4. `storage.ts` provides CRUD abstraction — can be swapped to API calls later
5. `questionScraper.ts` is a service that wraps the AI agent call (fetches from a backend endpoint or simulates with local data)
6. Derive computed values (streaks, stats, percentages) via store selectors

## State Management

Each domain has its own Zustand store:

- `topicStore`: topics, categories, materials, CRUD
- `questionStore`: scraped question sets, review queue, accept/reject
- `applicationStore`: applications, stages, CRUD
- `studyStore`: study sessions, streak calculation
- `deadlineStore`: deadlines, overdue detection, countdown logic

Cross-store interactions (e.g., accepting questions → creating a deadline) handled via store action composition — one store's action calls another store's action.

## Implementation Plan

### Phase 1: Foundation (Day 1)
1. Scaffold Vite + React + TypeScript + Tailwind project
2. Build design system (CSS tokens, base components: Button, Card, Badge, Input, Modal, Toast)
3. Set up Zustand stores with localStorage persistence
4. Build layout shell (Sidebar + Header + StatsBar + content area)
5. Define all TypeScript types

### Phase 2: Core Features (Days 2-3)
6. Dashboard page (stats + radar chart + deadlines + recent activity)
7. Topics page (categories, topic CRUD, confidence rating, materials)
8. Question scraping UI + review queue (Accept/Reject workflow)
9. Deadline system (set, countdown, overdue detection)

### Phase 3: Applications & Study (Days 3-4)
10. Applications page (kanban pipeline, CRUD, stage management)
11. Study Log page (session logging, calendar heatmap, streak tracking)

### Phase 4: Analytics & Polish (Day 4-5)
12. Analytics page (all charts)
13. Responsive design pass
14. Accessibility audit
15. Edge case handling (empty states, error states, loading states)

## Security & Data

- All data stored client-side in localStorage
- No authentication (static SPA)
- Question scraper service will need rate limiting and source attribution
- Future: optional backend with JWT auth + PostgreSQL

## Constraints

- Pure client-side SPA (no backend required)
- Built in `job-hunt-dashboard/` at repo root
- Must work offline (data in localStorage)
- Must handle empty states, loading states, and error states everywhere