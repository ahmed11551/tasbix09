import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import TasbihCounter from '@/components/TasbihCounter';
import DailyAzkarBar from '@/components/DailyAzkarBar';
import DhikrSelector from '@/components/DhikrSelector';
import StreakBadge from '@/components/StreakBadge';
import GoalCard from '@/components/GoalCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Settings2, Target, ChevronRight, History, Play, Volume2 } from 'lucide-react';
import type { DhikrItem, PrayerSegment, TranscriptionType, Goal } from '@/lib/types';
import { Link, useLocation } from 'wouter';
import { 
  useGoals, 
  useStats, 
  useDailyAzkar, 
  useCreateSession, 
  useUpdateSession,
  useCreateDhikrLog,
  useCreateGoal,
  useUpdateGoal,
  useUpsertDailyAzkar,
  useQazaDebt,
  useUpdateQazaProgress,
  useUnfinishedSessions,
  useCheckBadges,
  useCategoryStreaks,
  useUpdateCategoryStreaks,
} from '@/hooks/use-api';
import { getTodayDhikrItem, getDhikrItemsByCategory, findDhikrItemById, getAllDhikrItems } from '@/lib/dhikrUtils';
import { useDhikrCatalogByCategory } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { prayerLabels } from '@/lib/constants';
import { useLocalization } from '@/hooks/use-localization';
import { useQueryClient } from '@tanstack/react-query';
// ВРЕМЕННО: Локализация отключена из-за проблем с chunking
// TODO: Восстановить после исправления проблемы с загрузкой модулей

interface RecentAction {
  id: string;
  item: DhikrItem;
  count: number;
  rounds: number;
  timestamp: Date;
}

