/**
 * Прямое подключение к PostgreSQL через библиотеку postgres
 * Используется для случаев, когда нужны прямые SQL-запросы
 * или специфические операции, которые сложно выполнить через Prisma
 */

import postgres from 'postgres';

// Проверка DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL не установлен! Установите переменную окружения DATABASE_URL.');
}

// Определяем конфигурацию SSL на основе окружения
// Для библиотеки postgres SSL может быть: 'allow' | 'prefer' | 'require' | 'verify-full' | { rejectUnauthorized: boolean }
const sslConfig = process.env.NODE_ENV === 'production' 
  ? 'verify-full'  // Полная проверка SSL в production
  : 'require';     // Требование SSL, но без проверки сертификата в development

// Создаем подключение к PostgreSQL
export const sql = postgres(process.env.DATABASE_URL || '', {
  ssl: sslConfig,
  max: 10, // Максимальное количество соединений в пуле
  idle_timeout: 20, // Таймаут неактивных соединений (секунды)
  connect_timeout: 10, // Таймаут подключения (секунды)
});

// Проверка подключения (опционально)
if (process.env.CHECK_DB_CONNECTION === 'true') {
  sql`SELECT 1`
    .then(() => {
      console.log('✅ Прямое подключение к PostgreSQL установлено');
    })
    .catch((error) => {
      console.error('❌ Ошибка прямого подключения к PostgreSQL:', error.message);
      console.error('Проверьте DATABASE_URL и доступность базы данных');
    });
}

export default sql;

