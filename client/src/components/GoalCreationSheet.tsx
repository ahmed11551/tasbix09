import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
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

  const [category, setCategory] = useState<Category>(getInitialCategory());
  const [goalType, setGoalType] = useState<GoalType>(editingGoal?.goalType || 'recite');
  const [title, setTitle] = useState(editingGoal?.title || habitTemplate?.title || '');
  const [targetCount, setTargetCount] = useState(editingGoal?.targetCount || habitTemplate?.targetCount || 100);
  const [hasDeadline, setHasDeadline] = useState(!!editingGoal?.endDate);
  const [endDate, setEndDate] = useState(editingGoal?.endDate ? editingGoal.endDate.split('T')[0] : '');
  const [linkedToTasbih, setLinkedToTasbih] = useState(getInitialLinkedToTasbih());

  // Обновляем значения при изменении habitTemplate или editingGoal
  useEffect(() => {
    if (habitTemplate && !editingGoal) {
      const mappedCategory = habitCategoryToGoalCategory[habitTemplate.category];
      setCategory((mappedCategory || 'azkar') as Category);
      setTitle(habitTemplate.title);
      setTargetCount(habitTemplate.targetCount || 100);
      setLinkedToTasbih(habitTemplate.linkedToTasbih ?? ['azkar', 'salawat', 'dua', 'kalimat'].includes(mappedCategory || ''));
    } else if (editingGoal) {
      setCategory(editingGoal.category);
      setGoalType(editingGoal.goalType);
      setTitle(editingGoal.title);
      setTargetCount(editingGoal.targetCount);
      setHasDeadline(!!editingGoal.endDate);
      setEndDate(editingGoal.endDate ? editingGoal.endDate.split('T')[0] : '');
      setLinkedToTasbih(!!editingGoal.linkedCounterType);
    }
  }, [habitTemplate, editingGoal]);

  // Автоматически предлагать связь с тасбихом при изменении категории на зикр/салават
  useEffect(() => {
    if (!editingGoal && !habitTemplate) {
      // Если категория поддерживает тасбих, автоматически включаем связь
      if (['azkar', 'salawat', 'dua', 'kalimat', 'names99'].includes(category)) {
        setLinkedToTasbih(true);
      } else {
        // Для других категорий выключаем, если пользователь явно не установил
        setLinkedToTasbih(false);
      }
    }
  }, [category, editingGoal, habitTemplate]);

  const handleSubmit = () => {
    if (!title.trim() || targetCount <= 0) return;
    
    onSubmit?.({
      category,
      goalType,
      title: title.trim(),
      targetCount,
      endDate: hasDeadline ? endDate : undefined,
      linkedToTasbih,
    });
    
    setOpen(false);
    // Сброс формы только если не редактируем цель
    if (!editingGoal) {
      setTitle('');
      setTargetCount(100);
      setHasDeadline(false);
      setEndDate('');
      setCategory('azkar');
      setLinkedToTasbih(true);
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
            <CategorySelector
              selected={category}
              onSelect={setCategory}
              showAll={false}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Название цели</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${categoryLabels[category]}: моя цель...`}
              data-testid="input-goal-title"
            />
          </div>

          <div className="space-y-2">
            <Label>Тип цели</Label>
            <Select value={goalType} onValueChange={(v) => setGoalType(v as GoalType)}>
              <SelectTrigger data-testid="select-goal-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recite">Произнести (читать)</SelectItem>
                <SelectItem value="learn">Выучить наизусть</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Целевое количество</Label>
            <div className="flex flex-wrap gap-2">
              {presetTargets.map((target) => (
                <Button
                  key={target}
                  variant={targetCount === target ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setTargetCount(target)}
                  data-testid={`button-target-${target}`}
                >
                  {target.toLocaleString()}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              min={1}
              className="mt-2"
              data-testid="input-target-count"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label htmlFor="deadline">Установить срок</Label>
              <p className="text-xs text-muted-foreground">
                Система рассчитает ежедневный план
              </p>
            </div>
            <Switch
              id="deadline"
              checked={hasDeadline}
              onCheckedChange={setHasDeadline}
              data-testid="switch-deadline"
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
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-10"
                  min={new Date().toISOString().split('T')[0]}
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
              <Switch
                id="tasbih"
                checked={linkedToTasbih}
                onCheckedChange={setLinkedToTasbih}
                data-testid="switch-tasbih"
              />
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={!title.trim() || targetCount <= 0}
            data-testid="button-submit-goal"
          >
            {editingGoal ? 'Сохранить изменения' : 'Создать цель'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
