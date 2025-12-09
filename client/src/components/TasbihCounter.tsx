import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { RotateCcw, Undo2, RefreshCw, Volume2, VolumeX, Target, RotateCw, CheckCircle2, Play, Pause, Timer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DhikrItem } from '@/lib/types';
import { useDeleteLastDhikrLog } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n';

interface TasbihCounterProps {
  item?: DhikrItem;
  targetCount?: number;
  initialCount?: number;
  initialRounds?: number;
  counterKey?: string;
  onCountChange?: (count: number, delta: number, rounds: number) => void;
  onLearnAction?: (actionType: 'repeat' | 'learn_mark', count: number) => void;
  onComplete?: () => void;
  showSettings?: boolean;
  showTranscription?: boolean;
  showTranslation?: boolean;
  showAudioPlayer?: boolean;
  transcriptionType?: 'latin' | 'cyrillic';
  linkedGoalTitle?: string;
  goalType?: 'recite' | 'learn';
  sessionId?: string; // ID текущей сессии для отката лога
}

export default function TasbihCounter({
  item,
  targetCount,
  initialCount = 0,
  initialRounds,
  counterKey,
  onCountChange,
  onLearnAction,
  onComplete,
  showSettings = true,
  showTranscription = true,
  showTranslation = true,
  showAudioPlayer = true,
  transcriptionType = 'cyrillic',
  linkedGoalTitle,
  goalType = 'recite',
  sessionId,
}: TasbihCounterProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const deleteLastLogMutation = useDeleteLastDhikrLog();
  const computedRounds = initialRounds ?? Math.floor(initialCount / 100);
  const [count, setCount] = useState(initialCount);
  const [rounds, setRounds] = useState(computedRounds);
  const [goalTarget, setGoalTarget] = useState<number | null>(targetCount || null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [lastAction, setLastAction] = useState<{ delta: number; time: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSupported, setAudioSupported] = useState(true);
  const [repeatCount, setRepeatCount] = useState(0);
  const [isLearned, setIsLearned] = useState(false);
  const [autoIntervalEnabled, setAutoIntervalEnabled] = useState(false);
  const [autoIntervalSeconds, setAutoIntervalSeconds] = useState(1);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const prevKeyRef = useRef<string | undefined>(counterKey);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const autoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const ROUND_SIZE = 100;
  const isLearnMode = goalType === 'learn';

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setAudioSupported(true);
    } else {
      setAudioSupported(false);
    }
    return () => {
      if (speechRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayAudio = useCallback(() => {
    if (!item?.titleAr || !audioSupported) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(item.titleAr);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.8;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [item?.titleAr, audioSupported, isPlaying]);

  useEffect(() => {
    const currentKey = counterKey ?? item?.id;
    if (currentKey !== prevKeyRef.current) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      }
      const newRounds = initialRounds ?? Math.floor(initialCount / ROUND_SIZE);
      setCount(initialCount);
      setRounds(newRounds);
      setGoalTarget(targetCount || null);
      setShowUndo(false);
      setLastAction(null);
      // Сброс для режима learn
      setRepeatCount(0);
      setIsLearned(false);
      prevKeyRef.current = currentKey;
    }
  }, [counterKey, item?.id, initialCount, initialRounds, targetCount, isPlaying]);
  
  const displayCount = goalTarget 
    ? Math.max(0, goalTarget - count)
    : count;
  
  const progress = goalTarget 
    ? Math.min((count / goalTarget) * 100, 100)
    : (count % ROUND_SIZE) / ROUND_SIZE * 100;
  
  const isGoalComplete = goalTarget ? count >= goalTarget : false;

  useEffect(() => {
    if (isGoalComplete && onComplete) {
      onComplete();
    }
    // Остановить автоинтервал при достижении цели
    if (isGoalComplete && autoIntervalEnabled) {
      setAutoIntervalEnabled(false);
    }
  }, [isGoalComplete, onComplete, autoIntervalEnabled]);

  // Автоинтервал для автоматических тапов
  useEffect(() => {
    if (!autoIntervalEnabled || isGoalComplete || isLearnMode) {
      // Остановить интервал
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
      return;
    }

    // Очистить предыдущий интервал
    if (autoIntervalRef.current) {
      clearInterval(autoIntervalRef.current);
    }
    
    // Создать новый интервал
    autoIntervalRef.current = setInterval(() => {
      // Используем функциональное обновление для получения актуального состояния
      setCount((prevCount) => {
        const currentGoalTarget = goalTarget;
        const currentRounds = Math.floor(prevCount / ROUND_SIZE);
        
        // Проверка на достижение цели
        if (currentGoalTarget && prevCount >= currentGoalTarget) {
          if (autoIntervalRef.current) {
            clearInterval(autoIntervalRef.current);
            autoIntervalRef.current = null;
          }
          setAutoIntervalEnabled(false);
          return prevCount;
        }

        const delta = 1;
        const newCount = currentGoalTarget && prevCount + delta > currentGoalTarget
          ? currentGoalTarget
          : prevCount + delta;
        
        const newRounds = Math.floor(newCount / ROUND_SIZE);
        
        // Вызвать callback
        onCountChange?.(newCount, delta, newRounds);
        
        // Обновить rounds если нужно
        if (newRounds > currentRounds) {
          setRounds(newRounds);
        }
        
        return newCount;
      });
    }, autoIntervalSeconds * 1000);

    return () => {
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
    };
  }, [autoIntervalEnabled, autoIntervalSeconds, isGoalComplete, isLearnMode, goalTarget, onCountChange]);

  const handleTap = useCallback((delta: number) => {
    const now = Date.now();
    // Блокировка спама: не чаще 2 раз в секунду (500мс между тапами)
    if (now - lastTapTimeRef.current < 500) return;
    lastTapTimeRef.current = now;

    if (goalTarget && count + delta > goalTarget) {
      const actualDelta = goalTarget - count;
      if (actualDelta <= 0) return;
      delta = actualDelta;
    }

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 150);

    const newCount = count + delta;
    const newRounds = Math.floor(newCount / ROUND_SIZE);
    
    if (newRounds > rounds) {
      setRounds(newRounds);
    }
    
    setCount(newCount);
    onCountChange?.(newCount, delta, newRounds);

    setLastAction({ delta, time: now });
    setShowUndo(true);

    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    undoTimeoutRef.current = setTimeout(() => {
      setShowUndo(false);
      setLastAction(null);
    }, 5000);
  }, [count, rounds, goalTarget, onCountChange]);

  const handleUndo = useCallback(async () => {
    if (!lastAction) return;
    
    // Локально обновляем UI сразу для быстрой реакции
    const newCount = Math.max(0, count - lastAction.delta);
    const newRounds = Math.floor(newCount / ROUND_SIZE);
    setCount(newCount);
    setRounds(newRounds);
    setShowUndo(false);
    setLastAction(null);
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    
    // Вызываем callback для обновления родительского компонента
    onCountChange?.(newCount, -lastAction.delta, newRounds);
    
    // Откатываем на сервере через API
    if (sessionId) {
      try {
        const result = await deleteLastLogMutation.mutateAsync(sessionId);
        // Проверяем, был ли лог удален
        if (result?.deleted === false) {
          // Лога нет или нечего отменять - это не ошибка
          toast({ 
            title: t.tasbih.noActionToUndo, 
            description: result?.message || t.tasbih.noActionToUndo
          });
          // Восстанавливаем счетчик
          setCount(count);
          setRounds(Math.floor(count / ROUND_SIZE));
          onCountChange?.(count, lastAction.delta, Math.floor(count / ROUND_SIZE));
        } else {
          // Успешно откатили
          toast({ title: t.common.success, description: `${t.tasbih.undo} ${lastAction.delta}` });
        }
      } catch (error: any) {
        // Если ошибка 404 или "No log found" - не критично
        const errorMessage = error?.message || '';
        if (errorMessage.includes('404') || errorMessage.includes('No log found') || errorMessage.includes('Нет действий')) {
          toast({ 
            title: t.tasbih.noActionToUndo, 
            description: t.tasbih.noActionToUndo
          });
        } else {
          toast({
            title: t.common.error,
            description: errorMessage || t.common.error,
            variant: "destructive",
          });
        }
        // Восстанавливаем изменения локально обратно
        setCount(count);
        setRounds(Math.floor(count / ROUND_SIZE));
        onCountChange?.(count, lastAction.delta, Math.floor(count / ROUND_SIZE));
      }
    } else {
      // Если sessionId нет - только локальный откат (fallback)
      console.warn('Undo without sessionId - only local rollback');
    }
  }, [lastAction, count, onCountChange, sessionId, deleteLastLogMutation, toast]);

  const handleReset = useCallback(() => {
    setCount(0);
    onCountChange?.(0, -count, rounds);
    setShowUndo(false);
    setLastAction(null);
    // Остановить автоинтервал при сбросе
    if (autoIntervalEnabled) {
      setAutoIntervalEnabled(false);
    }
  }, [count, rounds, onCountChange, autoIntervalEnabled]);

  const handleFullReset = useCallback(() => {
    setCount(0);
    setRounds(0);
    setGoalTarget(null);
    onCountChange?.(0, -count, 0);
    setShowUndo(false);
    setLastAction(null);
    // Остановить автоинтервал при полном сбросе
    if (autoIntervalEnabled) {
      setAutoIntervalEnabled(false);
    }
  }, [count, onCountChange, autoIntervalEnabled]);

  const handleSetGoal = useCallback((target: number) => {
    setGoalTarget(target);
  }, []);

  // Обработчики для режима learn
  const handleRepeat = useCallback(() => {
    const newRepeatCount = repeatCount + 1;
    setRepeatCount(newRepeatCount);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 150);
    onLearnAction?.('repeat', newRepeatCount);
    
    // Если цель достигнута (например, 10 повторов), можно отметить как выученное
    if (goalTarget && newRepeatCount >= goalTarget) {
      setIsLearned(true);
      onLearnAction?.('learn_mark', newRepeatCount);
      onComplete?.();
    }
  }, [repeatCount, goalTarget, onLearnAction, onComplete]);

  const handleMarkLearned = useCallback(() => {
    setIsLearned(true);
    onLearnAction?.('learn_mark', repeatCount || 1);
    onComplete?.();
  }, [repeatCount, onLearnAction, onComplete]);

  const handleResetLearn = useCallback(() => {
    setRepeatCount(0);
    setIsLearned(false);
  }, []);

  const goalButtons = [33, 99, 100, 500, 1000];

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto px-4">
      {item && (
        <Card className="w-full p-4 relative flex flex-col max-h-[50vh]">
          {showAudioPlayer && audioSupported && (
            <button
              onClick={handlePlayAudio}
              className={cn(
                "absolute top-2 right-2 w-7 h-7 rounded-full z-10",
                "flex items-center justify-center",
                "bg-primary/10 hover:bg-primary/20 transition-colors",
                isPlaying && "bg-primary/20"
              )}
              data-testid="button-play-audio"
              aria-label={isPlaying ? "Остановить" : "Прослушать"}
            >
              {isPlaying ? (
                <VolumeX className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-primary" />
              )}
            </button>
          )}
          
          <ScrollArea className="flex-1 pr-2">
            <div className="text-center space-y-2">
              <p 
                className="font-arabic text-2xl leading-loose text-foreground break-words"
                dir="rtl"
                lang="ar"
              >
                {item.titleAr}
              </p>
              
              {showTranscription && (
                <p className="text-base text-muted-foreground italic break-words" aria-label="Транслитерация">
                  {transcriptionType === 'cyrillic' 
                    ? item.transcriptionCyrillic 
                    : item.transcriptionLatin}
                </p>
              )}
              
              {showTranslation && item.translation && (
                <p className="text-sm text-muted-foreground break-words" aria-label="Перевод">
                  {item.translation}
                </p>
              )}

              {linkedGoalTitle && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs text-primary/90 bg-primary/5 rounded-lg px-2.5 py-1.5">
                    <Target className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-medium">
                      Это засчитается в вашу цель "{linkedGoalTitle}"
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      )}

      {isLearnMode ? (
        // Режим learn: кнопки "Повторил" и "Выучил"
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold text-primary">{repeatCount}</div>
            <div className="text-sm text-muted-foreground">
              {goalTarget ? `${t.tasbih.goalColon} ${goalTarget} повторов` : t.tasbih.repeatCount}
            </div>
            {isLearned && (
              <div className="flex items-center justify-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {t.tasbih.learned}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button
              onClick={handleRepeat}
              disabled={isLearned}
              size="lg"
              className={cn(
                "h-14 text-base font-medium gap-2",
                isAnimating && "animate-tap-pulse"
              )}
              data-testid="button-repeat"
            >
              <RotateCw className="w-5 h-5" />
              {t.tasbih.repeat}
            </Button>

            <Button
              onClick={handleMarkLearned}
              disabled={isLearned}
              variant={isLearned ? "default" : "outline"}
              size="lg"
              className="h-14 text-base font-medium gap-2"
              data-testid="button-mark-learned"
            >
              <CheckCircle2 className="w-5 h-5" />
              {isLearned ? t.tasbih.learned.replace('!', '') : t.tasbih.markLearned}
            </Button>

            {(repeatCount > 0 || isLearned) && (
              <Button
                onClick={handleResetLearn}
                variant="ghost"
                size="sm"
                className="mt-2"
                data-testid="button-reset-learn"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                {t.tasbih.reset}
              </Button>
            )}
          </div>
        </div>
      ) : (
        // Режим recite: обычный счетчик
        <>
          <div className="relative flex items-center justify-center gap-3 w-full">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">{t.tasbih.goal}</span>
              {goalButtons.slice(0, 3).map((target) => (
                <Button
                  key={target}
                  variant={goalTarget === target ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSetGoal(target)}
                  data-testid={`button-goal-${target}`}
                  className="w-12 h-7 text-xs"
                >
                  {target}
                </Button>
              ))}
            </div>

            <button
              onClick={() => handleTap(1)}
              disabled={isGoalComplete}
              className={cn(
                "relative w-48 h-48 rounded-full flex items-center justify-center",
                "bg-gradient-to-br from-primary/90 to-primary",
                "border-4 border-primary-border",
                "transition-all duration-150",
                "focus:outline-none focus:ring-4 focus:ring-ring/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isAnimating && "animate-tap-pulse"
              )}
              data-testid="button-tap-counter"
              aria-label={`${t.tasbih.counter}: ${displayCount}`}
            >
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="47%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-primary-foreground/20"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="47%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={`${progress * 2.95} 295`}
                  strokeLinecap="round"
                  className="text-primary-foreground transition-all duration-300"
                />
              </svg>
              
              <div className="flex flex-col items-center z-10">
                <span 
                  className={cn(
                    "font-display text-5xl font-bold text-primary-foreground",
                    isAnimating && "animate-counter-pop"
                  )}
                >
                  {displayCount}
                </span>
                {goalTarget && (
                  <span className="text-[10px] text-primary-foreground/80 mt-0.5">
                    {t.tasbih.leftOf} {goalTarget}
                  </span>
                )}
              </div>
            </button>

            <div className="flex flex-col items-center gap-1.5">
              <div 
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center",
                  "bg-gold/20 border-2 border-gold",
                  "shadow-sm"
                )}
                data-testid="rounds-counter"
              >
                <span className="font-display text-lg font-bold text-gold">
                  {rounds}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground text-center leading-tight">
                {t.tasbih.rounds}
              </span>
              {goalButtons.slice(3).map((target) => (
                <Button
                  key={target}
                  variant={goalTarget === target ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSetGoal(target)}
                  data-testid={`button-goal-${target}`}
                  className="w-12 h-7 text-xs"
                >
                  {target}
                </Button>
              ))}
            </div>
          </div>

          {showUndo && lastAction && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleUndo}
              className="animate-slide-up gap-2"
              data-testid="button-undo"
            >
              <Undo2 className="w-4 h-4" />
              Отменить +{lastAction.delta}
            </Button>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              data-testid="button-reset"
              aria-label={t.tasbih.resetCounter}
              role="button"
              tabIndex={0}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="w-4 h-4" />
              {t.tasbih.reset}
            </Button>
            
            {goalTarget && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGoalTarget(null)}
                className="text-xs text-muted-foreground"
              >
                {t.tasbih.removeGoal}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFullReset}
              data-testid="button-full-reset"
              aria-label={t.tasbih.fullReset}
              role="button"
              tabIndex={0}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <RefreshCw className="w-4 h-4" />
              {t.tasbih.fullReset}
            </Button>
          </div>

          {isGoalComplete && (
            <div className="text-center animate-fade-in">
              <p className="text-lg font-semibold text-primary">
                {t.tasbih.goalCompletedMessage}
              </p>
            </div>
          )}

          {/* Настройка автоинтервала */}
          <Card className="p-3 mt-4 space-y-3 border-primary/20">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">{t.tasbih.autoInterval}</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="60"
                value={autoIntervalSeconds}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value) && value >= 1 && value <= 60) {
                    setAutoIntervalSeconds(value);
                  }
                }}
                disabled={autoIntervalEnabled}
                className="w-20"
                data-testid="input-auto-interval"
              />
              <span className="text-xs text-muted-foreground">{t.tasbih.from1To60Sec}</span>
            </div>

            <Button
              variant={autoIntervalEnabled ? "destructive" : "default"}
              size="sm"
              onClick={() => {
                if (autoIntervalEnabled) {
                  setAutoIntervalEnabled(false);
                } else {
                  if (autoIntervalSeconds >= 1 && autoIntervalSeconds <= 60) {
                    setAutoIntervalEnabled(true);
                  }
                }
              }}
              disabled={isGoalComplete || isLearnMode}
              className="w-full gap-2"
              data-testid="button-toggle-auto-interval"
            >
              {autoIntervalEnabled ? (
                <>
                  <Pause className="w-4 h-4" />
                  Остановить авто-тап
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {t.tasbih.startAutoTap}
                </>
              )}
            </Button>

            {autoIntervalEnabled && (
              <p className="text-xs text-center text-muted-foreground">
                Тап будет нажиматься автоматически каждые {autoIntervalSeconds} {autoIntervalSeconds === 1 ? 'секунду' : autoIntervalSeconds < 5 ? 'секунды' : 'секунд'}
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
