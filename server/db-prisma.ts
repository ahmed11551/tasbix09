import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Проверка DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL не установлен! Установите переменную окружения DATABASE_URL.');
  console.error('Пример для Neon: postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require');
}

// Создаем Prisma клиент с обработкой ошибок
export const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// Проверяем подключение к БД при старте (только в production или при явном запросе)
if (process.env.NODE_ENV === 'production' || process.env.CHECK_DB_CONNECTION === 'true') {
  prisma.$connect()
    .then(() => {
      console.log('✅ Подключение к базе данных установлено');
    })
    .catch((error) => {
      console.error('❌ Ошибка подключения к базе данных:', error.message);
      console.error('Проверьте DATABASE_URL и доступность базы данных');
      // Не падаем, но логируем ошибку
    });
}

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

