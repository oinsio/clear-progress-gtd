# Clear Progress — Frontend Project Structure

This document defines the directory structure for the Clear Progress frontend. Follow this structure when creating new files and modules.

---

## Directory Tree

```
src/
├── app/
│   ├── App.tsx                  # Root component, providers
│   ├── router.tsx               # React Router configuration
│   └── providers/               # Context providers (Theme, Sync, Auth)
│
├── pages/                       # Pages (1 file = 1 route)
│   ├── InboxPage.tsx
│   ├── TodayPage.tsx
│   ├── WeekPage.tsx
│   ├── LaterPage.tsx
│   ├── GoalPage.tsx             # Single goal screen
│   ├── GoalsPage.tsx            # Goals list
│   ├── SearchPage.tsx
│   ├── SettingsPage.tsx
│   └── SetupPage.tsx            # Backend connection setup
│
├── features/                    # Features — domain-grouped business logic + UI
│   ├── tasks/
│   │   ├── components/          # TaskCard, TaskForm, SwipeActions...
│   │   ├── hooks/               # useTaskActions, useTaskFilters...
│   │   └── utils/               # sortTasks, filterByBox...
│   ├── goals/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   ├── contexts/                # GTD contexts (@Home, @Office)
│   ├── categories/
│   ├── checklist/               # v1.1
│   └── settings/
│
├── shared/
│   ├── ui/                      # shadcn/ui components (Button, Dialog, Sheet...)
│   ├── components/              # Shared project components (Sidebar, PageHeader, EmptyState...)
│   ├── hooks/                   # useMediaQuery, useDebounce, useOnlineStatus...
│   └── lib/                     # General-purpose utilities (cn, formatDate, uuid...)
│
├── db/
│   ├── schema.ts                # Dexie schema (tables + indexes)
│   ├── database.ts              # Dexie instance + migrations
│   └── repositories/            # Repository classes per entity
│       ├── TaskRepository.ts
│       ├── GoalRepository.ts
│       ├── ContextRepository.ts
│       ├── CategoryRepository.ts
│       ├── ChecklistRepository.ts
│       └── SettingsRepository.ts
│
├── services/                    # Service layer (business logic over repositories)
│   ├── TaskService.ts
│   ├── GoalService.ts
│   ├── SyncService.ts           # pull/push/conflict resolution
│   └── ApiClient.ts             # HTTP wrapper for GAS backend
│
├── types/                       # Global types and interfaces
│   ├── entities.ts              # Task, Goal, Context, Category, ChecklistItem, Setting
│   ├── api.ts                   # API request/response types
│   └── common.ts                # Box, AccentColor, SyncStatus...
│
├── constants/
│   └── index.ts                 # BOX_ORDER, ACCENT_COLORS, API_ACTIONS, SYNC_INTERVAL...
│
├── styles/
│   └── globals.css              # Tailwind directives + CSS variables (accent colors)
│
├── test/                        # Test infrastructure (NOT tests themselves)
│   ├── setup.ts                 # Global setup (fake-indexeddb, MSW handlers)
│   ├── mocks/
│   │   ├── handlers.ts          # MSW request handlers for GAS API
│   │   └── server.ts            # MSW server instance
│   └── factories/               # Test data factories
│       ├── taskFactory.ts
│       └── goalFactory.ts
│
├── main.tsx                     # Entry point
└── vite-env.d.ts
```

---

## Code Placement Rules

### Layers and Responsibilities

| Layer | Path | Contains | Depends on |
|---|---|---|---|
| Pages | `src/pages/` | Route-bound page components | features, shared, services |
| Features | `src/features/{domain}/` | Domain components, hooks, utilities | shared, db, services, types |
| Services | `src/services/` | Business logic, sync, API client | db/repositories, types |
| Repositories | `src/db/repositories/` | IndexedDB CRUD operations via Dexie | db/schema, types |
| Shared | `src/shared/` | Reusable UI and utilities | types (never depends on features) |
| Types | `src/types/` | Interfaces and types | nothing |
| Constants | `src/constants/` | Constants and enum-like values | types |

