import { useState, useRef, useEffect } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TextWithTooltipProps {
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'p' | 'div';
  delayDuration?: number;
}

/**
 * Компонент для отображения текста с tooltip при обрезке.
 * Автоматически показывает tooltip только если текст обрезан.
 */
export function TextWithTooltip({
  children,
  className,
  as: Component = 'span',
  delayDuration = 300,
}: TextWithTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const textRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const isOverflowing =
          textRef.current.scrollWidth > textRef.current.clientWidth;
        setShowTooltip(isOverflowing);
      }
    };

    checkOverflow();
    
    // Проверяем при изменении размера окна
    window.addEventListener('resize', checkOverflow);
    
    // Используем ResizeObserver для более точного отслеживания
    let resizeObserver: ResizeObserver | null = null;
    if (textRef.current && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(checkOverflow);
      resizeObserver.observe(textRef.current);
    }

    return () => {
      window.removeEventListener('resize', checkOverflow);
      if (resizeObserver && textRef.current) {
        resizeObserver.unobserve(textRef.current);
      }
    };
  }, [children]);

  const content = (
    <Component
      ref={textRef}
      className={cn('truncate', className)}
    >
      {children}
    </Component>
  );

  if (!showTooltip) {
    return content;
  }

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs break-words">{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

