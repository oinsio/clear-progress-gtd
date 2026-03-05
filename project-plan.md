# Clear Progress — Пошаговый план разработки

## Условные обозначения

- **ID задачи**: `M-XX` (MVP), `V1-XX` (v1.1), `V2-XX` (v2.0)
- **Зависимости**: `→` означает «требует завершения»
- **AC**: Acceptance Criteria (критерии приёмки)

---

## Фаза 0: Инициализация проекта

### [ ] M-01. Инициализация frontend-проекта

Создать Vite + React + TypeScript проект, настроить базовые конфиги.

**AC:**
- [ ] `npm create vite` с шаблоном `react-ts`
- [ ] `tsconfig.json` с `strict: true`, path aliases (`@/` → `src/`)
- [ ] `vite.config.ts` с alias и будущим подключением PWA-плагина
- [ ] `.gitignore` покрывает `node_modules`, `dist`, `.env`
- [ ] `.env.example` с `VITE_GAS_URL`
- [ ] Проект запускается через `npm run dev` без ошибок

**Зависимости:** нет

---

### [ ] M-02. Подключение Tailwind CSS + shadcn/ui

**AC:**
- [ ] Tailwind 3.4+ установлен и работает
- [ ] `tailwind.config.ts` с кастомными цветами через CSS custom properties (для accent color)
- [ ] `postcss.config.js` настроен
- [ ] `globals.css` содержит Tailwind directives и CSS-переменные для accent colors (green, orange, purple, yellow, crimson)
- [ ] shadcn/ui инициализирован (`components.json`), установлены базовые компоненты: Button, Input, Sheet, Dialog, Select, Tabs
- [ ] Тестовая страница рендерится с компонентами shadcn/ui

**Зависимости:** → M-01

---

### [ ] M-03. Настройка React Router

**AC:**
- [ ] React Router 6+ установлен
- [ ] `router.tsx` содержит маршруты: `/` (редирект на коробку по умолчанию), `/inbox`, `/box/:boxId`, `/goals`, `/goals/:id`, `/contexts`, `/categories`, `/settings`, `/setup`, `*` (404)
- [ ] `App.tsx` рендерит `RouterProvider`
- [ ] `providers.tsx` оборачивает приложение в необходимые провайдеры
- [ ] Навигация между страницами-заглушками работает без перезагрузки

**Зависимости:** → M-01

---

### [ ] M-04. Инициализация backend-проекта (Google Apps Script)

**AC:**
- [ ] Папка `backend/` с `appsscript.json` (scopes: `drive.file`, `spreadsheets`), `tsconfig.json`
- [ ] `.clasp.json` настроен (или шаблон с инструкцией)
- [ ] `main.ts` содержит `doGet()` и `doPost()` с роутингом по параметру `action`
- [ ] Хелпер `response.ts` с функциями `jsonOk(data)` и `jsonError(message, code)`
- [ ] Action `ping` возвращает `{ ok: true, initialized: false }`
- [ ] Деплой как Web App доступен по URL

**Зависимости:** нет

---

### [ ] M-05. Типы данных (shared types)

Определить TypeScript-интерфейсы для всех сущностей.

**AC:**
- [ ] Файлы `types/task.ts`, `goal.ts`, `context.ts`, `category.ts`, `checklist.ts`, `settings.ts`, `sync.ts`
- [ ] Интерфейсы соответствуют схеме из Project Context (все поля, типы, опциональность)
- [ ] `sync.ts` содержит: `PullRequest`, `PullResponse`, `PushRequest`, `PushResponse`, `PushItemResult` (с полем `status: 'created' | 'accepted' | 'conflict'`)
- [ ] Enum/union types для `Box`, `GoalStatus`, `AccentColor`
- [ ] Типы экспортируются и доступны для импорта

**Зависимости:** → M-01

---

### [ ] M-06. Константы и конфигурация

**AC:**
- [ ] `config/constants.ts` содержит: список коробок (`inbox`, `today`, `week`, `later`) с label/icon, статусы целей, доступные accent colors с их CSS-значениями, лимиты (макс. размер обложки 2МБ)
- [ ] Значения соответствуют Project Context
- [ ] Экспортируются как `const` (не `enum`) для tree-shaking

**Зависимости:** → M-05

---

### [ ] M-07. Утилиты

**AC:**
- [ ] `lib/utils.ts`: функция `cn()` (clsx + tailwind-merge)
- [ ] `lib/uuid.ts`: обёртка `generateId()` над `crypto.randomUUID()`
- [ ] `lib/date.ts`: `nowISO()` (ISO 8601 UTC), `formatDate()`, `formatRelative()`
- [ ] Покрыты unit-тестами (Vitest)

**Зависимости:** → M-01

---

## Фаза 1: Локальное хранилище (IndexedDB)

### [ ] M-08. Dexie.js — схема и инстанс

**AC:**
- [ ] `db/index.ts` создаёт Dexie-инстанс `ClearProgressDB`
- [ ] Таблицы: `tasks`, `goals`, `contexts`, `categories`, `checklistItems`, `settings`
- [ ] Индексы: tasks — `id`, `box`, `goal_id`, `context_id`, `category_id`, `is_deleted`, `updated_at`; goals — `id`, `is_deleted`; contexts/categories — `id`, `is_deleted`; checklistItems — `id`, `task_id`, `is_deleted`; settings — `key`
- [ ] `migrations.ts` содержит версию 1 схемы
- [ ] БД открывается без ошибок

**Зависимости:** → M-05

---

### [ ] M-09. Repository: Tasks

