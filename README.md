# Умный Тасбих (Smart Tasbih) - Приложение для духовных практик

Полнофункциональное приложение для отслеживания исламских духовных практик: тасбих, зикры, цели, привычки и задачи.

## Варианты запуска

### Docker (рекомендуется для продакшена)

Полностью автономный запуск с PostgreSQL в контейнере:

```bash
# Создать .env файл (опционально, есть значения по умолчанию)
cp .env.example .env

# Запустить всё одной командой
docker-compose up -d

# Приложение доступно на http://localhost:5000
```

Преимущества Docker:
- Полная автономность (PostgreSQL + приложение в контейнерах)
- Не требует отдельной настройки БД
- Подходит для продакшена
- Легко развернуть на любом сервере

### Vercel (для Telegram Mini App)

Используйте Vercel только для Telegram Mini App. Для обычного деплоя лучше Docker.

1. Перейдите на https://vercel.com
2. Импортируйте репозиторий
3. Добавьте переменные окружения
4. Выполните деплой

Когда использовать Vercel:
- Если нужен Telegram Mini App
- Если нужен быстрый деплой без настройки сервера
- Для тестирования и разработки

Когда использовать Docker:
- Для продакшена на своем сервере
- Когда нужен полный контроль
- Когда важна стабильность и производительность

### Локальная разработка

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run dev
```

Приложение будет доступно на http://localhost:5000

**Для production запуска:**
```bash
npm run build
NODE_ENV=production npm start
```

## Переменные окружения

### Для локальной разработки / Docker

Создайте файл `.env` в корне проекта:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your-secret-key-min-32-chars
TEST_TOKEN=test_token_123
TELEGRAM_BOT_TOKEN=8401186204:AAEnf7AsD1n8Nbfcp6fA6epuYJLchneteNs
BOT_REPLIKA_API_URL=https://Bot.e-replika.ru/docs
OPENAI_API_KEY=your-openai-api-key
PORT=5000
NODE_ENV=production
```

### Для Vercel

**Быстрая настройка:**
```bash
./setup-vercel.sh
```

**Или вручную:**
1. Перейдите на https://vercel.com
2. Add New Project → Импортируйте репозиторий
3. Settings → Environment Variables → Добавьте переменные (см. `vercel-env-template.txt`)
4. После добавления выполните Redeploy проекта

**Подробная инструкция:** См. [VERCEL_SETUP.md](./VERCEL_SETUP.md)

### Настройка базы данных

Проект требует PostgreSQL базу данных. Рекомендуемые провайдеры:

**Supabase (рекомендуется):**
1. Создайте проект на https://supabase.com
2. Settings → Database → Connection string → URI
3. Скопируйте connection string
4. Добавьте `?sslmode=require` в конец строки
5. Добавьте в `DATABASE_URL` в Vercel или `.env`

**Альтернативы:** Neon (https://neon.tech), Railway (https://railway.app)

После настройки базы данных примените миграции:
```bash
npx prisma migrate deploy
```

## Telegram Mini App

Для Telegram Mini App требуется:

1. Деплой на Vercel (см. выше)
2. Создание бота через `@BotFather` в Telegram
3. Получение токена бота
4. Добавление токена в `TELEGRAM_BOT_TOKEN`
5. Настройка кнопки меню: отправьте `/setmenubutton` боту BotFather, выберите бота, введите текст кнопки и URL вашего приложения (например: `https://your-app.vercel.app`)

## Технологии

- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + Prisma
- **State Management**: React Query
- **AI**: OpenAI GPT-4o-mini
- **Telegram**: Mini App интеграция
- **Deployment**: Docker + Vercel

## Функциональность

- Аутентификация (Telegram auth, обычная регистрация)
- Управление привычками, задачами, целями
- Тасбих-счетчик с привязкой к намазам
- Зикры (каталог с поиском)
- Статистика и аналитика
- AI-ассистент
- Офлайн режим
- Telegram Mini App

## Документация

- [PROJECT_READINESS_REPORT.md](./PROJECT_READINESS_REPORT.md) - Отчет о готовности проекта к сдаче

## Управление Docker

```bash
# Запустить
docker-compose up -d

# Остановить
docker-compose down

# Остановить и удалить данные БД
docker-compose down -v

# Просмотр логов
docker-compose logs -f app

# Пересобрать после изменений
docker-compose up -d --build
```

## Лицензия

MIT
