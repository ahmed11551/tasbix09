import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TextWithTooltip } from '@/components/ui/text-with-tooltip';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  Moon, 
  Heart, 
  Star, 
  Sparkles,
  ChevronRight,
  Calendar,
  Play,
  Pause,
  PlayCircle
} from 'lucide-react';
import type { Goal } from '@/lib/types';
import { goalCategoryLabels as categoryLabels } from '@/lib/constants';

interface GoalCardProps {
  goal: Goal;
  onContinue?: (goal: Goal) => void;
  onEdit?: (goal: Goal) => void;
  onPause?: (goal: Goal) => void;
  onResume?: (goal: Goal) => void;
  compact?: boolean;
}

const categoryIcons: Record<string, typeof BookOpen> = {
  surah: BookOpen,
  ayah: BookOpen,
  dua: Moon,
  azkar: Sparkles,
  names99: Star,
  salawat: Heart,
  kalimat: Moon,
  general: Sparkles,
};

function getStatusIndicator(goal: Goal): { color: string; label: string } {
  if (goal.status === 'completed') {
    return { color: 'bg-green-500', label: 'Выполнено' };
  }
  
  if (goal.status === 'paused') {
    return { color: 'bg-gray-500', label: 'Приостановлено' };
  }
  
  if (!goal.endDate) {
    return { color: 'bg-blue-500', label: 'В процессе' };
  }

  const now = new Date();
  const endDate = new Date(goal.endDate);
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const progressPercentage = (goal.currentProgress / goal.targetCount) * 100;
  const expectedProgress = ((new Date().getTime() - new Date(goal.startDate).getTime()) / 
    (endDate.getTime() - new Date(goal.startDate).getTime())) * 100;

  if (daysLeft < 0) {
    return { color: 'bg-red-500', label: 'Просрочено' };
  }
  
  if (progressPercentage >= expectedProgress) {
    return { color: 'bg-green-500', label: 'По графику' };
  }
  
  if (progressPercentage >= expectedProgress * 0.7) {
    return { color: 'bg-yellow-500', label: 'Отстаёт' };
  }
  
  return { color: 'bg-red-500', label: 'Критично' };
}

function getDailyPlan(goal: Goal): number | null {
  if (goal.status === 'completed' || !goal.endDate) return null;
  
  const now = new Date();
  const endDate = new Date(goal.endDate);
  const daysLeft = Math.max(1, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const remaining = goal.targetCount - goal.currentProgress;
  
  return Math.ceil(remaining / daysLeft);
}

export default function GoalCard({ goal, onContinue, onEdit, onPause, onResume, compact = false }: GoalCardProps) {
  // Защита от невалидных данных
  if (!goal || !goal.id) {
    console.error('GoalCard: goal is invalid', goal);
    return null;
  }

  const Icon = categoryIcons[goal.category] || Sparkles;
  const progress = (goal.currentProgress / goal.targetCount) * 100;
  const status = getStatusIndicator(goal);
  const dailyPlan = getDailyPlan(goal);

  if (compact) {
    return (
      <Card 
        className="p-3 hover-elevate cursor-pointer active:scale-[0.98] transition-transform touch-manipulation"
        onClick={() => onContinue?.(goal)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onContinue?.(goal);
          }
        }}
        data-testid={`card-goal-${goal.id}`}
      >
        <div className="flex items-center gap-3 pointer-events-none">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            "bg-primary/10"
          )}>
            <Icon className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <TextWithTooltip className="text-sm font-medium">
                {goal.title}
              </TextWithTooltip>
              <div className={cn("w-2 h-2 rounded-full shrink-0", status.color)} />
            </div>
            <Progress value={progress} className="h-1.5 mt-1" />
            <span className="text-xs text-muted-foreground">
              {goal.currentProgress.toLocaleString()} / {goal.targetCount.toLocaleString()}
            </span>
          </div>
          
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3" data-testid={`card-goal-${goal.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            "bg-primary/10"
          )}>
            <Icon className="w-5 h-5 text-primary" />
          </div>
          
          <div>
            <h3 className="font-medium text-foreground">{goal.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-xs">
                {categoryLabels[goal.category]}
              </Badge>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  goal.goalType === 'learn' && "border-chart-2 text-chart-2"
                )}
              >
                {goal.goalType === 'learn' ? 'Выучить' : 'Произнести'}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <div className={cn("w-2 h-2 rounded-full", status.color)} />
          <span className="text-xs text-muted-foreground">{status.label}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Прогресс</span>
          <span className="font-medium">
            {goal.currentProgress.toLocaleString()} / {goal.targetCount.toLocaleString()}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {dailyPlan !== null && (
        <Card className="p-3 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Ежедневный план</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Для достижения цели делайте <span className="font-semibold text-primary">{dailyPlan.toLocaleString()}</span> в день
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Осталось дней:</span>
            <span className="font-medium">
              {goal.endDate ? Math.max(0, Math.ceil((new Date(goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0}
            </span>
          </div>
        </Card>
      )}

      {goal.endDate && (
        <div className="text-xs text-muted-foreground">
          Срок: до {new Date(goal.endDate).toLocaleDateString('ru-RU', { 
            day: 'numeric', 
            month: 'long' 
          })}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        {goal.status === 'paused' ? (
          <Button 
            size="sm" 
            className="flex-1 gap-2"
            onClick={() => onResume?.(goal)}
            data-testid={`button-resume-goal-${goal.id}`}
          >
            <PlayCircle className="w-4 h-4" />
            Возобновить
          </Button>
        ) : goal.status !== 'completed' && (
          <>
            <Button 
              size="sm" 
              className="flex-1 gap-2"
              onClick={() => onContinue?.(goal)}
              data-testid={`button-continue-goal-${goal.id}`}
            >
              <Play className="w-4 h-4" />
              {goal.linkedCounterType ? 'Перейти к тасбиху' : 'Продолжить'}
            </Button>
            {goal.status === 'active' && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onPause?.(goal)}
                data-testid={`button-pause-goal-${goal.id}`}
                title="Приостановить цель"
              >
                <Pause className="w-4 h-4" />
              </Button>
            )}
          </>
        )}
        
        <Button 
          size="sm" 
          variant="ghost"
          onClick={() => onEdit?.(goal)}
          data-testid={`button-edit-goal-${goal.id}`}
        >
          Изменить
        </Button>
      </div>
    </Card>
  );
}