**AC:**
- [ ] `db/repositories/task.repository.ts`
- [ ] Методы: `getAll(filters?)`, `getById(id)`, `getByBox(box)`, `getByGoalId(goalId)`, `create(task)`, `update(id, changes)`, `softDelete(id)`
- [ ] Все методы фильтруют `is_deleted !== true` по умолчанию
- [ ] `create` автоматически проставляет `id`, `created_at`, `updated_at`, `version: 1`, `is_deleted: false`, `is_completed: false`
- [ ] `update` инкрементирует `version`, обновляет `updated_at`
- [ ] `softDelete` ставит `is_deleted: true`, инкрементирует `version`

**Зависимости:** → M-08

---

### [ ] M-10. Repository: Goals

**AC:**
- [ ] `db/repositories/goal.repository.ts`
- [ ] Методы: `getAll()`, `getById(id)`, `create(goal)`, `update(id, changes)`, `softDelete(id)`
- [ ] Логика аналогична M-09
- [ ] `create` проставляет `status: 'not_started'` по умолчанию

**Зависимости:** → M-08

---

### [ ] M-11. Repository: Contexts

**AC:**
- [ ] `db/repositories/context.repository.ts`
- [ ] Методы: `getAll()`, `getById(id)`, `create(context)`, `update(id, changes)`, `softDelete(id)`

**Зависимости:** → M-08

---

### [ ] M-12. Repository: Categories

**AC:**
- [ ] `db/repositories/category.repository.ts`
- [ ] Аналогично M-11

**Зависимости:** → M-08

---

### [ ] M-13. Repository: Settings

**AC:**
- [ ] `db/repositories/settings.repository.ts`
- [ ] Методы: `get(key)`, `set(key, value)`, `getAll()`
- [ ] Дефолтные значения: `default_box: 'inbox'`, `accent_color: 'green'`

**Зависимости:** → M-08

---

### [ ] M-14. Repository: Checklist Items

**AC:**
- [ ] `db/repositories/checklist.repository.ts`
- [ ] Методы: `getByTaskId(taskId)`, `create(item)`, `update(id, changes)`, `softDelete(id)`, `reorder(taskId, orderedIds)`

**Зависимости:** → M-08

---

## Фаза 2: Сервисный слой

### [ ] M-15. Task Service

**AC:**
- [ ] `services/task.service.ts`
- [ ] Методы: `createTask(data)`, `updateTask(id, changes)`, `completeTask(id)`, `uncompleteTask(id)`, `moveToBox(id, box)`, `deleteTask(id)`, `getTasksByBox(box)`, `getTasksByGoal(goalId)`, `searchTasks(query)`
- [ ] `completeTask` ставит `is_completed: true`, `completed_at: nowISO()`
- [ ] `searchTasks` ищет по `title` и `notes` (case-insensitive, подстрока)
- [ ] Все мутации вызывают repository и возвращают обновлённую сущность

**Зависимости:** → M-09, M-07

---

### [ ] M-16. Goal Service

**AC:**
- [ ] `services/goal.service.ts`
- [ ] Методы: `createGoal(data)`, `updateGoal(id, changes)`, `updateStatus(id, status)`, `deleteGoal(id)`, `getAllGoals()`
- [ ] При удалении цели — у связанных задач `goal_id` сбрасывается в `""`

**Зависимости:** → M-10, M-09

---

### [ ] M-17. Context Service

**AC:**
- [ ] `services/context.service.ts`
- [ ] CRUD + при удалении контекста — у связанных задач `context_id` сбрасывается в `""`

**Зависимости:** → M-11, M-09

---

### [ ] M-18. Category Service

**AC:**
- [ ] `services/category.service.ts`
- [ ] Аналогично M-17 для `category_id`

**Зависимости:** → M-12, M-09

---

### [ ] M-19. Checklist Service

**AC:**
- [ ] `services/checklist.service.ts`
- [ ] Методы: `addItem(taskId, title)`, `toggleItem(id)`, `updateItem(id, changes)`, `deleteItem(id)`, `reorderItems(taskId, orderedIds)`, `getItemsByTask(taskId)`

**Зависимости:** → M-14

---

## Фаза 3: Layout и навигация

### [ ] M-20. Layout: Sidebar

**AC:**
- [ ] `components/layout/Sidebar.tsx` — боковое меню
- [ ] Элементы: Inbox (с каунтером), Today, Week, Later, разделитель, Goals, Contexts, Categories, разделитель, Settings
- [ ] Активный пункт подсвечивается accent color
- [ ] На мобильных (<768px) — открывается как Sheet (overlay) по свайпу или кнопке
- [ ] На десктопе (≥768px) — фиксирован слева
- [ ] Закрывается по клику на пункт (мобильная версия)

**Зависимости:** → M-02, M-03

---

### [ ] M-21. Layout: Header

**AC:**
- [ ] `components/layout/Header.tsx`
- [ ] Содержит: кнопка-гамбургер (мобильная), заголовок страницы, кнопка поиска
- [ ] Заголовок динамически меняется в зависимости от текущего маршрута

**Зависимости:** → M-20

---

### [ ] M-22. Layout: PageShell

**AC:**
- [ ] `components/layout/PageShell.tsx` — обёртка для всех страниц
- [ ] Props: `title`, `children`, `actions?` (кнопки в шапке)
- [ ] Обеспечивает единообразный отступ и скроллинг
- [ ] Содержит Sidebar + Header + контентную область

**Зависимости:** → M-20, M-21

---

### [ ] M-23. Shared: EmptyState

**AC:**
- [ ] `components/shared/EmptyState.tsx`
- [ ] Props: `icon?`, `title`, `description?`, `action?` (кнопка)
- [ ] Центрируется в контентной области

