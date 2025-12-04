# Быстрый старт - Подключение к Vercel

## Ваши учетные данные

- **Email:** ahmed1155@mail.ru
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## Быстрый способ (через веб-интерфейс)

### Шаг 1: Войдите в Vercel

1. Откройте https://vercel.com
2. Нажмите "Log In"
3. Введите: `ahmed1155@mail.ru`
4. Введите ваш пароль
5. Войдите в аккаунт

### Шаг 2: Импортируйте проект

1. Нажмите "Add New Project" (или "New Project")
2. Выберите "Import Git Repository"
3. Найдите репозиторий `ahmed11551/SmartTasbihGoals`
4. Нажмите "Import"

### Шаг 3: Настройте проект

Проект уже настроен через `vercel.json`, просто проверьте:
- **Framework Preset:** Other
- **Root Directory:** `./`
- **Build Command:** `npm run build:vercel` (автоматически)
- **Output Directory:** `dist/public` (автоматически)

Нажмите "Deploy"

### Шаг 4: Добавьте переменные окружения (ВАЖНО!)

После первого деплоя:

1. В Vercel Dashboard откройте ваш проект
2. Перейдите в **Settings → Environment Variables**
3. Нажмите **"Add New"**

Добавьте следующие переменные (по одной):

#### Обязательные:

**DATABASE_URL**
- Key: `DATABASE_URL`
- Value: `postgresql://postgres.xdlkilvotcnssarzugws:Sebiev9595@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`
- Environment: ✅ Production, ✅ Preview, ✅ Development

**SESSION_SECRET**
- Key: `SESSION_SECRET`
- Value: `smart-tasbih-goals-production-secret-key-2025-min-32-chars`
- Environment: ✅ Production, ✅ Preview, ✅ Development

#### Рекомендуемые:

**TELEGRAM_BOT_TOKEN**
- Key: `TELEGRAM_BOT_TOKEN`
- Value: `8401186204:AAEnf7AsD1n8Nbfcp6fA6epuYJLchneteNs`
- Environment: ✅ Production, ✅ Preview, ✅ Development

**OPENAI_API_KEY** (если есть)
- Key: `OPENAI_API_KEY`
- Value: ваш ключ OpenAI
- Environment: ✅ Production, ✅ Preview, ✅ Development

#### Уже настроенные (можно добавить для ясности):

**TEST_TOKEN**
- Key: `TEST_TOKEN`
- Value: `test_token_123`

**BOT_REPLIKA_API_URL**
- Key: `BOT_REPLIKA_API_URL`
- Value: `https://Bot.e-replika.ru/docs`

**NODE_ENV**
- Key: `NODE_ENV`
- Value: `production`

### Шаг 5: Пересоберите проект

После добавления всех переменных:

1. Перейдите в **Deployments**
2. Найдите последний деплой
3. Нажмите **три точки (⋮) → Redeploy**
4. Подтвердите Redeploy

### Шаг 6: Примените миграции БД

После успешного деплоя откройте терминал:

```bash
cd /Users/ahmeddevops/Desktop/SmartTasbihGoals_pub-main

# Если Vercel CLI установлен:
vercel env pull .env.local
npx prisma migrate deploy

# Если Vercel CLI не установлен:
# Примените миграции напрямую к вашей БД Supabase
# Используя connection string выше
```

---

## Проверка работы

1. Откройте URL вашего приложения из Vercel Dashboard
2. Проверьте API: `https://your-app.vercel.app/api/stats`
3. Должен вернуться JSON ответ (или ошибка авторизации, что нормально)

---

## Если что-то не работает

1. Проверьте логи: **Vercel Dashboard → Deployments → Ваш деплой → Functions → Logs**
2. Убедитесь, что все переменные окружения добавлены
3. Убедитесь, что выполнено Redeploy после добавления переменных
4. Проверьте, что база данных Supabase доступна

---

## Полезные ссылки

- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard
- GitHub репозиторий: https://github.com/ahmed11551/SmartTasbihGoals

---

**Готово!** После выполнения всех шагов приложение будет работать на Vercel.

