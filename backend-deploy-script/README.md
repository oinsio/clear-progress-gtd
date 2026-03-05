# Clear Progress — Backend Deployment

Google Apps Script бэкенд с развёртыванием через clasp.

## Первоначальная настройка

### 1. Установить clasp

```bash
npm install -g @google/clasp
clasp login
```

### 2. Создать Apps Script проект

Вариант А — через браузер:
- Открыть [script.google.com](https://script.google.com)
- Создать новый проект
- Project Settings → скопировать Script ID

Вариант Б — через clasp:
```bash
cd backend
clasp create --title "Clear Progress Backend" --type webapp
```

### 3. Настроить окружение

```bash
cp .env.example .env
cp .clasp.json.example .clasp.json
```

Заполнить `SCRIPT_ID` в обоих файлах.

Если проект уже существует:
```bash
clasp clone <SCRIPT_ID> --rootDir .
```

### 4. Первый деплой

```bash
# Сделать скрипт исполняемым
chmod +x deploy.sh

# Создать dev deployment
./deploy.sh deploy:new dev
# → Скопировать deployment ID в .env → DEPLOY_ID_DEV

# Создать prod deployment
./deploy.sh deploy:new prod
# → Скопировать deployment ID в .env → DEPLOY_ID_PROD
```

## Повседневное использование

```bash
# Запушить код без деплоя (для проверки синтаксиса)
./deploy.sh push

# Задеплоить на dev
./deploy.sh deploy dev

# Задеплоить на prod (запросит подтверждение)
./deploy.sh deploy prod

# Проверить доступность
./deploy.sh ping dev
./deploy.sh ping prod

# Посмотреть список деплоев
./deploy.sh status

# Открыть редактор в браузере
./deploy.sh open

# Посмотреть логи выполнения
./deploy.sh logs
```

## Структура файлов

```
backend/
├── deploy.sh            # Скрипт развёртывания
├── appsscript.json      # Манифест GAS (scopes, runtime)
├── .clasp.json          # Конфиг clasp (не коммитить!)
├── .clasp.json.example  # Шаблон конфига
├── .env                 # Переменные окружения (не коммитить!)
├── .env.example         # Шаблон переменных
├── .gitignore           # Исключения для git
└── src/                 # Исходники TypeScript (GAS)
    └── ...
```

## Окружения

| Окружение | Назначение | Переменная |
|-----------|------------|------------|
| dev | Разработка и тестирование | `DEPLOY_ID_DEV` |
| prod | Продакшен | `DEPLOY_ID_PROD` |

Каждое окружение — отдельный deployment ID в рамках одного Apps Script проекта.
Код один и тот же, но URL разные.

## Важные моменты

- **URL не меняется** при обновлении существующего deployment (`deploy`), меняется только при создании нового (`deploy:new`)
- **`clasp push`** перезаписывает ВСЕ файлы в проекте — убедитесь, что всё нужное в `rootDir`
- **TypeScript** компилируется clasp автоматически при push
- **`.env` и `.clasp.json` не коммитятся** — содержат секреты