**Зависимости:** → M-02

---

### [ ] M-24. Shared: ConfirmDialog

**AC:**
- [ ] `components/shared/ConfirmDialog.tsx`
- [ ] Props: `open`, `onConfirm`, `onCancel`, `title`, `description`, `confirmLabel?`, `variant?` (danger/default)
- [ ] Построен на shadcn AlertDialog

**Зависимости:** → M-02

---

## Фаза 4: CRUD задач (ядро)

### [ ] M-25. TaskItem — компонент одной задачи

**AC:**
- [ ] `components/tasks/TaskItem.tsx`
- [ ] Отображает: checkbox (завершение), title, метки (goal, context, category) как chips, индикатор заметок
- [ ] Клик по checkbox → вызывает `completeTask` / `uncompleteTask`
- [ ] Клик по задаче → переход к деталям / открытие формы редактирования
- [ ] Завершённые задачи визуально отличаются (strikethrough, приглушённый цвет)

**Зависимости:** → M-15, M-02

---

### [ ] M-26. SwipeableRow — компонент свайп-действий

**AC:**
- [ ] `components/shared/SwipeableRow.tsx`
- [ ] Свайп вправо → настраиваемое действие (по умолчанию — завершить задачу, зелёный фон с галочкой)
- [ ] Свайп влево → настраиваемое действие (по умолчанию — удалить, красный фон с корзиной)
- [ ] Порог срабатывания: 30% ширины
- [ ] Визуальный feedback: цветной фон раскрывается по мере свайпа
- [ ] Работает touch + mouse (pointer events)
- [ ] Анимация возврата при незавершённом свайпе

**Зависимости:** → M-02

---

### [ ] M-27. TaskList — список задач

**AC:**
- [ ] `components/tasks/TaskList.tsx`
- [ ] Props: `tasks`, `onComplete`, `onDelete`, `onReorder?`
- [ ] Рендерит список `TaskItem` внутри `SwipeableRow`
- [ ] Пустой список → `EmptyState`
- [ ] Завершённые задачи — в отдельной секции внизу (свёрнутой по умолчанию, с каунтером)

**Зависимости:** → M-25, M-26, M-23

---

### [ ] M-28. TaskForm — создание и редактирование задачи

**AC:**
- [ ] `components/tasks/TaskForm.tsx`
- [ ] Поля: title (обязательное), notes (textarea), box (select), goal (select), context (select), category (select)
- [ ] Режим создания: открывается снизу как Sheet, title в фокусе
- [ ] Режим редактирования: заполняет поля текущими значениями
- [ ] Валидация: title не пустой
- [ ] При сохранении: вызывает `createTask` или `updateTask`
- [ ] Селекты goal/context/category подтягивают данные из соответствующих сервисов

**Зависимости:** → M-15, M-16, M-17, M-18

---

### [ ] M-29. BoxTabs — переключатель коробок

**AC:**
- [ ] `components/tasks/BoxTabs.tsx`
- [ ] Табы: Today, Week, Later
- [ ] Активный таб подсвечивается accent color
- [ ] Клик по табу → навигация на `/box/:boxId`
- [ ] Каждый таб показывает каунтер незавершённых задач

**Зависимости:** → M-15, M-03

---

### [ ] M-30. BoxPage — страница коробки

**AC:**
- [ ] `pages/BoxPage.tsx`
- [ ] Читает `boxId` из URL params
- [ ] Загружает задачи для текущей коробки через `useTasksByBox(boxId)`
- [ ] Содержит: `BoxTabs`, `TaskList`, FAB-кнопка «+» для создания задачи
- [ ] FAB открывает `TaskForm` с предвыбранной текущей коробкой
- [ ] Поддерживает pull-to-refresh (или кнопка обновления)

**Зависимости:** → M-27, M-28, M-29, M-22

---

### [ ] M-31. InboxPage — страница входящих

**AC:**
- [ ] `pages/InboxPage.tsx`
- [ ] Загружает задачи с `box: 'inbox'`
- [ ] Отличие от BoxPage: нет BoxTabs, есть подсказка «Разберите входящие»
- [ ] Свайп влево → открывает быстрый выбор коробки (today/week/later) для перемещения
- [ ] FAB «+» создаёт задачу в inbox
- [ ] Каунтер в sidebar обновляется реактивно

**Зависимости:** → M-27, M-28, M-22, M-15

---

### [ ] M-32. Hook: useTasks

**AC:**
- [ ] `hooks/useTasks.ts`
- [ ] Использует Dexie `liveQuery` для реактивности
- [ ] Возвращает: `tasks`, `isLoading`, `createTask`, `updateTask`, `completeTask`, `deleteTask`, `moveToBox`
- [ ] Фильтрация по box, goal, search query
- [ ] Автоматически обновляет UI при изменениях в IndexedDB

**Зависимости:** → M-15, M-08

---

## Фаза 5: Цели

### [ ] M-33. GoalCard — карточка цели

**AC:**
- [ ] `components/goals/GoalCard.tsx`
- [ ] Отображает: обложку (или placeholder), title, статус (badge), каунтер задач
- [ ] Обложка занимает верхнюю часть карточки (aspect-ratio 16:9)
- [ ] Клик → переход на `/goals/:id`

**Зависимости:** → M-16, M-02

---

### [ ] M-34. GoalList — список целей

**AC:**
- [ ] `components/goals/GoalList.tsx`
- [ ] Сетка карточек (2 колонки на мобильных, 3 на десктопе)
- [ ] Фильтрация по статусу (все / активные / завершённые)
- [ ] Пустой список → `EmptyState`

