# Clear Progress — API Examples

**Подробные примеры вызовов всех эндпоинтов**

Версия 1.0 | Март 2026

---

## Соглашения

- `{WEB_APP_URL}` = `https://script.google.com/macros/s/{DEPLOY_ID}/exec`
- Все UUID — формат v4: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- Все даты — ISO 8601 UTC: `YYYY-MM-DDTHH:mm:ss.sssZ`
- `version` — целое число, начинается с 1, увеличивается на 1 при каждом изменении

---

## 1. GET ping

### 1.1. Успешный ping — система инициализирована

**Request**

```
GET {WEB_APP_URL}?action=ping
```

**Response (200)**

```json
{
  "ok": true,
  "app": "clear_progress",
  "version": "1.0",
  "initialized": true
}
```

### 1.2. Успешный ping — система НЕ инициализирована

**Request**

```
GET {WEB_APP_URL}?action=ping
```

**Response (200)**

```json
{
  "ok": true,
  "app": "clear_progress",
  "version": "1.0",
  "initialized": false
}
```

> Клиент должен вызвать `init` перед использованием остальных эндпоинтов.

---

## 2. POST init

### 2.1. Первый вызов — создание структуры

**Request**

```
POST {WEB_APP_URL}
Content-Type: application/json
```

```json
{
  "action": "init"
}
```

**Response (200)**

```json
{
  "ok": true,
  "created": true,
  "spreadsheet_id": "1BxOa7m2kQ3r5TvZ9pLnYjW8dCfEgHiKlMnOpQrStUv",
  "folder_id": "0B7x_K2mN3pQ4rS5tU6vW7xY8zA"
}
```

### 2.2. Повторный вызов — структура уже существует

**Request**

```json
{
  "action": "init"
}
```

**Response (200)**

```json
{
  "ok": true,
  "created": false,
  "spreadsheet_id": "1BxOa7m2kQ3r5TvZ9pLnYjW8dCfEgHiKlMnOpQrStUv",
  "folder_id": "0B7x_K2mN3pQ4rS5tU6vW7xY8zA"
}
```

> `created: false` — структура не пересоздавалась, ID вернулись из PropertiesService.

---

## 3. POST pull

### 3.1. Первый pull — все версии = 0

Клиент впервые синхронизируется. Сервер возвращает все данные целиком + настройки по умолчанию.

**Request**

```
POST {WEB_APP_URL}
Content-Type: application/json
```

```json
{
  "action": "pull",
  "versions": {
    "tasks": 0,
    "goals": 0,
    "contexts": 0,
    "categories": 0,
    "checklist_items": 0
  }
}
```

**Response (200) — пустая база после init**

```json
{
  "ok": true,
  "data": {
    "tasks": [],
    "goals": [],
    "contexts": [],
    "categories": [],
    "checklist_items": []
  },
  "settings": [
    { "key": "default_box", "value": "inbox", "updated_at": "2026-03-04T10:00:00.000Z" },
    { "key": "accent_color", "value": "green", "updated_at": "2026-03-04T10:00:00.000Z" }
  ],
  "server_time": "2026-03-04T10:00:01.000Z"
}
```

### 3.2. Первый pull — база с данными

Сервер уже содержит записи (пользователь работал с другого устройства).

**Request**

```json
{
  "action": "pull",
  "versions": {
    "tasks": 0,
    "goals": 0,
    "contexts": 0,
    "categories": 0,
    "checklist_items": 0
  }
}
```

**Response (200)**

