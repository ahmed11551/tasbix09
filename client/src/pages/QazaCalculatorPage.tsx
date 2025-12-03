import { useState } from 'react';
import { Card } from '@/components/ui/card';
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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calculator, Calendar, Target, Plus, Check, TrendingUp, Map } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { prayerLabels } from '@/lib/constants';
import { useQazaDebt, useCalculateQaza, useUpdateQazaProgress, useMarkQazaCalendarDay, useQazaCalendar, useCreateQazaGoal } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface QazaProgress {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  witr: number;
}

export default function QazaCalculatorPage() {
  const { toast } = useToast();
  const { data: debt, isLoading: debtLoading } = useQazaDebt();
  const calculateMutation = useCalculateQaza();
  const updateProgressMutation = useUpdateQazaProgress();
  const markCalendarMutation = useMarkQazaCalendarDay();
  const createGoalMutation = useCreateQazaGoal();
  
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthYear, setBirthYear] = useState('');
  const [prayerStartYear, setPrayerStartYear] = useState('');
  const [manualInput, setManualInput] = useState({
    years: 0,
    months: 0,
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'calculate' | 'debt' | 'safar' | 'plan' | 'reports'>('calculate');

  // Получить календарь для текущего месяца
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const { data: calendarEntries = [] } = useQazaCalendar(
    format(monthStart, 'yyyy-MM-dd'),
    format(monthEnd, 'yyyy-MM-dd')
  );

  const handleCalculate = async () => {
    try {
      if (mode === 'manual') {
        if (manualInput.years === 0 && manualInput.months === 0) {
          toast({
            title: "Ошибка",
            description: "Укажите период пропуска",
            variant: "destructive",
          });
          return;
        }
        await calculateMutation.mutateAsync({
          gender,
          manualPeriod: manualInput,
        });
      } else {
        if (!prayerStartYear) {
          toast({
            title: "Ошибка",
            description: "Укажите год начала намаза",
            variant: "destructive",
          });
          return;
        }
        await calculateMutation.mutateAsync({
          gender,
          birthYear: birthYear ? parseInt(birthYear) : undefined,
          prayerStartYear: parseInt(prayerStartYear),
        });
      }
      
      toast({
        title: "Долг рассчитан",
        description: "Расчет успешно сохранен",
      });
      setActiveTab('debt');
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось рассчитать долг",
        variant: "destructive",
      });
    }
  };

  const handleMarkDone = async (prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'witr') => {
    if (!debt) return;
    
    try {
      const currentProgress = debt[`${prayer}Progress` as keyof typeof debt] as number || 0;
      await updateProgressMutation.mutateAsync({
        prayer,
        count: currentProgress + 1,
      });
      
      toast({
        title: "Прогресс обновлен",
        description: `${prayerLabels[prayer] || prayer} отмечен`,
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить прогресс",
        variant: "destructive",
      });
    }
  };

  const handleMarkCalendarDay = async (dateLocal: string, prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'witr') => {
    try {
      const existingEntry = calendarEntries.find(e => e.dateLocal === dateLocal);
      const currentValue = existingEntry?.[prayer] || false;
      
      await markCalendarMutation.mutateAsync({
        dateLocal,
        prayers: {
          ...existingEntry,
          [prayer]: !currentValue,
        },
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отметить день",
        variant: "destructive",
      });
    }
  };

  const handleCreateGoal = async () => {
    if (!debt) {
      toast({
        title: "Ошибка",
        description: "Сначала рассчитайте долг",
        variant: "destructive",
      });
      return;
    }

    try {
      await createGoalMutation.mutateAsync();
      toast({
        title: "Цель создана",
        description: "Цель восполнения намазов успешно создана",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать цель",
        variant: "destructive",
      });
    }
  };

  const prayers: Array<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'witr'> = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'witr'];

  const totalDebt = debt ? 
    debt.fajrDebt + debt.dhuhrDebt + debt.asrDebt + debt.maghribDebt + debt.ishaDebt : 0;
  const totalProgress = debt ?
    debt.fajrProgress + debt.dhuhrProgress + debt.asrProgress + debt.maghribProgress + debt.ishaProgress : 0;
  const overallProgress = totalDebt > 0 ? (totalProgress / totalDebt) * 100 : 0;

  // Генерация календаря для месяца
  const getCalendarDays = () => {
    const days: Array<{ date: Date; dateLocal: string }> = [];
    const start = new Date(monthStart);
    while (start <= monthEnd) {
      days.push({
        date: new Date(start),
        dateLocal: format(start, 'yyyy-MM-dd'),
      });
      start.setDate(start.getDate() + 1);
    }
    return days;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14 max-w-md mx-auto">
          <Link href="/goals">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-display font-semibold text-lg">Калькулятор Каза</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {debt && (
          <Card className="p-4 space-y-4 bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-medium">Общий прогресс</h2>
                <p className="text-sm text-muted-foreground">
                  {totalProgress.toLocaleString()} из {totalDebt.toLocaleString()} намазов
                </p>
              </div>
            </div>
            
            <Progress value={overallProgress} className="h-3" />
            
            <p className="text-center text-lg font-semibold text-primary">
              {overallProgress.toFixed(1)}% выполнено
            </p>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calculate" className="text-xs">Расчет</TabsTrigger>
            <TabsTrigger value="debt" className="text-xs">Мой долг</TabsTrigger>
            <TabsTrigger value="plan" className="text-xs">Карта</TabsTrigger>
          </TabsList>

          <TabsContent value="calculate" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Button
                variant={mode === 'manual' ? 'default' : 'secondary'}
                className="flex-1"
                onClick={() => setMode('manual')}
              >
                Ручной ввод
              </Button>
              <Button
                variant={mode === 'auto' ? 'default' : 'secondary'}
                className="flex-1"
                onClick={() => setMode('auto')}
              >
                Авторасчёт
              </Button>
            </div>

            {mode === 'manual' ? (
              <Card className="p-4 space-y-4">
                <h3 className="font-medium">Укажите период пропуска</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="years">Лет</Label>
                    <Input
                      id="years"
                      type="number"
                      min={0}
                      value={manualInput.years}
                      onChange={(e) => setManualInput(prev => ({ 
                        ...prev, 
                        years: Number(e.target.value) 
                      }))}
                      data-testid="input-years"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="months">Месяцев</Label>
                    <Input
                      id="months"
                      type="number"
                      min={0}
                      max={11}
                      value={manualInput.months}
                      onChange={(e) => setManualInput(prev => ({ 
                        ...prev, 
                        months: Number(e.target.value) 
                      }))}
                      data-testid="input-months"
                    />
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleCalculate} 
                  disabled={calculateMutation.isPending}
                  data-testid="button-calculate"
                >
                  {calculateMutation.isPending ? 'Расчет...' : 'Рассчитать долг'}
                </Button>
              </Card>
            ) : (
              <Card className="p-4 space-y-4">
                <h3 className="font-medium">Автоматический расчёт</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Пол</Label>
                    <Select value={gender} onValueChange={(v) => setGender(v as 'male' | 'female')}>
                      <SelectTrigger data-testid="select-gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Мужской</SelectItem>
                        <SelectItem value="female">Женский</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birthYear">Год рождения (опционально)</Label>
                    <Input
                      id="birthYear"
                      type="number"
                      placeholder="1990"
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      data-testid="input-birth-year"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="prayerStartYear">Год начала намаза *</Label>
                    <Input
                      id="prayerStartYear"
                      type="number"
                      placeholder="2020"
                      value={prayerStartYear}
                      onChange={(e) => setPrayerStartYear(e.target.value)}
                      data-testid="input-prayer-start-year"
                    />
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleCalculate}
                    disabled={calculateMutation.isPending}
                    data-testid="button-calculate-auto"
                  >
                    {calculateMutation.isPending ? 'Расчет...' : 'Рассчитать'}
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  Для женщин будут учтены периоды освобождения от намаза
                </p>
              </Card>
            )}

            {debt && (
              <Button 
                className="w-full gap-2" 
                onClick={handleCreateGoal}
                disabled={createGoalMutation.isPending || !!debt.goalId}
                data-testid="button-create-qaza-goal"
              >
                <Target className="w-4 h-4" />
                {debt.goalId ? 'Цель уже создана' : 'Создать цель восполнения'}
              </Button>
            )}
          </TabsContent>

          <TabsContent value="debt" className="space-y-4 mt-4">
            {debtLoading ? (
              <div className="text-center py-6 text-muted-foreground">Загрузка...</div>
            ) : !debt ? (
              <Card className="p-4 text-center">
                <Calculator className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Сначала рассчитайте долг на вкладке "Расчет"
                </p>
                <Button onClick={() => setActiveTab('calculate')} size="sm">
                  Перейти к расчету
                </Button>
              </Card>
            ) : (
              <>
                <div className="space-y-3">
                  {prayers.map((prayer) => {
                    const debtAmount = debt[`${prayer}Debt` as keyof typeof debt] as number || 0;
                    const progressAmount = debt[`${prayer}Progress` as keyof typeof debt] as number || 0;
                    const remaining = debtAmount - progressAmount;
                    const prayerProgress = debtAmount > 0 ? (progressAmount / debtAmount) * 100 : 0;
                    
                    return (
                      <Card key={prayer} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            {prayer === 'witr' ? 'Витр' : prayerLabels[prayer] || prayer}
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="gap-1"
                            onClick={() => handleMarkDone(prayer)}
                            disabled={updateProgressMutation.isPending}
                            data-testid={`button-mark-${prayer}`}
                          >
                            <Plus className="w-3 h-3" />
                            +1
                          </Button>
                        </div>
                        
                        <Progress value={prayerProgress} className="h-2 mb-2" />
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Выполнено: {progressAmount.toLocaleString()}</span>
                          <span>Осталось: {remaining.toLocaleString()}</span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="plan" className="space-y-4 mt-4">
            {!debt ? (
              <Card className="p-4 text-center">
                <Map className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Сначала рассчитайте долг
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Отметьте дни, когда вы восполнили намазы. Нажмите на намаз в дне календаря.
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                    <div key={day} className="text-center text-xs text-muted-foreground p-1">
                      {day}
                    </div>
                  ))}
                  
                  {getCalendarDays().map(({ date, dateLocal }) => {
                    const entry = calendarEntries.find(e => e.dateLocal === dateLocal);
                    const isToday = dateLocal === format(new Date(), 'yyyy-MM-dd');
                    
                    const completedCount = entry ? 
                      [entry.fajr, entry.dhuhr, entry.asr, entry.maghrib, entry.isha].filter(Boolean).length : 0;
                    const hasCompleted = completedCount > 0;
                    
                    return (
                      <Popover key={dateLocal}>
                        <PopoverTrigger asChild>
                          <button
                            className={cn(
                              "relative aspect-square rounded-md border text-xs transition-colors",
                              isToday && "ring-2 ring-primary",
                              hasCompleted
                                ? "bg-green-500/20 border-green-500" 
                                : "bg-background border-border hover:bg-muted"
                            )}
                          >
                            <span className={cn(
                              "absolute inset-0 flex items-center justify-center",
                              isToday && "font-semibold"
                            )}>
                              {date.getDate()}
                            </span>
                            {hasCompleted && (
                              <div className="absolute bottom-0.5 left-0.5 right-0.5 flex gap-0.5">
                                {entry.fajr && <div className="h-1 flex-1 bg-green-500 rounded" title="Фаджр" />}
                                {entry.dhuhr && <div className="h-1 flex-1 bg-green-500 rounded" title="Зухр" />}
                                {entry.asr && <div className="h-1 flex-1 bg-green-500 rounded" title="Аср" />}
                                {entry.maghrib && <div className="h-1 flex-1 bg-green-500 rounded" title="Магриб" />}
                                {entry.isha && <div className="h-1 flex-1 bg-green-500 rounded" title="Иша" />}
                              </div>
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3" align="start">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">
                              {format(date, "d MMMM yyyy", { locale: ru })}
                            </div>
                            <div className="space-y-1.5">
                              {prayers.filter(p => p !== 'witr').map((prayer) => {
                                const isCompleted = entry?.[prayer] || false;
                                return (
                                  <button
                                    key={prayer}
                                    onClick={() => handleMarkCalendarDay(dateLocal, prayer)}
                                    className={cn(
                                      "w-full flex items-center justify-between p-2 rounded-md transition-colors text-sm",
                                      isCompleted 
                                        ? "bg-green-500/10 border border-green-500/20" 
                                        : "bg-muted hover:bg-muted/80"
                                    )}
                                  >
                                    <span>{prayerLabels[prayer] || prayer}</span>
                                    {isCompleted && <Check className="w-4 h-4 text-green-600" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                </div>

                <div className="flex gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500" />
                    <span>Восполнено</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
