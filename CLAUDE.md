# Clear Progress

Personal GTD (Getting Things Done) app for task and goal management.  
Type: PWA. Architecture: React frontend + Google Apps Script backend + Google Sheets storage.

## Quick Commands

```bash
npm run dev        # Vite dev server
npm run build      # Production build
npm run preview    # Preview production build
npm run test       # Vitest (unit + integration)
npm run test:e2e   # Playwright E2E tests
npm run lint       # ESLint + Prettier check
npm run lint:fix   # Auto-fix lint issues
npm run typecheck  # tsc --noEmit
clasp push         # Deploy GAS backend
clasp deploy       # Create new GAS deployment
```

## Tech Stack

- **Frontend**: React 18+ / TypeScript 5+ / Vite 5+ / Tailwind CSS 3.4+ / shadcn/ui / React Router 6+
- **Offline DB**: Dexie.js 3+ (IndexedDB wrapper)
- **PWA**: vite-plugin-pwa (Workbox)
- **Backend**: Google Apps Script (TypeScript via clasp), deployed as Web App
- **Storage**: Google Sheets (6 sheets) + IndexedDB (offline cache)
- **Hosting**: Cloudflare Pages
- **Testing**: Vitest + React Testing Library + MSW + fake-indexeddb / Playwright (E2E)

## Project Structure

```
src/
├── components/       # Reusable React components
│   ├── ui/           # shadcn/ui primitives
│   ├── tasks/        # Task-related components
│   ├── goals/        # Goal-related components
│   └── layout/       # Shell, sidebar, navigation
├── pages/            # Route-level page components
├── hooks/            # Custom React hooks (useXxx.ts)
├── services/         # Business logic & data layer
│   ├── db.ts         # Dexie schema & instance
│   ├── sync.ts       # Sync engine (pull/push)
│   └── api.ts        # GAS API client
├── types/            # TypeScript types & interfaces
├── utils/            # Pure utility functions
├── contexts/         # React Context providers
├── constants/        # App-wide constants & enums
└── assets/           # Static assets

gas/                  # Google Apps Script backend
├── src/
│   ├── main.ts       # doGet/doPost entry points
│   ├── router.ts     # Action-based routing
│   ├── sheets.ts     # Google Sheets CRUD operations
│   ├── drive.ts      # Google Drive (covers)
│   └── types.ts      # Shared types
├── .clasp.json
└── appsscript.json

public/               # Static PWA assets (manifest, icons)
tests/
├── unit/             # Vitest unit tests
├── integration/      # Vitest integration tests (MSW + fake-indexeddb)
└── e2e/              # Playwright E2E tests
```

## Code Conventions

### General

- Language: TypeScript strict mode, no `any` unless absolutely necessary
- Formatting: Prettier (defaults) + ESLint
- Imports: absolute paths via `@/` alias → `src/`
- No default exports except page components and `db.ts`
- Prefer named exports

### Naming

- Components: `PascalCase.tsx`, one component per file
- Hooks: `useXxx.ts`
- Services/utils: `camelCase.ts`
- Types/interfaces: `PascalCase` (e.g., `Task`, `Goal`, `SyncPayload`)
- Constants: `UPPER_SNAKE_CASE`
- CSS classes: Tailwind utilities only, no custom CSS unless absolutely necessary
- Files in `gas/`: `camelCase.ts`

### React Patterns

- Functional components only, no classes
- State management: React Context + useReducer for global state, useState for local
- Side effects: custom hooks, not raw useEffect in components
- UI: Tailwind + shadcn/ui, do not write custom CSS without strong reason
- Memoize with `useMemo`/`useCallback` only when there's a measured perf issue

### Error Handling

- API calls: always try/catch, surface errors to user via toast/notification
- Sync errors: queue for retry, never lose local data
- Dexie operations: wrap in try/catch, log errors

## Data Model

### Entities

**Tasks** — core entity  
Fields: `id` (UUID v4), `title`, `notes`, `box` (inbox | today | week | later), `goal_id?`, `context_id?`, `category_id?`, `is_completed`, `completed_at?`, `repeat_rule?` (v1.1), `sort_order`, `is_deleted`, `created_at`, `updated_at`, `version`

**Goals** — objectives  
Fields: `id`, `title`, `description?`, `cover_file_id?` (Google Drive), `status` (not_started | in_progress | paused | completed | cancelled), `sort_order`, `is_deleted`, `created_at`, `updated_at`, `version`

**Contexts** — GTD contexts (@Home, @Office...)  
Fields: `id`, `name`, `sort_order`, `is_deleted`, `created_at`, `updated_at`, `version`

**Categories** — life areas (Work, Family...)  
Same structure as Contexts.

**Checklist_Items** — subtasks  
Fields: `id`, `task_id`, `title`, `is_completed`, `sort_order`, `is_deleted`, `created_at`, `updated_at`, `version`

**Settings** — key-value  
MVP keys: `default_box`, `accent_color`  
v1.1 keys: `creation_fields`, `quick_property`, `menu_always_visible`, `menu_items`, `inbox_fields`, `focus_entity`

### Relationships

- `Tasks.goal_id` → `Goals.id` (0..1 : N)
- `Tasks.context_id` → `Contexts.id` (0..1 : N)
- `Tasks.category_id` → `Categories.id` (0..1 : N)
- `Checklist_Items.task_id` → `Tasks.id` (1 : N)