```json
{
  "ok": true,
  "data": {
    "tasks": [
      {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "title": "Купить продукты",
        "notes": "Молоко, хлеб, яйца, сыр",
        "box": "today",
        "goal_id": "",
        "context_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "category_id": "c4a760a8-dbcf-4e6a-9b3a-4f7c6d8e9f00",
        "is_completed": false,
        "completed_at": "",
        "repeat_rule": "",
        "sort_order": 1000,
        "is_deleted": false,
        "created_at": "2026-03-04T08:30:00.000Z",
        "updated_at": "2026-03-04T08:30:00.000Z",
        "version": 1
      },
      {
        "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        "title": "Подготовить отчёт за февраль",
        "notes": "Включить данные по продажам и маркетингу.\nОтправить директору до пятницы.",
        "box": "week",
        "goal_id": "e8b5f7d2-3c4a-4e6f-9a1b-7c8d9e0f1a2b",
        "context_id": "7d8e9f0a-1b2c-4d3e-5f6a-7b8c9d0e1f2a",
        "category_id": "b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e",
        "is_completed": false,
        "completed_at": "",
        "repeat_rule": "",
        "sort_order": 2000,
        "is_deleted": false,
        "created_at": "2026-03-03T14:20:00.000Z",
        "updated_at": "2026-03-04T09:15:00.000Z",
        "version": 2
      },
      {
        "id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
        "title": "Позвонить стоматологу",
        "notes": "",
        "box": "inbox",
        "goal_id": "",
        "context_id": "",
        "category_id": "",
        "is_completed": false,
        "completed_at": "",
        "repeat_rule": "",
        "sort_order": 3000,
        "is_deleted": false,
        "created_at": "2026-03-04T07:00:00.000Z",
        "updated_at": "2026-03-04T07:00:00.000Z",
        "version": 1
      },
      {
        "id": "c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f",
        "title": "Утренняя зарядка",
        "notes": "15 минут разминка + 20 минут силовые",
        "box": "today",
        "goal_id": "3f4a5b6c-7d8e-4f0a-1b2c-3d4e5f6a7b8c",
        "context_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "category_id": "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
        "is_completed": true,
        "completed_at": "2026-03-04T06:45:00.000Z",
        "repeat_rule": "weekdays:1,2,3,4,5",
        "sort_order": 500,
        "is_deleted": false,
        "created_at": "2026-02-15T10:00:00.000Z",
        "updated_at": "2026-03-04T06:45:00.000Z",
        "version": 38
      }
    ],
    "goals": [
      {
        "id": "e8b5f7d2-3c4a-4e6f-9a1b-7c8d9e0f1a2b",
        "title": "Запустить новый проект",
        "description": "Разработать и запустить MVP мобильного приложения для трекинга привычек до конца Q2 2026",
        "cover_file_id": "1AbCdEfGhIjKlMnOpQrStUvWxYz",
        "status": "in_progress",
        "sort_order": 1000,
        "is_deleted": false,
        "created_at": "2026-02-01T12:00:00.000Z",
        "updated_at": "2026-03-02T16:30:00.000Z",
        "version": 5
      },
      {
        "id": "3f4a5b6c-7d8e-4f0a-1b2c-3d4e5f6a7b8c",
        "title": "Здоровый образ жизни",
        "description": "Регулярные тренировки, правильное питание, режим сна",
        "cover_file_id": "",
        "status": "in_progress",
        "sort_order": 2000,
        "is_deleted": false,
        "created_at": "2026-02-10T09:00:00.000Z",
        "updated_at": "2026-02-10T09:00:00.000Z",
        "version": 1
      }
    ],
    "contexts": [
      {
        "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "name": "@Дом",
        "sort_order": 1000,
        "is_deleted": false,
        "created_at": "2026-02-01T10:00:00.000Z",
        "updated_at": "2026-02-01T10:00:00.000Z",
        "version": 1
      },
      {
        "id": "7d8e9f0a-1b2c-4d3e-5f6a-7b8c9d0e1f2a",
        "name": "@Офис",
        "sort_order": 2000,
        "is_deleted": false,
        "created_at": "2026-02-01T10:00:00.000Z",
        "updated_at": "2026-02-01T10:00:00.000Z",
        "version": 1
      },
      {
        "id": "5a6b7c8d-9e0f-4a1b-2c3d-4e5f6a7b8c9d",
        "name": "@Телефон",
        "sort_order": 3000,
        "is_deleted": false,
        "created_at": "2026-02-01T10:00:00.000Z",
        "updated_at": "2026-02-01T10:00:00.000Z",
        "version": 1
      }
    ],
    "categories": [
      {
        "id": "b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e",
        "name": "Работа",
        "sort_order": 1000,
        "is_deleted": false,
        "created_at": "2026-02-01T10:00:00.000Z",
        "updated_at": "2026-02-01T10:00:00.000Z",
        "version": 1
      },
      {
        "id": "c4a760a8-dbcf-4e6a-9b3a-4f7c6d8e9f00",
        "name": "Семья",
        "sort_order": 2000,
        "is_deleted": false,
        "created_at": "2026-02-01T10:00:00.000Z",
        "updated_at": "2026-02-01T10:00:00.000Z",
        "version": 1
      },
      {
        "id": "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
        "name": "Здоровье",
        "sort_order": 3000,
        "is_deleted": false,
        "created_at": "2026-02-01T10:00:00.000Z",
        "updated_at": "2026-02-01T10:00:00.000Z",
        "version": 1
      }
    ],
    "checklist_items": [
      {
        "id": "11111111-aaaa-4bbb-cccc-dddddddddddd",
        "task_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "title": "Молоко 2.5%",
        "is_completed": true,
        "sort_order": 1000,
        "is_deleted": false,
        "created_at": "2026-03-04T08:30:00.000Z",
        "updated_at": "2026-03-04T09:00:00.000Z",
        "version": 2
      },
      {
        "id": "22222222-aaaa-4bbb-cccc-dddddddddddd",
        "task_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "title": "Хлеб бородинский",
        "is_completed": false,
        "sort_order": 2000,
        "is_deleted": false,
        "created_at": "2026-03-04T08:30:00.000Z",
        "updated_at": "2026-03-04T08:30:00.000Z",
        "version": 1
      },
      {
        "id": "33333333-aaaa-4bbb-cccc-dddddddddddd",
        "task_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "title": "Яйца (десяток)",
        "is_completed": false,
        "sort_order": 3000,
        "is_deleted": false,
        "created_at": "2026-03-04T08:30:00.000Z",
        "updated_at": "2026-03-04T08:30:00.000Z",
        "version": 1
      },
      {
        "id": "44444444-aaaa-4bbb-cccc-dddddddddddd",
        "task_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "title": "Сыр голландский",
        "is_completed": false,
        "sort_order": 4000,
        "is_deleted": false,
        "created_at": "2026-03-04T08:30:00.000Z",
        "updated_at": "2026-03-04T08:30:00.000Z",
        "version": 1
      }
    ]
  },
  "settings": [
    { "key": "default_box", "value": "inbox", "updated_at": "2026-03-04T10:00:00.000Z" },
    { "key": "accent_color", "value": "green", "updated_at": "2026-03-04T10:00:00.000Z" }
  ],
  "server_time": "2026-03-04T10:05:00.000Z"
}
```

### 3.3. Инкрементный pull — получение изменений

Клиент уже имеет данные и запрашивает только новые изменения. Передаёт максимальные известные `version` по каждой сущности.

**Request**

```json
{
  "action": "pull",
  "versions": {
    "tasks": 38,
    "goals": 5,
    "contexts": 1,
    "categories": 1,
    "checklist_items": 2
  }
}
```

**Response (200) — есть новые изменения**

```json
{
  "ok": true,
  "data": {
    "tasks": [
      {
        "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
        "title": "Подготовить отчёт за февраль",
        "notes": "Включить данные по продажам и маркетингу.\nОтправить директору до пятницы.",
        "box": "today",
        "goal_id": "e8b5f7d2-3c4a-4e6f-9a1b-7c8d9e0f1a2b",
        "context_id": "7d8e9f0a-1b2c-4d3e-5f6a-7b8c9d0e1f2a",
        "category_id": "b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e",
        "is_completed": false,
        "completed_at": "",
        "repeat_rule": "",
        "sort_order": 2000,
        "is_deleted": false,
        "created_at": "2026-03-03T14:20:00.000Z",
        "updated_at": "2026-03-04T11:00:00.000Z",
        "version": 39
      }
    ],
    "goals": [],
    "contexts": [],
    "categories": [],
    "checklist_items": [
      {
        "id": "22222222-aaaa-4bbb-cccc-dddddddddddd",
        "task_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "title": "Хлеб бородинский",
        "is_completed": true,
        "sort_order": 2000,
        "is_deleted": false,
        "created_at": "2026-03-04T08:30:00.000Z",
        "updated_at": "2026-03-04T10:30:00.000Z",
        "version": 3
      }
    ]
  },
  "settings": [
    { "key": "default_box", "value": "inbox", "updated_at": "2026-03-04T10:00:00.000Z" },
    { "key": "accent_color", "value": "green", "updated_at": "2026-03-04T10:00:00.000Z" }
  ],
  "server_time": "2026-03-04T11:05:00.000Z"
}
```

