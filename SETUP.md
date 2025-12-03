# 🔧 Настройка проекта

## Переменные окружения

Создайте файл `.env` в корне проекта со следующим содержимым:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your-secret-key-min-32-chars
TEST_TOKEN=test_token_123
BOT_REPLIKA_API_URL=https://Bot.e-replika.ru/docs
OPENAI_API_KEY=your-openai-api-key-here
TELEGRAM_BOT_TOKEN=8401186204:AAEnf7AsD1n8Nbfcp6fA6epuYJLchneteNs
PORT=5000
NODE_ENV=development
```

## Для Vercel

Добавьте те же переменные окружения в Vercel Dashboard → Settings → Environment Variables.

**Важно:** Токен Telegram бота: `8401186204:AAEnf7AsD1n8Nbfcp6fA6epuYJLchneteNs`

## База данных

После настройки `.env`:

```bash
npm run db:generate
npm run db:push
```

## Запуск

```bash
npm run dev
```

