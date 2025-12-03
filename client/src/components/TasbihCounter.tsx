import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { RotateCcw, Undo2, RefreshCw, Volume2, VolumeX, Target } from 'lucide-react';
import type { DhikrItem } from '@/lib/types';

interface TasbihCounterProps {
  item?: DhikrItem;
  targetCount?: number;
  initialCount?: number;
  initialRounds?: number;
  counterKey?: string;
  onCountChange?: (count: number, delta: number, rounds: number) => void;
  onComplete?: () => void;
  showSettings?: boolean;
  showTranscription?: boolean;
  showTranslation?: boolean;
  showAudioPlayer?: boolean;
  transcriptionType?: 'latin' | 'cyrillic';
  linkedGoalTitle?: string;
}

export default function TasbihCounter({
  item,
  targetCount,
  initialCount = 0,
  initialRounds,
  counterKey,
  onCountChange,
  onComplete,
  showSettings = true,
  showTranscription = true,
  showTranslation = true,
  showAudioPlayer = true,
  transcriptionType = 'cyrillic',
  linkedGoalTitle,
}: TasbihCounterProps) {
  const computedRounds = initialRounds ?? Math.floor(initialCount / 100);
  const [count, setCount] = useState(initialCount);
  const [rounds, setRounds] = useState(computedRounds);
  const [goalTarget, setGoalTarget] = useState<number | null>(targetCount || null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [lastAction, setLastAction] = useState<{ delta: number; time: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSupported, setAudioSupported] = useState(true);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const prevKeyRef = useRef<string | undefined>(counterKey);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const ROUND_SIZE = 100;

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
  }, [isGoalComplete, onComplete]);

  const handleTap = useCallback((delta: number) => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < 100) return;
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

  const handleUndo = useCallback(() => {
    if (!lastAction) return;
    const newCount = Math.max(0, count - lastAction.delta);
    const newRounds = Math.floor(newCount / ROUND_SIZE);
    setCount(newCount);
    setRounds(newRounds);
    onCountChange?.(newCount, -lastAction.delta, newRounds);
    setShowUndo(false);
    setLastAction(null);
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
  }, [lastAction, count, onCountChange]);

  const handleReset = useCallback(() => {
    setCount(0);
    onCountChange?.(0, -count, rounds);
    setShowUndo(false);
    setLastAction(null);
  }, [count, rounds, onCountChange]);

  const handleFullReset = useCallback(() => {
    setCount(0);
    setRounds(0);
    setGoalTarget(null);
    onCountChange?.(0, -count, 0);
    setShowUndo(false);
    setLastAction(null);
  }, [count, onCountChange]);

  const handleSetGoal = useCallback((target: number) => {
    setGoalTarget(target);
  }, []);

  const goalButtons = [33, 99, 100, 500, 1000];

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto px-4">
      {item && (
        <Card className="w-full p-4 text-center space-y-2 relative">
          {showAudioPlayer && audioSupported && (
            <button
              onClick={handlePlayAudio}
              className={cn(
                "absolute top-2 right-2 w-7 h-7 rounded-full",
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
          
          <p 
            className="font-arabic text-2xl leading-loose text-foreground"
            dir="rtl"
            lang="ar"
          >
            {item.titleAr}
          </p>
          
          {showTranscription && (
            <p className="text-base text-muted-foreground italic">
              {transcriptionType === 'cyrillic' 
                ? item.transcriptionCyrillic 
                : item.transcriptionLatin}
            </p>
          )}
          
          {showTranslation && item.translation && (
            <p className="text-sm text-muted-foreground">
              {item.translation}
            </p>
          )}

          {linkedGoalTitle && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs text-primary/90 bg-primary/5 rounded-lg px-2.5 py-1.5">
                <Target className="w-3.5 h-3.5" />
                <span className="font-medium">
                  Это засчитается в вашу цель "{linkedGoalTitle}"
                </span>
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="relative flex items-center justify-center gap-3 w-full">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">Цель</span>
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
          aria-label={`Счетчик: ${displayCount}`}
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
                осталось из {goalTarget}
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
            кругов
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
          aria-label="Сбросить счетчик"
          className="gap-1.5 text-xs"
        >
          <RotateCcw className="w-4 h-4" />
          Сбросить
        </Button>
        
        {goalTarget && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGoalTarget(null)}
            className="text-xs text-muted-foreground"
          >
            Убрать цель
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFullReset}
          data-testid="button-full-reset"
          aria-label="Сбросить всё"
          className="gap-1.5 text-xs text-muted-foreground"
        >
          <RefreshCw className="w-4 h-4" />
          Сбросить всё
        </Button>
      </div>

      {isGoalComplete && (
        <div className="text-center animate-fade-in">
          <p className="text-lg font-semibold text-primary">
            Машааллах! Цель достигнута!
          </p>
        </div>
      )}
    </div>
  );
}
