#!/bin/bash

# Скрипт для настройки Vercel через CLI

set -e

echo "=== Настройка Vercel через CLI ==="
echo ""

# Проверка Node.js и npm
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Установите Node.js: https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm не найден. Установите Node.js (npm входит в состав Node.js)"
    exit 1
fi

echo "✅ Node.js версия: $(node --version)"
echo "✅ npm версия: $(npm --version)"
echo ""

# Проверка Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 Установка Vercel CLI..."
    npm install -g vercel
    echo "✅ Vercel CLI установлен"
else
    echo "✅ Vercel CLI уже установлен: $(vercel --version)"
fi

echo ""
echo "🔐 Шаг 1: Авторизация в Vercel"
echo "⚠️  Откроется браузер для входа. Нажмите Enter чтобы продолжить..."
read

vercel login

echo ""
echo "📁 Шаг 2: Подключение проекта к Vercel"
echo "Следуйте инструкциям:"
echo "  - Нажмите Enter для использования текущей директории"
echo "  - Выберите 'Link to existing project' или 'Create new project'"
echo "  - Если проект уже существует, выберите его из списка"
echo ""
echo "⚠️  Нажмите Enter чтобы продолжить..."
read

vercel link

echo ""
echo "📝 Шаг 3: Добавление переменных окружения"
echo ""
echo "⚠️  ВАЖНО: Добавьте переменные окружения в Vercel Dashboard:"
echo ""
echo "Откройте: https://vercel.com/dashboard"
echo "Выберите ваш проект → Settings → Environment Variables"
echo ""
echo "Добавьте переменные (см. vercel-env-template.txt):"
echo "  - DATABASE_URL (обязательно)"
echo "  - SESSION_SECRET (обязательно)"
echo "  - TELEGRAM_BOT_TOKEN"
echo "  - OPENAI_API_KEY (опционально)"
echo ""
echo "После добавления переменных нажмите Enter..."
read

echo ""
echo "🚀 Шаг 4: Первый деплой"
echo "Выполняется деплой на production..."
vercel --prod

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo ""
echo "1. Примените миграции базы данных:"
echo "   vercel env pull .env.local"
echo "   npx prisma migrate deploy"
echo ""
echo "2. Проверьте работу приложения:"
echo "   Откройте URL из вывода выше"
echo ""
echo "3. Полезные команды:"
echo "   vercel ls              - список деплоев"
echo "   vercel logs            - просмотр логов"
echo "   vercel env ls          - список переменных окружения"
echo "   vercel --prod          - новый деплой"
echo ""

