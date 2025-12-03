#!/bin/bash

# Скрипт для загрузки кода в GitHub

echo "🚀 Загрузка кода в GitHub..."
echo ""

cd /Users/ahmeddevops/Desktop/SmartTasbihGoals_pub-main

# Проверка remote
echo "📡 Проверка remote..."
git remote -v

echo ""
echo "📤 Попытка push в GitHub..."
echo ""

# Попытка push
if git push -u origin main 2>&1; then
    echo ""
    echo "✅ Успешно загружено в GitHub!"
    echo "📱 Репозиторий: https://github.com/ahmed11551/SmartTasbihGoals"
else
    echo ""
    echo "⚠️  Требуется аутентификация"
    echo ""
    echo "Варианты решения:"
    echo ""
    echo "1. Использовать SSH (если настроен):"
    echo "   git remote set-url origin git@github.com:ahmed11551/SmartTasbihGoals.git"
    echo "   git push -u origin main"
    echo ""
    echo "2. Использовать Personal Access Token:"
    echo "   - Создайте токен на GitHub (Settings → Developer settings → Personal access tokens)"
    echo "   - Выполните: git push -u origin main"
    echo "   - Введите токен вместо пароля"
    echo ""
    echo "3. Использовать GitHub Desktop:"
    echo "   - Откройте GitHub Desktop"
    echo "   - File → Add Local Repository"
    echo "   - Выберите эту папку и нажмите Publish"
fi