> В этом примере изменились только одна задача (box изменился с `week` на `today`, version 2→39) и один пункт чеклиста (стал is_completed, version 1→3). Остальные массивы пусты — изменений не было.

### 3.4. Инкрементный pull — изменений нет

**Request**

```json
{
  "action": "pull",
  "versions": {
    "tasks": 39,
    "goals": 5,
    "contexts": 1,
    "categories": 1,
    "checklist_items": 3
  }
}
```

**Response (200)**

```json
{
  "ok": true,
  "data": {
    "tasks": [],
    "goals": [],
    "contexts": [],
    "categories": [],
    "checklist_items": []
  },
  "settings": [
    { "key": "default_box", "value": "inbox", "updated_at": "2026-03-04T10:00:00.000Z" },
    { "key": "accent_color", "value": "green", "updated_at": "2026-03-04T10:00:00.000Z" }
  ],
  "server_time": "2026-03-04T11:10:00.000Z"
}
```

### 3.5. Pull с удалёнными записями

Сервер возвращает записи с `is_deleted: true`, чтобы клиент узнал об удалениях.

**Response (200) — фрагмент**

```json
{
  "ok": true,
  "data": {
    "tasks": [],
    "goals": [],
    "contexts": [
      {
        "id": "5a6b7c8d-9e0f-4a1b-2c3d-4e5f6a7b8c9d",
        "name": "@Телефон",
        "sort_order": 3000,
        "is_deleted": true,
        "created_at": "2026-02-01T10:00:00.000Z",
        "updated_at": "2026-03-04T12:00:00.000Z",
        "version": 2
      }
    ],
    "categories": [],
    "checklist_items": []
  },
  "settings": [
    { "key": "default_box", "value": "inbox", "updated_at": "2026-03-04T10:00:00.000Z" },
    { "key": "accent_color", "value": "green", "updated_at": "2026-03-04T10:00:00.000Z" }
  ],
  "server_time": "2026-03-04T12:05:00.000Z"
}
```

> Контекст «@Телефон» удалён (`is_deleted: true`). Клиент должен пометить его удалённым локально и скрыть из UI.

---

## 4. POST push

### 4.1. Создание новых записей

Клиент создал задачу, контекст и пункт чеклиста офлайн и отправляет их на сервер.

**Request**

```
POST {WEB_APP_URL}
Content-Type: application/json
```

```json
{
  "action": "push",
  "changes": {
    "tasks": [
      {
        "id": "b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e",
        "title": "Записаться к врачу",
        "notes": "Терапевт, ежегодный осмотр.\nВзять с собой полис и паспорт.",
        "box": "week",
        "goal_id": "3f4a5b6c-7d8e-4f0a-1b2c-3d4e5f6a7b8c",
        "context_id": "5a6b7c8d-9e0f-4a1b-2c3d-4e5f6a7b8c9d",
        "category_id": "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
        "is_completed": false,
        "completed_at": "",
        "repeat_rule": "",
        "sort_order": 4000,
        "is_deleted": false,
        "created_at": "2026-03-04T13:00:00.000Z",
        "updated_at": "2026-03-04T13:00:00.000Z",
        "version": 1
      }
    ],
    "goals": [],
    "contexts": [
      {
        "id": "aaaabbbb-cccc-4ddd-eeee-ffffffffffff",
        "name": "@Поликлиника",
        "sort_order": 4000,
        "is_deleted": false,
        "created_at": "2026-03-04T12:55:00.000Z",
        "updated_at": "2026-03-04T12:55:00.000Z",
        "version": 1
      }
    ],
    "categories": [],
    "checklist_items": [
      {
        "id": "55555555-aaaa-4bbb-cccc-dddddddddddd",
        "task_id": "b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e",
        "title": "Позвонить в регистратуру",
        "is_completed": false,
        "sort_order": 1000,
        "is_deleted": false,
        "created_at": "2026-03-04T13:00:00.000Z",
        "updated_at": "2026-03-04T13:00:00.000Z",
        "version": 1
      },
      {
        "id": "66666666-aaaa-4bbb-cccc-dddddddddddd",
        "task_id": "b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e",
        "title": "Найти полис ОМС",
        "is_completed": false,
        "sort_order": 2000,
        "is_deleted": false,
        "created_at": "2026-03-04T13:00:00.000Z",
        "updated_at": "2026-03-04T13:00:00.000Z",
        "version": 1
      }
    ],
    "settings": []
  }
}
```

**Response (200)**

```json
{
  "ok": true,
  "results": {
    "tasks": [
      { "id": "b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e", "status": "created", "version": 1 }
    ],
    "goals": [],
    "contexts": [
      { "id": "aaaabbbb-cccc-4ddd-eeee-ffffffffffff", "status": "created", "version": 1 }
    ],
    "categories": [],
    "checklist_items": [
      { "id": "55555555-aaaa-4bbb-cccc-dddddddddddd", "status": "created", "version": 1 },
      { "id": "66666666-aaaa-4bbb-cccc-dddddddddddd", "status": "created", "version": 1 }
    ],
    "settings": []
  },
  "server_time": "2026-03-04T13:00:02.000Z"
}
```

### 4.2. Обновление существующих записей

Клиент завершил задачу и переименовал контекст.

**Request**

