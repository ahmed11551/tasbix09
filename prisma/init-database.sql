-- Полная инициализация базы данных Smart Tasbih Goals
-- Выполните этот скрипт в Neon SQL Editor после создания базы данных

-- ВАЖНО: Сначала нужно создать все enum типы, затем таблицы

-- Enum типы
CREATE TYPE "Category" AS ENUM ('general', 'surah', 'ayah', 'dua', 'azkar', 'names99', 'salawat', 'kalimat');
CREATE TYPE "GoalType" AS ENUM ('recite', 'learn');
CREATE TYPE "GoalStatus" AS ENUM ('active', 'completed', 'archived', 'paused');
CREATE TYPE "PrayerSegment" AS ENUM ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'none');
CREATE TYPE "EventType" AS ENUM ('tap', 'bulk', 'repeat', 'learn_mark', 'goal_completed', 'auto_reset');
CREATE TYPE "BadgeLevel" AS ENUM ('copper', 'silver', 'gold');
CREATE TYPE "HabitCategory" AS ENUM ('namaz', 'quran', 'dhikr', 'sadaqa', 'knowledge', 'fasting', 'etiquette');
CREATE TYPE "HabitDifficulty" AS ENUM ('easy', 'medium', 'advanced');
CREATE TYPE "RepeatType" AS ENUM ('never', 'daily', 'weekly', 'monthly', 'custom');
CREATE TYPE "Priority" AS ENUM ('low', 'medium', 'high');
CREATE TYPE "SubscriptionTier" AS ENUM ('muslim', 'mutahsin', 'sahabAlWaqf');

-- Таблица User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'muslim',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Таблица Habit
CREATE TABLE "Habit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "category" "HabitCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "iconName" TEXT NOT NULL,
    "difficulty" "HabitDifficulty" NOT NULL,
    "repeatType" "RepeatType" NOT NULL,
    "repeatDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "repeatDates" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "time" TEXT,
    "endTime" TEXT,
    "isAllDay" BOOLEAN NOT NULL DEFAULT true,
    "reminders" JSONB NOT NULL DEFAULT '[]',
    "calendarId" TEXT,
    "notes" TEXT,
    "url" TEXT,
    "linkedToTasbih" BOOLEAN NOT NULL DEFAULT false,
    "targetCount" INTEGER,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "completedDates" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Habit_userId_idx" ON "Habit"("userId");

ALTER TABLE "Habit" ADD CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Таблица Task
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "dueTime" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'medium',
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "subtasks" JSONB NOT NULL DEFAULT '[]',
    "reminders" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Task_userId_idx" ON "Task"("userId");

ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Таблица Goal
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "itemId" TEXT,
    "goalType" "GoalType" NOT NULL,
    "title" TEXT NOT NULL,
    "targetCount" INTEGER NOT NULL,
    "currentProgress" INTEGER NOT NULL DEFAULT 0,
    "status" "GoalStatus" NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "linkedCounterType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Таблица Session
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalId" TEXT,
    "prayerSegment" "PrayerSegment" NOT NULL DEFAULT 'none',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Session_userId_idx" ON "Session"("userId");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Таблица DhikrLog
CREATE TABLE "DhikrLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "goalId" TEXT,
    "category" "Category" NOT NULL,
    "itemId" TEXT,
    "eventType" "EventType" NOT NULL,
    "delta" INTEGER NOT NULL,
    "valueAfter" INTEGER NOT NULL,
    "prayerSegment" "PrayerSegment" NOT NULL DEFAULT 'none',
    "atTs" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tz" TEXT NOT NULL DEFAULT 'UTC',
    "offlineId" TEXT DEFAULT gen_random_uuid()::TEXT,

    CONSTRAINT "DhikrLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DhikrLog_userId_idx" ON "DhikrLog"("userId");
CREATE INDEX "DhikrLog_sessionId_idx" ON "DhikrLog"("sessionId");

