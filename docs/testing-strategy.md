# Clear Progress — Стратегия тестирования

## 1. Обзор

Документ описывает инструменты, подходы и практики тестирования для приложения Clear Progress (React PWA + Google Apps Script + Google Sheets).

### Пирамида тестов

```
        ╱ ‾ ‾ ‾ ‾ ‾ ╲
       ╱   E2E (10%)   ╲          Playwright
      ╱─────────────────╲
     ╱ Интеграционные (30%)╲      Vitest + Testing Library + MSW
    ╱───────────────────────╲
   ╱    Юнит-тесты (60%)     ╲    Vitest
  ╱ ‾ ‾ ‾ ‾ ‾ ‾ ‾ ‾ ‾ ‾ ‾ ‾ ‾╲
```

| Уровень | Инструменты | Что покрывает |
|---------|------------|---------------|
| Юнит | Vitest | Утилиты, хелперы, sync-логика, трансформации данных |
| Интеграционные | Vitest + React Testing Library + MSW | Компоненты с взаимодействием, хуки, CRUD-операции, IndexedDB |
| E2E | Playwright | Полные пользовательские сценарии, офлайн, свайпы, PWA |

---

## 2. Стек инструментов

### 2.1 Vitest

Основной тест-раннер. Выбран потому что уже в стеке проекта, нативно работает с Vite, поддерживает TypeScript без дополнительной настройки, совместим с Jest API.

**Зона ответственности:** юнит-тесты, интеграционные тесты компонентов.

### 2.2 React Testing Library

Тестирование компонентов с точки зрения пользователя — через видимый текст, роли, лейблы. Не зависит от деталей реализации.

**Зона ответственности:** рендеринг компонентов, пользовательские взаимодействия (клик, ввод), проверка отображаемого состояния.

### 2.3 MSW (Mock Service Worker)

Перехват HTTP-запросов на уровне сервис-воркера. Единый слой моков для Vitest и Playwright.

**Зона ответственности:** мок GAS API (pull/push/ping/init), эмуляция конфликтов синхронизации, эмуляция сетевых ошибок.

### 2.4 Playwright

Кроссбраузерный E2E-фреймворк. Поддерживает эмуляцию мобильных устройств, офлайн-режим, touch-события.

**Зона ответственности:** полные пользовательские сценарии, офлайн/онлайн переходы, свайп-жесты, визуальная регрессия.

### 2.5 fake-indexeddb

In-memory реализация IndexedDB для Node.js. Позволяет тестировать Dexie.js в юнит-тестах без браузера.

**Зона ответственности:** операции с локальным кэшем, очередь офлайн-изменений.

---

## 3. Конфигурация

### 3.1 Vitest

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/**/*.d.ts',
        'src/main.tsx',
      ],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 70,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 3.2 Setup-файл

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';

// MSW — запуск перед всеми тестами
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

// Мок crypto.randomUUID для стабильных тестов
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  ...crypto,
  randomUUID: () => `test-uuid-${++uuidCounter}`,
});
```

### 3.3 MSW — обработчики

```ts
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

const GAS_URL = 'https://script.google.com/macros/s/*/exec';

// Фабрика данных
export function createTask(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    title: 'Test Task',
    notes: '',
    box: 'inbox',
    goal_id: '',
    context_id: '',
    category_id: '',
    is_completed: false,
    completed_at: '',
    sort_order: 0,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    ...overrides,
  };
}

export const handlers = [
  // ping
  http.get(GAS_URL, ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('action') === 'ping') {
      return HttpResponse.json({
        ok: true,
        initialized: true,
        timestamp: new Date().toISOString(),
      });
    }
  }),

  // pull
  http.post(GAS_URL, async ({ request }) => {
    const body = await request.json() as { action: string };
    if (body.action === 'pull') {
      return HttpResponse.json({
        ok: true,
        data: {
          tasks: [],
          goals: [],
          contexts: [],
          categories: [],
          checklist_items: [],
          settings: [],
        },
      });
    }

    // push
    if (body.action === 'push') {
      return HttpResponse.json({
        ok: true,
        results: [], // все accepted
      });
    }

    return HttpResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  }),
];
```

```ts
// src/test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### 3.4 Playwright

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 4. Примеры тестов

### 4.1 Юнит-тест — утилита сортировки задач