```json
{
  "action": "push",
  "changes": {
    "tasks": [
      {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "title": "Купить продукты",
        "notes": "Молоко, хлеб, яйца, сыр",
        "box": "today",
        "goal_id": "",
        "context_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "category_id": "c4a760a8-dbcf-4e6a-9b3a-4f7c6d8e9f00",
        "is_completed": true,
        "completed_at": "2026-03-04T14:30:00.000Z",
        "repeat_rule": "",
        "sort_order": 1000,
        "is_deleted": false,
        "created_at": "2026-03-04T08:30:00.000Z",
        "updated_at": "2026-03-04T14:30:00.000Z",
        "version": 2
      }
    ],
    "goals": [],
    "contexts": [
      {
        "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "name": "@Дом / Дача",
        "sort_order": 1000,
        "is_deleted": false,
        "created_at": "2026-02-01T10:00:00.000Z",
        "updated_at": "2026-03-04T14:25:00.000Z",
        "version": 2
      }
    ],
    "categories": [],
    "checklist_items": [],
    "settings": []
  }
}
```

**Response (200)**

```json
{
  "ok": true,
  "results": {
    "tasks": [
      { "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "status": "accepted", "version": 3 }
    ],
    "goals": [],
    "contexts": [
      { "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d", "status": "accepted", "version": 2 }
    ],
    "categories": [],
    "checklist_items": [],
    "settings": []
  },
  "server_time": "2026-03-04T14:30:02.000Z"
}
```

> Сервер увеличил version задачи (2→3). Клиент должен обновить локальную version.

### 4.3. Push с конфликтом

Клиент отправляет устаревшие изменения — серверная запись новее.

**Сценарий:** Клиент A изменил задачу в 14:30. Клиент B (офлайн с 14:00) пытается отправить свои изменения той же задачи с `updated_at: 14:15`.

**Request (от клиента B)**

```json
{
  "action": "push",
  "changes": {
    "tasks": [
      {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "title": "Купить продукты и воду",
        "notes": "Молоко, хлеб, яйца, сыр, вода 5л",
        "box": "today",
        "goal_id": "",
        "context_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "category_id": "c4a760a8-dbcf-4e6a-9b3a-4f7c6d8e9f00",
        "is_completed": false,
        "completed_at": "",
        "repeat_rule": "",
        "sort_order": 1000,
        "is_deleted": false,
        "created_at": "2026-03-04T08:30:00.000Z",
        "updated_at": "2026-03-04T14:15:00.000Z",
        "version": 2
      }
    ],
    "goals": [],
    "contexts": [],
    "categories": [],
    "checklist_items": [],
    "settings": []
  }
}
```

**Response (200)**

```json
{
  "ok": true,
  "results": {
    "tasks": [
      {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "status": "conflict",
        "server_record": {
          "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
          "title": "Купить продукты",
          "notes": "Молоко, хлеб, яйца, сыр",
          "box": "today",
          "goal_id": "",
          "context_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          "category_id": "c4a760a8-dbcf-4e6a-9b3a-4f7c6d8e9f00",
          "is_completed": true,
          "completed_at": "2026-03-04T14:30:00.000Z",
          "repeat_rule": "",
          "sort_order": 1000,
          "is_deleted": false,
          "created_at": "2026-03-04T08:30:00.000Z",
          "updated_at": "2026-03-04T14:30:00.000Z",
          "version": 3
        }
      }
    ],
    "goals": [],
    "contexts": [],
    "categories": [],
    "checklist_items": [],
    "settings": []
  },
  "server_time": "2026-03-04T14:35:00.000Z"
}
```

> Клиент B должен перезаписать локальную копию серверной версией (`server_record`). Изменения клиента B потеряны — это цена стратегии last-write-wins.

### 4.4. Смешанный push — создание, обновление и конфликт в одном запросе

**Request**

```json
{
  "action": "push",
  "changes": {
    "tasks": [
      {
        "id": "eeee1111-2222-4333-4444-555566667777",
        "title": "Новая задача из офлайна",
        "notes": "",
        "box": "inbox",
        "goal_id": "",
        "context_id": "",
        "category_id": "",
        "is_completed": false,
        "completed_at": "",
        "repeat_rule": "",
        "sort_order": 5000,
        "is_deleted": false,
        "created_at": "2026-03-04T15:00:00.000Z",
        "updated_at": "2026-03-04T15:00:00.000Z",
        "version": 1
      },
      {
        "id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
        "title": "Позвонить стоматологу",
        "notes": "Записаться на чистку",
        "box": "today",
        "goal_id": "",
        "context_id": "5a6b7c8d-9e0f-4a1b-2c3d-4e5f6a7b8c9d",
        "category_id": "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
        "is_completed": false,
        "completed_at": "",
        "repeat_rule": "",
        "sort_order": 3000,
        "is_deleted": false,
        "created_at": "2026-03-04T07:00:00.000Z",
        "updated_at": "2026-03-04T15:10:00.000Z",
        "version": 2
      }
    ],
    "goals": [
      {
        "id": "e8b5f7d2-3c4a-4e6f-9a1b-7c8d9e0f1a2b",
        "title": "Запустить новый проект",
        "description": "Разработать и запустить MVP до конца Q2 2026. Обновлённое описание.",
        "cover_file_id": "1AbCdEfGhIjKlMnOpQrStUvWxYz",
        "status": "in_progress",
        "sort_order": 1000,
        "is_deleted": false,
        "created_at": "2026-02-01T12:00:00.000Z",
        "updated_at": "2026-03-01T10:00:00.000Z",
        "version": 4
      }
    ],
    "contexts": [],
    "categories": [],
    "checklist_items": [],
    "settings": [
      { "key": "accent_color", "value": "#FF5722", "updated_at": "2026-03-04T15:05:00.000Z" }
    ]
  }
}
```

**Response (200)**

