# 🐳 Проверка и исправление Docker конфигурации

## 📋 Статус проверки

### ✅ Что работает:

1. **Dockerfile** - многоступенчатая сборка настроена правильно
2. **docker-compose.yml** - конфигурация корректна
3. **Скрипты запуска** - есть `run-docker.sh` и `start-docker.sh`

### ⚠️ Найденные проблемы:

1. **Проблема с путем в Dockerfile**
   - Dockerfile пытается запустить `dist/index.cjs`
   - Но `script/build.ts` может создавать другой путь
   - Нужно проверить структуру сборки

2. **Проблема с Prisma в Docker**
   - Prisma Client должен быть сгенерирован перед запуском
   - В docker-compose.yml есть команда `npx prisma generate`, но нужно убедиться, что она выполняется

---

## 🔧 Исправления

### 1. Обновленный Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Generate Prisma Client
COPY prisma ./prisma/
RUN npx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

USER nodejs

EXPOSE 5000

ENV PORT=5000

# Проверка наличия файла перед запуском
CMD ["sh", "-c", "if [ -f dist/index.cjs ]; then node dist/index.cjs; elif [ -f dist/server/index.cjs ]; then node dist/server/index.cjs; else echo 'Error: Entry point not found'; exit 1; fi"]
```

### 2. Обновленный docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: smarttasbih
      POSTGRES_PASSWORD: smarttasbih_password
      POSTGRES_DB: smarttasbih_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U smarttasbih"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://smarttasbih:smarttasbih_password@postgres:5432/smarttasbih_db
      SESSION_SECRET: ${SESSION_SECRET:-dev-secret-key-change-in-production-min-32-chars-long}
      TEST_TOKEN: ${TEST_TOKEN:-test_token_123}
      BOT_REPLIKA_API_URL: ${BOT_REPLIKA_API_URL:-https://Bot.e-replika.ru/docs}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN:-}
      OPENAI_API_KEY: ${OPENAI_API_KEY:-}
      PORT: 5000
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
    command: >
      sh -c "
        echo '🔍 Проверка Prisma Client...' &&
        npx prisma generate &&
        echo '✅ Prisma Client готов' &&
        echo '🔍 Проверка миграций...' &&
        npx prisma migrate deploy &&
        echo '✅ Миграции применены' &&
        echo '🚀 Запуск приложения...' &&
        if [ -f dist/index.cjs ]; then
          node dist/index.cjs
        elif [ -f dist/server/index.cjs ]; then
          node dist/server/index.cjs
        else
          echo '❌ Ошибка: точка входа не найдена'
          echo '📂 Содержимое dist/:'
          ls -la dist/ || echo 'Папка dist не существует'
          exit 1
        fi
      "
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## 📝 Инструкция по запуску

### Шаг 1: Установите Docker

**macOS:**
```bash
# Скачайте Docker Desktop с https://www.docker.com/products/docker-desktop
# Или через Homebrew:
brew install --cask docker
```

**Проверка установки:**
```bash
docker --version
docker compose version
```

### Шаг 2: Создайте .env файл (если нет)

```bash
cat > .env << 'EOF'
DATABASE_URL=postgresql://smarttasbih:smarttasbih_password@postgres:5432/smarttasbih_db
SESSION_SECRET=dev-secret-key-change-in-production-min-32-chars-long
TEST_TOKEN=test_token_123
BOT_REPLIKA_API_URL=https://Bot.e-replika.ru/docs
PORT=5000
NODE_ENV=production
EOF
```

### Шаг 3: Запустите через Docker

**Вариант A: Через скрипт (рекомендуется)**
```bash
chmod +x run-docker.sh
./run-docker.sh
```

**Вариант B: Вручную**
```bash
# Сборка и запуск
docker compose up --build -d

# Просмотр логов
docker compose logs -f app

# Остановка
docker compose down
```

### Шаг 4: Проверка работы

1. **Приложение должно быть доступно:** http://localhost:5000
2. **API должен отвечать:** http://localhost:5000/api/stats
3. **Проверка логов:**
   ```bash
   docker compose logs app | grep -i "error\|ready\|serving"
   ```

---

## 🔍 Диагностика проблем

### Проблема: "Cannot find module"

**Решение:**
```bash
# Пересоберите образ
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Проблема: "Entry point not found"

**Решение:**
1. Проверьте, что сборка прошла успешно:
   ```bash
   docker compose build
   ```
2. Проверьте структуру dist:
   ```bash
   docker compose run app ls -la dist/
   ```

### Проблема: "Database connection failed"

**Решение:**
1. Проверьте, что PostgreSQL контейнер запущен:
   ```bash
   docker compose ps
   ```
2. Проверьте логи PostgreSQL:
   ```bash
   docker compose logs postgres
   ```
3. Убедитесь, что DATABASE_URL правильный в docker-compose.yml

### Проблема: "Prisma Client not generated"

**Решение:**
```bash
# Зайдите в контейнер и сгенерируйте вручную
docker compose exec app npx prisma generate
```

---

## ✅ Чеклист проверки

- [ ] Docker установлен и работает
- [ ] .env файл создан (или переменные в docker-compose.yml)
- [ ] Docker образ успешно собирается
- [ ] Контейнеры запускаются без ошибок
- [ ] Приложение доступно на http://localhost:5000
- [ ] База данных подключается успешно
- [ ] API отвечает на запросы
- [ ] Логи не содержат критических ошибок

---

## 📊 Команды для работы с Docker

```bash
# Просмотр статуса контейнеров
docker compose ps

# Просмотр логов (все сервисы)
docker compose logs -f

# Просмотр логов (только приложение)
docker compose logs -f app

# Просмотр логов (только база данных)
docker compose logs -f postgres

# Перезапуск контейнера приложения
docker compose restart app

# Остановка всех контейнеров
docker compose down

# Остановка с удалением volumes (удалит данные БД!)
docker compose down -v

# Войти в контейнер приложения
docker compose exec app sh

# Выполнить команду в контейнере
docker compose exec app npx prisma studio

# Пересборка без кэша
docker compose build --no-cache

# Просмотр использования ресурсов
docker stats
```

---

**Последнее обновление:** 2 января 2025