ALTER TABLE "DhikrLog" ADD CONSTRAINT "DhikrLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DhikrLog" ADD CONSTRAINT "DhikrLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DhikrLog" ADD CONSTRAINT "DhikrLog_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Таблица DailyAzkar
CREATE TABLE "DailyAzkar" (
    "userId" TEXT NOT NULL,
    "dateLocal" TEXT NOT NULL,
    "fajr" INTEGER NOT NULL DEFAULT 0,
    "dhuhr" INTEGER NOT NULL DEFAULT 0,
    "asr" INTEGER NOT NULL DEFAULT 0,
    "maghrib" INTEGER NOT NULL DEFAULT 0,
    "isha" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyAzkar_pkey" PRIMARY KEY ("userId")
);

CREATE UNIQUE INDEX "DailyAzkar_userId_dateLocal_key" ON "DailyAzkar"("userId", "dateLocal");
CREATE INDEX "DailyAzkar_userId_idx" ON "DailyAzkar"("userId");

ALTER TABLE "DailyAzkar" ADD CONSTRAINT "DailyAzkar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Таблица Badge
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level" "BadgeLevel" NOT NULL,
    "icon" TEXT NOT NULL,
    "achievedAt" TIMESTAMP(3),
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "progress" INTEGER,
    "target" INTEGER,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Badge_userId_idx" ON "Badge"("userId");

ALTER TABLE "Badge" ADD CONSTRAINT "Badge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Таблица CalendarEvent
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endDate" TIMESTAMP(3) NOT NULL,
    "endTime" TEXT,
    "isAllDay" BOOLEAN NOT NULL DEFAULT true,
    "repeatType" "RepeatType" NOT NULL DEFAULT 'never',
    "calendarId" TEXT,
    "reminders" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CalendarEvent_userId_idx" ON "CalendarEvent"("userId");

ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Таблица QazaDebt
CREATE TABLE "QazaDebt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "birthYear" INTEGER,
    "prayerStartYear" INTEGER,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fajrDebt" INTEGER NOT NULL DEFAULT 0,
    "dhuhrDebt" INTEGER NOT NULL DEFAULT 0,
    "asrDebt" INTEGER NOT NULL DEFAULT 0,
    "maghribDebt" INTEGER NOT NULL DEFAULT 0,
    "ishaDebt" INTEGER NOT NULL DEFAULT 0,
    "witrDebt" INTEGER NOT NULL DEFAULT 0,
    "fajrProgress" INTEGER NOT NULL DEFAULT 0,
    "dhuhrProgress" INTEGER NOT NULL DEFAULT 0,
    "asrProgress" INTEGER NOT NULL DEFAULT 0,
    "maghribProgress" INTEGER NOT NULL DEFAULT 0,
    "ishaProgress" INTEGER NOT NULL DEFAULT 0,
    "witrProgress" INTEGER NOT NULL DEFAULT 0,
    "haydNifasPeriods" JSONB NOT NULL DEFAULT '[]',
    "safarDays" JSONB NOT NULL DEFAULT '[]',
    "goalId" TEXT,

    CONSTRAINT "QazaDebt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QazaDebt_userId_key" ON "QazaDebt"("userId");
CREATE INDEX "QazaDebt_userId_idx" ON "QazaDebt"("userId");

ALTER TABLE "QazaDebt" ADD CONSTRAINT "QazaDebt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Таблица QazaCalendarEntry
CREATE TABLE "QazaCalendarEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateLocal" TEXT NOT NULL,
    "fajr" BOOLEAN NOT NULL DEFAULT false,
    "dhuhr" BOOLEAN NOT NULL DEFAULT false,
    "asr" BOOLEAN NOT NULL DEFAULT false,
    "maghrib" BOOLEAN NOT NULL DEFAULT false,
    "isha" BOOLEAN NOT NULL DEFAULT false,
    "witr" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QazaCalendarEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QazaCalendarEntry_userId_dateLocal_key" ON "QazaCalendarEntry"("userId", "dateLocal");
CREATE INDEX "QazaCalendarEntry_userId_idx" ON "QazaCalendarEntry"("userId");

ALTER TABLE "QazaCalendarEntry" ADD CONSTRAINT "QazaCalendarEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Таблица CategoryStreak
CREATE TABLE "CategoryStreak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryStreak_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CategoryStreak_userId_category_key" ON "CategoryStreak"("userId", "category");
CREATE INDEX "CategoryStreak_userId_idx" ON "CategoryStreak"("userId");

ALTER TABLE "CategoryStreak" ADD CONSTRAINT "CategoryStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

