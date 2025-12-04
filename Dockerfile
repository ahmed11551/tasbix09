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

# Проверка наличия файла и запуск приложения
CMD ["sh", "-c", "if [ -f dist/index.cjs ]; then node dist/index.cjs; elif [ -f dist/server/index.cjs ]; then node dist/server/index.cjs; else echo 'Error: Entry point not found. Available files:'; ls -la dist/ 2>/dev/null || echo 'dist/ does not exist'; exit 1; fi"]

