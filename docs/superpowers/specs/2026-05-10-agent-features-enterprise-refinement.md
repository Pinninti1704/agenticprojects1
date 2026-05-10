# Agent Features — Enterprise Refinement Spec

> **Goal:** Upgrade 4 AI agent features (MockInterview, StoryBank, LinkedInOutreach, JobScanner) from prototype-level to enterprise-grade maturity: proper architecture, accessibility, data integrity, analytics integration, and real-AI-ready service layer.

**Architecture:** Extract all mock AI logic into an `AiProvider` service interface with mock fallback. Version localStorage with migration support. Add error boundaries per feature. Wire settings store into all configurable behavior. Wire analytics store into all user actions.

**Tech Stack:** React 19, Zustand 5, TypeScript 5, Tailwind CSS, localforage (upgraded storage), lucide-react icons.

---

## Cross-Cutting Architecture

### AI Service Layer

```
src/services/ai/
  types.ts          — AiProvider interface, AiRequest/AiResponse types
  mockProvider.ts   — Existing rule-based mock implementations
  index.ts          — Export factory: createAiProvider(type) returns AiProvider
```

```typescript
interface AiProvider {
  generateInterviewQuestions(jdTitle: string): Promise<InterviewQuestion[]>
  generateFeedback(question: string, answer: string): Promise<AnswerFeedback>
  generateStarStory(prompt: string): Promise<Omit<StarStory, 'id' | 'createdAt'>>
  generateOutreachMessage(params: OutreachParams): Promise<OutreachVariant[]>
  analyzeJobMatch(jdText: string, resumeText: string): Promise<JobMatchResult>
}

type AiProviderType = 'mock' | 'openai' | 'nim'
```

Components call `createAiProvider()` at init. The provider type is read from `useSettingsStore`. All components remain identical whether using mock or real AI.

### Versioned Storage

Current localStorage keys (`huntboard-questions`, `huntboard-settings`, etc.) get a version suffix: `huntboard-agent-v1`. Storage service auto-detects old versions and runs migration functions.

```
src/services/storage.ts — Add:
  - getItemWithMigration<T>(key, version, migrations)
  - exportAll() → JSON blob
  - importAll(json) → validate + write
```

### Error Boundaries

One error boundary per agent feature sub-tab. Each shows:
- Friendly error message with feature name
- "Retry" button that resets feature state
- "Clear data" button for corruption scenarios

### Analytics Integration

Every user action (interview started, answer submitted, story created, message generated, job scanned) calls `useAnalyticsStore().trackEvent(name, metadata)`.

```typescript
// analytics store gets a new method
trackEvent: (name: string, metadata?: Record<string, string | number>) => void
```

Events are stored in localStorage keyed by date, viewable in Analytics page as "Agent Activity" chart.

### Settings Store Integration

New settings added to `AppSettings`:
```typescript
interface AppSettings {
  // ...existing...
  agentProvider: 'mock' | 'openai' | 'nim'
  mockInterviewTimedMode: boolean
  mockInterviewQuestionCount: 3 | 6 | 10
  mockInterviewTimeLimit: number  // seconds per question
  storyAutoScore: boolean
  outreachDefaultTone: 'professional' | 'warm' | 'direct'
  jobScannerAutoExtract: boolean
}
```

---

## MockInterview Refinements

### Question Bank Expansion
- Replace 6 hardcoded questions with `InterviewQuestionPool` service containing 30+ questions across types (behavioral 10, technical 10, coding 5, situational 5)
- Each question has: `id, question, type, difficulty, category, keywords[]`
- `generateQuestions(jdTitle, count)` selects `count` questions using seeded PRNG based on JD title (deterministic per title)
- Categories from JD parsing: data structures, system design, frontend, backend, ML, behavioral

### Structured Answer Scoring
- `scoreAnswer(question, answer): AnswerScore`
- Evaluates: **Structure** (does it follow a framework), **Depth** (technical vocabulary presence), **Quantifiable** (numbers/dates/metrics mentioned), **Overall** (weighted composite)
- Returns per-dimension score (1-10) and specific improvement suggestion per dimension
- Mock implementation: keyword-based analysis with regex patterns for numbers, STAR-indicators ("situation", "task", etc.), technical glossary matching