export default function TasbihPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // ВРЕМЕННО: Локализация отключена
  const t = { tasbih: { selectDhikr: "Выбрать зикр", settings: "Настройки", audio: "Аудио", transcription: "Транскрипция", translation: "Перевод", transcriptionType: "Тип транскрипции", loading: "Загрузка...", errorCreatingSession: "Ошибка создания сессии", goalCompleted: "Цель выполнена", error: "Ошибка", success: "Успешно", dhikrSaved: "Зикр сохранен", sessionResumed: "Сессия возобновлена", errorResumingSession: "Ошибка возобновления сессии", noActionToUndo: "Нет действий для отмены", undo: "Отмена", reset: "Сброс", resetCounter: "Сбросить счетчик", fullReset: "Полный сброс", goal: "Цель", leftOf: "Осталось", rounds: "Раунды", goalCompletedMessage: "Цель выполнена!", autoInterval: "Авто-интервал", from1To60Sec: "от 1 до 60 сек", startAutoTap: "Начать авто-тап", stopAutoTap: "Остановить авто-тап", autoTapMessage: "Автоматический тап каждые", second: "секунда", seconds2: "секунды", seconds: "секунд", goalColon: "Цель:", repeatCount: "Повторения", learned: "Изучено!", markLearned: "Отметить изученным", repeat: "Повторить", counter: "Счетчик", transcriptionLabel: "Транскрипция", translationLabel: "Перевод", listen: "Слушать", stop: "Остановить", quickSelect: "Быстрый выбор" }, common: { loading: "Загрузка...", error: "Ошибка", success: "Успешно", search: "Поиск" }, navigation: { tasbih: "Тасбих", goals: "Цели", zikry: "Зикры", reports: "Отчеты", settings: "Настройки" }, settings: { cyrillic: "Кириллица", latin: "Латиница" } } as any;
  const [location] = useLocation();
  const { data: goals = [] } = useGoals();
  const { data: qazaDebt } = useQazaDebt();
  const { data: stats } = useStats();
  const today = new Date().toISOString().split('T')[0];
  const { data: dailyAzkarData } = useDailyAzkar(today);
  const createSessionMutation = useCreateSession();
  const updateSessionMutation = useUpdateSession();
  const createDhikrLogMutation = useCreateDhikrLog();
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const upsertDailyAzkarMutation = useUpsertDailyAzkar();
  const updateQazaProgressMutation = useUpdateQazaProgress();
  const { data: unfinishedSessions = [] } = useUnfinishedSessions();
  const checkBadgesMutation = useCheckBadges();
  const { data: categoryStreaks = [] } = useCategoryStreaks();
  
  // Обработка query параметров из URL
  const urlParams = useMemo(() => {
    if (typeof window === 'undefined') return {};
    const searchParams = new URLSearchParams(window.location.search);
    return {
      category: searchParams.get('category'),
      goalId: searchParams.get('goalId'),
      sessionId: searchParams.get('sessionId'),
    };
  }, [location]);
  
  // Загружаем каталог азкаров с API
  const { data: azkarCatalogFromAPI } = useDhikrCatalogByCategory('azkar');
  
  // Получаем зикры с API или fallback на статические данные
  const azkarItems = useMemo(() => {
    if (azkarCatalogFromAPI && Array.isArray(azkarCatalogFromAPI) && azkarCatalogFromAPI.length > 0) {
      // Преобразуем данные API в формат DhikrItem
      return azkarCatalogFromAPI.map((item: any) => ({
        id: item.id || item.slug || '',
        category: 'azkar' as const,
        slug: item.slug || item.id || '',
        titleAr: item.titleAr || item.title_ar || '',
        titleRu: item.titleRu || item.title_ru || item.title || '',
        titleEn: item.titleEn || item.title_en || item.title || '',
        transcriptionCyrillic: item.transcriptionCyrillic || item.transcription_cyrillic || '',
        transcriptionLatin: item.transcriptionLatin || item.transcription_latin || '',
        translation: item.translation || '',
      }));
    }
    // Fallback на статические данные
    return getDhikrItemsByCategory('azkar');
  }, [azkarCatalogFromAPI]);

  // Текущая активная сессия (state для передачи в компоненты)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const logBatchRef = useRef<Array<{ delta: number; valueAfter: number; timestamp: Date }>>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Синхронизируем ref и state
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // Получаем зикр дня или первый доступный (используем данные с API или fallback)
  const defaultDhikr = useMemo(() => {
    return getTodayDhikrItem() || azkarItems[0] || {
    id: 'default',
    category: 'azkar' as const,
    slug: 'subhanallah',
    titleAr: 'سُبْحَانَ اللَّهِ',
    titleRu: 'СубханАллах',
    titleEn: 'SubhanAllah',
    transcriptionCyrillic: 'СубханАллах',
    translation: 'Пречист Аллах',
  };
  }, [azkarItems]);
  
  const [selectedItem, setSelectedItem] = useState<DhikrItem>(defaultDhikr);
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerSegment>('none');
  const [currentCount, setCurrentCount] = useState(0);
  const [currentRounds, setCurrentRounds] = useState(0);
  const [counterKey, setCounterKey] = useState(() => Date.now().toString());
  const [showTranscription, setShowTranscription] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showAudioPlayer, setShowAudioPlayer] = useState(true);
  const { transcriptionType, setTranscriptionType } = useLocalization();
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
  // Состояние для автоматической последовательности зикров после намаза
  const [isPrayerSequenceMode, setIsPrayerSequenceMode] = useState(false);
  const [sequenceStage, setSequenceStage] = useState(0); // 0=Субханаллах, 1=Альхамдулиллах, 2=Аллаху акбар

  // Обработка query параметров из URL для автоматического выбора категории/цели
  useEffect(() => {
    // Обработка category и goalId
    if (urlParams.category) {
      // Найти зикр из указанной категории
      const categoryItems = getDhikrItemsByCategory(urlParams.category as any);
      if (categoryItems && categoryItems.length > 0) {
        // Если есть goalId, попробуем найти конкретный элемент
        let itemToSelect = categoryItems[0];
        if (urlParams.goalId) {
          const goal = goals.find((g: any) => g.id === urlParams.goalId);
          if (goal && goal.itemId) {
            const foundItem = categoryItems.find((item) => item.id === goal.itemId);
            if (foundItem) {
              itemToSelect = foundItem;
            }
          }
        }
        setSelectedItem(itemToSelect);
        // Очистить query параметры после обработки
        window.history.replaceState({}, '', '/');
      }
    }
    
    // Обработка sessionId для продолжения сессии
    if (urlParams.sessionId) {
      const session = unfinishedSessions.find((s: any) => s.id === urlParams.sessionId);
      if (session) {
        // Восстановить состояние сессии
        setCurrentSessionId(session.id);
        // Можно также восстановить счетчик и другие параметры из сессии
        // Очистить query параметры после обработки
        window.history.replaceState({}, '', '/');
      }
    }
  }, [urlParams.category, urlParams.goalId, urlParams.sessionId, goals, unfinishedSessions]);

  // Фильтруем цели - показываем только связанные с салаватами/азкарами, чтобы не делать страницу длинной
  const activeGoals = goals.filter((g: any) => 
    g.status === 'active' && 
    (g.category === 'salawat' || g.category === 'azkar')
  ).slice(0, 2);
  // Найти связанную цель для текущего выбранного зикра
  const linkedGoal = goals.find((g: any) => 
    g.linkedCounterType === selectedItem.category && 
    g.status === 'active' &&
    (g.itemId === selectedItem.id || !g.itemId)
  );
  
  // Получить streak для текущего типа активности (dhikr по умолчанию)
  const currentStreak = React.useMemo(() => {
    const dhikrStreak = categoryStreaks?.find((s: any) => s.category === 'dhikr');
    return dhikrStreak?.currentStreak || 0;
  }, [categoryStreaks]);
  
  const dailyAzkar = dailyAzkarData || {
    userId: '',
    dateLocal: today,
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
    total: 0,
    isComplete: false,
  };

  // Создать сессию при первом использовании счетчика
  const ensureSession = async () => {
    if (currentSessionId) return currentSessionId;

    try {
      const session = await createSessionMutation.mutateAsync({
        goalId: linkedGoal?.id || undefined,
        prayerSegment: selectedPrayer,
      });
      setCurrentSessionId(session.id);
      return session.id;
    } catch (error) {
      toast({
        title: t.common.error,
        description: t.tasbih.errorCreatingSession,
        variant: "destructive",
      });
      return null;
    }
  };

  // Сохранить лог зикра (батчинг для оптимизации)
  const handleLearnAction = useCallback(async (actionType: 'repeat' | 'learn_mark', count: number) => {
    const sessionId = await ensureSession();
    if (!sessionId) return;

    try {
      await createDhikrLogMutation.mutateAsync({
        sessionId,
        goalId: linkedGoal?.id || undefined,
        category: selectedItem.category,
        itemId: selectedItem.id,
        eventType: actionType,
        delta: actionType === 'repeat' ? 1 : 0,
        valueAfter: count,
        prayerSegment: selectedPrayer,
      });

      // Если цель связана и это отметка "Выучил", завершить цель
      if (actionType === 'learn_mark' && linkedGoal) {
        await updateGoalMutation.mutateAsync({
          id: linkedGoal.id,
          data: {
            currentProgress: linkedGoal.targetCount,
            status: 'completed',
            completedAt: new Date().toISOString(),
          },
        });

        toast({
          title: t.tasbih.goalCompleted,
          description: `Машааллах! Вы выучили "${linkedGoal.title}"!`,
        });
      }
    } catch (error) {
      // Ошибка обрабатывается через React Query
    }
  }, [ensureSession, createDhikrLogMutation, linkedGoal, selectedItem, selectedPrayer, updateGoalMutation, toast]);

  const saveDhikrLog = async (delta: number, valueAfter: number) => {
    const sessionId = await ensureSession();
    if (!sessionId) return;

    logBatchRef.current.push({ delta, valueAfter, timestamp: new Date() });

    // Очистить предыдущий таймаут
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Сохранить батч через 2 секунды (или сразу если батч большой)
    batchTimeoutRef.current = setTimeout(async () => {
      if (logBatchRef.current.length === 0) return;

      try {
        // Сохранить последний лог из батча
        const lastLog = logBatchRef.current[logBatchRef.current.length - 1];
        await createDhikrLogMutation.mutateAsync({
          sessionId,
          goalId: linkedGoal?.id || undefined,
          category: selectedItem.category,
          itemId: selectedItem.id,
          eventType: 'tap',
          delta: lastLog.delta,
          valueAfter: lastLog.valueAfter,
          prayerSegment: selectedPrayer,
        });

        // Обновить цель, если она связана
        if (linkedGoal) {
          // Вычислить новый прогресс: текущий прогресс цели + последнее изменение
          const newProgress = Math.min(linkedGoal.currentProgress + lastLog.delta, linkedGoal.targetCount);
          const isCompleted = newProgress >= linkedGoal.targetCount;
          
          if (newProgress !== linkedGoal.currentProgress) {
            await updateGoalMutation.mutateAsync({
              id: linkedGoal.id,
              data: {
                currentProgress: newProgress,
                status: isCompleted ? 'completed' : 'active',
                completedAt: isCompleted ? new Date().toISOString() : undefined,
              },
            });

            if (isCompleted) {
              toast({
                title: t.tasbih.goalCompleted,
                description: `Машааллах! Цель "${linkedGoal.title}" выполнена!`,
              });
            }
          }
        }

        // Обновить ежедневные азкары
        if (selectedPrayer !== 'none') {
          // ВАЖНО: Используем актуальные данные из React Query кэша, а не локальную переменную
          // Это гарантирует, что при переключении между намазами используются актуальные данные
          const cachedData = queryClient.getQueryData<typeof dailyAzkar>(['daily-azkar', today]);
          const currentAzkar = cachedData || dailyAzkarData || dailyAzkar;
          
          const prayerKey = selectedPrayer as keyof typeof currentAzkar;
          const currentPrayerCount = ((currentAzkar[prayerKey] as number) || 0) + lastLog.delta;
          const currentTotal = ((currentAzkar.total as number) || 0) + lastLog.delta;
          const newDailyAzkar = {
            userId: currentAzkar.userId || '',
            dateLocal: today,
            fajr: (currentAzkar.fajr as number) || 0,
            dhuhr: (currentAzkar.dhuhr as number) || 0,
            asr: (currentAzkar.asr as number) || 0,
            maghrib: (currentAzkar.maghrib as number) || 0,
            isha: (currentAzkar.isha as number) || 0,
            [prayerKey]: currentPrayerCount,
            total: currentTotal,
            isComplete: currentTotal >= 495,
          };

          await upsertDailyAzkarMutation.mutateAsync({
            dateLocal: today,
            ...newDailyAzkar,
          });

          // Обновить прогресс Каза, если есть долг и это салаваты
          // (считаем, что салаваты после намаза засчитываются как восполнение)
          if (qazaDebt && selectedItem.category === 'salawat' && selectedPrayer !== 'none') {
            const qazaPrayer = selectedPrayer; // fajr, dhuhr, asr, maghrib, isha
            if (qazaPrayer !== 'none') {
              const currentQazaProgress = qazaDebt[`${qazaPrayer}Progress` as keyof typeof qazaDebt] as number || 0;
              const qazaDebtAmount = qazaDebt[`${qazaPrayer}Debt` as keyof typeof qazaDebt] as number || 0;
              
              // Обновляем прогресс только если есть долг по этому намазу
              if (qazaDebtAmount > currentQazaProgress) {
                await updateQazaProgressMutation.mutateAsync({
                  prayer: qazaPrayer,
                  count: Math.min(currentQazaProgress + lastLog.delta, qazaDebtAmount),
                });
              }
            }
          }
        }

        logBatchRef.current = [];
      } catch (error) {
        // Ошибка обрабатывается через React Query
      }
    }, 2000);
  };

  // Завершить сессию при размонтировании
  useEffect(() => {
    return () => {
      if (currentSessionId) {
        updateSessionMutation.mutate({
          id: currentSessionId,
          data: { endedAt: new Date().toISOString() },
        });
        setCurrentSessionId(null);
      }
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, [currentSessionId]);

  const handlePrayerSelect = async (prayer: PrayerSegment) => {
    // Сохранить текущий батч логов перед переключением намаза
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
    
    if (logBatchRef.current.length > 0) {
      try {
        const lastLog = logBatchRef.current[logBatchRef.current.length - 1];
        await saveDhikrLog(lastLog.delta, lastLog.valueAfter);
        logBatchRef.current = [];
      } catch (error) {
        // Ошибка обрабатывается через React Query
      }
    }
    
    // Завершить текущую сессию перед сменой
    if (currentSessionId) {
      try {
        await updateSessionMutation.mutateAsync({
          id: currentSessionId,
          data: { endedAt: new Date().toISOString() },
        });
      } catch (error) {
        // Ошибка обрабатывается через React Query
      }
      setCurrentSessionId(null);
    }

    setSelectedPrayer(prayer);
    
    // Автоматическое создание цели azkar при тапе на сегмент
    if (prayer !== 'none') {
      try {
        const goalTitle = `Салаваты после ${prayerLabels[prayer]}`;
        
        // Проверяем, есть ли уже активная цель azkar для этого сегмента
        const existingGoal = goals.find(
          (g: Goal) => g.category === 'azkar' 
            && g.status === 'active' 
            && g.title === goalTitle
        );

        if (!existingGoal) {
          // Создаем новую цель azkar автоматически
          await createGoalMutation.mutateAsync({
            category: 'azkar',
            goalType: 'recite',
            title: goalTitle,
            targetCount: 99,
            linkedCounterType: 'azkar',
            status: 'active',
            startDate: new Date().toISOString(),
            currentProgress: 0,
          });

          toast({
            title: "Цель создана",
            description: `Автоматически создана цель: ${goalTitle}`,
          });
        }
      } catch (error) {
        console.error('Error creating azkar goal:', error);
        // Не показываем ошибку пользователю, чтобы не прерывать его работу
      }
    }
    
    // Активируем режим последовательности зикров после намаза
    setIsPrayerSequenceMode(true);
    setSequenceStage(0); // Начинаем с Субханаллах
    
    // Получаем зикры для последовательности
    const azkarItems = getDhikrItemsByCategory('azkar');
    const subhanallahItem = azkarItems.find(item => item.id === 'azkar-ap-1') || {
      id: 'azkar-ap-1',
      category: 'azkar' as const,
      slug: 'azkar-ap-1',
      titleAr: 'سُبْحَانَ اللَّهِ',
      titleRu: 'СубханАллах',
      titleEn: 'SubhanAllah',
      transcriptionCyrillic: 'СубханАллах',
      transcriptionLatin: 'SubhanAllah',
      translation: 'Пресвят Аллах',
    };
    
    setSelectedItem(subhanallahItem);
    setCurrentCount(0); // Начальный счетчик
    setCurrentRounds(0);
    setCounterKey(Date.now().toString());
  };

  const handleCountChange = async (count: number, delta: number, rounds: number) => {
    setCurrentCount(count);
    setCurrentRounds(rounds);
    
    // Автоматическая смена зикров в режиме последовательности после намаза
    if (isPrayerSequenceMode && delta > 0) {
      const remaining = 99 - count; // Осталось до 99
      
      // При достижении 33 кликов (осталось 66) -> переключаем на Альхамдулиллах
      if (count >= 33 && sequenceStage === 0) {
        const azkarItems = getDhikrItemsByCategory('azkar');
        const alhamdulillahItem = azkarItems.find(item => item.id === 'azkar-ap-2') || {
          id: 'azkar-ap-2',
          category: 'azkar' as const,
          slug: 'azkar-ap-2',
          titleAr: 'الْحَمْدُ لِلَّهِ',
          titleRu: 'Альхамдулиллях',
          titleEn: 'Alhamdulillah',
          transcriptionCyrillic: 'Альхамдулиллях',
          transcriptionLatin: 'Alhamdulillah',
          translation: 'Хвала Аллаху',
        };
        
        setSelectedItem(alhamdulillahItem);
        setSequenceStage(1);
        
        toast({
          title: "Переход к следующему зикру",
          description: "Альхамдулиллях (33 раза)",
        });
      }
      // При достижении 66 кликов (осталось 33) -> переключаем на Аллаху акбар
      else if (count >= 66 && sequenceStage === 1) {
        const azkarItems = getDhikrItemsByCategory('azkar');
        const allahuAkbarItem = azkarItems.find(item => item.id === 'azkar-ap-3') || {
          id: 'azkar-ap-3',
          category: 'azkar' as const,
          slug: 'azkar-ap-3',
          titleAr: 'اللَّهُ أَكْبَرُ',
          titleRu: 'Аллаху Акбар',
          titleEn: 'Allahu Akbar',
          transcriptionCyrillic: 'Аллаху Акбар',
          transcriptionLatin: 'Allahu Akbar',
          translation: 'Аллах Велик',
        };
        
        setSelectedItem(allahuAkbarItem);
        setSequenceStage(2);
        
        toast({
          title: "Последний зикр",
          description: "Аллаху Акбар (33 раза)",
        });
      }
      // При достижении 99 кликов -> завершаем последовательность
      else if (count >= 99 && sequenceStage === 2) {
        setIsPrayerSequenceMode(false);
        setSequenceStage(0);
        
        toast({
          title: "Машааллах!",
          description: "Последовательность завершена (99 раз)",
        });
      }
    }
    
    // Сохранить в API
    if (delta > 0) {
      await saveDhikrLog(delta, count);
    }
    
    if (count > 0 && delta > 0) {
      setRecentActions(prev => {
        const existingIndex = prev.findIndex(a => a.item.id === selectedItem.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            count,
            rounds,
            timestamp: new Date(),
          };
          return updated;
        }
        return [
          {
            id: Date.now().toString(),
            item: selectedItem,
            count,
            rounds,
            timestamp: new Date(),
          },
          ...prev.slice(0, 4),
        ];
      });
    }
  };

  const handleComplete = async () => {
    // Сохранить финальный батч перед завершением
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }

    if (logBatchRef.current.length > 0) {
      const lastLog = logBatchRef.current[logBatchRef.current.length - 1];
      await saveDhikrLog(lastLog.delta, lastLog.valueAfter);
    }

    // Завершить сессию
    if (currentSessionId) {
      try {
        await updateSessionMutation.mutateAsync({
          id: currentSessionId,
          data: { endedAt: new Date().toISOString() },
        });
        setCurrentSessionId(null);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Failed to end session:', error);
        }
      }
    }

    toast({
      title: t.common.success,
      description: t.tasbih.dhikrSaved,
    });
  };

  const handleContinueRecent = (action: RecentAction) => {
    setSelectedItem(action.item);
    setCurrentCount(action.count);
    setCurrentRounds(action.rounds);
    setCounterKey(Date.now().toString());
  };

  // Возобновить незавершенную сессию
  const handleResumeSession = async (session: any) => {
    try {
      // Завершить текущую сессию, если есть
      if (currentSessionId) {
        try {
          await updateSessionMutation.mutateAsync({
            id: currentSessionId,
            data: { endedAt: new Date().toISOString() },
          });
        } catch (error) {
          // Ошибка обрабатывается через React Query
        }
        setCurrentSessionId(null);
      }

      // Найти dhikr item по категории и itemId
      const dhikrItem = session.category && session.itemId
        ? findDhikrItemById(session.category, session.itemId)
        : null;

      if (dhikrItem) {
        setSelectedItem(dhikrItem);
      }

      // Установить молитву, если указана
      if (session.prayerSegment && session.prayerSegment !== 'none') {
        setSelectedPrayer(session.prayerSegment);
      }

      // Восстановить счетчик и сессию
      const count = session.currentCount || 0;
      const rounds = Math.floor(count / 100);
      setCurrentCount(count);
      setCurrentRounds(rounds);
      setCurrentSessionId(session.id);
      setCounterKey(Date.now().toString());

      toast({
        title: t.tasbih.sessionResumed,
        description: `Продолжаем с ${count} счетом`,
      });
    } catch (error) {
      toast({
        title: t.common.error,
        description: t.tasbih.errorResumingSession,
        variant: "destructive",
      });
    }
  };

  const handleDhikrSelect = async (item: DhikrItem) => {
    // Завершить текущую сессию при смене зикра
    if (currentSessionId && currentCount > 0) {
      try {
        await updateSessionMutation.mutateAsync({
          id: currentSessionId,
          data: { endedAt: new Date().toISOString() },
        });
      } catch (error) {
        // Ошибка обрабатывается через React Query
      }
      setCurrentSessionId(null);
    }

    // Выход из режима последовательности при ручном выборе зикра
    setIsPrayerSequenceMode(false);
    setSequenceStage(0);

    setSelectedItem(item);
    setCurrentCount(0);
    setCurrentRounds(0);
    setCounterKey(Date.now().toString());
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
    if (minutes < 60) return `${minutes} мин назад`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч назад`;
    return `${Math.floor(hours / 24)} дн назад`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
          <h1 className="font-display font-semibold text-lg">Умный Тасбих</h1>
          
          <div className="flex items-center gap-2">
            <StreakBadge count={currentStreak} size="sm" label="" />
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-tasbih-settings">
                  <Settings2 className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>{t.tasbih.settings}</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-6 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="audio-player">{t.tasbih.audio}</Label>
                    </div>
                    <Switch
                      id="audio-player"
                      checked={showAudioPlayer}
                      onCheckedChange={setShowAudioPlayer}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="transcription">{t.tasbih.transcription}</Label>
                    <Switch
                      id="transcription"
                      checked={showTranscription}
                      onCheckedChange={setShowTranscription}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="translation">{t.tasbih.translation}</Label>
                    <Switch
                      id="translation"
                      checked={showTranslation}
                      onCheckedChange={setShowTranslation}
                    />
                  </div>

                  {showTranscription && (
                    <div className="space-y-2">
                      <Label>{t.tasbih.transcriptionType}</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={transcriptionType === 'cyrillic' ? 'default' : 'secondary'}
                          size="sm"
                          onClick={() => setTranscriptionType('cyrillic' as 'cyrillic')}
                        >
                          {t.settings.cyrillic}
                        </Button>
                        <Button
                          variant={transcriptionType === 'latin' ? 'default' : 'secondary'}
                          size="sm"
                          onClick={() => setTranscriptionType('latin' as 'latin')}
                        >
                          {t.settings.latin}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        <div className="py-4">
          <DailyAzkarBar
            dailyAzkar={dailyAzkar}
            targetPerPrayer={99}
            selectedPrayer={selectedPrayer}
            onPrayerSelect={handlePrayerSelect}
          />
        </div>

        <div className="px-4 mb-4 space-y-1.5">
          <span className="text-xs text-muted-foreground font-medium">{t.tasbih.quickSelect}</span>
          <DhikrSelector
            selectedItem={selectedItem}
            onSelect={handleDhikrSelect}
          />
        </div>

        <div className="py-4">
          <TasbihCounter
            item={selectedItem}
            initialCount={currentCount}
            initialRounds={currentRounds}
            counterKey={counterKey}
            targetCount={
              isPrayerSequenceMode 
                ? 99 // Обратный отсчет от 99 в режиме последовательности
                : linkedGoal 
                  ? linkedGoal.targetCount - linkedGoal.currentProgress 
                  : undefined
            }
            onCountChange={handleCountChange}
            onLearnAction={handleLearnAction}
            onComplete={handleComplete}
            showTranscription={showTranscription}
            showTranslation={showTranslation}
            showAudioPlayer={showAudioPlayer}
            transcriptionType={transcriptionType}
            linkedGoalTitle={linkedGoal?.title}
            goalType={linkedGoal?.goalType || 'recite'}
            sessionId={currentSessionId || undefined}
          />
        </div>

        {/* Незавершенные сессии - обязательно отображаем, даже если пусто */}
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Незавершенные сессии</span>
          </div>
          
          {unfinishedSessions.length > 0 ? (
            <div className="space-y-2">
              {unfinishedSessions.map((session: any) => {
                const dhikrItem = session.category && session.itemId
                  ? findDhikrItemById(session.category, session.itemId)
                  : null;
                const sessionTitle = dhikrItem 
                  ? dhikrItem.titleRu 
                  : session.goal?.title || 'Неизвестный зикр';
                const startedDate = new Date(session.startedAt);
                const rounds = Math.floor((session.currentCount || 0) / 100);

                return (
                  <Card
                    key={session.id}
                    className="p-3 hover-elevate cursor-pointer active:scale-[0.98] transition-transform touch-manipulation border-primary/20 bg-primary/5"
                    onClick={() => handleResumeSession(session)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleResumeSession(session);
                      }
                    }}
                    data-testid={`unfinished-session-${session.id}`}
                  >
                    <div className="flex items-center justify-between pointer-events-none">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={sessionTitle}>
                          {sessionTitle}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{session.currentCount || 0} счёт</span>
                          {rounds > 0 && (
                            <span className="text-gold">• {rounds} кр.</span>
                          )}
                          <span>• {formatTimeAgo(startedDate)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-primary shrink-0">
                        <Play className="w-3 h-3" />
                        <span>Продолжить</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-4 border-dashed">
              <p className="text-sm text-muted-foreground text-center">
                Нет незавершенных сессий
              </p>
            </Card>
          )}
        </div>

        {recentActions.length > 0 && (
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Последние действия</span>
            </div>
            
            <div className="space-y-2">
              {recentActions.slice(0, 3).map((action) => (
                <Card 
                  key={action.id} 
                  className="p-3 hover-elevate cursor-pointer active:scale-[0.98] transition-transform touch-manipulation"
                  onClick={() => handleContinueRecent(action)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleContinueRecent(action);
                    }
                  }}
                  data-testid={`recent-action-${action.id}`}
                >
                  <div className="flex items-center justify-between pointer-events-none">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{action.item.titleRu}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{action.count} счёт</span>
                        {action.rounds > 0 && (
                          <span className="text-gold">• {action.rounds} кр.</span>
                        )}
                        <span>• {formatTimeAgo(action.timestamp)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                      <Play className="w-3 h-3" />
                      <span>Продолжить</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeGoals.length > 0 && (
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Ваши ближайшие цели</span>
              </div>
              <Link href="/goals">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Все цели
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
            
            <div className="space-y-2">
              {activeGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  compact
                  onContinue={(g) => {
                    if (g.item) {
                      setSelectedItem(g.item);
                      setCurrentCount(0);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
