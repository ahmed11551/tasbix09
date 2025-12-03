# Умный Тасбих (Smart Tasbih) - Приложение для духовных практик

Полнофункциональное приложение для отслеживания исламских духовных практик: тасбих, зикры, цели, привычки и задачи.

## 🚀 Быстрый старт

### Telegram Mini App (рекомендуется)

1. **Деплой на Vercel:** [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
2. **Создание бота:** [TELEGRAM_MINI_APP_GUIDE.md](./TELEGRAM_MINI_APP_GUIDE.md)
3. **Быстрая инструкция:** [QUICK_START_TELEGRAM.md](./QUICK_START_TELEGRAM.md)

### Локальный запуск

```bash
# Установить зависимости
npm install

# Настроить .env
cp .env.example .env

# Применить миграции
npm run db:generate
npm run db:push

# Запустить
npm run dev
```

### Docker

```bash
docker-compose up -d
```

## Технологии

- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **State Management**: React Query (TanStack Query)
- **AI**: OpenAI GPT-4o-mini
- **Offline Support**: IndexedDB
- **Micro Frontend**: Module Federation (Vite)
- **Deployment**: Vercel + Docker
- **Telegram**: Mini App интеграция

## Функциональность

✅ **Полностью реализовано:**
- Аутентификация (регистрация, вход, Telegram auth)
- Управление привычками (создание, редактирование, удаление, отслеживание прогресса)
- Управление задачами (с подзадачами, приоритетами, дедлайнами)
- Управление целями (с прогрессом и статусами)
- Тасбих-счетчик с привязкой к намазам
- Зикры (каталог с поиском и избранным)
- Статистика и аналитика
- AI-ассистент для создания задач и привычек
- Офлайн режим с синхронизацией
- Уведомления и напоминания
- Калькулятор казы (восполнение пропущенных намазов)
- **Telegram Mini App** - полная интеграция

## Документация

- [TELEGRAM_MINI_APP_GUIDE.md](./TELEGRAM_MINI_APP_GUIDE.md) - Полная инструкция по Telegram Mini App
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Деплой на Vercel
- [API_INTEGRATION.md](./API_INTEGRATION.md) - Документация API
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Инструкции по развертыванию
- [MODULE_FEDERATION.md](./MODULE_FEDERATION.md) - Module Federation

## Структура проекта

```
├── client/          # Frontend (React + TypeScript)
├── server/          # Backend (Express + TypeScript)
├── prisma/          # Prisma schema и миграции
├── shared/          # Общие типы
└── vercel.json      # Vercel конфигурация
```

## Переменные окружения

```env
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your-secret-key
TEST_TOKEN=test_token_123
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
BOT_REPLIKA_API_URL=https://Bot.e-replika.ru/docs
OPENAI_API_KEY=your-openai-key
PORT=5000
NODE_ENV=production
```

## Лицензия

MIT