```ts
// src/utils/sort.test.ts
import { describe, it, expect } from 'vitest';
import { sortTasks } from './sort';
import { createTask } from '@/test/mocks/handlers';

describe('sortTasks', () => {
  it('сортирует по sort_order по возрастанию', () => {
    const tasks = [
      createTask({ title: 'C', sort_order: 3 }),
      createTask({ title: 'A', sort_order: 1 }),
      createTask({ title: 'B', sort_order: 2 }),
    ];

    const sorted = sortTasks(tasks);
    expect(sorted.map(t => t.title)).toEqual(['A', 'B', 'C']);
  });

  it('исключает soft-deleted задачи', () => {
    const tasks = [
      createTask({ title: 'Active', is_deleted: false }),
      createTask({ title: 'Deleted', is_deleted: true }),
    ];

    const sorted = sortTasks(tasks);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].title).toBe('Active');
  });
});
```

### 4.2 Интеграционный тест — создание задачи

```tsx
// src/features/tasks/TaskCreateForm.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCreateForm } from './TaskCreateForm';
import { TestProviders } from '@/test/TestProviders';

describe('TaskCreateForm', () => {
  it('создаёт задачу и очищает форму', async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();

    render(
      <TestProviders>
        <TaskCreateForm onCreated={onCreated} />
      </TestProviders>
    );

    const input = screen.getByPlaceholderText(/название задачи/i);
    await user.type(input, 'Купить молоко');
    await user.click(screen.getByRole('button', { name: /создать/i }));

    expect(onCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Купить молоко',
        box: 'inbox',
      })
    );
    expect(input).toHaveValue('');
  });

  it('не создаёт задачу с пустым названием', async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();

    render(
      <TestProviders>
        <TaskCreateForm onCreated={onCreated} />
      </TestProviders>
    );

    await user.click(screen.getByRole('button', { name: /создать/i }));
    expect(onCreated).not.toHaveBeenCalled();
  });
});
```

### 4.3 Интеграционный тест — синхронизация с конфликтом

```ts
// src/services/sync.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { SyncService } from './sync';
import { db } from '@/db';
import { createTask } from '@/test/mocks/handlers';

describe('SyncService.push', () => {
  beforeEach(async () => {
    await db.tasks.clear();
  });

  it('обрабатывает conflict — перезаписывает локальную версию', async () => {
    const localTask = createTask({
      id: 'task-1',
      title: 'Local Version',
      version: 2,
    });
    await db.tasks.put(localTask);

    const serverTask = createTask({
      id: 'task-1',
      title: 'Server Version',
      version: 3,
      updated_at: new Date(Date.now() + 1000).toISOString(),
    });

    server.use(
      http.post('https://script.google.com/macros/s/*/exec', () => {
        return HttpResponse.json({
          ok: true,
          results: [
            { id: 'task-1', status: 'conflict', server_record: serverTask },
          ],
        });
      })
    );

    await SyncService.push([localTask]);
    const stored = await db.tasks.get('task-1');

    expect(stored?.title).toBe('Server Version');
    expect(stored?.version).toBe(3);
  });
});
```

### 4.4 Тест IndexedDB / Dexie.js

```ts
// src/db/tasks.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './index';
import { createTask } from '@/test/mocks/handlers';

describe('TasksDB', () => {
  beforeEach(async () => {
    await db.tasks.clear();
  });

  it('сохраняет и находит задачу по box', async () => {
    await db.tasks.bulkPut([
      createTask({ id: '1', box: 'today' }),
      createTask({ id: '2', box: 'inbox' }),
      createTask({ id: '3', box: 'today' }),
    ]);

    const todayTasks = await db.tasks
      .where('box')
      .equals('today')
      .toArray();

    expect(todayTasks).toHaveLength(2);
  });

  it('хранит очередь неотправленных изменений', async () => {
    const task = createTask({ id: '1', title: 'Offline Task' });
    await db.tasks.put(task);
    await db.pendingChanges.put({
      id: crypto.randomUUID(),
      entity: 'tasks',
      record_id: '1',
      timestamp: new Date().toISOString(),
    });

    const pending = await db.pendingChanges.toArray();
    expect(pending).toHaveLength(1);
    expect(pending[0].record_id).toBe('1');
  });
});
```

### 4.5 E2E — полный сценарий задачи

