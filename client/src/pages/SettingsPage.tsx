import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, 
  Bell, 
  Globe, 
  Moon, 
  Sun,
  Vibrate,
  Volume2,
  Shield,
  HelpCircle,
  MessageCircle,
  ChevronRight,
  Sparkles,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [language, setLanguage] = useState('ru');
  const [transcriptionType, setTranscriptionType] = useState('cyrillic');

  const handleDarkModeChange = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div id="main-content" tabIndex={-1} className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
          <h1 className="font-display font-semibold text-lg">Настройки</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-6">
        <Card className="p-4 hover-elevate cursor-pointer" data-testid="card-pro-upgrade">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Садака ПАСС</h3>
              <p className="text-sm text-muted-foreground">
                Неограниченные цели и AI-отчёты
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </Card>

        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground px-1">Профиль</h2>
          <Card className="divide-y divide-border">
            <button className="flex items-center gap-4 p-4 w-full hover-elevate" data-testid="button-profile">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Мой профиль</p>
                <p className="text-sm text-muted-foreground">Имя, часовой пояс, мазхаб</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground px-1">Приложение</h2>
          <Card className="divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Sun className="w-5 h-5 text-muted-foreground" />
                )}
                <Label htmlFor="dark-mode">Тёмная тема</Label>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={handleDarkModeChange}
                data-testid="switch-dark-mode"
              />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <Label htmlFor="notifications">Уведомления</Label>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
                data-testid="switch-notifications"
              />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Vibrate className="w-5 h-5 text-muted-foreground" />
                <Label htmlFor="haptic">Вибрация при тапе</Label>
              </div>
              <Switch
                id="haptic"
                checked={hapticFeedback}
                onCheckedChange={setHapticFeedback}
                data-testid="switch-haptic"
              />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-muted-foreground" />
                <Label htmlFor="sounds">Звуковые эффекты</Label>
              </div>
              <Switch
                id="sounds"
                checked={soundEffects}
                onCheckedChange={setSoundEffects}
                data-testid="switch-sounds"
              />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground px-1">Локализация</h2>
          <Card className="divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <span>Язык</span>
              </div>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-32" data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
                <span>Транскрипция</span>
              </div>
              <Select value={transcriptionType} onValueChange={setTranscriptionType}>
                <SelectTrigger className="w-32" data-testid="select-transcription">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cyrillic">Кириллица</SelectItem>
                  <SelectItem value="latin">Латиница</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground px-1">Поддержка</h2>
          <Card className="divide-y divide-border">
            <button className="flex items-center gap-4 p-4 w-full hover-elevate" data-testid="button-help">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left">Помощь и FAQ</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <button className="flex items-center gap-4 p-4 w-full hover-elevate" data-testid="button-feedback">
              <MessageCircle className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left">Обратная связь</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <button className="flex items-center gap-4 p-4 w-full hover-elevate" data-testid="button-privacy">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left">Политика конфиденциальности</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </Card>
        </div>

        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Умный Тасбих v1.0.0
          </p>
        </div>
      </main>
    </div>
  );
}