**Зависимости:** → M-33, M-23

---

### [ ] M-35. GoalForm — создание и редактирование цели

**AC:**
- [ ] `components/goals/GoalForm.tsx`
- [ ] Поля: title (обязательное), description (textarea), status (select), обложка (upload)
- [ ] CoverUploader: выбор файла, превью, ограничение 2МБ, кроп (если возможно) или fit
- [ ] При сохранении: создаёт/обновляет цель

**Зависимости:** → M-16, M-02

---

### [ ] M-36. GoalDetails — экран цели

**AC:**
- [ ] `components/goals/GoalDetails.tsx`
- [ ] Верхняя часть: обложка (на всю ширину), title, description, статус
- [ ] Нижняя часть: список задач, привязанных к цели (`TaskList` с фильтром по `goal_id`)
- [ ] Кнопка «+» создаёт задачу с предвыбранной целью
- [ ] Кнопка редактирования → `GoalForm`
- [ ] Кнопка удаления → `ConfirmDialog` → soft delete

**Зависимости:** → M-35, M-27, M-28, M-24

---

### [ ] M-37. GoalsPage

**AC:**
- [ ] `pages/GoalsPage.tsx`
- [ ] Содержит `GoalList` + FAB «+» для создания цели
- [ ] FAB открывает `GoalForm`

**Зависимости:** → M-34, M-35, M-22

---

### [ ] M-38. GoalDetailPage

**AC:**
- [ ] `pages/GoalDetailPage.tsx`
- [ ] Читает `id` из URL params
- [ ] Если цель не найдена → редирект на `/goals`
- [ ] Рендерит `GoalDetails`

**Зависимости:** → M-36, M-03

---

### [ ] M-39. Hook: useGoals

**AC:**
- [ ] `hooks/useGoals.ts`
- [ ] Dexie `liveQuery`, реактивное обновление
- [ ] Возвращает: `goals`, `isLoading`, `createGoal`, `updateGoal`, `deleteGoal`

**Зависимости:** → M-16, M-08

---

## Фаза 6: Контексты и категории

### [ ] M-40. ContextList + ContextForm

**AC:**
- [ ] `components/contexts/ContextList.tsx` — список контекстов с возможностью редактирования и удаления
- [ ] `components/contexts/ContextForm.tsx` — создание/редактирование (поле name)
- [ ] Удаление через `ConfirmDialog`
- [ ] При удалении контекста отображается предупреждение о количестве связанных задач

**Зависимости:** → M-17, M-24

---

### [ ] M-41. ContextsPage

**AC:**
- [ ] `pages/ContextsPage.tsx`
- [ ] Содержит `ContextList` + кнопка создания
- [ ] Inline-редактирование или модалка

**Зависимости:** → M-40, M-22

---

### [ ] M-42. CategoryList + CategoryForm

**AC:**
- [ ] Аналогично M-40 для категорий
- [ ] `components/categories/CategoryList.tsx`, `CategoryForm.tsx`

**Зависимости:** → M-18, M-24

---

### [ ] M-43. CategoriesPage

**AC:**
- [ ] Аналогично M-41 для категорий

**Зависимости:** → M-42, M-22

---

### [ ] M-44. Hook: useContexts + useCategories

**AC:**
- [ ] `hooks/useContexts.ts`, `hooks/useCategories.ts`
- [ ] Dexie `liveQuery`
- [ ] CRUD-операции через сервисы

**Зависимости:** → M-17, M-18, M-08

---

## Фаза 7: Поиск и настройки

### [ ] M-45. SearchDialog

**AC:**
- [ ] `components/search/SearchDialog.tsx`
- [ ] Открывается по кнопке в Header или Cmd+K / Ctrl+K
- [ ] Поиск по задачам (title + notes) и целям (title + description)
- [ ] Debounce ввода: 300мс
- [ ] Результаты группируются: «Задачи», «Цели»
- [ ] Клик по результату → навигация к сущности
- [ ] Пустой запрос → пусто, нет результатов → сообщение

**Зависимости:** → M-15, M-16, M-02

---

### [ ] M-46. Настройки: акцентный цвет

**AC:**
- [ ] `components/shared/ColorPicker.tsx` — выбор из 5 цветов (green, orange, purple, yellow, crimson)
- [ ] Каждый цвет — круглый элемент с превью
- [ ] При выборе: сохраняется в Settings, CSS custom properties обновляются на `:root`
- [ ] `styles/themes.ts` содержит маппинг цвет → набор CSS custom properties (primary, primary-foreground и т.д.)
- [ ] Цвет применяется мгновенно без перезагрузки

**Зависимости:** → M-13, M-02

---

### [ ] M-47. Настройки: коробка по умолчанию

**AC:**
- [ ] В SettingsPage: select для выбора `default_box` (inbox/today/week/later)
- [ ] При создании задачи через FAB (не из конкретной коробки) — используется `default_box`
- [ ] `/` редиректит на выбранную коробку

**Зависимости:** → M-13, M-28

---

### [ ] M-48. SettingsPage

**AC:**
- [ ] `pages/SettingsPage.tsx`
- [ ] Секции: «Внешний вид» (акцентный цвет), «Задачи» (коробка по умолчанию), «Синхронизация» (статус, URL бэкенда, кнопка отключения)
- [ ] Все изменения сохраняются мгновенно (auto-save)

**Зависимости:** → M-46, M-47, M-22

---

### [ ] M-49. Hook: useSettings

