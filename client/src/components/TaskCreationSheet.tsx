import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  X, 
  Check,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Flag,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Task, Subtask } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TaskCreationSheetProps {
  editingTask?: Task | null;
  onSubmit: (task: Partial<Task>) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type DateOption = 'none' | 'today' | 'tomorrow' | 'custom';
type Priority = 'low' | 'medium' | 'high';

export default function TaskCreationSheet({ 
  editingTask,
  onSubmit, 
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: TaskCreationSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  
  const [dateOption, setDateOption] = useState<DateOption>('none');
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const [hasTime, setHasTime] = useState(false);
  const [time, setTime] = useState('12:00');
  
  const [priority, setPriority] = useState<Priority>('medium');

  useEffect(() => {
    if (editingTask && open) {
      setTitle(editingTask.title);
      setNotes(editingTask.description || '');
      setSubtasks(editingTask.subtasks || []);
      setPriority(editingTask.priority || 'medium');
      
      if (editingTask.dueTime) {
        setHasTime(true);
        setTime(editingTask.dueTime);
      } else {
        setHasTime(false);
        setTime('12:00');
      }
      
      if (editingTask.dueDate) {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        
        if (editingTask.dueDate === today) {
          setDateOption('today');
        } else if (editingTask.dueDate === tomorrow) {
          setDateOption('tomorrow');
        } else {
          setDateOption('custom');
          setCustomDate(new Date(editingTask.dueDate));
        }
      } else {
        setDateOption('none');
        setCustomDate(undefined);
      }
    } else if (!open) {
      resetForm();
    }
  }, [editingTask, open]);

  const onFormSubmit = async (data: TaskFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
    
    let dueDate: string | undefined;
    const today = new Date();
    
    if (dateOption === 'today') {
      dueDate = today.toISOString().split('T')[0];
    } else if (dateOption === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      dueDate = tomorrow.toISOString().split('T')[0];
    } else if (dateOption === 'custom' && customDate) {
      dueDate = customDate.toISOString().split('T')[0];
    }

    const task: Partial<Task> = {
      id: editingTask?.id,
      title: title.trim(),
      description: notes.trim() || undefined,
      dueDate,
      dueTime: hasTime ? time : undefined,
      priority,
      isCompleted: editingTask?.isCompleted ?? false,
      completedAt: editingTask?.completedAt,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      reminders: [],
      createdAt: editingTask?.createdAt ?? new Date().toISOString(),
    };

      await onSubmit(task);
      resetForm();
      setOpen(false);
    } catch (error) {
      // Ошибка обрабатывается в родительском компоненте
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { 
      id: Date.now().toString(), 
      title: newSubtask.trim(), 
      isCompleted: false 
    }]);
    setNewSubtask('');
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const getDateLabel = () => {
    if (dateOption === 'today') return 'Сегодня';
    if (dateOption === 'tomorrow') return 'Завтра';
    if (dateOption === 'custom' && customDate) {
      return format(customDate, 'd MMM yyyy г.', { locale: ru });
    }
    return 'Без срока';
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger && (
        <SheetTrigger asChild>
          {trigger}
        </SheetTrigger>
      )}

      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setOpen(false)}
            className="shrink-0"
            data-testid="button-close-task-sheet"
          >
            Отмена
          </Button>
          
          <h2 className="font-semibold text-center flex-1 truncate">
            {editingTask ? 'Редактирование' : 'Новая задача'}
          </h2>
          
          <Button 
            variant="default" 
            size="sm"
            onClick={handleSubmit(onFormSubmit)}
            disabled={!title.trim() || isSubmitting || Object.keys(errors).length > 0}
            className="shrink-0 relative"
            data-testid="button-save-task"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-1" />
                Готово
              </>
            )}
          </Button>
        </div>

        <ScrollArea className="h-[calc(85vh-60px)]">
          <div className="p-4 space-y-4">
            <Card className="divide-y divide-border">
              <div className="p-4">
                <Input
                  {...register('title', {
                    required: 'Название задачи обязательно',
                    minLength: {
                      value: 1,
                      message: 'Название не может быть пустым',
                    },
                    maxLength: {
                      value: 200,
                      message: 'Название не должно превышать 200 символов',
                    },
                  })}
                  placeholder="Название задачи"
                  className={cn(
                    "border-0 p-0 text-base focus-visible:ring-0 h-auto",
                    errors.title && "border-b border-destructive"
                  )}
                  data-testid="input-task-title"
                />
                {errors.title && (
                  <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.title.message}</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <Textarea
                  {...register('notes', {
                    maxLength: {
                      value: 1000,
                      message: 'Заметка не должна превышать 1000 символов',
                    },
                  })}
                  placeholder="Заметка к задаче"
                  className={cn(
                    "border-0 p-0 resize-none min-h-[60px] focus-visible:ring-0",
                    errors.notes && "border-b border-destructive"
                  )}
                  data-testid="input-task-notes"
                />
                {errors.notes && (
                  <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.notes.message}</span>
                  </div>
                )}
              </div>
              
              <div className="p-4 space-y-2">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeSubtask(subtask.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <span className={cn(
                      "text-sm",
                      subtask.isCompleted && "line-through text-muted-foreground"
                    )}>{subtask.title}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground"
                    onClick={addSubtask}
                    disabled={!newSubtask.trim()}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Подзадача"
                    className="border-0 p-0 text-sm focus-visible:ring-0 h-auto"
                    onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                    data-testid="input-subtask"
                  />
                </div>
                {subtasks.length === 0 && !newSubtask && (
                  <button
                    onClick={() => document.querySelector<HTMLInputElement>('[data-testid="input-subtask"]')?.focus()}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Добавить подзадачу +
                  </button>
                )}
              </div>
            </Card>

            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant={dateOption === 'none' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateOption('none')}
                className="shrink-0"
              >
                Без срока
              </Button>
              <Button
                variant={dateOption === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateOption('today')}
                className="shrink-0"
              >
                Сегодня
              </Button>
              <Button
                variant={dateOption === 'tomorrow' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateOption('tomorrow')}
                className="shrink-0"
              >
                Завтра
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateOption === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    className="shrink-0"
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    {dateOption === 'custom' && customDate 
                      ? format(customDate, 'd MMM', { locale: ru })
                      : 'Дата'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customDate}
                    onSelect={(date) => {
                      setCustomDate(date);
                      if (date) setDateOption('custom');
                    }}
                    locale={ru}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span>Время</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasTime ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        {...register('time', {
                          required: hasTime ? 'Укажите время' : false,
                        })}
                        className={cn("w-24 h-8", errors.time && "border-destructive")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setValue('hasTime', false, { shouldValidate: false })}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('hasTime', true, { shouldValidate: true })}
                    >
                      Без времени
                    </Button>
                  )}
                </div>
                {errors.time && (
                  <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.time.message}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Flag className="w-5 h-5 text-muted-foreground" />
                  <span>Приоритет</span>
                </div>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant={field.value === 'low' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => field.onChange('low')}
                        className={cn(field.value === 'low' && 'bg-green-600 hover:bg-green-700')}
                      >
                        Низкий
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === 'medium' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => field.onChange('medium')}
                        className={cn(field.value === 'medium' && 'bg-amber-500 hover:bg-amber-600')}
                      >
                        Средний
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === 'high' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => field.onChange('high')}
                        className={cn(field.value === 'high' && 'bg-red-600 hover:bg-red-700')}
                      >
                        Высокий
                      </Button>
                    </div>
                  )}
                />
              </div>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