### Data Rules — IMPORTANT

- **IDs**: UUID v4 generated client-side via `crypto.randomUUID()`
- **Soft delete**: set `is_deleted = true`, never remove rows
- **Versioning**: increment `version` field (+1) on every change — used for sync
- **Dates**: ISO 8601 UTC strings (e.g., `"2025-01-15T10:30:00.000Z"`)
- **Empty optional fields**: use `""` (empty string), never `null` or `undefined`
- **sort_order**: integer, used for manual ordering within lists

## Backend API (Google Apps Script)

Single endpoint: `https://script.google.com/macros/s/{DEPLOY_ID}/exec`  
Routing via `action` field in request body. Format: JSON.

### Actions

| Action | Method | Purpose |
|--------|--------|---------|
| `ping` | GET | Health check; returns `{ ok: true, initialized: bool }` |
| `init` | POST | Create Drive folder + Sheets + sheet structure (idempotent) |
| `pull` | POST | Get changes since client's known versions |
| `push` | POST | Send local changes to server |
| `upload_cover` | POST | Upload goal cover image (base64, ≤2MB, SHA-256 dedup) |
| `delete_cover` | POST | Delete cover (checks ref_count before actual delete) |
| `purge` | POST | (v2.0) Hard-delete soft-deleted records |

### Pull Request

Client sends max known `version` per entity type:

```json
{
  "action": "pull",
  "versions": {
    "tasks": 42,
    "goals": 10,
    "contexts": 5,
    "categories": 3,
    "checklist_items": 20,
    "settings": 1
  }
}
```

Server returns all records with `version > client_version` for each entity.

### Push Request

Client sends arrays of changed records:

```json
{
  "action": "push",
  "changes": {
    "tasks": [{ ...task }],
    "goals": [{ ...goal }]
  }
}
```

### Push Response Statuses

Each record in push response has a status:
- `created` — new record inserted
- `accepted` — update applied
- `conflict` — server has newer version; response includes `server_record` for client to overwrite local copy

**Conflict resolution: last-write-wins by `updated_at`.**

### Google Drive Structure

```
My Drive/
└── Clear Progress/
    ├── Clear Progress Data.gsheet   (6 sheets: Tasks, Goals, Contexts, Categories, Checklist_Items, Settings)
    └── Covers/                      (goal cover images)
```

OAuth scopes: `drive.file` + `spreadsheets` (minimal).

## Sync Engine

### Flow

1. **App open**: `pull` → update local IndexedDB with server changes
2. **User makes changes**: write to IndexedDB immediately (optimistic UI)
3. **After changes settle**: `push` with debounce (5–10 seconds)
4. **Periodic**: `pull` every 5 minutes while app is active
5. **Reconnect after offline**: `push` queued changes → `pull` to catch up

### Offline Behavior

- All reads/writes go through Dexie (IndexedDB) — app works fully offline
- Changes accumulate in IndexedDB with incremented `version`
- On reconnect: push all pending changes, then pull server state
- Network status detection via `navigator.onLine` + fetch error handling

### Sync Rules

- Never lose local data — offline changes always get pushed eventually
- On conflict: accept server record (last-write-wins), but log conflict for debugging
- Sync should be invisible to user; show subtle indicator only on error
- All sync operations are non-blocking; UI never freezes waiting for sync

## Feature Scope

### MVP

- Task boxes: inbox, today, week, later
- Task CRUD: create, read, update, delete (soft)
- Complete task: swipe right
- Move tasks between boxes
- Goals with statuses (not_started, in_progress, paused, completed, cancelled) and cover images
- Contexts and Categories CRUD
- Sidebar navigation
- Goal detail screen (with linked tasks)
- Search across tasks
- Swipe actions on task items
- Default box setting
- Accent color (green, orange, purple, yellow, crimson)
- Full sync with GAS backend
- Backend connection setup flow

### v1.1

- Checklists (subtasks within a task)
- Recurring tasks (`repeat_rule`)
- Focus mode
- Quick property panel
- Inbox processing flow
- Copy/duplicate task
- Configurable creation fields
- Quick property shortcut
- Menu customization

### v2.0

- Statistics dashboard
- Sharing
- Purge (hard delete old soft-deleted records)

## Testing Guidelines

### Unit Tests (Vitest)

- Co-locate test files: `Component.test.tsx` next to `Component.tsx`
- Use `fake-indexeddb` for Dexie operations
- Use MSW for API mocking — do not mock fetch directly
- Test business logic in services independently from components
- Aim for meaningful coverage, not 100%

### Integration Tests (Vitest + RTL)

- Test user flows: create task → see it in list → complete it
- Mock only the network layer (MSW), use real Dexie with fake-indexeddb

### E2E Tests (Playwright)

- Target: Chromium + Mobile Chrome + Mobile Safari viewports
- Test critical paths: onboarding, task CRUD, sync, offline→online
- Use data-testid attributes for selectors, not CSS classes

## Important Reminders

- This is a mobile-first PWA — always consider touch interactions and small screens
- Performance matters: keep bundle small, lazy-load routes, avoid unnecessary re-renders
- The app should feel native: smooth animations, instant feedback, no loading spinners for local data
- Accessibility: semantic HTML, ARIA labels, keyboard navigation support
- i18n is not in scope for MVP, but avoid hardcoding user-facing strings where easy to avoid