**AC:**
- [ ] `hooks/useSettings.ts`
- [ ] Методы: `getSetting(key)`, `setSetting(key, value)`, `settings` (все)
- [ ] Реактивное обновление через Dexie

**Зависимости:** → M-13, M-08

---

## Фаза 8: Backend — CRUD и синхронизация

### [ ] M-50. Backend: action `init`

**AC:**
- [ ] Создаёт папку «Clear Progress» в корне Google Drive (если не существует)
- [ ] Создаёт «Clear Progress Data.gsheet» внутри папки (если не существует)
- [ ] Создаёт 6 листов: Tasks, Goals, Contexts, Categories, Checklist_Items, Settings
- [ ] Каждый лист получает заголовочную строку с названиями полей
- [ ] Создаёт папку «Covers» внутри «Clear Progress» (если не существует)
- [ ] Идемпотентен: повторный вызов не дублирует структуру
- [ ] Сохраняет ID spreadsheet и папки в Script Properties
- [ ] Возвращает `{ ok: true }`

**Зависимости:** → M-04

---

### [ ] M-51. Backend: sheets client

**AC:**
- [ ] `sheets/client.ts` — получение SpreadsheetApp по ID из Script Properties
- [ ] Методы: `getSheet(name)`, `getSpreadsheet()`
- [ ] Кеширование в рамках одного запроса (GAS execution)
- [ ] Если spreadsheet не найден → ошибка `not_initialized`

**Зависимости:** → M-50

---

### [ ] M-52. Backend: CRUD для каждого листа

**AC:**
- [ ] Файлы: `tasks.sheet.ts`, `goals.sheet.ts`, `contexts.sheet.ts`, `categories.sheet.ts`, `checklists.sheet.ts`, `settings.sheet.ts`
- [ ] Каждый файл: `getAll()`, `getByVersion(minVersion)`, `upsert(record)`, `bulkUpsert(records)`
- [ ] `getAll` возвращает все строки как объекты
- [ ] `getByVersion` возвращает строки с `version > minVersion`
- [ ] `upsert` находит строку по `id`, обновляет или добавляет новую
- [ ] Корректная работа с пустыми строками и типами данных

**Зависимости:** → M-51

---

### [ ] M-53. Backend: action `pull`

**AC:**
- [ ] Принимает: `{ versions: { tasks: N, goals: N, contexts: N, categories: N, checklist_items: N, settings: N } }`
- [ ] Для каждой сущности возвращает записи с `version > N`
- [ ] Ответ: `{ ok: true, data: { tasks: [...], goals: [...], ... } }`
- [ ] Если `versions` не передан — возвращает все записи (initial pull)

**Зависимости:** → M-52

---

### [ ] M-54. Backend: action `push`

**AC:**
- [ ] Принимает: `{ changes: { tasks: [...], goals: [...], ... } }`
- [ ] Для каждой записи: сравнивает `updated_at` с серверной версией
- [ ] Last-write-wins: если клиентская `updated_at` ≥ серверной → принимает (`accepted` / `created`)
- [ ] Если клиентская `updated_at` < серверной → `conflict`, возвращает `server_record`
- [ ] Ответ: `{ ok: true, results: { tasks: [{ id, status, server_record? }], ... } }`

**Зависимости:** → M-52

---

### [ ] M-55. Backend: validation helper

**AC:**
- [ ] `helpers/validation.ts`
- [ ] Валидация входных данных для push: обязательные поля, типы, допустимые значения (box, status)
- [ ] Возвращает массив ошибок или пустой массив
- [ ] Невалидные записи отклоняются с `status: 'error'`

**Зависимости:** → M-04

---

### [ ] M-56. Backend: action `upload_cover`

**AC:**
- [ ] Принимает: `{ goal_id, filename, data }` (data — base64)
- [ ] Проверяет размер (≤2МБ после декодирования)
- [ ] Вычисляет SHA-256 хеш, проверяет дедупликацию в папке Covers
- [ ] Если файл с таким хешем уже есть — использует существующий
- [ ] Сохраняет файл в папку Covers, возвращает `file_id`
- [ ] Обновляет `cover_file_id` у цели

**Зависимости:** → M-50, M-52

---

### [ ] M-57. Backend: action `delete_cover`

**AC:**
- [ ] Принимает: `{ goal_id }`
- [ ] Проверяет, что файл не используется другими целями (ref_count)
- [ ] Если ref_count = 0 → удаляет файл из Drive
- [ ] Очищает `cover_file_id` у цели
- [ ] Возвращает `{ ok: true }`

**Зависимости:** → M-50, M-52

---

## Фаза 9: Синхронизация (frontend)

### [ ] M-58. API Service

**AC:**
- [ ] `services/api.service.ts`
- [ ] Базовый метод `request(action, payload?)` — fetch к GAS URL
- [ ] GAS Web App отвечает с редиректом → обработка `redirect: 'follow'`
- [ ] Таймаут: 30 секунд
- [ ] Обработка ошибок: сетевые, HTTP, JSON-парсинг
- [ ] Методы: `ping()`, `init()`, `pull(versions)`, `push(changes)`, `uploadCover(goalId, file)`, `deleteCover(goalId)`

**Зависимости:** → M-05

---

### [ ] M-59. Sync Service

**AC:**
- [ ] `services/sync.service.ts`
- [ ] `pullChanges()`: вызывает `api.pull`, мерджит данные в IndexedDB (обновляет если серверная version > локальной)
- [ ] `pushChanges()`: собирает записи с `version > lastPushedVersion`, вызывает `api.push`, обрабатывает конфликты
- [ ] `fullSync()`: pull → push → pull (для подхвата результатов push)
- [ ] Debounce push: 5 секунд после последнего изменения
- [ ] Периодический pull: каждые 5 минут
- [ ] Очередь: не допускает параллельных sync-операций
- [ ] Статус: `idle`, `pulling`, `pushing`, `error`
- [ ] Учёт offline: если сеть недоступна — копит изменения, sync при восстановлении

