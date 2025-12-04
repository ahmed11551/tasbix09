# Инструкция по подключению к Vercel

## Что нужно для подключения

### 1. Аккаунт на Vercel
- Перейдите на https://vercel.com
- Войдите через GitHub (рекомендуется) или создайте аккаунт

### 2. Доступ к GitHub репозиторию
- Репозиторий должен быть в вашем GitHub аккаунте
- Текущий репозиторий: `https://github.com/ahmed11551/SmartTasbihGoals.git`

### 3. Переменные окружения

Обязательные переменные для добавления в Vercel:

```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
SESSION_SECRET=your-secret-key-minimum-32-characters-long
TEST_TOKEN=test_token_123
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
BOT_REPLIKA_API_URL=https://Bot.e-replika.ru/docs
OPENAI_API_KEY=your-openai-api-key (опционально)
NODE_ENV=production
```

### 4. База данных PostgreSQL
- Создайте базу данных на Supabase, Neon или Railway
- Скопируйте connection string
- Добавьте в `DATABASE_URL`

---

## Шаги подключения

### Вариант 1: Через веб-интерфейс Vercel (рекомендуется)

1. **Откройте Vercel Dashboard**
   - Перейдите на https://vercel.com/dashboard
   - Войдите в аккаунт

2. **Импортируйте проект**
   - Нажмите "Add New Project"
   - Выберите "Import Git Repository"
   - Найдите репозиторий `SmartTasbihGoals`
   - Нажмите "Import"

3. **Настройте проект**
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command: `npm run build:vercel` (уже настроено в vercel.json)
   - Output Directory: `dist/public` (уже настроено в vercel.json)
   - Install Command: `npm install`

4. **Добавьте переменные окружения**
   - Нажмите "Environment Variables"
   - Добавьте каждую переменную из списка выше
   - Выберите окружения: Production, Preview, Development (все три)
   - Нажмите "Save"

5. **Деплой**
   - Нажмите "Deploy"
   - Дождитесь завершения сборки (2-5 минут)

6. **Примените миграции базы данных**
   После успешного деплоя:
   ```bash
   # Установите Vercel CLI (если еще не установлен)
   npm i -g vercel
   
   # Войдите в Vercel
   vercel login
   
   # Получите переменные окружения
   vercel env pull .env.local
   
   # Примените миграции
   npx prisma migrate deploy
   ```

### Вариант 2: Через Vercel CLI

1. **Установите Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Войдите в Vercel**
   ```bash
   vercel login
   ```

3. **Подключите проект**
   ```bash
   cd /Users/ahmeddevops/Desktop/SmartTasbihGoals_pub-main
   vercel
   ```
   - Следуйте инструкциям в терминале
   - Выберите или создайте проект

4. **Добавьте переменные окружения**
   ```bash
   vercel env add DATABASE_URL production
   vercel env add SESSION_SECRET production
   vercel env add TEST_TOKEN production
   vercel env add TELEGRAM_BOT_TOKEN production
   vercel env add BOT_REPLIKA_API_URL production
   vercel env add OPENAI_API_KEY production
   ```
   
   Или добавьте через веб-интерфейс (проще)

5. **Деплой**
   ```bash
   vercel --prod
   ```

---

## После деплоя

### 1. Проверка работы
- Откройте URL вашего приложения (например: `https://smart-tasbih-goals.vercel.app`)
- Проверьте, что фронтенд загружается
- Проверьте API: `https://your-app.vercel.app/api/stats`

### 2. Применение миграций
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

### 3. Настройка Telegram Mini App
- Получите URL вашего приложения из Vercel Dashboard
- Настройте бота через @BotFather:
  ```
  /setmenubutton
  ```
- Выберите бота, введите текст кнопки и URL приложения

---

## Полезные команды Vercel CLI

```bash
# Просмотр логов
vercel logs

# Список деплоев
vercel ls

# Просмотр переменных окружения
vercel env ls

# Получить переменные окружения локально
vercel env pull .env.local

# Пересобрать проект
vercel --prod
```

---

## Устранение проблем

### Ошибка: "DATABASE_URL не установлен"
- Проверьте, что добавили `DATABASE_URL` в Environment Variables
- Убедитесь, что выбрали все окружения (Production, Preview, Development)
- Выполните Redeploy после добавления переменных

### Ошибка: "Could not find the build directory"
- Убедитесь, что `buildCommand` правильный: `npm run build:vercel`
- Проверьте логи сборки в Vercel Dashboard

### Ошибка: "Prisma Client not generated"
- Миграции применяются автоматически через `postinstall`
- Если не работает, примените вручную: `npx prisma migrate deploy`

### Страница не открывается
- Проверьте логи в Vercel Dashboard → Deployment → Functions → Logs
- Убедитесь, что база данных доступна из интернета
- Проверьте, что все переменные окружения добавлены

---

## Контакты и поддержка

- Vercel Docs: https://vercel.com/docs
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub репозиторий: https://github.com/ahmed11551/SmartTasbihGoals

