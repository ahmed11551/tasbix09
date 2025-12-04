import { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  ChevronLeft, 
  ChevronRight,
  Target,
  ListTodo,
  AlertTriangle,
  X,
  Flag,
} from 'lucide-react';
import type { Habit, Task, WeekDay } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CalendarSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habits: Habit[];
  tasks: Task[];
}

type FilterType = 'all' | 'habits' | 'tasks' | 'overdue';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const dayMapping: Record<WeekDay, number> = {
  'mon': 0, 'tue': 1, 'wed': 2, 'thu': 3, 'fri': 4, 'sat': 5, 'sun': 6
};

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];
  
  let startDayOfWeek = firstDay.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
  
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(year, month, -i);
    days.push(prevDate);
  }
  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }
  
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }
  
  return days;
}

interface DateEventInfo {
  habits: Habit[];
  tasks: Task[];
  overdueTasks: Task[];
  hasHabits: boolean;
  hasTasks: boolean;
  hasOverdue: boolean;
}

function DayRing({ hasHabits, hasTasks, hasOverdue, filter, isToday, children }: { 
  hasHabits: boolean; 
  hasTasks: boolean; 
  hasOverdue: boolean; 
  filter: FilterType;
  isToday: boolean;
  children: React.ReactNode;
}) {
  const showHabits = hasHabits && (filter === 'all' || filter === 'habits');
  const showTasks = hasTasks && (filter === 'all' || filter === 'tasks');
  const showOverdue = hasOverdue && (filter === 'all' || filter === 'overdue');
  
  const hasEvents = showHabits || showTasks || showOverdue;
  
  let ringColor = '';
  if (showOverdue) {
    ringColor = 'ring-red-500';
  } else if (showTasks) {
    ringColor = 'ring-blue-500';
  } else if (showHabits) {
    ringColor = 'ring-green-500';
  }
  
  const multiRing = (showHabits && showTasks) || (showHabits && showOverdue) || (showTasks && showOverdue);
  
  if (!hasEvents) {
    return (
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center text-xs",
        isToday && "bg-primary text-primary-foreground font-bold"
      )}>
        {children}
      </div>
    );
  }
  
  return (
    <div className={cn(
      "w-7 h-7 rounded-full flex items-center justify-center text-xs",
      "ring-2 ring-offset-1 ring-offset-background",
      ringColor,
      isToday && "bg-primary/20 font-bold",
      multiRing && "ring-[3px]"
    )}>
      {children}
    </div>
  );
}

