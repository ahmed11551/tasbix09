import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

/**
 * Skeleton для карточки цели
 */
export function GoalCardSkeleton() {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-20" />
      </div>
    </Card>
  );
}

/**
 * Skeleton для списка целей
 */
export function GoalsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <GoalCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton для карточки привычки
 */
export function HabitCardSkeleton() {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </Card>
  );
}

/**
 * Skeleton для списка привычек
 */
export function HabitsListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <HabitCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton для карточки задачи
 */
export function TaskCardSkeleton() {
  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-start gap-3">
        <Skeleton className="w-5 h-5 rounded mt-0.5" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Skeleton для списка задач
 */
export function TasksListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton для статистики
 */
export function StatsSkeleton() {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center space-y-1">
            <Skeleton className="h-6 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Skeleton для страницы
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        <StatsSkeleton />
        <GoalsListSkeleton count={3} />
      </main>
    </div>
  );
}

