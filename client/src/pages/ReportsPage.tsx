import React, { useState, useMemo } from 'react';
import { Link } from 'wouter';
import StatsCard from '@/components/StatsCard';
import BadgeCard from '@/components/BadgeCard';
import StreakBadge from '@/components/StreakBadge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Target, 
  Flame, 
  Calendar,
  Trophy,
  History,
  Download,
  Share2,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  BarChart3,
  CircleCheck,
  AlertCircle,
  Clock,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { prayerLabels } from '@/lib/constants';
import { useGoals, useStats, useDailyAzkar, useBadges, useCheckBadges, useCategoryStreaks, useActivityHeatmap } from '@/hooks/use-api';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import { Check, ListChecks } from 'lucide-react';
// ВРЕМЕННО: Локализация отключена
  // // ВРЕМЕННО: Локализация отключена
  // import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { Task, Subtask, Habit, WeekDay } from '@/lib/types';
import { useData } from '@/context/DataContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ComposedChart,
  Line,
} from 'recharts';
import { getIconByName } from '@/lib/iconUtils';

const generateRecentDates = (daysBack: number): string[] => {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const CHART_COLORS = {
  completed: '#22c55e',
  remaining: '#3b82f6', 
  overdue: '#ef4444',
  habits: '#10b981',
  goals: '#6366f1',
};

type AnalyticsPeriod = 'week' | 'month' | 'quarter' | 'year';

interface MissedItem {
  id: string;
  habitId: string;
  habitTitle: string;
  habitIcon: string;
  date: string;
  dateLabel: string;
}

export default function ReportsPage() {
  // ВРЕМЕННО: Локализация отключена
  const t = {
    reports: {
      title: 'Отчеты',
      overallProgress: 'Общий прогресс',
      for: 'За',
      week: 'неделю',
      month: 'месяц',
      quarter: 'квартал',
      year: 'год',
      completed: 'Выполнено',
      streak: 'Серия',
      daysInRow: 'дней подряд',
      pending: 'Ожидает',
      everythingDone: 'Все сделано!',
      actions: 'действий',
      today: 'Сегодня',
      habits: 'привычек',
      missed: 'Пропущено',
      forPeriod: 'за период',
      dynamics: 'Динамика',
      achievements: 'Достижения',
      history: 'История',
      todayTab: 'Сегодня',
      achievementsTab: 'Достижения',
      historyTab: 'История',
      executed: 'Выполнено',
      percentCompletion: '% выполнения',
      whatToDoNow: 'Что делать сейчас',
      completeTodayHabits: 'Выполнить сегодняшние привычки',
      left: 'Осталось',
      missedHabits: 'Пропущенные привычки',
      allHabitsDone: 'Все привычки выполнены!',
      greatWork: 'Отличная работа!',
      overdueTasks: 'Просроченные задачи',
      task: 'задача',
      tasksRequireAttention: 'задач требуют',
      recoverHabits: 'Восстановить',
      habit: 'привычку',
      streakGrowing: 'Серия растет!',
      daysInPeriod: 'дней за период',
      allUnderControl: 'Все под контролем',
      noTasksRequiringAttention: 'Нет задач, требующих внимания',
      noMissedHabits: 'Нет пропущенных привычек',
      mark: 'Отметить',
      pendingActions: 'Ожидающие действия',
      overdueTasksCount: 'Просроченные задачи',
      deadline: 'Срок',
      salawatAfterPrayer: 'Салават после намаза',
      tasksToday: 'Задачи на сегодня',
      all: 'Все',
      noTasksToday: 'Нет задач на сегодня',
      subtasks: 'подзадач',
    },
    common: { loading: 'Загрузка...', error: 'Ошибка', success: 'Успешно' },
  } as any;
  const { habits, tasks, toggleHabitDay } = useData();
  const { data: goals = [] } = useGoals();
  const { data: stats } = useStats();
  const { data: badges = [] } = useBadges();
  const checkBadgesMutation = useCheckBadges();
  const { data: categoryStreaks = [] } = useCategoryStreaks();
  const today = new Date().toISOString().split('T')[0];
  const { data: dailyAzkarData } = useDailyAzkar(today);
  const { data: activityHeatmapData = [] } = useActivityHeatmap({ days: 365 });
  
  const [activeTab, setActiveTab] = useState<'today' | 'achievements' | 'history'>('today');
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>('week');
  const [missedSheetOpen, setMissedSheetOpen] = useState(false);
  const [pendingSheetOpen, setPendingSheetOpen] = useState(false);
  const [todayHabitsSheetOpen, setTodayHabitsSheetOpen] = useState(false);

  // Проверить бейджи при загрузке
  React.useEffect(() => {
    checkBadgesMutation.mutate();
  }, []);

  // Разделить бейджи на разблокированные и заблокированные
  const unlockedBadges = badges.filter((b: any) => b.isUnlocked);
  const lockedBadges = badges.filter((b: any) => !b.isUnlocked);

  const handleMarkHabitComplete = (habitId: string, dateKey: string) => {
    toggleHabitDay(habitId, dateKey);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Мой духовный прогресс',
          text: `Мой общий прогресс: ${analyticsData.overallCompletionRate}%\nСерия: ${analyticsData.currentStreak} дней\nСегодня: ${analyticsData.todayHabitsCompleted}/${analyticsData.todayHabitsExpected} привычек`,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }
  };

  const handleDownload = () => {
    // TODO: Implement PDF/CSV download
    console.log('Download report');
  };

  const analyticsData = useMemo(() => {
    const activeGoals = goals.filter((g: any) => g.status === 'active');
    const completedGoalsArr = goals.filter((g: any) => g.status === 'completed');
    
    const goalsProgress = activeGoals.reduce((acc, g) => acc + g.currentProgress, 0);
    const goalsTarget = activeGoals.reduce((acc, g) => acc + g.targetCount, 0);
    const goalsRemaining = Math.max(0, goalsTarget - goalsProgress);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = today.toISOString().split('T')[0];
    
    let periodDays = 7;
    if (analyticsPeriod === 'month') periodDays = 30;
    else if (analyticsPeriod === 'quarter') periodDays = 90;
    else if (analyticsPeriod === 'year') periodDays = 365;
    
    const periodStart = new Date(today);
    periodStart.setDate(today.getDate() - periodDays + 1);
    
    const allDates: string[] = [];
    for (let i = 0; i < periodDays; i++) {
      const d = new Date(periodStart);
      d.setDate(periodStart.getDate() + i);
      allDates.push(d.toISOString().split('T')[0]);
    }
    
    let habitsCompleted = 0;
    let habitsExpected = 0;
    let habitsMissed = 0;
    const missedItems: MissedItem[] = [];
    
    habits.forEach(habit => {
      const habitCreatedAt = habit.createdAt ? new Date(habit.createdAt) : periodStart;
      habitCreatedAt.setHours(0, 0, 0, 0);
      
      allDates.forEach(dateKey => {
        const date = new Date(dateKey);
        date.setHours(0, 0, 0, 0);
        const dayOfWeek = (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const)[date.getDay()];
        
        if (date < habitCreatedAt) return;
        
        let isScheduled = false;
        if (habit.repeatType === 'daily') {
          isScheduled = true;
        } else if (habit.repeatType === 'weekly' && habit.repeatDays) {
          isScheduled = habit.repeatDays.includes(dayOfWeek);
        }
        
        if (isScheduled && date <= today) {
          habitsExpected++;
          if (habit.completedDates.includes(dateKey)) {
            habitsCompleted++;
          } else if (dateKey < todayKey) {
            habitsMissed++;
            missedItems.push({
              id: `${habit.id}-${dateKey}`,
              habitId: habit.id,
              habitTitle: habit.title,
              habitIcon: habit.iconName,
              date: dateKey,
              dateLabel: new Date(dateKey).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
            });
          }
        }
      });
    });
    
    const tasksTotal = tasks.length;
    const tasksCompleted = tasks.filter(t => t.isCompleted).length;
    const tasksOverdue = tasks.filter(t => {
      if (t.isCompleted || !t.dueDate) return false;
      return t.dueDate < todayKey;
    }).length;
    
    interface ChartBucket {
      label: string;
      startIdx: number;
      endIdx: number;
    }
    
    const generateBuckets = (): ChartBucket[] => {
      if (analyticsPeriod === 'week') {
        return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((label, i) => ({
          label,
          startIdx: i,
          endIdx: i + 1,
        }));
      } else if (analyticsPeriod === 'month') {
        const bucketCount = 5;
        const daysPerBucket = Math.floor(periodDays / bucketCount);
        const remainder = periodDays % bucketCount;
        const buckets: ChartBucket[] = [];
        let currentIdx = 0;
        
        for (let i = 0; i < bucketCount; i++) {
          const extraDay = i < remainder ? 1 : 0;
          const bucketSize = daysPerBucket + extraDay;
          buckets.push({
            label: `Нед ${i + 1}`,
            startIdx: currentIdx,
            endIdx: currentIdx + bucketSize,
          });
          currentIdx += bucketSize;
        }
        return buckets;
      } else if (analyticsPeriod === 'quarter') {
        const bucketCount = 3;
        const daysPerBucket = Math.floor(periodDays / bucketCount);
        const remainder = periodDays % bucketCount;
        const buckets: ChartBucket[] = [];
        let currentIdx = 0;
        
        for (let i = 0; i < bucketCount; i++) {
          const extraDay = i < remainder ? 1 : 0;
          const bucketSize = daysPerBucket + extraDay;
          buckets.push({
            label: `${t.reports.month} ${i + 1}`,
            startIdx: currentIdx,
            endIdx: currentIdx + bucketSize,
          });
          currentIdx += bucketSize;
        }
        return buckets;
      } else {
        const bucketCount = 12;
        const daysPerBucket = Math.floor(periodDays / bucketCount);
        const remainder = periodDays % bucketCount;
        const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        const buckets: ChartBucket[] = [];
        let currentIdx = 0;
        
        for (let i = 0; i < bucketCount; i++) {
          const extraDay = i < remainder ? 1 : 0;
          const bucketSize = daysPerBucket + extraDay;
          buckets.push({
            label: monthNames[i],
            startIdx: currentIdx,
            endIdx: currentIdx + bucketSize,
          });
          currentIdx += bucketSize;
        }
        return buckets;
      }
    };
    
    const buckets = generateBuckets();
    
    const chartData = buckets.map((bucket) => {
      let completed = 0;
      let missed = 0;
      let expected = 0;
      
      for (let i = bucket.startIdx; i < bucket.endIdx; i++) {
        const dateKey = allDates[i];
        if (!dateKey) continue;
        
        const date = new Date(dateKey);
        date.setHours(0, 0, 0, 0);
        
        habits.forEach(habit => {
          const habitCreatedAt = habit.createdAt ? new Date(habit.createdAt) : periodStart;
          habitCreatedAt.setHours(0, 0, 0, 0);
          
          if (date < habitCreatedAt) return;
          
          const dayOfWeek = (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const)[date.getDay()];
          const isScheduled = habit.repeatType === 'daily' || 
            (habit.repeatType === 'weekly' && habit.repeatDays?.includes(dayOfWeek));
          
          if (isScheduled && date <= today) {
            expected++;
            if (habit.completedDates.includes(dateKey)) {
              completed++;
            } else if (dateKey < todayKey) {
              missed++;
            }
          }
        });
      }
      
      const completionRate = expected > 0 ? Math.round((completed / expected) * 100) : 0;
      
      return {
        name: bucket.label,
        completed: completed,
        missed: missed,
        expected: expected,
        rate: completionRate,
      };
    });
    
    const summaryData = [
      { 
        name: 'Цели', 
        completed: Math.round((goalsProgress / Math.max(goalsTarget, 1)) * 100),
        label: `${goalsProgress}/${goalsTarget}`,
      },
      { 
        name: 'Привычки', 
        completed: Math.round((habitsCompleted / Math.max(habitsExpected, 1)) * 100),
        label: `${habitsCompleted}/${habitsExpected}`,
      },
      { 
        name: 'Задачи', 
        completed: Math.round((tasksCompleted / Math.max(tasksTotal, 1)) * 100),
        label: `${tasksCompleted}/${tasksTotal}`,
      },
    ];
    
    const overallCompletionRate = Math.min(100, Math.round(
      ((habitsCompleted + tasksCompleted + goalsProgress) / 
       Math.max(habitsExpected + tasksTotal + goalsTarget, 1)) * 100
    ));
    
    const todayStr = todayKey;
    let todayHabitsCompleted = 0;
    let todayHabitsExpected = 0;
    const todayHabitsList: { habit: Habit; isCompleted: boolean }[] = [];
    
    habits.forEach(habit => {
      const date = new Date(todayStr);
      const dayOfWeek = (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const)[date.getDay()];
      const isScheduled = habit.repeatType === 'daily' || 
        (habit.repeatType === 'weekly' && habit.repeatDays?.includes(dayOfWeek));
      if (isScheduled) {
        todayHabitsExpected++;
        const isCompleted = habit.completedDates.includes(todayStr);
        if (isCompleted) {
          todayHabitsCompleted++;
        }
        todayHabitsList.push({ habit, isCompleted });
      }
    });
    
    const todayTasks = tasks.filter(t => t.dueDate === todayStr || !t.dueDate);
    const pendingTasks = tasks.filter(t => !t.isCompleted && (t.dueDate === todayStr || !t.dueDate));
    const overdueTasks = tasks.filter(t => !t.isCompleted && t.dueDate && t.dueDate < todayStr);
    
    const todayTasksCount = pendingTasks.length;
    const pendingActions = (todayHabitsExpected - todayHabitsCompleted) + todayTasksCount + tasksOverdue;
    
    const currentStreak = Math.max(...habits.map(h => h.currentStreak), 0);
    const avgStreak = habits.length > 0 
      ? Math.round(habits.reduce((acc, h) => acc + h.currentStreak, 0) / habits.length)
      : 0;
    
    const previousPeriodMissed = habitsMissed > 0 ? Math.max(0, habitsMissed - 2) : 0;
    const missedTrend = previousPeriodMissed > habitsMissed ? 'down' : habitsMissed > previousPeriodMissed ? 'up' : 'same';
    
    const todayProgressPercent = todayHabitsExpected > 0 
      ? Math.round((todayHabitsCompleted / todayHabitsExpected) * 100)
      : 100;
    
    const firstStreak = habits[0]?.currentStreak || 0;
    const streakDelta = currentStreak > 0 ? Math.max(0, currentStreak - avgStreak) : 0;
    
    return {
      goalsProgress,
      goalsTarget,
      goalsRemaining,
      completedGoalsCount: completedGoalsArr.length,
      activeGoals,
      habitsCompleted,
      habitsExpected,
      habitsMissed,
      tasksCompleted,
      tasksTotal,
      tasksOverdue,
      chartData,
      summaryData,
      missedItems: missedItems.slice(0, 20),
      overallCompletionRate,
      todayHabitsCompleted,
      todayHabitsExpected,
      todayHabitsList,
      todayTasksCount,
      pendingTasks,
      overdueTasks,
      pendingActions,
      currentStreak,
      avgStreak,
      missedTrend,
      todayProgress: todayProgressPercent,
      streakDelta,
    };
  }, [analyticsPeriod, habits, goals, stats]);

  const prayerProgress = dailyAzkarData ? {
    fajr: { done: dailyAzkarData.fajr, target: 99 },
    dhuhr: { done: dailyAzkarData.dhuhr, target: 99 },
    asr: { done: dailyAzkarData.asr, target: 99 },
    maghrib: { done: dailyAzkarData.maghrib, target: 99 },
    isha: { done: dailyAzkarData.isha, target: 99 },
  } : {
    fajr: { done: 0, target: 99 },
    dhuhr: { done: 0, target: 99 },
    asr: { done: 0, target: 99 },
    maghrib: { done: 0, target: 99 },
    isha: { done: 0, target: 99 },
  };

  const recentActivity = [
    { time: '08:32', action: '+33 СубханАллах', category: 'azkar' },
    { time: '08:15', action: '+99 азкары после Фаджр', category: 'azkar' },
    { time: '07:45', action: 'Выполнен намаз Фаджр', category: 'prayer' },
    { time: 'Вчера', action: '+500 салаватов', category: 'salawat' },
    { time: 'Вчера', action: 'Цель выполнена: 1000 зикров', category: 'azkar' },
  ];

  const completedGoals = goals.filter((g: any) => g.status === 'completed');

  return (
    <div id="main-content" tabIndex={-1} className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
          <h1 className="font-display font-semibold text-lg">{t.reports.title}</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare} data-testid="button-share">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload} data-testid="button-download">
              <Download className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        <Card className="p-4 mb-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20" data-testid="dashboard-overview">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t.reports.overallProgress}</h3>
                <p className="text-xs text-muted-foreground">{t.reports.for} {
                  analyticsPeriod === 'week' ? t.reports.week :
                  analyticsPeriod === 'month' ? t.reports.month :
                  analyticsPeriod === 'quarter' ? t.reports.quarter : t.reports.year
                }</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{analyticsData.overallCompletionRate}%</p>
              <p className="text-xs text-muted-foreground">{t.reports.completed}</p>
            </div>
          </div>
          
          <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-4">
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
              style={{ width: `${analyticsData.overallCompletionRate}%` }}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {analyticsData.summaryData.map((item) => (
              <div key={item.name} className="text-center p-2 rounded-lg bg-background/50">
                <p className="text-lg font-semibold">{item.completed}%</p>
                <p className="text-xs text-muted-foreground">{item.name}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="p-3" data-testid="kpi-streak">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <span className="text-xs text-muted-foreground">{t.reports.streak}</span>
            </div>
            <p className="text-2xl font-bold">{analyticsData.currentStreak}</p>
            <p className="text-xs text-muted-foreground">{t.reports.daysInRow}</p>
          </Card>
          
          <button 
            onClick={() => setPendingSheetOpen(true)}
            className="text-left"
            data-testid="kpi-pending-button"
          >
            <Card className="p-3 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  analyticsData.pendingActions > 0 ? "bg-yellow-500/10" : "bg-green-500/10"
                )}>
                  {analyticsData.pendingActions > 0 ? (
                    <Clock className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{t.reports.pending}</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
              </div>
              <p className="text-2xl font-bold">{analyticsData.pendingActions}</p>
              <p className="text-xs text-muted-foreground">
                {analyticsData.pendingActions === 0 ? t.reports.everythingDone : t.reports.actions}
              </p>
            </Card>
          </button>
          
          <button 
            onClick={() => setTodayHabitsSheetOpen(true)}
            className="text-left"
            data-testid="kpi-today-button"
          >
            <Card className="p-3 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-xs text-muted-foreground">{t.reports.today}</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
              </div>
              <p className="text-2xl font-bold">{analyticsData.todayHabitsCompleted}/{analyticsData.todayHabitsExpected}</p>
              <p className="text-xs text-muted-foreground">{t.reports.habits}</p>
            </Card>
          </button>
          
          <button 
            onClick={() => setMissedSheetOpen(true)}
            className="text-left"
            data-testid="kpi-missed-button"
          >
            <Card className="p-3 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  analyticsData.habitsMissed > 0 ? "bg-red-500/10" : "bg-green-500/10"
                )}>
                  {analyticsData.habitsMissed > 0 ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{t.reports.missed}</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
              </div>
              <div className="flex items-center gap-1">
                <p className="text-2xl font-bold">{analyticsData.habitsMissed}</p>
                {analyticsData.missedTrend === 'down' && (
                  <ArrowDownRight className="w-4 h-4 text-green-500" />
                )}
                {analyticsData.missedTrend === 'up' && (
                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t.reports.forPeriod}</p>
            </Card>
          </button>
        </div>

        <Card className="p-4 mb-4" data-testid="analytics-chart">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="font-medium">{t.reports.dynamics}</h3>
            </div>
            <Select value={analyticsPeriod} onValueChange={(v) => setAnalyticsPeriod(v as AnalyticsPeriod)}>
              <SelectTrigger className="w-28 h-8 text-xs" data-testid="select-analytics-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">{t.reports.week}</SelectItem>
                <SelectItem value="month">{t.reports.month}</SelectItem>
                <SelectItem value="quarter">{t.reports.quarter}</SelectItem>
                <SelectItem value="year">{t.reports.year}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analyticsData.chartData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  width={25}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  width={30}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  labelStyle={{ fontWeight: 500 }}
                  formatter={(value: number, name: string) => {
                    if (name === 'rate') return [`${value}%`, t.reports.completed];
                    return [value, name === 'completed' ? t.reports.executed : name === 'missed' ? t.reports.missed : t.reports.pending];
                  }}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="completed" 
                  name="completed"
                  fill={CHART_COLORS.completed}
                  radius={[4, 4, 0, 0]}
                  stackId="stack"
                />
                <Bar 
                  yAxisId="left"
                  dataKey="missed" 
                  name="missed"
                  fill={CHART_COLORS.overdue}
                  radius={[4, 4, 0, 0]}
                  stackId="stack"
                />
                <Line 
                  yAxisId="right"
                  type="monotone"
                  dataKey="rate" 
                  name="rate"
                  stroke={CHART_COLORS.goals}
                  strokeWidth={2.5}
                  dot={{ fill: CHART_COLORS.goals, strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: 'white' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-muted-foreground">{t.reports.executed}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-muted-foreground">{t.reports.missed}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-0.5 rounded-full bg-indigo-500" />
              <span className="text-muted-foreground">{t.reports.percentCompletion}</span>
            </div>
          </div>
          
        </Card>
        
        <Card className="p-4 mb-4" data-testid="actionable-insights">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="font-medium">{t.reports.whatToDoNow}</h3>
          </div>
          
          <div className="space-y-2">
            {analyticsData.todayProgress < 100 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t.reports.completeTodayHabits}</p>
                  <p className="text-xs text-muted-foreground">{t.reports.left} {100 - analyticsData.todayProgress}% для полного выполнения</p>
                </div>
              </div>
            )}
            
            {analyticsData.todayProgress >= 100 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
                <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CircleCheck className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-600">{t.reports.allHabitsDone}</p>
                  <p className="text-xs text-muted-foreground">{t.reports.greatWork}</p>
                </div>
              </div>
            )}
            
            {analyticsData.tasksOverdue > 0 && (
              <Link href="/goals">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 hover:bg-red-500/15 transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-600">{t.reports.overdueTasks}</p>
                    <p className="text-xs text-muted-foreground">{analyticsData.tasksOverdue} {analyticsData.tasksOverdue === 1 ? t.reports.task : t.reports.tasksRequireAttention} внимания</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-500" />
                </div>
              </Link>
            )}
            
            {analyticsData.habitsMissed > 0 && (
              <button 
                onClick={() => setMissedSheetOpen(true)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/15 transition-colors"
                data-testid="button-view-missed-habits"
              >
                <div className="w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-yellow-600">{t.reports.missedHabits}</p>
                  <p className="text-xs text-muted-foreground">{t.reports.recoverHabits} {analyticsData.habitsMissed} {analyticsData.habitsMissed === 1 ? t.reports.habit : t.reports.habits}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-yellow-500" />
              </button>
            )}
            
            {analyticsData.streakDelta > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10">
                <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t.reports.streakGrowing}</p>
                  <p className="text-xs text-muted-foreground">+{analyticsData.streakDelta} {t.reports.daysInPeriod}</p>
                </div>
              </div>
            )}
            
            {analyticsData.tasksOverdue === 0 && analyticsData.habitsMissed === 0 && analyticsData.todayProgress >= 100 && (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium">{t.reports.allUnderControl}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.reports.noTasksRequiringAttention}</p>
              </div>
            )}
          </div>
        </Card>

        <Sheet open={missedSheetOpen} onOpenChange={setMissedSheetOpen}>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                {t.reports.missedHabits}
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(70vh-80px)]">
              <div className="space-y-2 pr-4">
                {analyticsData.missedItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{t.reports.noMissedHabits}</p>
                ) : (
                  analyticsData.missedItems.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
                      data-testid={`missed-item-${item.id}`}
                    >
                      <Link 
                        href={`/goals?highlightHabit=${item.habitId}`}
                        className="flex items-center gap-3 flex-1 min-w-0"
                        onClick={() => setMissedSheetOpen(false)}
                      >
                        <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                          {getIconByName(item.habitIcon, "w-4 h-4 text-muted-foreground")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.habitTitle}</p>
                          <p className="text-xs text-muted-foreground">{item.dateLabel}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkHabitComplete(item.habitId, item.date);
                        }}
                        data-testid={`button-complete-missed-${item.id}`}
                      >
                        <CircleCheck className="w-3.5 h-3.5" />
                        <span className="text-xs">{t.reports.mark}</span>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <Sheet open={pendingSheetOpen} onOpenChange={setPendingSheetOpen}>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                {t.reports.pendingActions}
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(70vh-80px)]">
              <div className="space-y-4 pr-4">
                {analyticsData.overdueTasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-500 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {t.reports.overdueTasksCount} ({analyticsData.overdueTasks.length})
                    </h4>
                    <div className="space-y-2">
                      {analyticsData.overdueTasks.map((task: Task) => (
                        <Link key={task.id} href="/goals">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 hover:bg-red-500/15 transition-colors cursor-pointer">
                            <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                              <Target className="w-4 h-4 text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{task.title}</p>
                              <p className="text-xs text-red-500">{t.reports.deadline}: {new Date(task.dueDate!).toLocaleDateString('ru-RU')}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-red-500" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {analyticsData.pendingTasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <ListChecks className="w-4 h-4" />
                      {t.reports.todayTasks} ({analyticsData.pendingTasks.length})
                    </h4>
                    <div className="space-y-2">
                      {analyticsData.pendingTasks.map((task: Task) => (
                        <Link key={task.id} href="/goals">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer">
                            <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                              <Target className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{task.title}</p>
                              {task.dueDate && (
                                <p className="text-xs text-muted-foreground">{t.reports.deadline}: {new Date(task.dueDate).toLocaleDateString('ru-RU')}</p>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {analyticsData.todayHabitsList.filter(h => !h.isCompleted).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      {t.reports.uncompletedHabits} ({analyticsData.todayHabitsList.filter(h => !h.isCompleted).length})
                    </h4>
                    <div className="space-y-2">
                      {analyticsData.todayHabitsList.filter(h => !h.isCompleted).map(({ habit }) => (
                        <div 
                          key={habit.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center shrink-0">
                            {getIconByName(habit.iconName, "w-4 h-4 text-muted-foreground")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{habit.title}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 gap-1"
                            onClick={() => handleMarkHabitComplete(habit.id, new Date().toISOString().split('T')[0])}
                          >
                            <CircleCheck className="w-3.5 h-3.5" />
                            <span className="text-xs">Отметить</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {analyticsData.pendingActions === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-sm font-medium">{t.reports.everythingDone}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.reports.noTasksRequiringAttention}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <Sheet open={todayHabitsSheetOpen} onOpenChange={setTodayHabitsSheetOpen}>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-500" />
                {t.reports.todayHabits}
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(70vh-80px)]">
              <div className="space-y-2 pr-4">
                {analyticsData.todayHabitsList.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{t.reports.noTodayHabits}</p>
                ) : (
                  analyticsData.todayHabitsList.map(({ habit, isCompleted }) => (
                    <div 
                      key={habit.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg",
                        isCompleted ? "bg-green-500/10" : "bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                        isCompleted ? "bg-green-500/20" : "bg-background"
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          getIconByName(habit.iconName, "w-4 h-4 text-muted-foreground")
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          isCompleted && "text-green-600"
                        )}>{habit.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {isCompleted ? t.reports.completed : t.reports.awaiting}
                        </p>
                      </div>
                      {!isCompleted && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 gap-1"
                          onClick={() => handleMarkHabitComplete(habit.id, new Date().toISOString().split('T')[0])}
                        >
                          <CircleCheck className="w-3.5 h-3.5" />
                          <span className="text-xs">Отметить</span>
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="today" className="gap-1">
              <Calendar className="w-3 h-3" />
              {t.reports.today}
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-1">
              <Trophy className="w-3 h-3" />
              {t.reports.achievements}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1">
              <History className="w-3 h-3" />
              {t.reports.history}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{t.reports.salawatAfterPrayer}</h3>
                <span className="text-sm text-muted-foreground">
                  166 / 495
                </span>
              </div>
              
              <div className="space-y-3">
                {Object.entries(prayerProgress).map(([prayer, { done, target }]) => (
                  <div key={prayer} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {prayerLabels[prayer]}
                      </span>
                      <span className={done >= target ? "text-primary font-medium" : ""}>
                        {done} / {target}
                      </span>
                    </div>
                    <Progress value={(done / target) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <ListChecks className="w-4 h-4" />
                  {t.reports.tasksToday}
                </h3>
                <Link href="/goals">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs" data-testid="link-all-tasks">
                    {t.reports.all}
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
              
              {(() => {
                const today = new Date().toISOString().split('T')[0];
                const todayTasks = tasks.filter((t: Task) => t.dueDate === today || !t.dueDate);
                const completedCount = todayTasks.filter((t: Task) => t.isCompleted).length;
                
                if (todayTasks.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      {t.reports.noTasksToday}
                    </p>
                  );
                }
                
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t.reports.completed}</span>
                      <span>{completedCount} / {todayTasks.length}</span>
                    </div>
                    <Progress value={(completedCount / todayTasks.length) * 100} className="h-2" />
                    
                    <div className="space-y-2 pt-2">
                      {todayTasks.slice(0, 3).map((task: Task) => {
                        const subtasks = task.subtasks || [];
                        const completedSubtasks = subtasks.filter((s: Subtask) => s.isCompleted).length;
                        const hasSubtasks = subtasks.length > 0;
                        
                        return (
                          <div key={task.id} className="flex items-start gap-2" data-testid={`report-task-${task.id}`}>
                            <div className={cn(
                              "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                              task.isCompleted 
                                ? "bg-primary border-primary" 
                                : "border-muted-foreground"
                            )}>
                              {task.isCompleted && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={cn(
                                "text-sm truncate block",
                                task.isCompleted && "line-through text-muted-foreground"
                              )}>
                                {task.title}
                              </span>
                              {hasSubtasks && (
                                <span className="text-xs text-muted-foreground">
                                  {completedSubtasks}/{subtasks.length} {t.reports.subtasks}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </Card>

            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{t.reports.activeGoals}</h3>
                <Link href="/goals">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs" data-testid="link-all-goals">
                    {t.reports.all}
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
              
              {goals.filter((g: any) => g.status === 'active').slice(0, 2).map((goal: any) => (
                <div key={goal.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{goal.title}</span>
                    <span className="text-muted-foreground">
                      {Math.round((goal.currentProgress / goal.targetCount) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(goal.currentProgress / goal.targetCount) * 100} 
                    className="h-1.5" 
                  />
                </div>
              ))}
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-chart-2" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{t.reports.recommendation}</p>
                  <p className="text-xs text-muted-foreground">
                    Для достижения цели "10000 салаватов" делайте 350 салаватов в день
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            {unlockedBadges.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">{t.reports.receivedBadges}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {unlockedBadges.map((badge) => (
                    <BadgeCard 
                      key={badge.id} 
                      badge={badge}
                      onClick={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}

            {lockedBadges.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-muted-foreground">{t.reports.inProgress}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {lockedBadges.map((badge) => (
                    <BadgeCard 
                      key={badge.id} 
                      badge={badge}
                      onClick={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}

            {completedGoals.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium">{t.reports.completedGoals}</h3>
                {completedGoals.map((goal) => (
                  <Card key={goal.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Target className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{goal.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {goal.completedAt && new Date(goal.completedAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Тепловая карта активности
              </h3>
              <ActivityHeatmap data={activityHeatmapData} period="year" />
            </Card>
            
            <Card className="divide-y divide-border">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </Card>
            
            <Button variant="outline" className="w-full">
              {t.reports.loadMore}
            </Button>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
