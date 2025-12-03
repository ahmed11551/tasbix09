# Инструкции по применению миграции базы данных

Миграция для модели `CategoryStreak` создана и находится в файле:
`prisma/migrations/20250127000000_add_category_streaks/migration.sql`

## Вариант 1: Через Prisma CLI (если Node.js установлен)

```bash
npx prisma migrate deploy
```

или для разработки:

```bash
npx prisma migrate dev
```

## Вариант 2: Через Docker

Если используете Docker, выполните:

```bash
docker-compose exec server npx prisma migrate deploy
```

или

```bash
docker-compose exec server npx prisma migrate dev
```

## Вариант 3: Напрямую SQL (если база данных доступна)

Вы можете выполнить SQL-скрипт напрямую на вашей базе данных PostgreSQL/Neon:

```bash
psql $DATABASE_URL -f prisma/migrations/20250127000000_add_category_streaks/migration.sql
```

Или через веб-интерфейс вашего провайдера базы данных (Neon, Supabase и т.д.).

## Что делает миграция:

1. Создает таблицу `CategoryStreak` с полями:
   - `id` - уникальный идентификатор
   - `userId` - связь с пользователем
   - `category` - категория ('prayer', 'quran', 'dhikr')
   - `currentStreak` - текущая серия дней
   - `longestStreak` - самая длинная серия
   - `lastActivityDate` - дата последней активности
   - временные метки

2. Создает уникальный индекс на `userId` + `category`
3. Добавляет внешний ключ на таблицу `User`

После применения миграции функциональность категорийных streaks будет полностью работать!

