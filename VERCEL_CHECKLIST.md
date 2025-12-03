# ✅ Чеклист готовности приложения к деплою на Vercel

## Обязательные переменные окружения в Vercel Dashboard

Перейдите в **Vercel Dashboard → Settings → Environment Variables** и добавьте:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
SESSION_SECRET=your-secret-key-min-32-chars-long
TEST_TOKEN=test_token_123
BOT_REPLIKA_API_URL=https://Bot.e-replika.ru/docs
TELEGRAM_BOT_TOKEN=8401186204:AAEnf7AsD1n8Nbfcp6fA6epuYJLchneteNs
OPENAI_API_KEY=your-openai-api-key-here
NODE_ENV=production
```

## Проверка перед деплоем

- [x] ✅ `@vercel/node` добавлен в dependencies (не devDependencies)
- [x] ✅ `api/index.ts` настроен как serverless function
- [x] ✅ `vercel.json` настроен корректно
- [x] ✅ `build:vercel` скрипт включает `prisma generate`
- [x] ✅ `postinstall` скрипт включает `prisma generate`
- [x] ✅ Prisma schema настроен
- [x] ✅ Все TypeScript ошибки исправлены
- [ ] ⚠️ **Добавьте переменные окружения в Vercel Dashboard**
- [ ] ⚠️ **Убедитесь что DATABASE_URL указывает на рабочий PostgreSQL**

## После деплоя

1. Проверьте что база данных доступна
2. Примените миграции Prisma:
   ```bash
   npx prisma migrate deploy
   ```
   Или через Vercel CLI:
   ```bash
   vercel env pull
   npx prisma migrate deploy
   ```

3. Проверьте что API работает: `https://your-app.vercel.app/api/stats`

## Структура файлов для Vercel

```
api/
  index.ts          ← Serverless функция для всех API запросов
dist/
  public/           ← Статические файлы фронтенда (после сборки)
vercel.json         ← Конфигурация Vercel
```

## Возможные проблемы

### Ошибка: "Cannot find module '@prisma/client'"
**Решение:** Убедитесь что `postinstall` скрипт выполняется и Prisma Client генерируется.

### Ошибка: "Database connection failed"
**Решение:** Проверьте что `DATABASE_URL` правильно настроен в Vercel Environment Variables.

### Ошибка: "Routes not found"
**Решение:** Убедитесь что `api/index.ts` правильно экспортирует handler и регистрирует роуты.