```json
{
  "ok": true,
  "results": {
    "tasks": [
      { "id": "eeee1111-2222-4333-4444-555566667777", "status": "created", "version": 1 },
      { "id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a", "status": "accepted", "version": 3 }
    ],
    "goals": [
      {
        "id": "e8b5f7d2-3c4a-4e6f-9a1b-7c8d9e0f1a2b",
        "status": "conflict",
        "server_record": {
          "id": "e8b5f7d2-3c4a-4e6f-9a1b-7c8d9e0f1a2b",
          "title": "Запустить новый проект",
          "description": "Разработать и запустить MVP мобильного приложения для трекинга привычек до конца Q2 2026",
          "cover_file_id": "1AbCdEfGhIjKlMnOpQrStUvWxYz",
          "status": "in_progress",
          "sort_order": 1000,
          "is_deleted": false,
          "created_at": "2026-02-01T12:00:00.000Z",
          "updated_at": "2026-03-02T16:30:00.000Z",
          "version": 5
        }
      }
    ],
    "contexts": [],
    "categories": [],
    "checklist_items": [],
    "settings": [
      { "key": "accent_color", "status": "accepted" }
    ]
  },
  "server_time": "2026-03-04T15:10:02.000Z"
}
```

> В одном ответе: задача создана (`created`), задача обновлена (`accepted`), цель отклонена (`conflict`), настройка принята.

### 4.5. Мягкое удаление записей

Клиент удаляет задачу и пункт чеклиста (soft delete).

**Request**

```json
{
  "action": "push",
  "changes": {
    "tasks": [
      {
        "id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
        "title": "Позвонить стоматологу",
        "notes": "Записаться на чистку",
        "box": "today",
        "goal_id": "",
        "context_id": "5a6b7c8d-9e0f-4a1b-2c3d-4e5f6a7b8c9d",
        "category_id": "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
        "is_completed": false,
        "completed_at": "",
        "repeat_rule": "",
        "sort_order": 3000,
        "is_deleted": true,
        "created_at": "2026-03-04T07:00:00.000Z",
        "updated_at": "2026-03-04T16:00:00.000Z",
        "version": 4
      }
    ],
    "goals": [],
    "contexts": [],
    "categories": [],
    "checklist_items": [
      {
        "id": "55555555-aaaa-4bbb-cccc-dddddddddddd",
        "task_id": "b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e",
        "title": "Позвонить в регистратуру",
        "is_completed": true,
        "sort_order": 1000,
        "is_deleted": true,
        "created_at": "2026-03-04T13:00:00.000Z",
        "updated_at": "2026-03-04T16:00:00.000Z",
        "version": 3
      }
    ],
    "settings": []
  }
}
```

**Response (200)**

```json
{
  "ok": true,
  "results": {
    "tasks": [
      { "id": "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a", "status": "accepted", "version": 5 }
    ],
    "goals": [],
    "contexts": [],
    "categories": [],
    "checklist_items": [
      { "id": "55555555-aaaa-4bbb-cccc-dddddddddddd", "status": "accepted", "version": 4 }
    ],
    "settings": []
  },
  "server_time": "2026-03-04T16:00:02.000Z"
}
```

> Записи помечены `is_deleted: true` на сервере. Они останутся в Sheets до вызова `purge`.

### 4.6. Push с обновлением настроек

**Request**

```json
{
  "action": "push",
  "changes": {
    "tasks": [],
    "goals": [],
    "contexts": [],
    "categories": [],
    "checklist_items": [],
    "settings": [
      { "key": "default_box", "value": "today", "updated_at": "2026-03-04T17:00:00.000Z" },
      { "key": "accent_color", "value": "purple", "updated_at": "2026-03-04T17:00:00.000Z" },
      { "key": "creation_fields", "value": "[\"goal\",\"context\",\"notes\"]", "updated_at": "2026-03-04T17:00:00.000Z" },
      { "key": "quick_property", "value": "context", "updated_at": "2026-03-04T17:00:00.000Z" },
      { "key": "menu_always_visible", "value": "true", "updated_at": "2026-03-04T17:00:00.000Z" },
      { "key": "menu_items", "value": "[\"inbox\",\"goals\",\"tasks\",\"completed\"]", "updated_at": "2026-03-04T17:00:00.000Z" },
      { "key": "inbox_fields", "value": "[\"context\",\"goal\"]", "updated_at": "2026-03-04T17:00:00.000Z" },
      { "key": "focus_entity", "value": "goal:e8b5f7d2-3c4a-4e6f-9a1b-7c8d9e0f1a2b", "updated_at": "2026-03-04T17:00:00.000Z" }
    ]
  }
}
```

**Response (200)**

```json
{
  "ok": true,
  "results": {
    "tasks": [],
    "goals": [],
    "contexts": [],
    "categories": [],
    "checklist_items": [],
    "settings": [
      { "key": "default_box", "status": "accepted" },
      { "key": "accent_color", "status": "accepted" },
      { "key": "creation_fields", "status": "accepted" },
      { "key": "quick_property", "status": "accepted" },
      { "key": "menu_always_visible", "status": "accepted" },
      { "key": "menu_items", "status": "accepted" },
      { "key": "inbox_fields", "status": "accepted" },
      { "key": "focus_entity", "status": "accepted" }
    ]
  },
  "server_time": "2026-03-04T17:00:02.000Z"
}
```

### 4.7. Push — создание цели с обложкой и привязанными задачами

Полный сценарий: создать цель → загрузить обложку → привязать задачи.

> **Шаг 1:** Сначала загрузить обложку через `upload_cover` (см. раздел 5), получить `file_id`.
> **Шаг 2:** Затем отправить push с целью и задачами.

**Request (шаг 2)**

