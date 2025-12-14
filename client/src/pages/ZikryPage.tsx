import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Heart,
  Share2,
  BookmarkPlus,
  Play,
  Copy,
  Check,
} from 'lucide-react';
import { getIconByName } from '@/lib/iconUtils';
import { cn } from '@/lib/utils';
import {
  zikryCatalog,
  getZikrItemsBySubcategory,
  getAllZikrItems,
  getTodayZikr,
  type ZikrCategory,
  type ZikrSubcategory,
  type ZikrItem,
  type ZikrCatalogCategory,
} from '@/lib/zikryCatalog';
import { useToast } from '@/hooks/use-toast';
import { TextWithTooltip } from '@/components/ui/text-with-tooltip';
import { EmptyState } from '@/components/ui/empty-state';
import { useFavorites, useToggleFavorite } from '@/hooks/use-api';
// ВРЕМЕННО: Локализация отключена
  // // ВРЕМЕННО: Локализация отключена
  // import { useTranslation } from '@/lib/i18n';

interface CategoryCardProps {
  category: ZikrCatalogCategory;
  onClick: () => void;
}

function CategoryCard({ category, onClick }: CategoryCardProps) {
  const totalCount = category.subcategories.reduce((sum, sub) => sum + sub.count, 0);
  
  return (
    <Card
      className="p-4 hover-elevate cursor-pointer"
      onClick={onClick}
      data-testid={`category-${category.id}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          {getIconByName(category.iconName, "w-6 h-6 text-primary")}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{category.titleRu}</h3>
          <p className="text-sm text-muted-foreground">{category.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{totalCount}</Badge>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </Card>
  );
}

interface SubcategoryCardProps {
  subcategory: ZikrSubcategory;
  categoryId: ZikrCategory;
  onClick: () => void;
}

function SubcategoryCard({ subcategory, onClick }: SubcategoryCardProps) {
  return (
    <Card
      className="overflow-hidden hover-elevate cursor-pointer"
      onClick={onClick}
      data-testid={`subcategory-${subcategory.id}`}
    >
      <div className="relative h-24 bg-gradient-to-br from-primary/20 to-primary/5 flex items-end p-3">
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="text-xs bg-background/80 backdrop-blur">
            {subcategory.count}
          </Badge>
        </div>
        <h4 className="font-semibold text-sm">{subcategory.titleRu}</h4>
      </div>
    </Card>
  );
}

interface ZikrItemCardProps {
  item: ZikrItem;
  index: number;
  onOpen: () => void;
}

function ZikrItemCard({ item, index, onOpen }: ZikrItemCardProps) {
  return (
    <Card
      className="p-3 hover-elevate cursor-pointer"
      onClick={onOpen}
      data-testid={`zikr-item-${item.id}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm text-muted-foreground w-6 shrink-0">{index + 1}.</span>
          <TextWithTooltip className="font-medium">
            {item.titleRu}
          </TextWithTooltip>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    </Card>
  );
}

interface ZikrDetailSheetProps {
  item: ZikrItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTasbih?: (item: ZikrItem) => void;
}

function ZikrDetailSheet({ item, open, onOpenChange, onStartTasbih }: ZikrDetailSheetProps) {
  const { toast } = useToast();
  // ВРЕМЕННО: Локализация отключена
  const t = {
    zikry: { 
      startTasbih: 'Перейти к тасбиху', 
      copied: 'Скопировано', 
      copiedForShare: 'Скопировано для отправки', 
      translation: 'Перевод', 
      source: 'Источник', 
      benefit: 'Польза' 
    },
    common: { loading: 'Загрузка...', error: 'Ошибка', success: 'Успешно' },
  } as any;
  const [copied, setCopied] = useState(false);
  const { data: favorites = [] } = useFavorites();
  const toggleFavoriteMutation = useToggleFavorite();
  
  // Определяем категорию для текущего зикра
  const getItemCategory = (item: ZikrItem): ZikrCategory | null => {
    if (!item) return null;
    for (const cat of zikryCatalog) {
      if (cat.subcategories.some(sub => sub.id === item.subcategoryId)) {
        return cat.id;
      }
    }
    return null;
  };
  
  // Определяем, является ли текущий зикр избранным
  const itemCategory = item ? getItemCategory(item) : null;
  const isFavorite = item && itemCategory 
    ? favorites.some((f: any) => f.category === itemCategory && f.itemId === item.id) 
    : false;

  const handleCopy = async () => {
    if (!item) return;
    const text = `${item.titleAr}\n\n${item.transcriptionCyrillic}\n\n${item.translation}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: t.zikry.copied });
  };

  const handleShare = async () => {
    if (!item) return;
    const text = `${item.titleRu}\n\n${item.titleAr}\n\n${item.transcriptionCyrillic}\n\n${item.translation}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.titleRu, text });
      } catch (error: any) {
        // Игнорируем AbortError (пользователь отменил шаринг)
        if (error.name !== 'AbortError') {
          // Для других ошибок - используем fallback на clipboard
          await navigator.clipboard.writeText(text);
          toast({ title: t.zikry.copiedForShare });
        }
      }
    } else {
      await navigator.clipboard.writeText(text);
          toast({ title: t.zikry.copiedForShare });
    }
  };

  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-center">{item.titleRu}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100%-8rem)] pr-4">
          <div className="space-y-6 pb-4">
            <div className="text-center">
              <p
                className="font-arabic text-2xl leading-loose text-foreground"
                dir="rtl"
                lang="ar"
              >
                {item.titleAr}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground italic text-center">
                {item.transcriptionCyrillic}
              </p>
              <p className="text-sm text-muted-foreground text-center">
                {item.transcriptionLatin}
              </p>
            </div>

            <Card className="p-4 bg-muted/30">
              <h4 className="text-sm font-medium mb-2">{t.zikry.translation}</h4>
              <p className="text-sm text-muted-foreground">{item.translation}</p>
            </Card>

            {item.source && (
              <div className="text-center">
                <Badge variant="outline" className="text-xs">
                  {t.zikry.source} {item.source}
                </Badge>
              </div>
            )}

            {item.benefits && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <h4 className="text-sm font-medium mb-2 text-primary">{t.zikry.benefit}</h4>
                <p className="text-sm text-muted-foreground">{item.benefits}</p>
              </Card>
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-center gap-2 pt-4 border-t">
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              if (!item) return;
              const category = getItemCategory(item);
              if (!category) {
                toast({
                  title: t.common.error,
                  description: 'Не удалось определить категорию зикра',
                  variant: "destructive",
                });
                return;
              }
              
              try {
                await toggleFavoriteMutation.mutateAsync({
                  category,
                  itemId: item.id,
                  isFavorite,
                });
                toast({
                  title: isFavorite ? 'Удалено из избранного' : 'Добавлено в избранное',
                });
              } catch (error: any) {
                toast({
                  title: t.common.error,
                  description: error.message || 'Не удалось обновить избранное',
                  variant: "destructive",
                });
              }
            }}
            disabled={toggleFavoriteMutation.isPending}
            data-testid="button-favorite"
          >
            <Heart className={cn("w-5 h-5", isFavorite && "fill-red-500 text-red-500")} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleCopy} data-testid="button-copy">
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare} data-testid="button-share">
            <Share2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" data-testid="button-bookmark">
            <BookmarkPlus className="w-5 h-5" />
          </Button>
          {onStartTasbih && item && (
            <Button
              className="gap-2"
              onClick={() => {
                if (!item || !item.id) {
                  console.error('onStartTasbih: item is invalid', item);
                  return;
                }
                onStartTasbih(item);
                onOpenChange(false);
              }}
              data-testid="button-start-tasbih"
            >
              <Play className="w-4 h-4" />
              {t.zikry.startTasbih}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

type ViewState = 
  | { type: 'categories' }
  | { type: 'subcategories'; category: ZikrCatalogCategory }
  | { type: 'items'; category: ZikrCatalogCategory; subcategory: ZikrSubcategory };

export default function ZikryPage() {
  const { toast } = useToast();
  // ВРЕМЕННО: Локализация отключена
  const t = {
    zikry: { 
      title: 'Зикры', 
      startTasbih: 'Перейти к тасбиху', 
      copied: 'Скопировано', 
      copiedForShare: 'Скопировано для отправки', 
      translation: 'Перевод', 
      source: 'Источник', 
      benefit: 'Польза',
      found: 'Найдено:',
      categories: 'Категории',
      favorites: 'Избранное',
      share: 'Поделиться',
      todayDua: 'Дуа дня',
      noFavorites: 'Нет избранного',
      noFavoritesDescription: 'Добавьте зикры в избранное, чтобы быстро к ним возвращаться'
    },
    common: { loading: 'Загрузка...', error: 'Ошибка', success: 'Успешно', search: 'Поиск' },
  } as any;
  const [viewState, setViewState] = useState<ViewState>({ type: 'categories' });
  const { data: favorites = [] } = useFavorites();
  const toggleFavoriteMutation = useToggleFavorite();
  
  // Получаем все избранные зикры
  const favoriteItems = (() => {
    if (!favorites || favorites.length === 0) return [];
    // Собираем все зикры из всех категорий
    const allItems: Array<ZikrItem & { category: ZikrCategory }> = [];
    zikryCatalog.forEach(category => {
      const items = getAllZikrItems(category.id);
      items.forEach(item => {
        allItems.push({ ...item, category: category.id });
      });
    });
    return allItems.filter(item => 
      favorites.some((f: any) => f.category === item.category && f.itemId === item.id)
    );
  })();
  const [activeTab, setActiveTab] = useState<'categories' | 'favorites'>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ZikrItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const todayZikr = getTodayZikr();

  const handleBack = () => {
    if (viewState.type === 'items') {
      setViewState({ type: 'subcategories', category: viewState.category });
    } else if (viewState.type === 'subcategories') {
      setViewState({ type: 'categories' });
    }
  };

  const handleOpenCategory = (category: ZikrCatalogCategory) => {
    setViewState({ type: 'subcategories', category });
  };

  const handleOpenSubcategory = (subcategory: ZikrSubcategory) => {
    if (viewState.type === 'subcategories') {
      setViewState({ type: 'items', category: viewState.category, subcategory });
    }
  };

  const handleOpenItem = (item: ZikrItem) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const getItems = (): ZikrItem[] => {
    if (viewState.type !== 'items') return [];
    return getZikrItemsBySubcategory(viewState.category.id, viewState.subcategory.id);
  };

  const getSearchResults = (): ZikrItem[] => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: ZikrItem[] = [];
    
    zikryCatalog.forEach(category => {
      const items = getAllZikrItems(category.id);
      results.push(...items.filter(item =>
        item.titleRu.toLowerCase().includes(query) ||
        item.translation.toLowerCase().includes(query)
      ));
    });
    
    return results;
  };

  const searchResults = getSearchResults();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-2 px-4 h-14 max-w-md mx-auto">
          {viewState.type !== 'categories' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              data-testid="button-back"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <h1 className="font-display font-semibold text-lg flex-1">
            {viewState.type === 'categories' && t.zikry.title}
            {viewState.type === 'subcategories' && viewState.category.titleRu}
            {viewState.type === 'items' && viewState.subcategory.titleRu}
          </h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {viewState.type === 'categories' && (
          <>
            <div className="relative mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-2 right-4 w-16 h-16 rounded-full border-2 border-primary/30" />
                <div className="absolute bottom-1 left-6 w-10 h-10 rounded-full border border-primary/20" />
              </div>
              <div className="relative px-4 py-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary/70 font-medium mb-0.5">Духовная практика</p>
                  <h2 className="text-lg font-semibold text-primary">Коллекция зикров</h2>
                </div>
                <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center">
                  {getIconByName("BookOpen", "w-7 h-7 text-primary")}
                </div>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t.common.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>

            {searchQuery ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t.zikry.found} {searchResults.length}
                </p>
                {(searchResults || []).map((item, index) => {
                  if (!item || !item.id) {
                    console.error('ZikryPage: invalid item in searchResults', item);
                    return null;
                  }
                  return (
                    <ZikrItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      onOpen={() => handleOpenItem(item)}
                    />
                  );
                })}
              </div>
            ) : (
              <>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'categories' | 'favorites')}>
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="categories" className="flex-1">{t.zikry.categories}</TabsTrigger>
                    <TabsTrigger value="favorites" className="flex-1">{t.zikry.favorites}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="categories" className="space-y-4">
                    {todayZikr && (
                      <Card
                        className="p-4 bg-primary/5 border-primary/20 hover-elevate cursor-pointer"
                        onClick={() => handleOpenItem(todayZikr)}
                        data-testid="today-zikr"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            {getIconByName("Sparkles", "w-5 h-5 text-primary")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-primary font-medium">{t.zikry.todayDua}</p>
                            <p className="text-sm truncate">{todayZikr.titleRu}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </Card>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => {}}
                        data-testid="button-favorites-quick"
                      >
                        <Heart className="w-4 h-4" />
                        {t.zikry.favorites}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => {}}
                        data-testid="button-share-quick"
                      >
                        <Share2 className="w-4 h-4" />
                        {t.zikry.share}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {zikryCatalog.map(category => (
                        <CategoryCard
                          key={category.id}
                          category={category}
                          onClick={() => handleOpenCategory(category)}
                        />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="favorites">
                    {favoriteItems.length === 0 ? (
                      <EmptyState
                        icon={Heart}
                        title={t.zikry.noFavorites}
                        description={t.zikry.noFavoritesDescription}
                      />
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-3">
                          {t.zikry.found} {favoriteItems.length}
                        </p>
                        {favoriteItems.map(item => (
                          <Card
                            key={`${item.category}-${item.id}`}
                            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setSelectedItem(item)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium mb-1">{item.titleRu}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {item.transcriptionCyrillic}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="ml-2"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await toggleFavoriteMutation.mutateAsync({
                                      category: item.category,
                                      itemId: item.id,
                                      isFavorite: true,
                                    });
                                  } catch (error) {
                                    toast({
                                      title: t.common.error,
                                      description: 'Не удалось удалить из избранного',
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                disabled={toggleFavoriteMutation.isPending}
                              >
                                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </>
        )}

        {viewState.type === 'subcategories' && (
          <div className="grid grid-cols-2 gap-3">
            {viewState.category.subcategories.map(subcategory => (
              <SubcategoryCard
                key={subcategory.id}
                subcategory={subcategory}
                categoryId={viewState.category.id}
                onClick={() => handleOpenSubcategory(subcategory)}
              />
            ))}
          </div>
        )}

        {viewState.type === 'items' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-3">
              Всего: {getItems().length}
            </p>
            {getItems().map((item, index) => (
              <ZikrItemCard
                key={item.id}
                item={item}
                index={index}
                onOpen={() => handleOpenItem(item)}
              />
            ))}
            {getItems().length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t.zikry.title} будут добавлены позже</p>
              </div>
            )}
          </div>
        )}
      </main>

      <ZikrDetailSheet
        item={selectedItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
