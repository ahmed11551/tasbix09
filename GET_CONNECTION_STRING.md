# 🔗 Как получить Connection String из Neon

Ваш проект Neon: **sparkling-sound-64172647**

## Метод 1: Через Neon Dashboard (рекомендуется)

1. **Откройте**: https://console.neon.tech
2. **Войдите** в ваш аккаунт
3. **Выберите проект** `sparkling-sound-64172647`
4. На **главной странице проекта** найдите раздел **"Connection Details"**
5. Вы увидите connection string в формате:

```
postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

6. **Нажмите кнопку "Copy"** чтобы скопировать весь connection string

---

## Метод 2: Через Connection String в настройках

1. В Neon Dashboard → ваш проект
2. Перейдите в **"Connection Details"** (в левом меню или на главной странице)
3. Выберите **"Connection string"** (не "Connection pooling")
4. Скопируйте connection string

---

## Формат connection string должен быть:

### ✅ Правильный формат:
```
postgresql://neondb_owner:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

Или если используется `pg.neon.tech`:
```
postgresql://neondb_owner:password@pg.neon.tech/dbname?sslmode=require
```

### ❌ Неправильно:
- Без `?sslmode=require`
- Только hostname без остальных параметров
- С `localhost` или `127.0.0.1`

---

## После получения connection string:

1. **Скопируйте весь connection string**
2. **Добавьте в Vercel**:
   - Settings → Environment Variables
   - Key: `DATABASE_URL`
   - Value: вставьте connection string
3. **Передеплойте** проект

---

## Если не можете найти connection string:

1. В Neon Dashboard → ваш проект
2. Перейдите в **"Settings"** (настройки проекта)
3. Найдите раздел **"Connection Details"** или **"Database"**
4. Там должен быть **"Connection string"** или **"Connection URI"**

Если все еще не можете найти:
- Нажмите на кнопку **"Show"** или **"Reveal"** рядом с паролем
- Connection string обычно показан рядом с настройками базы данных

