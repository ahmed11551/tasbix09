import { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  BookOpen,
  Sparkles,
  ChevronRight,
  Plus,
  X,
  CircleDot,
  Target,
  Flag,
} from 'lucide-react';
import {
  habitCategories,
  filterTags,
  habitsCatalog,
  difficultyLabels,
  type HabitTemplate,
  type HabitCategory,
  type FilterTag,
} from '@/lib/habitsCatalog';
import { getIconByName } from '@/lib/iconUtils';

interface HabitCatalogSheetProps {
  onSelectHabit: (habit: HabitTemplate) => void;
  onSelectHabitForGoal?: (habit: HabitTemplate) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function HabitCatalogSheet({ onSelectHabit, onSelectHabitForGoal, trigger, open: controlledOpen, onOpenChange }: HabitCatalogSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | null>(null);
  const [selectedTag, setSelectedTag] = useState<FilterTag | null>(null);
  const [selectedHabitForAction, setSelectedHabitForAction] = useState<HabitTemplate | null>(null);

  const filteredHabits = useMemo(() => {
    let habits = habitsCatalog;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      habits = habits.filter(h => 
        h.title.toLowerCase().includes(query) || 
        h.description.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      habits = habits.filter(h => h.category === selectedCategory);
    }

    if (selectedTag) {
      habits = habits.filter(h => h.tags.includes(selectedTag));
    }

    return habits;
  }, [searchQuery, selectedCategory, selectedTag]);

  const handleCreateHabit = () => {
    if (selectedHabitForAction) {
      onSelectHabit(selectedHabitForAction);
      setSelectedHabitForAction(null);
      setOpen(false);
      setSearchQuery('');
      setSelectedCategory(null);
      setSelectedTag(null);
    }
  };

  const handleCreateGoal = () => {
    if (selectedHabitForAction && onSelectHabitForGoal) {
      onSelectHabitForGoal(selectedHabitForAction);
      setSelectedHabitForAction(null);
      setOpen(false);
      setSearchQuery('');
      setSelectedCategory(null);
      setSelectedTag(null);
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedTag(null);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategory || selectedTag || searchQuery;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger && (
        <SheetTrigger asChild>
          {trigger}
        </SheetTrigger>
      )}

      <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl p-0">
        <div className="bg-gradient-to-b from-primary/10 to-background">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              Найди вдохновение
            </SheetTitle>
          </SheetHeader>

          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по каталогу привычек..."
                className="pl-10 bg-background/80 backdrop-blur border-border/50"
                data-testid="input-habit-search"
              />
            </div>
          </div>

          <ScrollArea className="w-full">
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
              {filterTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTag === tag.id ? "default" : "secondary"}
                  className="cursor-pointer whitespace-nowrap shrink-0 px-3 py-1.5 gap-1"
                  onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                  data-testid={`filter-tag-${tag.id}`}
                >
                  {getIconByName(tag.iconName, "w-3 h-3")}
                  {tag.title}
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>

        <ScrollArea className="h-[calc(95vh-180px)]">
          <div className="p-4 space-y-4">
            {hasActiveFilters && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Найдено: {filteredHabits.length}
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-primary h-8"
                >
                  <X className="w-3 h-3 mr-1" />
                  Сбросить
                </Button>
              </div>
            )}

            {!selectedCategory && !searchQuery && !selectedTag && (
              <div className="grid grid-cols-2 gap-3">
                {habitCategories.map((cat) => {
                  const count = habitsCatalog.filter(h => h.category === cat.id).length;
                  return (
                    <Card
                      key={cat.id}
                      className="p-4 cursor-pointer hover-elevate active-elevate-2 transition-all"
                      onClick={() => setSelectedCategory(cat.id)}
                      data-testid={`category-card-${cat.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${cat.color}20` }}>
                            {getIconByName(cat.iconName, "w-5 h-5")}
                          </div>
                          <h3 className="font-medium text-sm">{cat.title}</h3>
                          <p className="text-xs text-muted-foreground">{count} привычек</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${cat.colorClass}`} />
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {(selectedCategory || searchQuery || selectedTag) && (
              <div className="space-y-2">
                {selectedCategory && !searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="mb-2 -ml-2 text-primary"
                  >
                    <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
                    Все категории
                  </Button>
                )}

                {filteredHabits.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Привычки не найдены</p>
                    <Button 
                      variant="ghost" 
                      onClick={clearFilters}
                      className="mt-2 text-primary"
                    >
                      Попробовать другой поиск
                    </Button>
                  </div>
                ) : (
                  filteredHabits.map((habit) => {
                    const category = habitCategories.find(c => c.id === habit.category);
                    const difficulty = difficultyLabels[habit.difficulty];
                    
                    return (
                      <Card
                        key={habit.id}
                        className="p-4 hover-elevate transition-all"
                        onClick={() => {
                          // Если есть опция создания цели, показываем диалог при клике на карточку
                          if (onSelectHabitForGoal) {
                            setSelectedHabitForAction(habit);
                          } else {
                            // Иначе сразу создаем привычку
                            onSelectHabit(habit);
                            setOpen(false);
                            setSearchQuery('');
                            setSelectedCategory(null);
                            setSelectedTag(null);
                          }
                        }}
                        data-testid={`habit-card-${habit.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${category?.color}15` }}
                          >
                            {getIconByName(habit.iconName, "w-5 h-5")}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium text-sm leading-tight line-clamp-2">
                                {habit.title}
                              </h3>
                            </div>
                            
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {habit.description}
                            </p>
                            
                            <div className="flex items-center gap-2 mt-2">
                              <div 
                                className={`w-1.5 h-1.5 rounded-full ${difficulty.color}`} 
                              />
                              <span className="text-xs text-muted-foreground">
                                {difficulty.label}
                              </span>
                              {habit.linkedToTasbih && (
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 gap-1">
                                  <CircleDot className="w-2 h-2" />
                                  Тасбих
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="default"
                                className="flex-1 h-8 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectHabit(habit);
                                  setOpen(false);
                                  setSearchQuery('');
                                  setSelectedCategory(null);
                                  setSelectedTag(null);
                                }}
                                data-testid={`button-create-habit-${habit.id}`}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Привычка
                              </Button>
                              {onSelectHabitForGoal && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-8 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onSelectHabitForGoal) {
                                      onSelectHabitForGoal(habit);
                                      setOpen(false);
                                      setSearchQuery('');
                                      setSelectedCategory(null);
                                      setSelectedTag(null);
                                    }
                                  }}
                                  data-testid={`button-create-goal-${habit.id}`}
                                >
                                  <Target className="w-3 h-3 mr-1" />
                                  Цель
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            )}

            <div className="pt-4 pb-8 text-center">
              <p className="text-xs text-muted-foreground italic">
                "Каждое доброе действие — привычка сердца. Начни сегодня."
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Dialog for choosing between habit and goal when clicking on card */}
        {selectedHabitForAction && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4" onClick={() => setSelectedHabitForAction(null)}>
            <Card className="w-full max-w-md p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-medium text-lg">Выберите действие</h3>
              <p className="text-sm text-muted-foreground">
                Что вы хотите создать на основе "{selectedHabitForAction.title}"?
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleCreateHabit}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                  Создать привычку
                </Button>
                <Button
                  onClick={handleCreateGoal}
                  className="w-full justify-start gap-2"
                >
                  <Target className="w-4 h-4" />
                  Создать цель
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedHabitForAction(null)}
                className="w-full"
              >
                Отмена
              </Button>
            </Card>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
