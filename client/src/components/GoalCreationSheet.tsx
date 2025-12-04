import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import CategorySelector from './CategorySelector';
import { Plus, Calendar } from 'lucide-react';
import type { Category, GoalType } from '@/lib/types';
import type { HabitTemplate } from '@/lib/habitsCatalog';
import { goalCategoryLabels as categoryLabels, habitCategoryToGoalCategory } from '@/lib/constants';

interface GoalCreationSheetProps {
  onSubmit?: (goal: {
    category: Category;
    goalType: GoalType;
    title: string;
    targetCount: number;
    endDate?: string;
    linkedToTasbih: boolean;
  }) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  habitTemplate?: HabitTemplate | null;
  editingGoal?: any;
}

export default function GoalCreationSheet({ onSubmit, trigger, open: controlledOpen, onOpenChange, habitTemplate, editingGoal }: GoalCreationSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Определяем начальные значения с учетом шаблона привычки или редактируемой цели
  const getInitialCategory = (): Category => {
    if (editingGoal) return editingGoal.category as Category;
    if (habitTemplate) {
      const mapped = habitCategoryToGoalCategory[habitTemplate.category];
      return (mapped || 'azkar') as Category;
    }
    return 'azkar';
  };

  const getInitialLinkedToTasbih = (): boolean => {
    if (editingGoal) return !!editingGoal.linkedCounterType;
    if (habitTemplate) return habitTemplate.linkedToTasbih ?? false;
    // Автоматически предлагать для категорий зикр/салават
    return ['azkar', 'salawat', 'dua', 'kalimat'].includes(getInitialCategory());
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isDirty },
    reset,
  } = useForm<GoalFormData>({
    defaultValues: {
      category: getInitialCategory(),
      goalType: (editingGoal?.goalType || 'recite') as GoalType,
      title: editingGoal?.title || habitTemplate?.title || '',
      targetCount: editingGoal?.targetCount || habitTemplate?.targetCount || 100,
      hasDeadline: !!editingGoal?.endDate,
      endDate: editingGoal?.endDate ? editingGoal.endDate.split('T')[0] : '',
      linkedToTasbih: getInitialLinkedToTasbih(),
    },
    mode: 'onChange',
  });

  const category = watch('category');
  const goalType = watch('goalType');
  const title = watch('title');
  const targetCount = watch('targetCount');
  const hasDeadline = watch('hasDeadline');
  const endDate = watch('endDate');
  const linkedToTasbih = watch('linkedToTasbih');

  // Обновляем значения при изменении habitTemplate или editingGoal
  useEffect(() => {
    if (habitTemplate && !editingGoal) {
      const mappedCategory = habitCategoryToGoalCategory[habitTemplate.category];
      reset({
        category: (mappedCategory || 'azkar') as Category,
        goalType: 'recite' as GoalType,
        title: habitTemplate.title,
        targetCount: habitTemplate.targetCount || 100,
        hasDeadline: false,
        endDate: '',
        linkedToTasbih: habitTemplate.linkedToTasbih ?? ['azkar', 'salawat', 'dua', 'kalimat'].includes(mappedCategory || ''),
      });
    } else if (editingGoal) {
      reset({
        category: editingGoal.category as Category,
        goalType: editingGoal.goalType as GoalType,
        title: editingGoal.title,
        targetCount: editingGoal.targetCount,
        hasDeadline: !!editingGoal.endDate,
        endDate: editingGoal.endDate ? editingGoal.endDate.split('T')[0] : '',
        linkedToTasbih: !!editingGoal.linkedCounterType,
      });
    }
  }, [habitTemplate, editingGoal, reset]);

  // Автоматически предлагать связь с тасбихом при изменении категории на зикр/салават
  useEffect(() => {
    if (!editingGoal && !habitTemplate) {
      // Если категория поддерживает тасбих, автоматически включаем связь
      if (['azkar', 'salawat', 'dua', 'kalimat', 'names99'].includes(category)) {
        setValue('linkedToTasbih', true, { shouldValidate: true });
      } else {
        // Для других категорий выключаем, если пользователь явно не установил
        setValue('linkedToTasbih', false, { shouldValidate: true });
      }
    }
  }, [category, editingGoal, habitTemplate, setValue]);

  const onFormSubmit = async (data: GoalFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit?.({
        category: data.category,
        goalType: data.goalType,
        title: data.title.trim(),
        targetCount: data.targetCount,
        endDate: data.hasDeadline && data.endDate ? data.endDate : undefined,
        linkedToTasbih: data.linkedToTasbih,
      });
      
      setOpen(false);
      // Сброс формы только если не редактируем цель
      if (!editingGoal) {
        reset({
          category: 'azkar',
          goalType: 'recite',
          title: '',
          targetCount: 100,
          hasDeadline: false,
          endDate: '',
          linkedToTasbih: true,
        });
      }
    } catch (error) {
      // Ошибка обрабатывается в родительском компоненте
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetTargets = [33, 99, 100, 500, 1000, 5000, 10000];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger && (
        <SheetTrigger asChild>
          {trigger}
        </SheetTrigger>
      )}
      
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle>{editingGoal ? 'Редактировать цель' : 'Новая цель'}</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 overflow-y-auto pb-20">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Категория</Label>
            <Controller
              name="category"
              control={control}
              rules={{ required: 'Выберите категорию' }}
              render={({ field }) => (
                <>
                  <CategorySelector
                    selected={field.value}
                    onSelect={(value) => {
                      field.onChange(value);
                      // Автоматически предлагать связь с тасбихом
                      if (!editingGoal && !habitTemplate) {
                        if (['azkar', 'salawat', 'dua', 'kalimat', 'names99'].includes(value)) {
                          setValue('linkedToTasbih', true, { shouldValidate: true });
                        } else {
                          setValue('linkedToTasbih', false, { shouldValidate: true });
                        }
                      }
                    }}
                    showAll={false}
                  />
                  {errors.category && (
                    <div className="flex items-center gap-1 text-sm text-destructive mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.category.message}</span>
                    </div>
                  )}
                </>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Название цели</Label>
            <Input
              id="title"
              {...register('title', {
                required: 'Название цели обязательно',
                minLength: {
                  value: 2,
                  message: 'Название должно содержать минимум 2 символа',
                },
                maxLength: {
                  value: 200,
                  message: 'Название не должно превышать 200 символов',
                },
              })}
              placeholder={`${categoryLabels[category]}: моя цель...`}
              className={cn(errors.title && 'border-destructive focus-visible:ring-destructive')}
              data-testid="input-goal-title"
            />
            {errors.title && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.title.message}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Тип цели</Label>
            <Controller
              name="goalType"
              control={control}
              rules={{ required: 'Выберите тип цели' }}
              render={({ field }) => (
                <>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger 
                      data-testid="select-goal-type"
                      className={cn(errors.goalType && 'border-destructive')}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recite">Произнести (читать)</SelectItem>
                      <SelectItem value="learn">Выучить наизусть</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.goalType && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.goalType.message}</span>
                    </div>
                  )}
                </>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetCount">Целевое количество</Label>
            <div className="flex flex-wrap gap-2">
              {presetTargets.map((target) => (
                <Button
                  key={target}
                  type="button"
                  variant={targetCount === target ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setValue('targetCount', target, { shouldValidate: true })}
                  data-testid={`button-target-${target}`}
                >
                  {target.toLocaleString()}
                </Button>
              ))}
            </div>
            <Input
              id="targetCount"
              type="number"
              {...register('targetCount', {
                required: 'Укажите целевое количество',
                min: {
                  value: 1,
                  message: 'Количество должно быть не менее 1',
                },
                max: {
                  value: 1000000,
                  message: 'Количество не должно превышать 1,000,000',
                },
                valueAsNumber: true,
              })}
              min={1}
              max={1000000}
              className={cn("mt-2", errors.targetCount && 'border-destructive focus-visible:ring-destructive')}
              data-testid="input-target-count"
            />
            {errors.targetCount && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.targetCount.message}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="deadline">Установить срок</Label>
              <p className="text-xs text-muted-foreground">
                Система рассчитает ежедневный план
              </p>
            </div>
            <Controller
              name="hasDeadline"
              control={control}
              render={({ field }) => (
                <Switch
                  id="deadline"
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (!checked) {
                      setValue('endDate', '', { shouldValidate: false });
                    }
                  }}
                  data-testid="switch-deadline"
                />
              )}
            />
          </div>

          {hasDeadline && (
            <div className="space-y-2">
              <Label htmlFor="endDate">Срок выполнения</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate', {
                    required: hasDeadline ? 'Укажите срок выполнения' : false,
                    validate: (value) => {
                      if (hasDeadline && value) {
                        const selectedDate = new Date(value);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (selectedDate < today) {
                          return 'Срок выполнения не может быть в прошлом';
                        }
                      }
                      return true;
                    },
                  })}
                  min={new Date().toISOString().split('T')[0]}
                  className={cn("pl-10", errors.endDate && 'border-destructive focus-visible:ring-destructive')}
                  data-testid="input-end-date"
                />
              </div>
            </div>
          )}

          {['azkar', 'salawat', 'dua', 'kalimat'].includes(category) && (
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="tasbih">Связать с тасбихом</Label>
                <p className="text-xs text-muted-foreground">
                  Прогресс будет учитываться автоматически
                </p>
              </div>
              <Controller
                name="linkedToTasbih"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="tasbih"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-tasbih"
                  />
                )}
              />
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <Button
            className="w-full relative"
            size="lg"
            onClick={handleSubmit(onFormSubmit)}
            disabled={isSubmitting || Object.keys(errors).length > 0 || !title.trim() || targetCount <= 0}
            data-testid="button-submit-goal"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              editingGoal ? 'Сохранить изменения' : 'Создать цель'
            )}
          </Button>
          {Object.keys(errors).length > 0 && (
            <p className="text-xs text-destructive text-center mt-2">
              Исправьте ошибки в форме перед сохранением
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