```json
{
  "action": "push",
  "changes": {
    "tasks": [
      {
        "id": "77778888-9999-4aaa-bbbb-ccccddddeeee",
        "title": "Выбрать фреймворк",
        "notes": "Сравнить React Native, Flutter, Kotlin Multiplatform",
        "box": "today",
        "goal_id": "aabbccdd-eeff-4112-2334-556677889900",
        "context_id": "7d8e9f0a-1b2c-4d3e-5f6a-7b8c9d0e1f2a",
        "category_id": "b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e",
        "is_completed": false,
        "completed_at": "",
        "repeat_rule": "",
        "sort_order": 1000,
        "is_deleted": false,
        "created_at": "2026-03-04T18:00:00.000Z",
        "updated_at": "2026-03-04T18:00:00.000Z",
        "version": 1
      },
      {
        "id": "88889999-aaaa-4bbb-cccc-ddddeeeeffff",
        "title": "Составить ТЗ",
        "notes": "",
        "box": "week",
        "goal_id": "aabbccdd-eeff-4112-2334-556677889900",
        "context_id": "7d8e9f0a-1b2c-4d3e-5f6a-7b8c9d0e1f2a",
        "category_id": "b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e",
        "is_completed": false,
        "completed_at": "",
        "repeat_rule": "",
        "sort_order": 2000,
        "is_deleted": false,
        "created_at": "2026-03-04T18:00:00.000Z",
        "updated_at": "2026-03-04T18:00:00.000Z",
        "version": 1
      }
    ],
    "goals": [
      {
        "id": "aabbccdd-eeff-4112-2334-556677889900",
        "title": "Создать мобильное приложение",
        "description": "Кроссплатформенное приложение для учёта личных финансов",
        "cover_file_id": "1XyZ_aBcDeFgHiJkLmNoPqRsTuVwXyZ",
        "status": "not_started",
        "sort_order": 3000,
        "is_deleted": false,
        "created_at": "2026-03-04T18:00:00.000Z",
        "updated_at": "2026-03-04T18:00:00.000Z",
        "version": 1
      }
    ],
    "contexts": [],
    "categories": [],
    "checklist_items": [],
    "settings": []
  }
}
```

**Response (200)**

```json
{
  "ok": true,
  "results": {
    "tasks": [
      { "id": "77778888-9999-4aaa-bbbb-ccccddddeeee", "status": "created", "version": 1 },
      { "id": "88889999-aaaa-4bbb-cccc-ddddeeeeffff", "status": "created", "version": 1 }
    ],
    "goals": [
      { "id": "aabbccdd-eeff-4112-2334-556677889900", "status": "created", "version": 1 }
    ],
    "contexts": [],
    "categories": [],
    "checklist_items": [],
    "settings": []
  },
  "server_time": "2026-03-04T18:00:03.000Z"
}
```

---

## 5. POST upload_cover

### 5.1. Загрузка новой обложки

**Request**

```
POST {WEB_APP_URL}
Content-Type: application/json
```

```json
{
  "action": "upload_cover",
  "goal_id": "aabbccdd-eeff-4112-2334-556677889900",
  "filename": "finance_app_cover.jpg",
  "mime_type": "image/jpeg",
  "data": "/9j/4AAQSkZJRgABAQEASABIAAD/4gIcSUNDX1BST0ZJTEUAAQEAAAIMbGNtcwRAAABtbnRyUkdCIFhZWiAH5gABAAEA..."
}
```

> Поле `data` — base64-кодированное изображение без префикса `data:image/jpeg;base64,`. Здесь показан усечённый пример. Реальная строка будет значительно длиннее (до ~2.7 МБ для файла 2 МБ).

**Response (200)**

```json
{
  "ok": true,
  "file_id": "1XyZ_aBcDeFgHiJkLmNoPqRsTuVwXyZ",
  "reused": false
}
```

### 5.2. Загрузка дубликата — дедупликация

Та же картинка загружается повторно для другой цели. SHA-256 совпадает с существующим файлом.

**Request**

```json
{
  "action": "upload_cover",
  "goal_id": "3f4a5b6c-7d8e-4f0a-1b2c-3d4e5f6a7b8c",
  "filename": "healthy_living_cover.jpg",
  "mime_type": "image/jpeg",
  "data": "/9j/4AAQSkZJRgABAQEASABIAAD/4gIcSUNDX1BST0ZJTEUAAQEAAAIMbGNtcwRAAABtbnRyUkdCIFhZWiAH5gABAAEA..."
}
```

**Response (200)**

```json
{
  "ok": true,
  "file_id": "1XyZ_aBcDeFgHiJkLmNoPqRsTuVwXyZ",
  "reused": true
}
```

> `reused: true` — новый файл не создан. Обе цели будут ссылаться на один и тот же `file_id`. Это нормально и корректно.

### 5.3. Загрузка PNG-обложки

**Request**

```json
{
  "action": "upload_cover",
  "goal_id": "e8b5f7d2-3c4a-4e6f-9a1b-7c8d9e0f1a2b",
  "filename": "project_banner.png",
  "mime_type": "image/png",
  "data": "iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAYAAADL1t+KAAA..."
}
```

**Response (200)**

```json
{
  "ok": true,
  "file_id": "1MnOpQrStUvWxYzAbCdEfGhIjKlMnOp",
  "reused": false
}
```

---

## 6. POST delete_cover

### 6.1. Удаление обложки — файл больше не используется

**Request**

```
POST {WEB_APP_URL}
Content-Type: application/json
```

```json
{
  "action": "delete_cover",
  "file_id": "1MnOpQrStUvWxYzAbCdEfGhIjKlMnOp"
}
```

**Response (200)**

```json
{
  "ok": true,
  "deleted": true,
  "ref_count": 0
}
```

> Файл физически удалён с Google Drive.

### 6.2. Удаление обложки — файл используется другой целью

Файл `1XyZ...` используется двумя целями (дедупликация). Одна цель сменила обложку, клиент просит удалить старую.

**Request**

```json
{
  "action": "delete_cover",
  "file_id": "1XyZ_aBcDeFgHiJkLmNoPqRsTuVwXyZ"
}
```

**Response (200)**

```json
{
  "ok": true,
  "deleted": false,
  "ref_count": 1,
  "message": "Файл используется другими целями"
}
```

> Файл не удалён: ещё 1 цель ссылается на него. Клиент может безопасно убрать `cover_file_id` из своей цели, но файл на Drive останется.

### 6.3. Удаление обложки — файл не найден

**Request**

```json
{
  "action": "delete_cover",
  "file_id": "1NONEXISTENT_FILE_ID_12345"
}
```

