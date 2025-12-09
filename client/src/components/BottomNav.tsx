import { cn } from '@/lib/utils';
import { useLocation, Link } from 'wouter';
import { 
  Circle,
  Target,
  BookMarked,
  BarChart3,
  Settings
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function BottomNav() {
  const [location] = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/', icon: Circle, label: t.navigation.tasbih },
    { path: '/goals', icon: Target, label: t.navigation.goals },
    { path: '/zikry', icon: BookMarked, label: t.navigation.zikry },
    { path: '/reports', icon: BarChart3, label: t.navigation.reports },
    { path: '/settings', icon: Settings, label: t.navigation.settings },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location === path || 
            (path !== '/' && location.startsWith(path));
          
          return (
            <Link key={path} href={path}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 w-14 h-full",
                  "transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
                data-testid={`nav-${path.replace('/', '') || 'home'}`}
              >
                <Icon 
                  className={cn(
                    "w-5 h-5",
                    isActive && "fill-primary/20"
                  )} 
                />
                <span className={cn(
                  "text-[10px]",
                  isActive && "font-semibold"
                )}>
                  {label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
