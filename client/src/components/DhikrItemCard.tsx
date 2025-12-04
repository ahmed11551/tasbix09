import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TextWithTooltip } from '@/components/ui/text-with-tooltip';
import { cn } from '@/lib/utils';
import { Play, Check, ChevronRight } from 'lucide-react';
import type { DhikrItem, TranscriptionType } from '@/lib/types';
import { categoryLabels } from '@/lib/constants';

interface DhikrItemCardProps {
  item: DhikrItem;
  onSelect?: (item: DhikrItem) => void;
  onPlay?: (item: DhikrItem) => void;
  isSelected?: boolean;
  showTranscription?: boolean;
  showTranslation?: boolean;
  transcriptionType?: TranscriptionType;
  compact?: boolean;
}

export default function DhikrItemCard({
  item,
  onSelect,
  onPlay,
  isSelected = false,
  showTranscription = true,
  showTranslation = true,
  transcriptionType = 'cyrillic',
  compact = false,
}: DhikrItemCardProps) {
  if (compact) {
    return (
      <Card
        className={cn(
          "p-3 hover-elevate cursor-pointer",
          isSelected && "ring-2 ring-primary bg-primary/5"
        )}
        onClick={() => onSelect?.(item)}
        data-testid={`card-dhikr-item-${item.id}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-arabic text-lg truncate" dir="rtl" lang="ar">
              {item.titleAr}
            </p>
            <TextWithTooltip as="p" className="text-sm text-muted-foreground">
              {item.titleRu}
            </TextWithTooltip>
          </div>
          
          <div className="flex items-center gap-2">
            {isSelected && (
              <Check className="w-5 h-5 text-primary" />
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "p-4 space-y-3 hover-elevate",
        isSelected && "ring-2 ring-primary bg-primary/5"
      )}
      data-testid={`card-dhikr-item-${item.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Badge variant="secondary" className="text-xs">
          {categoryLabels[item.category]}
        </Badge>
        
        {item.audioUrl && (
          <Button
            size="icon"
            variant="ghost"
            className="w-8 h-8"
            onClick={(e) => {
              e.stopPropagation();
              onPlay?.(item);
            }}
            data-testid={`button-play-${item.id}`}
          >
            <Play className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="text-center space-y-3" onClick={() => onSelect?.(item)}>
        <p 
          className="font-arabic text-2xl leading-loose text-foreground cursor-pointer"
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
          <p className="text-sm text-muted-foreground px-4">
            {item.translation}
          </p>
        )}
      </div>

      {item.meta?.surahNumber && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Сура {item.meta.surahNumber}</span>
          {item.meta.ayahCount && (
            <span>• {item.meta.ayahCount} аятов</span>
          )}
        </div>
      )}

      <Button
        className="w-full gap-2"
        onClick={() => onSelect?.(item)}
        variant={isSelected ? "default" : "secondary"}
        data-testid={`button-select-${item.id}`}
      >
        {isSelected ? (
          <>
            <Check className="w-4 h-4" />
            Выбрано
          </>
        ) : (
          'Выбрать'
        )}
      </Button>
    </Card>
  );
}