### Timed Mode
- When `mockInterviewTimedMode` is enabled in settings, a countdown timer appears per question
- Visual color shift: normal → yellow at 60s → red at 30s
- Auto-submits when timer hits 0 (graceful: saves what's typed)
- Pause between questions (configurable: 15/30/60s)

### Session History
- Past sessions searchable by JD title substring
- Filter: all / completed / in-progress
- Sort: date (newest/oldest), progress

### Export
- Completed interview → "Download as Markdown" button
- Format: `# Mock Interview: {title}\n\n## Q1: {question}\n**Answer:** {answer}\n**Feedback:** {feedback}\n...`
- Completed interview → "Download as JSON" for re-import

### Keyboard Navigation
- Focus first textarea on question load
- Ctrl+Enter: Submit answer
- Ctrl+Shift+Enter: Skip question
- Escape: Cancel/close panels
- Tab order: textarea → skip → submit

---

## StoryBank Refinements

### Inline Editing
- Click any S/T/A/R/reflection text to enter edit mode
- Textarea replaces read-only text on click
- Save/Cancel buttons appear inline
- Escape cancels, Ctrl+Enter saves

### Rich AI Generation
- Expanded archetype detection: leadership, conflict-resolution, delivery, incident-response, mentorship, architecture-decision, customer-impact, optimization, innovation, cross-functional
- Uses multi-keyword clustering (matches against 3-5 keywords per archetype, requires 2+ matches)
- Generates more specific narratives per archetype (e.g., "incident-response" includes severity levels, timeline language)
- Fallback to generic if no archetype matches

### Search & Filter
- Search box (magnifying glass icon) filters stories across all text fields (S/T/A/R/reflection/tags)
- Tag filter: clickable tag chips, multi-select, OR logic (stories matching ANY selected tag)
- Sort: Newest / Oldest / Alphabetical / Highest Rated
- Empty search state: "No stories match your search" with clear-filter button

### Favorites
- Star icon on each story card
- Pinned stories render first in any list view
- Visual separator between pinned and unpinned
- Pin state persisted to store

### Bulk Operations
- Toggle "Select mode" button enables checkboxes on each card
- Shift+click range selection
- Select All / Deselect All buttons in selection bar
- Bulk actions: Delete (with confirm modal), Export as JSON, Tag selection with new tag

### STAR Quality Scoring
- `scoreStarStory(story): StarScore { situation, task, action, result, overall }`
- Evaluation dimensions per component:
  - **Situation**: Is the context specific? (company name, team size, timeline)
  - **Task**: Is the responsibility clear? (ownership language, scope)
  - **Action**: Is the contribution distinct? (active verbs, technical specifics)
  - **Result**: Is it quantified? (numbers, percentages, impact language)
- Visual: color-coded score bar (red < 3, yellow 3-7, green > 7) next to each component
- Overall score displayed as badge on card

---

## LinkedInOutreach Refinements

### Tone Selector
- Three tones: Professional (formal vocabulary, longer sentences), Warm (conversational, personal), Direct (concise, action-oriented)
- Tone changes sentence structure and vocabulary of generated messages
- Default tone configurable in settings store

### Deep Personalization
- Fields: Recipient name, Company name, Role title, Mutual connection name, Shared interest/group, Article reference
- Each field maps to specific insertion points in message templates
- Fields appear as a form section ("Personalization Details") toggled by an "Add Details" button
- All fields optional — graceful fallback to generic language

### Message Variants
- Each generate call produces 3 variants with different opening hooks
- Variants displayed in a tab/carousel UI
- User selects one to copy or rejects all to regenerate

### Connection Tracking
- New store slice: `outreachMessages: OutreachEntry[]`
- `OutreachEntry`: id, type, recipient, context, message, tone, createdAt, status (sent/replied/connected/booked), followUpDate
- Status update buttons on each sent message
- "Follow up" button generates a follow-up message variant
- Dashboard-style mini-funnel: Sent → Replied → Connected → Booked

### Follow-up Reminders
- Auto-calculated: `followUpDate = createdAt + settings.followUpDays`
- Messages due for follow-up have a visual badge ("Follow-up needed")
- "Generate follow-up" button opens variant picker pre-filled with context

### LinkedIn Character Limits
- Connection note: 300 character visual counter, red at 280+
- InMail/message: 2000 character counter
- Truncation warning when approaching limit
- Auto-truncate on copy with "..." appended

### CSV Export
- Download outreach history: Name, Type, Date, Status, Context, Message columns
- Format: UTF-8 BOM CSV for Excel compatibility

---

## JobScanner Refinements

### Skill Frequency Analysis
- Parse JD text for skill keyword frequency using a skill lexicon (100+ tech keywords with variants)
- Display top 10 most-frequent skills as a horizontal bar chart (using CSS bars, no chart library needed)
- Frequency count shown next to each skill

### Resume Text Parsing
- Add resume textarea alongside JD textarea
- `extractSkills(text, lexicon): string[]` — matches text against skill lexicon, returns deduplicated matches
- Extracted skills displayed as badges with "Detected" label before user enters manual skills
- Manual skills input still available to supplement detection

### Critical vs Nice-to-Have Gap Analysis
- Skill mention frequency in JD determines criticality: mentioned 3+ times = "critical", 1-2 times = "nice-to-have"
- Two separate sections in UI: "Critical Missing Skills" (red badges, top) and "Nice-to-Have Missing" (yellow badges)
- Matched skills shown as green in both sections

### Deterministic Role Matching
- `matchRoles(jdText): ScannedRole[]`
- Scoring logic (not random):
  - +15 if senior keyword matches candidate level
  - +10 per matched critical skill
  - +5 per matched nice-to-have skill
  - -10 if missing 3+ critical skills
  - +10 if location preference matches
- 4-6 roles generated per scan (not always the same 4)

### History Tracking
- Past scans saved: `ScannedJob[]` in agent store
- Each has: id, jdText, extractedSkills, matchResult, scannedRoles, createdAt
- List view: JD title (auto-extracted from first line), date, match score
- Click past scan to restore full results
- "Compare" mode: selects 2 past scans, side-by-side match score comparison

### Export
- Full report: JSON with all analysis data
- Summary card: Markdown formatted for Notion/Obsidian pasting
- Resume bullet suggestions list: Markdown

### Resume Bullet Suggestions
- For each critical missing skill: "How to add X to your resume" expandable section
- Contains: 2-3 example bullet points using the skill in context
- Mock generation uses skill-specific templates (e.g., for "Docker": "Containerized microservices using Docker, reducing deployment time by 60%")

---

## Settings Panel Additions

New "AI / Agent" tab in settings panel (4th tab tab after General, Scraper, Applications):

- AI Provider: dropdown (Mock / OpenAI / NIM)
- Mock Interview: Timed mode toggle, Question count (3/6/10), Per-question time limit (slider 60-600s)
- Story Bank: Auto-score toggle
- LinkedIn Outreach: Default tone dropdown
- Job Scanner: Auto-extract skills toggle

---

## File Map

### New files:
- `src/services/ai/types.ts` — AiProvider interface + request/response types
- `src/services/ai/mockProvider.ts` — All mock AI implementations
- `src/services/ai/index.ts` — createAiProvider factory
- `src/features/agent/MockInterviewQuestionPool.ts` — Question bank + selection
- `src/features/agent/ScoringService.ts` — Answer scoring + STAR scoring logic
- `src/features/agent/OutreachStore.ts` — Connection tracking store slice
- `src/features/agent/ExportService.ts` — Download helpers (Markdown, JSON, CSV)
- `src/features/agent/KeyboardUtils.ts` — Keyboard event handler constants
- `src/features/settings/AiSettingsTab.tsx` — AI provider config panel

### Modified files:
- `src/stores/agentStore.ts` — Add outreachMessages, scannedJobs, favorites
- `src/types/agent.ts` — Add AnswerScore, StarScore, OutreachEntry, ScannedJob types
- `src/types/settings.ts` — Add AI/agent settings fields
- `src/stores/settingsStore.ts` — Add AI defaults + updateApp changes
- `src/stores/analyticsStore.ts` — Add trackEvent
- `src/features/agent/MockInterview.tsx` — Full rewrite with service layer
- `src/features/agent/StoryBank.tsx` — Full rewrite with service layer
- `src/features/agent/LinkedInOutreach.tsx` — Full rewrite with service layer
- `src/features/agent/JobScanner.tsx` — Full rewrite with service layer
- `src/features/settings/SettingsPanel.tsx` — Add AI tab
- `src/services/storage.ts` — Add versioning + migration + export/import
- `src/components/layout/ErrorBoundary.tsx` — New generic error boundary (if not exists)