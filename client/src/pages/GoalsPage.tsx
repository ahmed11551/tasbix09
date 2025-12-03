import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Target, 
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus, 
  Sparkles,
  Search,
  ArrowUpDown,
  CalendarDays,
  Check,
  MoreVertical,
  Pencil,
  Trash2,
  AlertCircle,
  TrendingUp,
  Clock,
  ListTodo,
  Flag,
  Circle,
  Square,
  X,
} from 'lucide-react';
import HabitCatalogSheet from '@/components/HabitCatalogSheet';
import HabitCreationSheet from '@/components/HabitCreationSheet';
import TaskCreationSheet from '@/components/TaskCreationSheet';
import GoalCreationSheet from '@/components/GoalCreationSheet';
import GoalCard from '@/components/GoalCard';
import AIAssistantSheet from '@/components/AIAssistantSheet';
import CalendarSheet from '@/components/CalendarSheet';
import type { Habit, Task, Goal, WeekDay } from '@/lib/types';
import type { HabitTemplate } from '@/lib/habitsCatalog';
import { habitCategories } from '@/lib/habitsCatalog';
import { cn } from '@/lib/utils';
import { getIconByName } from '@/lib/iconUtils';
import { useData } from '@/context/DataContext';
import { 
  useGoals, 
  useCreateGoal, 
  useUpdateGoal, 
  useDeleteGoal,
  useCreateHabit,
  useUpdateHabit,
  useDeleteHabit,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

function getWeekDays(baseDate: Date = new Date()): { date: Date; dayName: string; dayNum: number; isToday: boolean }[] {
  const days = [];
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  
  const startOfWeek = new Date(baseDate);
  const dayOfWeek = startOfWeek.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(startOfWeek.getDate() + diff);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    days.push({
      date,
      dayName: dayNames[date.getDay()],
      dayNum: date.getDate(),
      isToday: date.getTime() === today.getTime(),
    });
  }
  
  return days;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

interface HabitCardProps {
  habit: Habit;
  weekDays: ReturnType<typeof getWeekDays>;
  onToggleDay: (habitId: string, date: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  isHighlighted?: boolean;
  cardRef?: (el: HTMLDivElement | null) => void;
}

function getWeeklyTarget(habit: Habit): number {
  if (habit.repeatType === 'daily') return 7;
  if (habit.repeatType === 'weekly' && habit.repeatDays && habit.repeatDays.length > 0) {
    return habit.repeatDays.length;
  }
  return 7;
}

function getDailyTargetHint(habit: Habit): string | null {
  if (!habit.targetCount || habit.targetCount <= 0) return null;
  
  const weeklyTarget = getWeeklyTarget(habit);
  const dailyCount = Math.ceil(habit.targetCount / weeklyTarget);
  
  const getTypeWord = (count: number, category: string): string => {
    if (category === 'salawat') {
      if (count === 1) return 'салават';
      if (count >= 2 && count <= 4) return 'салавата';
      return 'салаватов';
    }
    if (category === 'dua') return 'дуа';
    if (category === 'quran') {
      if (count === 1) return 'аят';
      if (count >= 2 && count <= 4) return 'аята';
      return 'аятов';
    }
    if (category === 'namaz') {
      if (count === 1) return 'ракаат';
      if (count >= 2 && count <= 4) return 'ракаата';
      return 'ракаатов';
    }
    if (category === 'sadaqa') return 'садака';
    if (category === 'dhikr' || category === 'azkar') {
      if (count === 1) return 'зикр';
      if (count >= 2 && count <= 4) return 'зикра';
      return 'зикров';
    }
    if (count === 1) return 'раз';
    if (count >= 2 && count <= 4) return 'раза';
    return 'раз';
  };
    
  return `${dailyCount} ${getTypeWord(dailyCount, habit.category)} в день`;
}

function HabitCard({ habit, weekDays, onToggleDay, onEdit, onDelete, isHighlighted, cardRef }: HabitCardProps) {
  const completedThisWeek = weekDays.filter(day => 
    habit.completedDates.includes(formatDateKey(day.date))
  ).length;
  
  const weeklyTarget = getWeeklyTarget(habit);
  const progressPercent = Math.min((completedThisWeek / weeklyTarget) * 100, 100);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = formatDateKey(today);
  const isTodayCompleted = habit.completedDates.includes(todayKey);
  
  const shouldCompleteToday = habit.repeatType === 'daily' || 
    (habit.repeatType === 'weekly' && habit.repeatDays?.includes(
      ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][today.getDay()] as any
    ));
  
  const missedDays = weekDays.filter(day => {
    if (day.date >= today) return false;
    const dateKey = formatDateKey(day.date);
    if (habit.completedDates.includes(dateKey)) return false;
    if (habit.repeatType === 'daily') return true;
    if (habit.repeatType === 'weekly' && habit.repeatDays) {
      const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][day.date.getDay()];
      return habit.repeatDays.includes(dayOfWeek as any);
    }
    return true;
  }).length;
  
  const dailyHint = getDailyTargetHint(habit);
  const categoryInfo = habitCategories.find(c => c.id === habit.category);

  return (
    <Card 
      ref={cardRef}
      className={cn(
        "p-3 space-y-2 relative overflow-hidden transition-all duration-300",
        isHighlighted && "ring-2 ring-primary ring-offset-2 shadow-lg animate-pulse"
      )} 
      data-testid={`habit-card-${habit.id}`}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: categoryInfo?.color || '#22c55e' }}
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            {getIconByName(habit.iconName, "w-5 h-5 text-primary")}
          </div>
          <div className="min-w-0">
            <span className="font-medium text-sm block truncate">{habit.title}</span>
            <div className="flex items-center gap-1.5">
              <Progress value={progressPercent} className="w-16 h-1.5" />
              <span className="text-xs text-muted-foreground">{completedThisWeek}/{weeklyTarget}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1">
            {weekDays.map((day) => {
              const dateKey = formatDateKey(day.date);
              const isCompleted = habit.completedDates.includes(dateKey);
              const isFuture = day.date > today;
              const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][day.date.getDay()] as WeekDay;
              const isScheduled = habit.repeatType === 'daily' 
                ? true 
                : habit.repeatType === 'weekly' 
                  ? habit.repeatDays?.includes(dayOfWeek) ?? false
                  : true;
              
              return (
                <button
                  key={dateKey}
                  onClick={() => !isFuture && onToggleDay(habit.id, dateKey)}
                  disabled={isFuture}
                  className={cn(
                    "w-5 h-5 rounded-full transition-all flex items-center justify-center text-[9px] font-medium",
                    isCompleted 
                      ? "bg-primary text-primary-foreground" 
                      : isScheduled
                        ? day.isToday 
                          ? "bg-primary/30 text-primary ring-1 ring-primary"
                          : "bg-primary/20 text-primary"
                        : "bg-muted/50 text-muted-foreground/50",
                    isFuture && "opacity-50",
                    !isFuture && !isCompleted && isScheduled && "hover:bg-primary/40 active:bg-primary/50 cursor-pointer",
                    !isScheduled && "cursor-default"
                  )}
                  data-testid={`habit-dot-${habit.id}-${day.dayNum}`}
                >
                  {day.dayName.charAt(0)}
                </button>
              );
            })}
          </div>
          
          {isTodayCompleted && (
            <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center ml-1">
              <Check className="w-3.5 h-3.5 text-gold" />
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(habit)}>
                <Pencil className="w-4 h-4 mr-2" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(habit.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {dailyHint && (
        <div className="flex items-center gap-1.5 text-[11px] text-primary/80 pl-12">
          <Target className="w-3 h-3" />
          <span>Для достижения цели: {dailyHint}</span>
        </div>
      )}
      
      {!isTodayCompleted && shouldCompleteToday && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pl-12">
          <Clock className="w-3 h-3" />
          <span>
            {missedDays > 0 
              ? `Пропущено ${missedDays} дн. — выполните сегодня!`
              : 'Выполните сегодня для продолжения серии'
            }
          </span>
        </div>
      )}
    </Card>
  );
}

