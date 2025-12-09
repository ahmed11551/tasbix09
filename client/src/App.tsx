import React, { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider } from "@/context/DataContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import BottomNav from "@/components/BottomNav";
import TelegramAuth from "@/components/TelegramAuth";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { SkipToMain } from "@/components/ui/skip-to-main";
import NotFound from "@/pages/not-found";
// КРИТИЧНО: Импортируем useTranslation здесь, чтобы модуль был включен в shared chunk
// и был доступен для lazy-loaded страниц
import { useTranslation } from "@/lib/i18n";

// Принудительно импортируем весь модуль i18n для гарантии включения в shared chunk
import * as i18nModule from "@/lib/i18n";
if (typeof window !== 'undefined') {
  // Принудительная оценка модуля для включения в bundle
  void i18nModule;
}

// КРИТИЧНО: Отключаем lazy loading для TasbihPage, чтобы избежать проблем с i18n
// Модуль i18n должен быть доступен ДО загрузки страницы
import TasbihPage from "@/pages/TasbihPage";
const GoalsPage = lazy(() => import("@/pages/GoalsPage"));
const ZikryPage = lazy(() => import("@/pages/ZikryPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const QazaCalculatorPage = lazy(() => import("@/pages/QazaCalculatorPage"));

// Loading компонент
const PageLoader = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground">{t.common.loading}</div>
    </div>
  );
};

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={TasbihPage} />
        <Route path="/goals" component={GoalsPage} />
        <Route path="/zikry" component={ZikryPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/qaza-calculator" component={QazaCalculatorPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ErrorBoundary>
            <DataProvider>
              <TelegramAuth />
              <SkipToMain />
              <OfflineBanner />
              <div className="min-h-screen bg-background">
                <Router />
                <BottomNav />
              </div>
              <Toaster />
            </DataProvider>
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
