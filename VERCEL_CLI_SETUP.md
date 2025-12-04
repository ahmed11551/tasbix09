# Настройка Vercel через CLI - Пошаговая инструкция

## Предварительные требования

1. **Установите Node.js** (если еще не установлен):
   - Скачайте с https://nodejs.org/
   - Или через Homebrew: `brew install node`

2. **Проверьте установку**:
   ```bash
   node --version
   npm --version
   ```

---

## Шаг 1: Установка Vercel CLI

Откройте терминал и выполните:

```bash
npm install -g vercel
```

Проверьте установку:
```bash
vercel --version
```

---

## Шаг 2: Авторизация в Vercel

```bash
vercel login
```

**Что произойдет:**
- Откроется браузер
- Войдите в свой аккаунт Vercel (или через GitHub)
- Авторизация завершится автоматически

---

## Шаг 3: Подключение проекта

Перейдите в директорию проекта:

```bash
cd /Users/ahmeddevops/Desktop/SmartTasbihGoals_pub-main
```

Подключите проект к Vercel:

```bash
vercel link
```

**Вопросы которые будут заданы:**

1. **Set up and deploy?** → Нажмите `Y` (Yes)
2. **Which scope?** → Выберите ваш аккаунт
3. **Link to existing project?** → 
   - Если проект уже есть в Vercel: `Y` → выберите проект из списка
   - Если проект новый: `N` → введите название проекта
4. **What's your project's name?** → `smart-tasbih-goals` (или любое другое)
5. **In which directory is your code located?** → `./` (просто нажмите Enter)

---

## Шаг 4: Добавление переменных окружения

### Способ A: Через веб-интерфейс (проще)

1. Откройте https://vercel.com/dashboard
2. Выберите ваш проект
3. Settings → Environment Variables
4. Добавьте переменные (см. список ниже)
5. Выберите окружения: Production, Preview, Development (все три)
6. Нажмите Save

### Способ B: Через CLI

```bash
# Добавление переменных через CLI
vercel env add DATABASE_URL production
# Введите значение connection string от вашей БД

vercel env add SESSION_SECRET production
# Введите случайную строку минимум 32 символа

vercel env add TELEGRAM_BOT_TOKEN production
# Введите токен от @BotFather

vercel env add OPENAI_API_KEY production
# Введите ключ OpenAI (опционально)

# Добавить для всех окружений (production, preview, development)
# Для каждого окружения выполните команду отдельно:
vercel env add DATABASE_URL preview
vercel env add DATABASE_URL development
# И так далее для всех переменных
```

**Необходимые переменные:**

```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
SESSION_SECRET=your-secret-key-minimum-32-characters-long-random-string
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
OPENAI_API_KEY=your-openai-api-key (опционально)
TEST_TOKEN=test_token_123
BOT_REPLIKA_API_URL=https://Bot.e-replika.ru/docs
NODE_ENV=production
```

**Полный список:** См. файл `vercel-env-template.txt`

---

## Шаг 5: Первый деплой

После добавления переменных окружения выполните деплой:

```bash
vercel --prod
```

**Что произойдет:**
- Начнется сборка проекта
- Загрузка на Vercel
- Получите URL вашего приложения (например: `https://smart-tasbih-goals.vercel.app`)

---

## Шаг 6: Применение миграций базы данных

После успешного деплоя примените миграции:

```bash
# Получить переменные окружения локально
vercel env pull .env.local

# Применить миграции
npx prisma migrate deploy
```

---

## Полезные команды Vercel CLI

```bash
# Список всех деплоев
vercel ls

# Просмотр логов
vercel logs

# Просмотр переменных окружения
vercel env ls

# Получить переменные окружения в файл
vercel env pull .env.local

# Новый деплой на production
vercel --prod

# Деплой на preview
vercel

# Удалить переменную окружения
vercel env rm VARIABLE_NAME production

# Открыть проект в браузере
vercel open
```

---

## Проверка работы

1. **Откройте URL приложения** из вывода команды `vercel --prod`
2. **Проверьте API**: `https://your-app.vercel.app/api/stats`
3. **Проверьте логи**: `vercel logs` или в Vercel Dashboard

---

## Устранение проблем

### Ошибка: "vercel: command not found"
- Убедитесь, что Vercel CLI установлен: `npm install -g vercel`
- Проверьте PATH: `which vercel`

### Ошибка: "DATABASE_URL не установлен"
- Добавьте переменные окружения (см. Шаг 4)
- Выполните Redeploy: `vercel --prod`

### Ошибка: "Project not found"
- Убедитесь, что выполнили `vercel link`
- Проверьте, что проект существует в Vercel Dashboard

### Страница не открывается
- Проверьте логи: `vercel logs` или в Dashboard
- Убедитесь, что база данных доступна из интернета
- Проверьте, что все переменные окружения добавлены

---

## Автоматический скрипт

Если хотите использовать автоматический скрипт:

```bash
./vercel-setup.sh
```

Скрипт проведет через все шаги автоматически.

---

**Готово!** Ваше приложение теперь деплоится на Vercel.

