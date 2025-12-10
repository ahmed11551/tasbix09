FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

    # Install OpenSSL для Prisma ДО npm install (с retry для сетевых проблем)
    RUN apk update && apk add --no-cache openssl openssl-dev || \
        (sleep 5 && apk update && apk add --no-cache openssl openssl-dev) || \
        echo "OpenSSL установка пропущена - могут быть предупреждения Prisma"

# Copy package files first
COPY package.json package-lock.json* ./

# Copy prisma schema before npm install (needed for postinstall script)
COPY prisma ./prisma/

# Install dependencies (postinstall will run prisma generate)
# Добавляем retry и таймауты для надежности с множественными попытками
RUN     npm config set fetch-retries 15 && \
    npm config set fetch-retry-mintimeout 30000 && \
    npm config set fetch-retry-maxtimeout 180000 && \
    npm config set registry https://registry.npmjs.org/ && \
    npm install --legacy-peer-deps --ignore-scripts

# Prisma generate с несколькими попытками (может падать из-за сетевых проблем)
RUN     for i in 1 2 3 4 5; do \
        npx prisma generate && break || (echo "Попытка $i не удалась, ждем..." && sleep 15); \
    done

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
ENV DOCKER=1

# Install OpenSSL для Prisma (пробуем разные варианты в зависимости от архитектуры)
RUN apk add --no-cache openssl || \
    apk add --no-cache openssl-dev || \
    apk add --no-cache openssl1.1-compat || \
    echo "OpenSSL installation skipped - may cause Prisma warnings"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

    COPY --from=deps /app/node_modules ./node_modules
    # .prisma уже включен в node_modules, не нужно копировать отдельно
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

USER nodejs

EXPOSE 5000

ENV PORT=5000

# Проверка наличия файла и запуск приложения
CMD ["sh", "-c", "if [ -f dist/index.cjs ]; then node dist/index.cjs; elif [ -f dist/server/index.cjs ]; then node dist/server/index.cjs; else echo 'Error: Entry point not found. Available files:'; ls -la dist/ 2>/dev/null || echo 'dist/ does not exist'; exit 1; fi"]

