-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "CategoryStreak_userId_category_key" ON "CategoryStreak"("userId", "category");

-- CreateIndex
CREATE INDEX "CategoryStreak_userId_idx" ON "CategoryStreak"("userId");

-- AddForeignKey
ALTER TABLE "CategoryStreak" ADD CONSTRAINT "CategoryStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

