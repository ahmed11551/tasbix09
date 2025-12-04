import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Баннер, показывающий статус онлайн/офлайн
 */
export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      // Показываем сообщение о восстановлении соединения
      if (wasOffline) {
        setTimeout(() => setWasOffline(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] text-center py-2 text-sm font-medium transition-all duration-300",
        isOnline
          ? "bg-green-500 text-white"
          : "bg-amber-500 text-white"
      )}
      style={{ paddingTop: "calc(0.5rem + env(safe-area-inset-top))" }}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
        <WifiOff className="w-4 h-4" />
        <span>
          {isOnline
            ? "Соединение восстановлено"
            : "Работа в офлайн режиме"}
        </span>
      </div>
    </div>
  );
}

