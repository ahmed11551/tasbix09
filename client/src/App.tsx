import { lazy, Suspense } from "react";
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

// Lazy loading для страниц - уменьшает initial bundle size
const TasbihPage = lazy(() => import("@/pages/TasbihPage"));
const GoalsPage = lazy(() => import("@/pages/GoalsPage"));
const ZikryPage = lazy(() => import("@/pages/ZikryPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const QazaCalculatorPage = lazy(() => import("@/pages/QazaCalculatorPage"));

// Loading компонент
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-muted-foreground">Загрузка...</div>
  </div>
);

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