**Зависимости:** → M-58, M-09, M-10, M-11, M-12, M-13, M-14

---

### [ ] M-60. Hook: useSync

**AC:**
- [ ] `hooks/useSync.ts`
- [ ] Возвращает: `syncStatus`, `lastSyncAt`, `isOnline`, `forcePull()`, `forcePush()`
- [ ] Подписывается на `navigator.onLine`
- [ ] Запускает `fullSync` при монтировании и при восстановлении сети
- [ ] Запускает периодический pull (setInterval)

**Зависимости:** → M-59

---

### [ ] M-61. SyncIndicator

**AC:**
- [ ] `components/shared/SyncIndicator.tsx`
- [ ] Отображает текущий статус: иконка облака (synced / syncing / error / offline)
- [ ] Располагается в Header или Sidebar
- [ ] Клик → показывает детали (последний sync, ошибка)

**Зависимости:** → M-60

---

### [ ] M-62. SetupPage — подключение бэкенда

**AC:**
- [ ] `pages/SetupPage.tsx`
- [ ] Поле ввода GAS URL
- [ ] Кнопка «Проверить» → вызывает `ping`, показывает результат
- [ ] Если `initialized: false` → кнопка «Инициализировать» → вызывает `init`
- [ ] Если `initialized: true` → кнопка «Подключить» → сохраняет URL в Settings, запускает fullSync
- [ ] Валидация URL (формат GAS Exec URL)
- [ ] Возможность отключить бэкенд (удалить URL из Settings)

**Зависимости:** → M-58, M-48

---

## Фаза 10: PWA

### [ ] M-63. PWA: manifest и иконки

**AC:**
- [ ] `manifest.webmanifest`: name, short_name, icons (192, 512), start_url, display: standalone, theme_color, background_color
- [ ] Иконки в формате PNG
- [ ] Meta-теги в `index.html`: theme-color, apple-touch-icon, viewport

**Зависимости:** → M-01

---

### [ ] M-64. PWA: Service Worker

**AC:**
- [ ] `vite-plugin-pwa` настроен в `vite.config.ts`
- [ ] Стратегия: `generateSW` (Workbox)
- [ ] Precache: все статические ресурсы (JS, CSS, HTML, иконки)
- [ ] Runtime cache: шрифты (cache-first), API запросы (network-first)
- [ ] Offline fallback: приложение работает из кеша
- [ ] Обновление: prompt пользователю при наличии новой версии

**Зависимости:** → M-63

---

### [ ] M-65. Cover Service (frontend)

**AC:**
- [ ] `services/cover.service.ts`
- [ ] `uploadCover(goalId, file)`: валидация размера (≤2МБ), конвертация в base64, вызов `api.uploadCover`, обновление `cover_file_id` в IndexedDB
- [ ] `deleteCover(goalId)`: вызов `api.deleteCover`, очистка `cover_file_id`
- [ ] `getCoverUrl(fileId)`: формирует URL для превью (Google Drive thumbnail link)
- [ ] Обработка ошибок: файл слишком большой, сеть недоступна

**Зависимости:** → M-58, M-10

---

## Фаза 11: Полировка MVP

### [ ] M-66. Drag-and-drop сортировка

**AC:**
- [ ] Задачи внутри коробки можно перетаскивать для изменения порядка
- [ ] Обновляется `sort_order` у затронутых задач
- [ ] На мобильных: long press → drag
- [ ] Цели на GoalsPage также можно переупорядочить
- [ ] Контексты и категории — drag-and-drop в списке

**Зависимости:** → M-30, M-37, M-41, M-43

---

### [ ] M-67. Обработка ошибок и edge cases

**AC:**
- [ ] Глобальный error boundary (React)
- [ ] Toast-уведомления для ошибок sync и CRUD
- [ ] Обработка случая: бэкенд не подключён (работаем только локально)
- [ ] Обработка случая: IndexedDB недоступна (предупреждение)
- [ ] Обработка случая: quota exceeded

**Зависимости:** → M-62, M-60

---

### [ ] M-68. Адаптивная вёрстка и финальная полировка

**AC:**
- [ ] Тестирование на экранах: 320px, 375px, 768px, 1024px, 1440px
- [ ] Все интерактивные элементы имеют touch target ≥ 44px
- [ ] Анимации: переходы между страницами, появление/скрытие элементов
- [ ] Скелетоны загрузки (skeleton screens) вместо спиннеров
- [ ] Тёмная тема: учёт prefers-color-scheme (если в scope)

**Зависимости:** → все задачи MVP

---

---

## Фаза 12: v1.1 — Чеклисты

### [ ] V1-01. ChecklistPanel

**AC:**
- [ ] `components/checklists/ChecklistPanel.tsx`
- [ ] Встраивается в TaskDetails / TaskForm
- [ ] Отображает список подзадач с checkbox и title
- [ ] Кнопка «+ Добавить пункт» внизу
- [ ] Inline-редактирование title
- [ ] Drag-and-drop для reorder
- [ ] Свайп влево для удаления пункта
- [ ] Прогресс-бар: N из M выполнено

**Зависимости:** → M-19, M-25

---

### [ ] V1-02. ChecklistItem

**AC:**
- [ ] `components/checklists/ChecklistItem.tsx`
- [ ] Checkbox + editable title
- [ ] Завершённые — strikethrough
- [ ] Анимация при завершении