interface AIInsightProps {
  habits: Habit[];
}

function shouldCompleteOnDay(habit: Habit, date: Date): boolean {
  if (habit.repeatType === 'daily') return true;
  if (habit.repeatType === 'weekly' && habit.repeatDays) {
    const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
    return habit.repeatDays.includes(dayOfWeek as any);
  }
  return true;
}

function AIInsight({ habits }: AIInsightProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = formatDateKey(today);
  const weekDays = getWeekDays();
  
  const habitsForToday = habits.filter(h => shouldCompleteOnDay(h, today));
  const habitsNotCompletedToday = habitsForToday.filter(h => !h.completedDates.includes(todayKey));
  
  const laggingHabits = habits.filter(h => {
    const missedDays = weekDays.filter(day => {
      if (day.date >= today) return false;
      const dateKey = formatDateKey(day.date);
      if (h.completedDates.includes(dateKey)) return false;
      return shouldCompleteOnDay(h, day.date);
    }).length;
    return missedDays >= 2;
  });
  
  const brokenStreaks = habits.filter(h => {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = formatDateKey(yesterday);
    const shouldHaveCompletedYesterday = shouldCompleteOnDay(h, yesterday);
    return h.currentStreak > 0 && shouldHaveCompletedYesterday && 
           !h.completedDates.includes(yesterdayKey) && !h.completedDates.includes(todayKey);
  });
  
  const totalCompleted = habits.reduce((sum, h) => {
    return sum + weekDays.filter(day => h.completedDates.includes(formatDateKey(day.date))).length;
  }, 0);
  const totalPossible = habits.reduce((sum, h) => sum + getWeeklyTarget(h), 0);
  const weeklyPerformance = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  const metricsRow = (
    <div className="flex items-center gap-3 text-xs flex-wrap">
      <div className="flex items-center gap-1">
        <TrendingUp className="w-3 h-3 text-muted-foreground" />
        <span className="text-muted-foreground">{weeklyPerformance}%</span>
      </div>
      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3 text-muted-foreground" />
        <span className="text-muted-foreground">{habitsNotCompletedToday.length}/{habitsForToday.length}</span>
      </div>
    </div>
  );

  if (laggingHabits.length > 0) {
    return (
      <Card className="p-3 bg-amber-500/10 border-amber-500/20" data-testid="ai-insight">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                Требуют внимания
              </span>
            </div>
            {metricsRow}
          </div>
          <div className="space-y-1 pl-6">
            {laggingHabits.slice(0, 2).map(h => (
              <div key={h.id} className="flex items-center gap-2 text-xs">
                <span className="w-1 h-1 rounded-full bg-amber-500" />
                <span className="font-medium">{h.title}</span>
                <span className="text-muted-foreground">— 2+ дня</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground border-t border-amber-500/20 pt-2">
            Начните с одной привычки, чтобы вернуться в ритм
          </p>
        </div>
      </Card>
    );
  }

  if (brokenStreaks.length > 0) {
    return (
      <Card className="p-3 bg-orange-500/10 border-orange-500/20" data-testid="ai-insight">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                Серия под угрозой
              </span>
            </div>
            {metricsRow}
          </div>
          <div className="space-y-1 pl-6">
            {brokenStreaks.slice(0, 2).map(h => (
              <div key={h.id} className="flex items-center gap-2 text-xs">
                <span className="w-1 h-1 rounded-full bg-orange-500" />
                <span className="font-medium">{h.title}</span>
                <span className="text-muted-foreground">— {h.currentStreak} дн.</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground border-t border-orange-500/20 pt-2">
            Выполните сегодня, чтобы сохранить серию!
          </p>
        </div>
      </Card>
    );
  }

  if (habitsNotCompletedToday.length === 0 && habits.length > 0) {
    return (
      <Card className="p-3 bg-primary/5 border-primary/20" data-testid="ai-insight">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Все выполнено!</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-primary" />
              <span className="text-primary font-medium">{weeklyPerformance}%</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground pl-6">
            {habits.length} привычек сегодня. Машааллах!
          </p>
        </div>
      </Card>
    );
  }

  if (weeklyPerformance >= 80) {
    return (
      <Card className="p-3 bg-primary/5 border-primary/20" data-testid="ai-insight">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Отличный прогресс!</span>
            </div>
            {metricsRow}
          </div>
          {habitsNotCompletedToday.length > 0 && (
            <p className="text-[11px] text-muted-foreground pl-6">
              Осталось {habitsNotCompletedToday.length} привычек на сегодня
            </p>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3 bg-muted/30" data-testid="ai-insight">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">На сегодня</span>
          </div>
          {metricsRow}
        </div>
        {habitsNotCompletedToday[0] && (
          <p className="text-[11px] text-muted-foreground pl-6">
            Начните с "{habitsNotCompletedToday[0].title}"
          </p>
        )}
      </div>
    </Card>
  );
}

export default function GoalsPage() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const highlightHabitId = searchParams.get('highlightHabit');
  const { toast } = useToast();
  
  // API hooks
  const { data: goals = [], isLoading: goalsLoading } = useGoals();
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();
  
  const { 
    habits, 
    tasks, 
    addHabit, 
    updateHabit,
    deleteHabit, 
    toggleHabitDay,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    toggleSubtask 
  } = useData();
  
  const [goalsOpen, setGoalsOpen] = useState(true);
  const [tasksOpen, setTasksOpen] = useState(true);
  const [habitsOpen, setHabitsOpen] = useState(true);
  const [taskFilter, setTaskFilter] = useState<'all' | 'today' | 'tomorrow' | 'no_date'>('all');
  const [goalFilter, setGoalFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('all');
  const [highlightedHabitId, setHighlightedHabitId] = useState<string | null>(null);
  
  const habitRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const [selectedTemplate, setSelectedTemplate] = useState<HabitTemplate | null>(null);
  const [habitSheetOpen, setHabitSheetOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  
  const [goalSheetOpen, setGoalSheetOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalDeleteDialogOpen, setGoalDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskDeleteDialogOpen, setTaskDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [habitCatalogOpen, setHabitCatalogOpen] = useState(false);
  const [habitCategoryFilter, setHabitCategoryFilter] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const weekDays = useMemo(() => getWeekDays(), []);

  useEffect(() => {
    if (highlightHabitId) {
      setHabitsOpen(true);
      setHighlightedHabitId(highlightHabitId);
      
      setTimeout(() => {
        const element = habitRefs.current[highlightHabitId];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      setTimeout(() => {
        setHighlightedHabitId(null);
        window.history.replaceState({}, '', '/goals');
      }, 3000);
    }
  }, [highlightHabitId]);

  const filteredHabits = useMemo(() => {
    if (!habitCategoryFilter) return habits;
    return habits.filter(h => h.category === habitCategoryFilter);
  }, [habits, habitCategoryFilter]);

  const filteredGoals = useMemo(() => {
    if (goalFilter === 'all') return goals;
    return goals.filter(g => g.status === goalFilter);
  }, [goals, goalFilter]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    
    if (taskFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      result = result.filter(t => t.dueDate === today);
    } else if (taskFilter === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      result = result.filter(t => t.dueDate === tomorrowStr);
    } else if (taskFilter === 'no_date') {
      result = result.filter(t => !t.dueDate);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [tasks, taskFilter, searchQuery]);

  const handleSelectFromCatalog = (template: HabitTemplate) => {
    setSelectedTemplate(template);
    setHabitSheetOpen(true);
  };

  const handleCreateHabit = async (habitData: Partial<Habit>) => {
    try {
      if (editingHabit) {
        await updateHabit(editingHabit.id, habitData);
        setEditingHabit(null);
        toast({
          title: "Привычка обновлена",
          description: "Изменения сохранены",
        });
      } else {
        await addHabit(habitData);
        toast({
          title: "Привычка создана",
          description: "Новая привычка добавлена",
        });
      }
      setSelectedTemplate(null);
      setHabitSheetOpen(false);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сохранить привычку",
        variant: "destructive",
      });
    }
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitSheetOpen(true);
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabitToDelete(habitId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteHabit = async () => {
    if (habitToDelete) {
      try {
        await deleteHabit(habitToDelete);
        toast({
          title: "Привычка удалена",
          description: "Привычка успешно удалена",
        });
        setHabitToDelete(null);
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить привычку",
          variant: "destructive",
        });
      }
    }
    setDeleteDialogOpen(false);
  };

  const handleCreateGoal = async (goalData: {
    category: string;
    goalType: string;
    title: string;
    targetCount: number;
    endDate?: string;
    linkedToTasbih: boolean;
  }) => {
    try {
      const goalPayload = {
        category: goalData.category,
        goalType: goalData.goalType,
        title: goalData.title,
        targetCount: goalData.targetCount,
        currentProgress: 0,
        status: 'active' as const,
        startDate: new Date().toISOString(),
        endDate: goalData.endDate ? new Date(goalData.endDate).toISOString() : undefined,
        linkedCounterType: goalData.linkedToTasbih ? goalData.category : undefined,
      };

      if (editingGoal) {
        await updateGoalMutation.mutateAsync({ id: editingGoal.id, data: goalPayload });
        toast({
          title: "Цель обновлена",
          description: "Изменения сохранены",
        });
        setEditingGoal(null);
      } else {
        await createGoalMutation.mutateAsync(goalPayload);
        toast({
          title: "Цель создана",
          description: "Новая цель добавлена",
        });
      }
      setGoalSheetOpen(false);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сохранить цель",
        variant: "destructive",
      });
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalSheetOpen(true);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoalToDelete(goalId);
    setGoalDeleteDialogOpen(true);
  };

  const confirmDeleteGoal = async () => {
    if (goalToDelete) {
      try {
        await deleteGoalMutation.mutateAsync(goalToDelete);
        toast({
          title: "Цель удалена",
          description: "Цель успешно удалена",
        });
        setGoalToDelete(null);
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить цель",
          variant: "destructive",
        });
      }
    }
    setGoalDeleteDialogOpen(false);
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskData);
        setEditingTask(null);
        toast({
          title: "Задача обновлена",
          description: "Изменения сохранены",
        });
      } else {
        await addTask(taskData);
        toast({
          title: "Задача создана",
          description: "Новая задача добавлена",
        });
      }
      setTaskSheetOpen(false);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось сохранить задачу",
        variant: "destructive",
      });
    }
  };

  const handleToggleTaskAsync = async (taskId: string) => {
    try {
      await toggleTask(taskId);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить задачу",
        variant: "destructive",
      });
    }
  };

  const handleToggleHabitDayAsync = async (habitId: string, dateKey: string) => {
    try {
      await toggleHabitDay(habitId, dateKey);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить привычку",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskSheetOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      toast({
        title: "Задача удалена",
        description: "Задача успешно удалена",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить задачу",
        variant: "destructive",
      });
    }
  };

  const confirmDeleteTask = async () => {
    if (taskToDelete) {
      await handleDeleteTask(taskToDelete);
      setTaskToDelete(null);
    }
    setTaskDeleteDialogOpen(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskSheetOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
    setTaskDeleteDialogOpen(true);
  };


  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
          {searchOpen ? (
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Поиск задач..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9"
                  data-testid="input-search-tasks"
                />
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                data-testid="button-close-search"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <>
              <h1 className="font-display font-semibold text-lg">Мои цели</h1>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSearchOpen(true)}
                  data-testid="button-search"
                >
                  <Search className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setCalendarOpen(true)}
                  data-testid="button-calendar"
                >
                  <CalendarDays className="w-5 h-5" />
                </Button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        <AIInsight habits={habits} />

        <Collapsible open={tasksOpen} onOpenChange={setTasksOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between py-2">
              <h2 className="text-lg font-semibold">Задачи</h2>
              {tasksOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3">
            <div className="flex gap-2">
              {(['all', 'today', 'tomorrow', 'no_date'] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={taskFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTaskFilter(filter)}
                  className="text-xs"
                  data-testid={`button-filter-${filter}`}
                >
                  {filter === 'all' ? 'Все' : filter === 'today' ? 'Сегодня' : filter === 'tomorrow' ? 'Завтра' : 'Без даты'}
                </Button>
              ))}
            </div>

            {filteredTasks.length === 0 ? (
              <div className="text-center py-6">
                <Target className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">Нет задач</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task: Task) => {
                  const subtasks = task.subtasks || [];
                  const completedSubtasks = subtasks.filter(s => s.isCompleted).length;
                  const hasSubtasks = subtasks.length > 0;
                  const subtaskProgress = hasSubtasks ? (completedSubtasks / subtasks.length) * 100 : 0;
                  
                  return (
                    <Card key={task.id} className="p-3" data-testid={`task-card-${task.id}`}>
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleTaskAsync(task.id)}
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 mt-0.5",
                            task.isCompleted 
                              ? "bg-primary border-primary" 
                              : "border-muted-foreground hover:border-primary"
                          )}
                          data-testid={`button-toggle-task-${task.id}`}
                        >
                          {task.isCompleted && <Check className="w-3 h-3 text-primary-foreground" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-sm truncate",
                              task.isCompleted && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </span>
                            {task.priority === 'high' && (
                              <Flag className="w-4 h-4 text-rose-300 fill-rose-300 shrink-0" />
                            )}
                            {task.priority === 'medium' && (
                              <div className="w-3 h-3 rounded-full bg-orange-300 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground">
                                {task.dueDate === formatDateKey(new Date()) ? 'Сегодня' : 
                                 task.dueDate === formatDateKey(new Date(Date.now() + 86400000)) ? 'Завтра' :
                                 task.dueDate}
                              </span>
                            )}
                            {task.dueTime && (
                              <span className="text-xs text-muted-foreground">{task.dueTime}</span>
                            )}
                            {hasSubtasks && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button 
                                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    data-testid={`button-subtasks-${task.id}`}
                                  >
                                    <ListTodo className="w-3 h-3" />
                                    <span>{completedSubtasks}/{subtasks.length}</span>
                                    <Progress value={subtaskProgress} className="w-12 h-1" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-3" align="start">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm font-medium">
                                      <span>Подзадачи</span>
                                      <span className="text-muted-foreground">{Math.round(subtaskProgress)}%</span>
                                    </div>
                                    <div className="space-y-1">
                                      {subtasks.map(subtask => (
                                        <button
                                          key={subtask.id}
                                          onClick={async () => {
                                            try {
                                              await toggleSubtask(task.id, subtask.id);
                                            } catch (error) {
                                              toast({
                                                title: "Ошибка",
                                                description: "Не удалось обновить подзадачу",
                                                variant: "destructive",
                                              });
                                            }
                                          }}
                                          className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded p-1.5 transition-colors"
                                          data-testid={`button-toggle-subtask-${subtask.id}`}
                                        >
                                          <div className={cn(
                                            "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                                            subtask.isCompleted 
                                              ? "bg-primary border-primary" 
                                              : "border-muted-foreground"
                                          )}>
                                            {subtask.isCompleted && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                          </div>
                                          <span className={cn(
                                            "text-sm",
                                            subtask.isCompleted && "line-through text-muted-foreground"
                                          )}>
                                            {subtask.title}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTask(task)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible open={habitsOpen} onOpenChange={setHabitsOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between py-2">
              <h2 className="text-lg font-semibold">Привычки</h2>
              {habitsOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-2">
            {habits.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">Добавьте первую привычку</p>
                <HabitCatalogSheet
                  onSelectHabit={handleSelectFromCatalog}
                  trigger={
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Выбрать из каталога
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                <ScrollArea className="w-full pb-1">
                  <div className="flex gap-1.5 pb-1">
                    <button
                      onClick={() => setHabitCategoryFilter(null)}
                      className={cn(
                        "px-2.5 py-1 text-xs rounded-full transition-colors whitespace-nowrap shrink-0",
                        !habitCategoryFilter 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                      data-testid="filter-habit-all"
                    >
                      Все
                    </button>
                    {habitCategories.map((category) => {
                      const count = habits.filter(h => h.category === category.id).length;
                      if (count === 0) return null;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setHabitCategoryFilter(habitCategoryFilter === category.id ? null : category.id)}
                          className={cn(
                            "px-2.5 py-1 text-xs rounded-full transition-colors whitespace-nowrap shrink-0 flex items-center gap-1",
                            habitCategoryFilter === category.id
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                          data-testid={`filter-habit-${category.id}`}
                        >
                          <div 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: category.color }}
                          />
                          {category.title}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
                {filteredHabits.map(habit => (
                    <HabitCard
                    key={habit.id}
                    habit={habit}
                    weekDays={weekDays}
                    onToggleDay={handleToggleHabitDayAsync}
                    onEdit={handleEditHabit}
                    onDelete={handleDeleteHabit}
                    isHighlighted={highlightedHabitId === habit.id}
                    cardRef={(el) => { habitRefs.current[habit.id] = el; }}
                  />
                ))}
              </>
            )}
          </CollapsibleContent>
        </Collapsible>
      </main>

      <div className="fixed bottom-20 left-4 z-50">
        <DropdownMenu open={fabMenuOpen} onOpenChange={setFabMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              size="default"
              className="rounded-full shadow-lg gap-1.5 h-10 px-4"
              data-testid="button-add-fab"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Добавить</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-48 mb-2">
            <DropdownMenuItem 
              onClick={() => {
                setFabMenuOpen(false);
                setAiSheetOpen(true);
              }}
              className="gap-2"
              data-testid="menu-add-ai"
            >
              <Sparkles className="w-4 h-4" />
              Добавить с AI
              <ChevronRight className="w-4 h-4 ml-auto" />
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                setFabMenuOpen(false);
                setTaskSheetOpen(true);
              }}
              className="gap-2"
              data-testid="menu-add-task"
            >
              <Check className="w-4 h-4" />
              Добавить задачу
              <ChevronRight className="w-4 h-4 ml-auto" />
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                setFabMenuOpen(false);
                setHabitCatalogOpen(true);
              }}
              className="gap-2"
              data-testid="menu-add-habit"
            >
              <Target className="w-4 h-4" />
              Добавить привычку
              <ChevronRight className="w-4 h-4 ml-auto" />
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                setFabMenuOpen(false);
                setGoalSheetOpen(true);
              }}
              className="gap-2"
              data-testid="menu-add-goal"
            >
              <Flag className="w-4 h-4" />
              Добавить цель
              <ChevronRight className="w-4 h-4 ml-auto" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <HabitCatalogSheet
        onSelectHabit={handleSelectFromCatalog}
        open={habitCatalogOpen}
        onOpenChange={setHabitCatalogOpen}
      />

      <HabitCreationSheet
        template={editingHabit ? undefined : selectedTemplate}
        editingHabit={editingHabit}
        onSubmit={handleCreateHabit}
        open={habitSheetOpen}
        onOpenChange={(open) => {
          setHabitSheetOpen(open);
          if (!open) {
            setSelectedTemplate(null);
            setEditingHabit(null);
          }
        }}
      />

      <TaskCreationSheet
        editingTask={editingTask}
        onSubmit={handleCreateTask}
        open={taskSheetOpen}
        onOpenChange={(open) => {
          setTaskSheetOpen(open);
          if (!open) {
            setEditingTask(null);
          }
        }}
      />

      <AIAssistantSheet
        onCreateTask={(task) => {
          handleCreateTask({
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
          });
        }}
        onCreateHabit={(habit) => {
          setHabitSheetOpen(true);
        }}
        open={aiSheetOpen}
        onOpenChange={setAiSheetOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить привычку?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Вся история выполнения будет удалена.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteHabit} className="bg-destructive text-destructive-foreground">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={taskDeleteDialogOpen} onOpenChange={setTaskDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить задачу?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask} className="bg-destructive text-destructive-foreground">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GoalCreationSheet
        onSubmit={handleCreateGoal}
        open={goalSheetOpen}
        onOpenChange={(open) => {
          setGoalSheetOpen(open);
          if (!open) {
            setEditingGoal(null);
          }
        }}
      />

      <AlertDialog open={goalDeleteDialogOpen} onOpenChange={setGoalDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить цель?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Весь прогресс по цели будет удален.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteGoal} className="bg-destructive text-destructive-foreground">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CalendarSheet
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        habits={habits}
        tasks={tasks}
      />
    </div>
  );
}
