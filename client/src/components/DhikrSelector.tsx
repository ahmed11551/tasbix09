import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import CategorySelector from './CategorySelector';
import DhikrItemCard from './DhikrItemCard';
import { TextWithTooltip } from '@/components/ui/text-with-tooltip';
import { Search, ChevronDown, BookOpen } from 'lucide-react';
import type { DhikrItem, Category } from '@/lib/types';
import { categoryLabels } from '@/lib/constants';
import { 
  getDhikrItemsByCategory, 
  searchDhikrItems, 
  getPopularDhikrItems,
  getAllDhikrItems 
} from '@/lib/dhikrUtils';
import { useGoals } from '@/hooks/use-api';
import { useMemo } from 'react';

interface DhikrSelectorProps {
  selectedItem?: DhikrItem;
  onSelect?: (item: DhikrItem) => void;
  trigger?: React.ReactNode;
}

export default function DhikrSelector({ selectedItem, onSelect, trigger }: DhikrSelectorProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>('azkar');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'categories' | 'recent' | 'goals'>('categories');
  const { data: goals = [] } = useGoals();
  const { t } = useTranslation();

  // Фильтрация по категории и поиску
  const filteredItems = useMemo(() => {
    if (searchQuery) {
      return searchDhikrItems(searchQuery, category === 'general' ? undefined : category);
    }
    if (category === 'general') {
      return getAllDhikrItems();
    }
    return getDhikrItemsByCategory(category);
  }, [category, searchQuery]);

  // Зикры из целей
  const goalDhikrItems = useMemo(() => {
    const activeGoalsWithItems = goals
      .filter((g: any) => g.status === 'active' && g.item)
      .map((g: any) => g.item as DhikrItem)
      .slice(0, 3);
    return activeGoalsWithItems;
  }, [goals]);
  
  // Популярные зикры (для вкладки "Недавние")
  const recentItems = useMemo(() => getPopularDhikrItems(5), []);

  const handleSelect = (item: DhikrItem) => {
    onSelect?.(item);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-between gap-2" data-testid="button-select-dhikr">
            {selectedItem ? (
              <TextWithTooltip className="flex-1 text-left">
                {selectedItem.titleRu}
              </TextWithTooltip>
            ) : (
              <span className="text-muted-foreground">{t.tasbih.selectDhikr}</span>
            )}
            <ChevronDown className="w-4 h-4 shrink-0" />
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-2">
          <SheetTitle>{t.tasbih.selectDhikr}</SheetTitle>
        </SheetHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t.common.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-dhikr"
          />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="categories" data-testid="tab-categories">
              Категории
            </TabsTrigger>
            <TabsTrigger value="recent" data-testid="tab-recent">
              Недавние
            </TabsTrigger>
            <TabsTrigger value="goals" data-testid="tab-goals">
              Из целей
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4">
            <CategorySelector
              selected={category}
              onSelect={setCategory}
            />
            
            <ScrollArea className="h-[40vh]">
              <div className="space-y-3 px-1">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <DhikrItemCard
                      key={item.id}
                      item={item}
                      onSelect={handleSelect}
                      isSelected={selectedItem?.id === item.id}
                      compact
                    />
                  ))
                ) : (
                  <EmptyState
                    icon={BookOpen}
                    title="Ничего не найдено"
                    description={`В категории "${categoryLabels[category]}" нет доступных зикров`}
                  />
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="recent">
            <ScrollArea className="h-[50vh]">
              <div className="space-y-3 px-1">
                {recentItems.length > 0 ? (
                  recentItems.map((item) => (
                    <DhikrItemCard
                      key={item.id}
                      item={item}
                      onSelect={handleSelect}
                      isSelected={selectedItem?.id === item.id}
                      compact
                    />
                  ))
                ) : (
                  <EmptyState
                    icon={BookOpen}
                    title="Нет недавних зикров"
                    description="Зикры, которые вы используете чаще всего, появятся здесь"
                  />
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="goals">
            <ScrollArea className="h-[50vh]">
              <div className="space-y-3 px-1">
                {goalDhikrItems.length > 0 ? (
                  goalDhikrItems.map((item) => (
                    <DhikrItemCard
                      key={item.id}
                      item={item}
                      onSelect={handleSelect}
                      isSelected={selectedItem?.id === item.id}
                      compact
                    />
                  ))
                ) : (
                  <EmptyState
                    icon={BookOpen}
                    title="Нет зикров из целей"
                    description="Создайте цели с зикрами, и они появятся здесь для быстрого доступа"
                  />
                )}
                <p className="text-sm text-muted-foreground text-center py-4">
                  Зикры, связанные с вашими активными целями
                </p>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
