import { useEffect, useState } from 'react';
import { getTelegramUser, isTelegramWebApp, getTelegramInitData } from '@/lib/telegram';
import { useQuery } from '@tanstack/react-query';
import { setAuthToken, setUserId } from '@/lib/auth';

export default function TelegramAuth() {
  const [initData, setInitData] = useState<string | null>(null);

  useEffect(() => {
    if (!isTelegramWebApp()) {
      return;
    }

    const data = getTelegramInitData();
    setInitData(data);
  }, []);

  // Авторизация через Telegram
  const { data: user } = useQuery({
    queryKey: ['telegram-auth', initData],
    queryFn: async () => {
      if (!isTelegramWebApp() || !initData) return null;

      const tgUser = getTelegramUser();
      if (!tgUser) return null;

      try {
        const response = await fetch('/api/telegram/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: tgUser.id,
            username: tgUser.username,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
            photoUrl: tgUser.photo_url,
            initData, // Для валидации на бэкенде
          }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Установить токен и userId для API запросов
          if (data.user?.id) {
            setUserId(data.user.id, true);
            // Использовать тестовый токен для авторизации
            setAuthToken('test_token_123', true);
          }
          
          return data.user;
        }
      } catch (error) {
        console.error('Telegram auth error:', error);
      }
      return null;
    },
    enabled: !!initData && isTelegramWebApp(),
    retry: false,
  });

  // Также установить токен для обычных пользователей (без Telegram)
  useEffect(() => {
    if (!isTelegramWebApp()) {
      // Для тестирования без Telegram - установить дефолтные значения
      const userId = localStorage.getItem('user_id') || 'default-user';
      const token = localStorage.getItem('api_token') || 'test_token_123';
      setUserId(userId, true);
      setAuthToken(token, true);
    }
  }, []);

  // Компонент работает в фоне, не рендерит UI
  return null;
}

