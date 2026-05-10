# Agent Features Enterprise Refinement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Upgrade 4 AI agent features (MockInterview, StoryBank, LinkedInOutreach, JobScanner) to enterprise-grade: AI service layer, accessibility, data integrity, analytics, settings integration.

**Architecture:** Extract mock AI into `AiProvider` interface. Error boundaries per feature. Settings + analytics wired into all features.

**Tech Stack:** React 19, Zustand 5, TypeScript 5, Tailwind CSS, lucide-react

---

### Task 1: Types & Settings — Add new types and settings fields
- **Files:** `src/types/agent.ts`, `src/types/settings.ts`, `src/stores/settingsStore.ts`
- Add `AnswerScore`, `StarScore`, `OutreachEntry`, `ScannedJob`, `OutreachParams`, `OutreachVariant` interfaces to agent types
- Add 7 AI settings fields to AppSettings (agentProvider, mockInterviewTimedMode, mockInterviewQuestionCount, mockInterviewTimeLimit, storyAutoScore, outreachDefaultTone, jobScannerAutoExtract)
- Add defaults to settings store
- Build check + commit

### Task 2: Analytics Store — Create event tracking store
- **Files:** Create `src/stores/analyticsStore.ts`
- Zustand store with `events: AnalyticsEvent[]`, `trackEvent(name, metadata)`, `getEventsByDate(date)`, `getEventsByName(name)`, `clear()`
- Persisted to localStorage key `huntboard-analytics`
- Build check + commit

### Task 3: AI Service Layer — Interface, mock provider, and factory
- **Files:** Create `src/services/ai/types.ts`, `src/services/ai/mockProvider.ts`, `src/services/ai/index.ts`
- `AiProvider` interface with 7 methods: generateInterviewQuestions, generateFeedback, generateStarStory, scoreStarStory, generateOutreachMessage, analyzeJobMatch, generateResumeBullets
- `MockAiProvider` class: 30-question pool, 70+ skill lexicon, 20-term technical glossary, 8 STAR archetypes. Seeded PRNG. Keyword-based scoring and matching.
- Factory `createAiProvider(type)` with singleton instances per type
- Build check + commit

### Task 4: Error Boundary + Agent Store Extension
- **Files:** Create `src/components/layout/ErrorFallback.tsx`, Modify `src/stores/agentStore.ts`
- ErrorFallback component with title, message, retry button, clear data button
- Agent store gains: outreachMessages[], scannedJobs[], storyFavorites[], addOutreachMessage, updateOutreachStatus, addScannedJob, deleteScannedJob, toggleStoryFavorite, updateStory
- Build check + commit

### Task 5: Settings Panel — Add AI/Agent tab
- **Files:** Create `src/features/settings/AiSettingsTab.tsx`, Modify `src/features/settings/SettingsPanel.tsx`, Modify `src/types/settings.ts`
- Add 'ai' to SettingsTab union. Create AiSettingsTab with all 7 settings fields. Wire into SettingsPanel tabs.
- Build check + commit

### Task 6: MockInterview — Full rewrite with service layer
- **Files:** Rewrite `src/features/agent/MockInterview.tsx`
- Use AiProvider for question generation + feedback (returns AnswerScore with per-dimension scores)
- Timed countdown mode from settings. Session search/filter. Markdown/JSON export. Keyboard nav (Ctrl+Enter/Shift+Enter). Auto-focus on question change. Analytics events.
- Wrap in ErrorBoundary with ErrorFallback

### Task 7: StoryBank — Full rewrite with service layer
- **Files:** Rewrite `src/features/agent/StoryBank.tsx`
- Use AiProvider for story generation + STAR scoring. Inline editing (click S/T/A/R to edit). Search/filter/sort. Favorites. Bulk select/delete/export. STAR quality score bars.
- Analytics events. ErrorBoundary wrapper.

### Task 8: LinkedInOutreach — Full rewrite with service layer
- **Files:** Rewrite `src/features/agent/LinkedInOutreach.tsx`
- Use AiProvider for message generation (3 variants). Tone selector. Deep personalization fields. Connection tracking with status funnel. Follow-up reminders. Character counters (300/2000). CSV export.
- Analytics events. ErrorBoundary wrapper.

### Task 9: JobScanner — Full rewrite with service layer
- **Files:** Rewrite `src/features/agent/JobScanner.tsx`
- Use AiProvider for match analysis + resume bullets. Skill frequency bar chart (CSS, no library). Resume textarea + auto-extract skills. Critical vs nice-to-have gap analysis. Deterministic role scoring. History with restore/compare. Export JSON/Markdown. Resume bullet suggestions per missing critical skill.
- Analytics events. ErrorBoundary wrapper.

---

## Self-Review

**Spec coverage check:**
- Task 1 covers all new types and settings fields from spec
- Task 2 covers analytics store spec requirement
- Task 3 covers AI service layer (types, mock provider, factory)
- Task 4 covers error boundaries + store extensions for outreach/scanned jobs/favorites
- Task 5 covers settings panel AI tab
- Task 6 covers MockInterview: question bank, structured scoring, timed mode, session history, export, keyboard nav
- Task 7 covers StoryBank: inline editing, rich AI generation, search/filter, favorites, bulk ops, STAR quality scoring
- Task 8 covers LinkedInOutreach: tone selector, deep personalization, variants, connection tracking, follow-ups, char limits, CSV export
- Task 9 covers JobScanner: skill frequency, resume parsing, critical/nice-to-have gaps, deterministic matching, history, export, resume bullets

**No placeholders** — all types, interfaces, and method signatures are explicit.

**Type consistency:** AiProvider method signatures match types/agent.ts interfaces. Settings fields match both settings.ts and settingsStore.ts defaults. Store action names match agentStore.ts extensions.