### Dependency Direction

```
pages → features → services → repositories → db/schema
  ↓        ↓          ↓            ↓
  └────────┴──────────┴────────────┴──→ shared, types, constants
```

Forbidden:
- `shared/` must not import from `features/`, `pages/`, `services/`, `db/`.
- `types/` must not import anything from the project.
- `db/repositories/` must not import from `services/` or `features/`.
- Cross-imports between features (`features/tasks/` ↛ `features/goals/`). Shared code goes into `shared/`.

### Where to Place New Code

| What you're creating | Where to put it |
|---|---|
| New page/route | `src/pages/` + register in `src/app/router.tsx` |
| Feature-specific component | `src/features/{domain}/components/` |
| Feature-specific hook | `src/features/{domain}/hooks/` |
| Feature-specific utility | `src/features/{domain}/utils/` |
| shadcn/ui component | `src/shared/ui/` |
| Reusable project component | `src/shared/components/` |
| Reusable hook (not domain-bound) | `src/shared/hooks/` |
| General-purpose utility (cn, formatDate) | `src/shared/lib/` |
| Entity repository | `src/db/repositories/` |
| Business logic service | `src/services/` |
| Interface/type | `src/types/` |
| Constant | `src/constants/index.ts` |
| Context provider (Theme, Auth, Sync) | `src/app/providers/` |

### Adding a New Feature (Domain)

When adding a new domain, create the full structure:

```
src/features/{domain}/
├── components/
├── hooks/
└── utils/
```

Not all subdirectories are required — create them as needed. If a domain has only one component and no hooks/utilities, placing it directly in `src/features/{domain}/` is acceptable.

---

## Test Placement Rules

### Colocation

Tests live next to the file they test. Suffix: `.test.ts` / `.test.tsx`.

```
src/services/
├── TaskService.ts
├── TaskService.test.ts          # ← test next to source
├── SyncService.ts
└── SyncService.test.ts

src/db/repositories/
├── TaskRepository.ts
└── TaskRepository.test.ts

src/features/tasks/utils/
├── sortTasks.ts
└── sortTasks.test.ts

src/features/tasks/hooks/
├── useTaskActions.ts
└── useTaskActions.test.ts

src/shared/lib/
├── formatDate.ts
└── formatDate.test.ts
```

### Test Infrastructure

The `src/test/` directory contains only shared infrastructure, not tests:

| Path | Purpose |
|---|---|
| `src/test/setup.ts` | Global setup: fake-indexeddb, MSW server start, custom matchers |
| `src/test/mocks/handlers.ts` | MSW request handlers for GAS API mocking (ping, init, pull, push) |
| `src/test/mocks/server.ts` | MSW server instance |
| `src/test/factories/` | Factories for creating test entities (Task, Goal, etc.) with default values |

### Vitest Configuration

In `vitest.config.ts` (or `test` section in `vite.config.ts`):

```ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/*.test.{ts,tsx}',
      ],
      thresholds: {
        statements: 70,
        lines: 70,
        functions: 70,
        branches: 65,
      },
    },
  },
});
```

### What to Test

| Priority | Layer | Examples |
|---|---|---|
| High | `services/` | Business logic in TaskService, SyncService (conflict resolution) |
| High | `db/repositories/` | CRUD operations with fake-indexeddb |
| High | `features/*/utils/` | Pure functions (sorting, filtering) |
| Medium | `features/*/hooks/` | Custom hooks via renderHook |
| Medium | `shared/lib/` | Utilities (formatDate, cn, uuid) |
| Low | `features/*/components/` | Components — only critical interactions |
| Low | `pages/` | Page integration tests (if needed) |

---

*Created: March 13, 2026 | Clear Progress — Frontend Project Structure*
