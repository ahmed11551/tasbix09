import { Button } from '@/components/ui/button';

/**
 * Компонент "Skip to main content" для улучшения accessibility.
 * Позволяет пользователям с клавиатурой быстро перейти к основному содержимому,
 * пропуская навигационные элементы.
 */
export function SkipToMain({ mainContentId = 'main-content' }: { mainContentId?: string }) {
  const handleClick = () => {
    const mainContent = document.getElementById(mainContentId);
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Button
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      aria-label="Перейти к основному содержимому"
    >
      Перейти к основному содержимому
    </Button>
  );
}