```ts
// e2e/task-lifecycle.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Жизненный цикл задачи', () => {
  test('создание → перемещение → завершение', async ({ page }) => {
    await page.goto('/');

    // Создать задачу в inbox
    await page.getByPlaceholder(/название задачи/i).fill('E2E задача');
    await page.getByRole('button', { name: /создать/i }).click();
    await expect(page.getByText('E2E задача')).toBeVisible();

    // Переместить в today
    await page.getByText('E2E задача').click();
    await page.getByRole('button', { name: /today/i }).click();

    // Перейти в today и проверить
    await page.getByRole('link', { name: /today/i }).click();
    await expect(page.getByText('E2E задача')).toBeVisible();

    // Завершить задачу (свайп вправо)
    const task = page.getByText('E2E задача');
    const box = await task.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 10, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + box.height / 2, { steps: 10 });
      await page.mouse.up();
    }

    await expect(page.getByText('E2E задача')).not.toBeVisible();
  });
});
```

### 4.6 E2E — офлайн-режим

```ts
// e2e/offline-sync.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Офлайн-синхронизация', () => {
  test('задача создаётся офлайн и синхронизируется при восстановлении', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Отключить сеть
    await context.setOffline(true);

    // Создать задачу
    await page.getByPlaceholder(/название задачи/i).fill('Офлайн задача');
    await page.getByRole('button', { name: /создать/i }).click();

    // Задача видна в UI
    await expect(page.getByText('Офлайн задача')).toBeVisible();

    // Индикатор офлайн-статуса
    await expect(page.getByTestId('offline-indicator')).toBeVisible();

    // Восстановить сеть
    await context.setOffline(false);

    // Индикатор синхронизации → исчезает
    await expect(page.getByTestId('sync-indicator')).toBeVisible();
    await expect(page.getByTestId('sync-indicator')).not.toBeVisible({
      timeout: 15000,
    });

    // Задача по-прежнему видна
    await expect(page.getByText('Офлайн задача')).toBeVisible();
  });
});
```

---

## 5. Структура файлов

```
src/
├── test/
│   ├── setup.ts                    # Глобальный setup (MSW, fake-indexeddb, моки)
│   ├── TestProviders.tsx            # Обёртка с Router, Store, QueryClient
│   └── mocks/
│       ├── handlers.ts              # MSW-обработчики + фабрики данных
│       └── server.ts                # MSW-сервер для Node
├── db/
│   ├── index.ts
│   └── tasks.test.ts
├── services/
│   ├── sync.ts
│   └── sync.test.ts
├── utils/
│   ├── sort.ts
│   └── sort.test.ts
└── features/
    ├── tasks/
    │   ├── TaskCreateForm.tsx
    │   ├── TaskCreateForm.test.tsx
    │   ├── TaskList.tsx
    │   └── TaskList.test.tsx
    ├── goals/
    │   ├── GoalCard.tsx
    │   └── GoalCard.test.tsx
    └── ...

e2e/
├── task-lifecycle.spec.ts
├── offline-sync.spec.ts
├── navigation.spec.ts
├── goals.spec.ts
└── fixtures/
    └── test-data.ts                 # Фикстуры для E2E
```

Принцип: тестовые файлы лежат рядом с тестируемым кодом (`.test.ts` / `.test.tsx`). E2E — в отдельной папке `e2e/`.

---

## 6. MSW — моки GAS API

### 6.1 Принцип

MSW перехватывает все запросы к GAS URL и возвращает контролируемые ответы. Один набор обработчиков используется и в Vitest, и в Playwright (через `setupWorker` в браузере).

### 6.2 Переопределение для конкретного теста

```ts
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

it('показывает ошибку при недоступном бэкенде', async () => {
  server.use(
    http.get('https://script.google.com/macros/s/*/exec', () => {
      return HttpResponse.error(); // Имитация сетевой ошибки
    })
  );

  // ... рендер и проверка
});
```

### 6.3 Сценарии для моков

| Сценарий | Что мокать |
|----------|-----------|
| Первый запуск (не инициализирован) | `ping` → `{ initialized: false }` |
| Нормальная работа | `pull` → данные, `push` → `accepted` |
| Конфликт синхронизации | `push` → `conflict` + `server_record` |
| Сетевая ошибка | `HttpResponse.error()` |
| Медленный ответ | `delay('real')` или `delay(5000)` |
| Ошибка сервера | `HttpResponse.json({ ok: false }, { status: 500 })` |

---

## 7. Тестирование IndexedDB / Dexie.js

### 7.1 Подход

В юнит/интеграционных тестах: `fake-indexeddb/auto` (импорт в setup.ts) подменяет глобальный `indexedDB` in-memory реализацией. Dexie работает с ней прозрачно.