**Response (200)**

```json
{
  "ok": false,
  "error": "FILE_NOT_FOUND",
  "message": "Файл обложки не найден на Google Drive"
}
```

---

## 7. POST get_cover

### 7.1. Получение одной обложки

**Request**

```json
{
  "action": "get_cover",
  "file_ids": ["1XyZ_aBcDeFgHiJkLmNoPqRsTuVwXyZ"]
}
```

**Response**

```json
{
  "ok": true,
  "covers": [
    {
      "file_id": "1XyZ_aBcDeFgHiJkLmNoPqRsTuVwXyZ",
      "mime_type": "image/jpeg",
      "data": "/9j/4AAQSkZJRgABAQEASABIAAD..."
    }
  ]
}
```

---

### 7.2. Batch-запрос нескольких обложек

**Request**

```json
{
  "action": "get_cover",
  "file_ids": [
    "1XyZ_aBcDeFgHiJkLmNoPqRsTuVwXyZ",
    "1MnOpQrStUvWxYzAbCdEfGhIjKlMnOp",
    "1AbCdEfGhIjKlMnOpQrStUvWxYzAbCd"
  ]
}
```

**Response**

```json
{
  "ok": true,
  "covers": [
    {
      "file_id": "1XyZ_aBcDeFgHiJkLmNoPqRsTuVwXyZ",
      "mime_type": "image/jpeg",
      "data": "/9j/4AAQSkZJRgABAQEASABIAAD..."
    },
    {
      "file_id": "1MnOpQrStUvWxYzAbCdEfGhIjKlMnOp",
      "mime_type": "image/png",
      "data": "iVBORw0KGgoAAAANSUhEUgAA..."
    },
    {
      "file_id": "1AbCdEfGhIjKlMnOpQrStUvWxYzAbCd",
      "mime_type": "image/webp",
      "data": "UklGRlYAAABXRUJQVlA4..."
    }
  ]
}
```

---

### 7.3. Частичный успех — один файл не найден

**Request**

```json
{
  "action": "get_cover",
  "file_ids": [
    "1XyZ_aBcDeFgHiJkLmNoPqRsTuVwXyZ",
    "1NONEXISTENT_OR_DELETED_FILE_ID"
  ]
}
```

**Response**

Поле `ok` остаётся `true`. Клиент должен проверить каждый элемент массива `covers` отдельно.

```json
{
  "ok": true,
  "covers": [
    {
      "file_id": "1XyZ_aBcDeFgHiJkLmNoPqRsTuVwXyZ",
      "mime_type": "image/jpeg",
      "data": "/9j/4AAQSkZJRgABAQEASABIAAD..."
    },
    {
      "file_id": "1NONEXISTENT_OR_DELETED_FILE_ID",
      "error": "FILE_NOT_FOUND"
    }
  ]
}
```

---

### 7.4. Ошибка — пустой массив file_ids

**Request**

```json
{
  "action": "get_cover",
  "file_ids": []
}
```

**Response**

```json
{
  "ok": false,
  "error": "INVALID_PAYLOAD",
  "message": "file_ids must be a non-empty array"
}
```

---

### 7.5. Ошибка — слишком много файлов

**Request**

```json
{
  "action": "get_cover",
  "file_ids": ["id1", "id2", "id3", "id4", "id5", "id6", "id7", "id8", "id9", "id10", "id11"]
}
```

**Response**

```json
{
  "ok": false,
  "error": "INVALID_PAYLOAD",
  "message": "file_ids must contain at most 10 items"
}
```

---

## 8. POST purge (v2.0)

### 7.1. Успешный purge

**Request**

```
POST {WEB_APP_URL}
Content-Type: application/json
```

```json
{
  "action": "purge",
  "confirm": true
}
```

**Response (200)**

```json
{
  "ok": true,
  "purged": {
    "tasks": 5,
    "goals": 1,
    "contexts": 2,
    "categories": 0,
    "checklist_items": 12,
    "cover_files": 1
  }
}
```

> Удалено: 5 задач, 1 цель, 2 контекста, 12 пунктов чеклиста из Google Sheets + 1 файл обложки с Google Drive. Все они имели `is_deleted: true`.

### 7.2. Purge без подтверждения

**Request**

```json
{
  "action": "purge",
  "confirm": false
}
```

**Response (200)**

```json
{
  "ok": false,
  "error": "CONFIRMATION_REQUIRED",
  "message": "Поле confirm должно быть true для выполнения purge"
}
```

### 7.3. Purge — нечего удалять

**Request**

```json
{
  "action": "purge",
  "confirm": true
}
```

**Response (200)**

```json
{
  "ok": true,
  "purged": {
    "tasks": 0,
    "goals": 0,
    "contexts": 0,
    "categories": 0,
    "checklist_items": 0,
    "cover_files": 0
  }
}
```

---

## 9. Ошибки

### 8.1. Неизвестный action

**Request**

```json
{
  "action": "unknown_action"
}
```

**Response (200)**

```json
{
  "ok": false,
  "error": "INVALID_ACTION",
  "message": "Неизвестный action: unknown_action"
}
```

### 8.2. API не инициализировано

Вызов `pull` до `init`.

**Request**

```json
{
  "action": "pull",
  "versions": {
    "tasks": 0,
    "goals": 0,
    "contexts": 0,
    "categories": 0,
    "checklist_items": 0
  }
}
```

**Response (200)**

```json
{
  "ok": false,
  "error": "NOT_INITIALIZED",
  "message": "Вызовите init перед использованием API"
}
```

### 8.3. Невалидные данные в запросе

Push без обязательного поля `changes`.

**Request**

```json
{
  "action": "push"
}
```

**Response (200)**

```json
{
  "ok": false,
  "error": "INVALID_PAYLOAD",
  "message": "Отсутствует обязательное поле: changes"
}
```

### 8.4. Невалидные данные — пропущено поле в записи

**Request**

```json
{
  "action": "push",
  "changes": {
    "tasks": [
      {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "title": "Задача без обязательных полей"
      }
    ],
    "goals": [],
    "contexts": [],
    "categories": [],
    "checklist_items": [],
    "settings": []
  }
}
```