export default function CalendarSheet({ open, onOpenChange, habits, tasks }: CalendarSheetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = formatDateKey(today);
  
  const getDateEventInfo = (date: Date): DateEventInfo => {
    const dateKey = formatDateKey(date);
    const dayOfWeek = date.getDay();
    const weekDay: WeekDay = (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const)[dayOfWeek];
    
    const matchingHabits = habits.filter(habit => {
      if (habit.repeatType === 'daily') return true;
      if (habit.repeatType === 'weekly' && habit.repeatDays) {
        return habit.repeatDays.includes(weekDay);
      }
      return habit.completedDates.includes(dateKey);
    });
    
    const dateTasks = tasks.filter(t => t.dueDate === dateKey);
    
    const allOverdue = tasks.filter(t => {
      if (!t.dueDate || t.isCompleted) return false;
      return t.dueDate < todayKey && t.dueDate === dateKey;
    });
    
    return {
      habits: matchingHabits,
      tasks: dateTasks,
      overdueTasks: allOverdue,
      hasHabits: matchingHabits.length > 0,
      hasTasks: dateTasks.filter(t => !allOverdue.includes(t)).length > 0,
      hasOverdue: allOverdue.length > 0,
    };
  };
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setPopoverOpen(true);
  };

  const toggleFilter = (type: FilterType) => {
    if (filter === type) {
      setFilter('all');
    } else {
      setFilter(type);
    }
  };
  
  const selectedDateInfo = selectedDate ? getDateEventInfo(selectedDate) : null;
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[65vh] rounded-t-2xl pb-6">
        <SheetHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <SheetTitle className="text-lg font-semibold">
              {MONTHS[month]} {year}
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>
        
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
            <button 
              onClick={() => setFilter('all')}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors",
                filter === 'all' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
              data-testid="filter-all"
            >
              <span>Все</span>
            </button>
            <button 
              onClick={() => toggleFilter('habits')}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors",
                filter === 'habits' ? "bg-green-500/20 text-green-600" : "text-muted-foreground hover:bg-muted"
              )}
              data-testid="filter-habits"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span>Привычки</span>
            </button>
            <button 
              onClick={() => toggleFilter('tasks')}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors",
                filter === 'tasks' ? "bg-blue-500/20 text-blue-600" : "text-muted-foreground hover:bg-muted"
              )}
              data-testid="filter-tasks"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Задачи</span>
            </button>
            <button 
              onClick={() => toggleFilter('overdue')}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors",
                filter === 'overdue' ? "bg-red-500/20 text-red-600" : "text-muted-foreground hover:bg-muted"
              )}
              data-testid="filter-overdue"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Просрочено</span>
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-px">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
            
            {days.map((date, index) => {
              const isCurrentMonth = date.getMonth() === month;
              const dateKey = formatDateKey(date);
              const isToday = dateKey === todayKey;
              const eventInfo = getDateEventInfo(date);
              
              const showHabits = eventInfo.hasHabits && (filter === 'all' || filter === 'habits');
              const showTasks = eventInfo.hasTasks && (filter === 'all' || filter === 'tasks');
              const showOverdue = eventInfo.hasOverdue && (filter === 'all' || filter === 'overdue');
              const hasVisibleEvents = showHabits || showTasks || showOverdue;
              
              return (
                <Popover key={index} open={popoverOpen && selectedDate?.getTime() === date.getTime()}>
                  <PopoverTrigger asChild>
                    <button
                      onClick={() => handleDateClick(date)}
                      className={cn(
                        "h-9 flex items-center justify-center transition-colors",
                        !isCurrentMonth && "opacity-40",
                        "hover:bg-muted/50 rounded"
                      )}
                      data-testid={`calendar-date-${dateKey}`}
                    >
                      <DayRing
                        hasHabits={eventInfo.hasHabits}
                        hasTasks={eventInfo.hasTasks}
                        hasOverdue={eventInfo.hasOverdue}
                        filter={filter}
                        isToday={isToday}
                      >
                        <span className={cn(
                          isToday && "text-primary"
                        )}>
                          {date.getDate()}
                        </span>
                      </DayRing>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-52 p-2" 
                    align="center"
                    onPointerDownOutside={() => setPopoverOpen(false)}
                    onEscapeKeyDown={() => setPopoverOpen(false)}
                  >
                    {selectedDateInfo && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-xs">
                            {selectedDate?.toLocaleDateString('ru-RU', { 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5"
                            onClick={() => setPopoverOpen(false)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="space-y-1">
                          {(filter === 'all' || filter === 'habits') && selectedDateInfo.hasHabits && (
                            <div className="flex items-center gap-1.5 p-1.5 rounded bg-green-500/10 text-xs">
                              <Target className="w-3 h-3 text-green-600" />
                              <span>{selectedDateInfo.habits.length} {getHabitWord(selectedDateInfo.habits.length)}</span>
                            </div>
                          )}
                          
                          {(filter === 'all' || filter === 'tasks') && selectedDateInfo.tasks.filter(t => !selectedDateInfo.overdueTasks.includes(t)).length > 0 && (
                            <div className="flex items-center gap-1.5 p-1.5 rounded bg-blue-500/10 text-xs">
                              <ListTodo className="w-3 h-3 text-blue-600" />
                              <span>{selectedDateInfo.tasks.filter(t => !selectedDateInfo.overdueTasks.includes(t)).length} {getTaskWord(selectedDateInfo.tasks.filter(t => !selectedDateInfo.overdueTasks.includes(t)).length)}</span>
                            </div>
                          )}
                          
                          {(filter === 'all' || filter === 'overdue') && selectedDateInfo.hasOverdue && (
                            <div className="flex items-center gap-1.5 p-1.5 rounded bg-red-500/10 text-xs text-red-600">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{selectedDateInfo.overdueTasks.length} просрочено</span>
                            </div>
                          )}
                          
                          {!selectedDateInfo.hasHabits && !selectedDateInfo.hasTasks && !selectedDateInfo.hasOverdue && (
                            <p className="text-xs text-muted-foreground text-center py-1">
                              Нет дел
                            </p>
                          )}
                        </div>
                        
                        {(selectedDateInfo.hasHabits || selectedDateInfo.hasTasks || selectedDateInfo.hasOverdue) && (
                          <ScrollArea className="mt-2 max-h-24">
                            <div className="space-y-1">
                              {(filter === 'all' || filter === 'habits') && selectedDateInfo.habits.slice(0, 2).map(habit => (
                                <div 
                                  key={habit.id} 
                                  className="flex items-center gap-1.5 text-[10px] p-1 rounded bg-muted/50"
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                  <TextWithTooltip className="text-xs">
                                    {habit.title}
                                  </TextWithTooltip>
                                </div>
                              ))}
                              {(filter === 'all' || filter === 'tasks' || filter === 'overdue') && selectedDateInfo.tasks.slice(0, 2).map(task => {
                                const isOverdue = selectedDateInfo.overdueTasks.includes(task);
                                if (filter === 'tasks' && isOverdue) return null;
                                if (filter === 'overdue' && !isOverdue) return null;
                                return (
                                  <div 
                                    key={task.id} 
                                    className={cn(
                                      "flex items-center gap-1.5 text-[10px] p-1 rounded bg-muted/50",
                                      isOverdue && "text-red-600"
                                    )}
                                  >
                                    <div className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      isOverdue ? "bg-red-500" : "bg-blue-500"
                                    )} />
                                    <TextWithTooltip className="text-xs">
                                      {task.title}
                                    </TextWithTooltip>
                                    {task.priority === 'high' && (
                                      <Flag className="w-2.5 h-2.5 text-red-500 shrink-0 fill-red-500" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function getHabitWord(count: number): string {
  if (count === 1) return 'привычка';
  if (count >= 2 && count <= 4) return 'привычки';
  return 'привычек';
}

function getTaskWord(count: number): string {
  if (count === 1) return 'задача';
  if (count >= 2 && count <= 4) return 'задачи';
  return 'задач';
}