В E2E: Playwright использует реальную IndexedDB браузера. Очистка между тестами — через `page.evaluate(() => indexedDB.deleteDatabase('ClearProgressDB'))`.

### 7.2 Что тестировать

- CRUD-операции для каждой сущности
- Индексы и выборки по `box`, `goal_id`, `context_id`, `is_deleted`
- Очередь `pendingChanges` — добавление, извлечение, очистка после push
- Миграции схемы (при обновлении версии Dexie)
- Пограничные случаи: пустые строки вместо null, корректность ISO-дат

---

## 8. Тестирование GAS-бэкенда

### 8.1 Подход

GAS не имеет встроенного тест-фреймворка. Варианты:

**Вариант A — HTTP-тесты к тестовому деплою.** Отдельный деплой GAS, привязанный к тестовой Google-таблице. Тесты (Vitest или любой HTTP-клиент) отправляют запросы и проверяют ответы.

```ts
// backend-tests/api.test.ts
const GAS_TEST_URL = process.env.GAS_TEST_DEPLOY_URL;

describe('GAS API', () => {
  it('init создаёт структуру таблицы', async () => {
    const res = await fetch(GAS_TEST_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'init' }),
    });
    const data = await res.json();

    expect(data.ok).toBe(true);
  });

  it('push + pull — round-trip', async () => {
    const task = { /* ... */ };

    await fetch(GAS_TEST_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'push', changes: { tasks: [task] } }),
    });

    const pullRes = await fetch(GAS_TEST_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'pull', versions: { tasks: 0 } }),
    });
    const pullData = await pullRes.json();

    expect(pullData.data.tasks).toContainEqual(
      expect.objectContaining({ id: task.id })
    );
  });
});
```

**Вариант B — clasp + газовые юнит-тесты.** Вынести бизнес-логику GAS в чистые функции, тестировать их локально через `gas-local` или аналогичные библиотеки.

---

## 9. Ключевые сценарии для покрытия

### 9.1 Критические (обязательно)

- Создание/редактирование/удаление задачи (soft delete)
- Перемещение между коробками (inbox → today → week → later)
- Завершение задачи (свайп)
- Синхронизация: pull → push → обработка конфликтов
- Офлайн-режим: создание задач → восстановление → синхронизация
- Навигация: боковое меню, переходы между экранами
- Цели: создание, статусы, привязка задач, обложки

### 9.2 Важные (MVP)

- Поиск задач
- Фильтрация по контексту/категории
- Коробка по умолчанию в настройках
- Акцентный цвет — переключение
- Свайп-действия (влево — удаление, вправо — завершение)

### 9.3 Регрессионные (v1.1+)

- Чеклисты внутри задачи
- Повторяющиеся задачи
- Режим «Фокус»
- Панель быстрых свойств
- Обработка входящих

---

## 10. CI-интеграция

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx vitest run --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test --project=chromium
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Рекомендации для CI

- Юнит/интеграционные тесты — на каждый push и PR
- E2E — на каждый PR в main, можно ограничить только Chromium для скорости
- Полный кроссбраузерный прогон (Chromium + Mobile Chrome + Mobile Safari) — перед релизом
- Порог покрытия: 70% statements/lines/functions, 65% branches
- Кэширование `node_modules` и Playwright-браузеров для ускорения

---

## 11. Зависимости для установки

```bash
# Юнит и интеграционные тесты
npm install -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jsdom fake-indexeddb msw

# E2E
npm install -D @playwright/test
npx playwright install
```

---

## 12. Полезные практики

- **Фабрики данных** (`createTask`, `createGoal`, ...) — единый источник тестовых данных, переиспользуются на всех уровнях.
- **TestProviders** — обёртка с Router, Store, QueryClient для интеграционных тестов. Позволяет рендерить компоненты в реалистичном окружении.
- **Тесты рядом с кодом** — `.test.ts` лежат в той же папке, что и тестируемый модуль. Проще находить и поддерживать.
- **Один assert на сценарий** — где возможно, один тест проверяет одно поведение. Исключение: E2E, где допустимы longer flows.
- **Детерминированные UUID** — мок `crypto.randomUUID()` в setup для предсказуемых ID.
- **Очистка между тестами** — `afterEach(cleanup)` для DOM, `db.table.clear()` для IndexedDB, `server.resetHandlers()` для MSW.