**Зависимости:** → V1-01

---

### [ ] V1-03. Hook: useChecklists

**AC:**
- [ ] `hooks/useChecklists.ts`
- [ ] Dexie liveQuery по `task_id`
- [ ] CRUD через checklist service

**Зависимости:** → M-19, M-08

---

## Фаза 13: v1.1 — Повторяющиеся задачи

### [ ] V1-04. Модель повторений

**AC:**
- [ ] Поле `repeat_rule` в Task: `{ type: 'daily' | 'weekly' | 'monthly' | 'custom', interval: number, days_of_week?: number[], end_date?: string }`
- [ ] При завершении повторяющейся задачи: создаётся новая копия с очищенным `is_completed`, обновлённым `created_at`
- [ ] Оригинал остаётся завершённым в истории
- [ ] Новая задача наследует: title, notes, box, goal_id, context_id, category_id, repeat_rule, чеклист (с очищенными is_completed)

**Зависимости:** → M-05, M-15

---

### [ ] V1-05. UI повторений в TaskForm

**AC:**
- [ ] Новое поле в TaskForm: «Повторение»
- [ ] Варианты: Нет, Каждый день, Каждую неделю, Каждый месяц, Настроить
- [ ] «Настроить» → выбор интервала, дней недели, даты окончания
- [ ] Иконка повторения на TaskItem

**Зависимости:** → V1-04, M-28

---

### [ ] V1-06. Логика пересоздания повторяющихся задач

**AC:**
- [ ] При вызове `completeTask` для задачи с `repeat_rule`:
  1. Завершает текущую задачу
  2. Создаёт новую с `sort_order` = 0 (вверх списка)
  3. Копирует чеклист с `is_completed: false`
- [ ] Toast: «Задача завершена. Создана следующая повторяющаяся задача.»

**Зависимости:** → V1-04, M-15, M-19

---

## Фаза 14: v1.1 — Режим «Фокус»

### [ ] V1-07. Настройка focus_entity

**AC:**
- [ ] В Settings: выбор `focus_entity` — цель или контекст, на который фокусируемся
- [ ] Формат: `{ type: 'goal' | 'context', id: string }` или `null`

**Зависимости:** → M-13

---

### [ ] V1-08. Фокус-режим в UI

**AC:**
- [ ] Когда `focus_entity` установлен:
  - В коробках задач (today/week/later) задачи фокусной сущности визуально выделяются (accent border/background)
  - Опционально: фильтр «Только фокус»
  - В Sidebar: индикатор текущего фокуса
- [ ] Быстрое переключение фокуса из Sidebar или Settings

**Зависимости:** → V1-07, M-30, M-20

---

## Фаза 15: v1.1 — Панель быстрых свойств и обработка входящих

### [ ] V1-09. Панель быстрых свойств

**AC:**
- [ ] Настройка `quick_property` в Settings: выбор свойства, показываемого на панели под задачей (goal / context / category / box)
- [ ] На TaskItem при включённой настройке: тап по задаче раскрывает inline-панель для быстрого изменения выбранного свойства
- [ ] Панель закрывается по выбору значения или тапу вне

**Зависимости:** → M-25, M-13

---

### [ ] V1-10. Обработка входящих (Inbox processing)

**AC:**
- [ ] В InboxPage: режим «Разобрать» — последовательный просмотр задач одна за другой
- [ ] Для каждой задачи: карточка с title + notes, кнопки: Today / Week / Later / Delete / Skip
- [ ] Прогресс-бар: N из M обработано
- [ ] По завершении: сообщение «Inbox Zero!» 🎉

**Зависимости:** → M-31, M-15

---

### [ ] V1-11. Копирование задачи

**AC:**
- [ ] В TaskDetails: кнопка «Дублировать»
- [ ] Создаёт копию задачи со всеми полями (кроме id, created_at, updated_at, version)
- [ ] Копирует чеклист
- [ ] Title: «Копия — {original_title}»
- [ ] Toast: «Задача скопирована»

**Зависимости:** → M-15, M-19

---

### [ ] V1-12. Настройка полей создания

**AC:**
- [ ] Настройка `creation_fields` в Settings: мультиселект полей, отображаемых в TaskForm при создании
- [ ] Доступные поля: notes, goal, context, category, repeat (v1.1)
- [ ] По умолчанию: только title + box
- [ ] Остальные поля доступны через «Ещё» или при редактировании

**Зависимости:** → M-28, M-13

---

### [ ] V1-13. Настройка пунктов меню

**AC:**
- [ ] Настройка `menu_items` в Settings: выбор видимых пунктов Sidebar и их порядок
- [ ] Настройка `menu_always_visible`: показывать ли Sidebar всегда на десктопе
- [ ] Применяется мгновенно

**Зависимости:** → M-20, M-13

---

### [ ] V1-14. Настройка полей Inbox

**AC:**
- [ ] Настройка `inbox_fields` в Settings: какие поля показывать при быстром создании из Inbox
- [ ] Может отличаться от `creation_fields`

**Зависимости:** → V1-12, M-31

---

## Фаза 16: v1.1 — Синхронизация чеклистов и повторений

### [ ] V1-15. Обновление push/pull для чеклистов

**AC:**
- [ ] `sync.service` включает `checklist_items` в pull/push
- [ ] Backend `pull` и `push` обрабатывают лист Checklist_Items
- [ ] Конфликты чеклистов разрешаются по `updated_at` (last-write-wins)

**Зависимости:** → M-59, M-53, M-54, M-14

---