**Response (200)**

```json
{
  "ok": false,
  "error": "INVALID_PAYLOAD",
  "message": "Задача f47ac10b-58cc-4372-a567-0e02b2c3d479: отсутствуют обязательные поля: box, is_completed, sort_order, is_deleted, created_at, updated_at, version"
}
```

### 8.5. Файл обложки слишком большой

**Request**

```json
{
  "action": "upload_cover",
  "goal_id": "e8b5f7d2-3c4a-4e6f-9a1b-7c8d9e0f1a2b",
  "filename": "huge_photo.jpg",
  "mime_type": "image/jpeg",
  "data": "<base64 строка 3.5 МБ>"
}
```

**Response (200)**

```json
{
  "ok": false,
  "error": "FILE_TOO_LARGE",
  "message": "Размер файла превышает максимально допустимые 2 МБ"
}
```

### 8.6. Внутренняя ошибка сервера

**Response (200)**

```json
{
  "ok": false,
  "error": "INTERNAL_ERROR",
  "message": "Ошибка чтения данных из Google Sheets: Service invoked too many times"
}
```

### 8.7. Upload cover — пропущены обязательные поля

**Request**

```json
{
  "action": "upload_cover",
  "goal_id": "e8b5f7d2-3c4a-4e6f-9a1b-7c8d9e0f1a2b"
}
```

**Response (200)**

```json
{
  "ok": false,
  "error": "INVALID_PAYLOAD",
  "message": "Отсутствуют обязательные поля: filename, mime_type, data"
}
```

---

## 10. Полные сценарии (E2E)

### 9.1. Сценарий: Первый запуск приложения

```
1. GET  ?action=ping
   → { ok: true, initialized: false }

2. POST { action: "init" }
   → { ok: true, created: true, spreadsheet_id: "...", folder_id: "..." }

3. POST { action: "pull", versions: { tasks: 0, goals: 0, contexts: 0, categories: 0, checklist_items: 0 } }
   → { ok: true, data: { tasks: [], goals: [], ... }, settings: [...], server_time: "..." }
```

### 9.2. Сценарий: Создать задачу → завершить → удалить

```
1. POST push — создание задачи (is_completed: false, is_deleted: false)
   → status: "created"

2. POST push — завершение задачи (is_completed: true, completed_at: "2026-03-04T14:30:00.000Z")
   → status: "accepted"

3. POST push — удаление задачи (is_deleted: true)
   → status: "accepted"

4. POST pull — другое устройство получает запись с is_deleted: true
   → data.tasks: [{ ..., is_deleted: true }]
```

### 9.3. Сценарий: Загрузить обложку → сменить обложку

```
1. POST upload_cover — загрузка первой обложки
   → { file_id: "AAA", reused: false }

2. POST push — привязка к цели (cover_file_id: "AAA")
   → status: "accepted"

3. POST upload_cover — загрузка новой обложки
   → { file_id: "BBB", reused: false }

4. POST push — обновление цели (cover_file_id: "BBB")
   → status: "accepted"

5. POST delete_cover — удаление старой обложки (file_id: "AAA")
   → { deleted: true, ref_count: 0 }
```

### 9.4. Сценарий: Офлайн-синхронизация

```
1. Клиент уходит в офлайн (последний pull: versions { tasks: 10, goals: 3, ... })

2. Пользователь создаёт 2 задачи, завершает 1, удаляет 1 — всё в IndexedDB

3. Сеть восстанавливается

4. POST push — все 4 изменения одним запросом
   → результаты: 2x created, 1x accepted, 1x accepted

5. POST pull — получение изменений с сервера (versions: обновлённые)
   → data содержит записи, изменённые с другого устройства за время офлайна
```

### 9.5. Сценарий: Конфликт при двух устройствах

```
Устройство A и B имеют задачу "Купить молоко" (version: 5, updated_at: 10:00)

1. Устройство A: переименовывает в "Купить молоко 3.2%" (updated_at: 10:05)
   POST push → status: "accepted", version: 6

2. Устройство B (офлайн с 10:00): переименовывает в "Купить молоко и кефир" (updated_at: 10:03)
   POST push → status: "conflict", server_record: { title: "Купить молоко 3.2%", version: 6 }

3. Устройство B перезаписывает локальную копию серверной версией
   Результат: на обоих устройствах "Купить молоко 3.2%" (version: 6)
```

---

## 11. Справочник значений полей

### 10.1. Допустимые значения enum-полей

| Поле | Допустимые значения |
|------|-------------------|
| `task.box` | `inbox`, `today`, `week`, `later` |
| `goal.status` | `not_started`, `in_progress`, `paused`, `completed`, `cancelled` |
| `task.repeat_rule` | `daily`, `weekly`, `monthly`, `weekdays:1,2,3,4,5`, `custom:N` (N — число дней), `""` (пусто — без повторения) |
| `setting.default_box` | `inbox`, `today`, `week`, `later` |
| `setting.accent_color` | `green`, `orange`, `purple`, `yellow`, `crimson`, `#RRGGBB` |
| `setting.quick_property` | `goal`, `context`, `category` |
| `setting.menu_always_visible` | `true`, `false` |
| `setting.focus_entity` | `goal:{uuid}`, `context:{uuid}`, `""` (пусто — выключен) |

### 10.2. Статусы результатов push

| Статус | Описание | Действие клиента |
|--------|----------|-----------------|
| `created` | Новая запись добавлена на сервер | Обновить локальную version |
| `accepted` | Изменение принято, version увеличена | Обновить локальную version |
| `conflict` | Серверная запись новее | Перезаписать локальную копию из `server_record` |

### 10.3. Пустые значения

Необязательные строковые поля передаются как пустая строка `""`, а не `null`:

```json
{
  "goal_id": "",
  "context_id": "",
  "category_id": "",
  "notes": "",
  "completed_at": "",
  "repeat_rule": "",
  "cover_file_id": ""
}
```