### [ ] V1-16. Обновление push/pull для repeat_rule

**AC:**
- [ ] Поле `repeat_rule` сериализуется как JSON-строка в Google Sheets
- [ ] Pull десериализует обратно в объект
- [ ] Push сериализует перед отправкой

**Зависимости:** → V1-04, M-59

---

---

## Фаза 17: v2.0 — Статистика

### [ ] V2-01. Модель данных статистики

**AC:**
- [ ] Статистика вычисляется на клиенте из существующих данных (задачи с `is_completed: true`, `completed_at`)
- [ ] Метрики: задач завершено (за день/неделю/месяц/всё время), streak (дней подряд с завершёнными задачами), завершено по коробкам, завершено по целям, среднее задач в день
- [ ] Не требует нового листа — чистая агрегация

**Зависимости:** → M-09

---

### [ ] V2-02. StatsPage

**AC:**
- [ ] `pages/StatsPage.tsx`
- [ ] Секции: «Обзор» (карточки с ключевыми метриками), «По дням» (bar chart — задачи за последние 30 дней), «По целям» (pie chart / horizontal bars), «Streak» (текущий + рекордный)
- [ ] Графики: Recharts или Chart.js
- [ ] Период: переключатель (неделя / месяц / всё время)

**Зависимости:** → V2-01, M-22

---

### [ ] V2-03. Добавление Stats в навигацию

**AC:**
- [ ] Новый пункт в Sidebar: «Статистика»
- [ ] Маршрут `/stats`
- [ ] Иконка: bar-chart или trending-up

**Зависимости:** → V2-02, M-20, M-03

---

## Фаза 18: v2.0 — Шаринг

### [ ] V2-04. Шаринг Google Sheets

**AC:**
- [ ] В Settings: кнопка «Поделиться данными»
- [ ] Открывает Google Drive sharing dialog (или генерирует ссылку)
- [ ] Другой пользователь может подключить чужой spreadsheet как read-only
- [ ] Новый action бэкенда: `get_share_link`

**Зависимости:** → M-50, M-62

---

### [ ] V2-05. Read-only режим

**AC:**
- [ ] Если подключён чужой spreadsheet → приложение работает в read-only
- [ ] Все кнопки создания/редактирования скрыты
- [ ] Индикатор «Режим просмотра» в Header
- [ ] Pull работает, push заблокирован

**Зависимости:** → V2-04, M-59

---

## Фаза 19: v2.0 — Purge и обслуживание

### [ ] V2-06. Backend: action `purge`

**AC:**
- [ ] Удаляет из Google Sheets строки с `is_deleted: true` старше N дней (по умолчанию 30)
- [ ] Параметр: `{ older_than_days?: number }`
- [ ] Возвращает количество удалённых строк по каждой сущности
- [ ] Удаляет осиротевшие обложки (файлы в Covers без ссылок из Goals)

**Зависимости:** → M-52

---

### [ ] V2-07. Purge в Settings UI

**AC:**
- [ ] В SettingsPage секция «Обслуживание»
- [ ] Кнопка «Очистить удалённые записи»
- [ ] Показывает количество soft-deleted записей
- [ ] ConfirmDialog перед выполнением
- [ ] Результат: toast с количеством удалённых

**Зависимости:** → V2-06, M-48, M-58

---

### [ ] V2-08. Автоматическая очистка IndexedDB

**AC:**
- [ ] При pull: если запись с `is_deleted: true` и `updated_at` старше 30 дней → удаляется из IndexedDB (hard delete на клиенте)
- [ ] Уменьшает объём локальной БД

**Зависимости:** → M-59

---

## Фаза 20: Финализация v2.0

### [ ] V2-09. E2E-тестирование

**AC:**
- [ ] Ключевые сценарии покрыты тестами: создание задачи, перемещение между коробками, завершение, создание цели, подключение бэкенда, sync flow
- [ ] Тестовый фреймворк: Playwright или Cypress
- [ ] CI: тесты запускаются при PR

**Зависимости:** → все задачи v2.0

---

### [ ] V2-10. Performance-оптимизация

**AC:**
- [ ] Lighthouse PWA score ≥ 90
- [ ] Lighthouse Performance score ≥ 90
- [ ] Bundle size: lazy loading для страниц (React.lazy + Suspense)
- [ ] Виртуализация длинных списков (>100 задач): react-window или react-virtuoso
- [ ] IndexedDB: batch-операции при sync

**Зависимости:** → все задачи v2.0

---

### [ ] V2-11. Документация

**AC:**
- [ ] README.md: описание проекта, скриншоты, инструкция по запуску
- [ ] CONTRIBUTING.md: гайд по разработке
- [ ] Инструкция для пользователя: как задеплоить GAS, как подключить
- [ ] Inline JSDoc для публичных API сервисов

**Зависимости:** → все задачи v2.0

---

## Граф зависимостей (ключевые пути)

```
M-01 → M-02 → M-20 → M-22 → [все страницы]
M-01 → M-03 → [все страницы]
M-01 → M-05 → M-08 → M-09..M-14 → M-15..M-19 → [все компоненты задач/целей]
M-04 → M-50 → M-51 → M-52 → M-53, M-54 → M-58 → M-59 → M-60
M-59 + M-09..M-14 → полная синхронизация
MVP → V1-01..V1-16 → V2-01..V2-11
```

**Критический путь MVP:**
M-01 → M-05 → M-08 → M-09 → M-15 → M-32 → M-25 → M-27 → M-30 (работающий список задач в коробке)

Параллельно: M-04 → M-50..M-54 (бэкенд готов к моменту, когда фронт дойдёт до sync)
