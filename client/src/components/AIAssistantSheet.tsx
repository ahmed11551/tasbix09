import { useState, useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  Mic,
  MicOff,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { getAuthOptions } from '@/lib/api';
import { useHabits, useTasks, useGoals } from '@/hooks/use-api';

interface AIAssistantSheetProps {
  onCreateTask?: (task: { title: string; description?: string; dueDate?: string }) => void;
  onCreateHabit?: (habit: { title: string; description?: string }) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistantSheet({ 
  onCreateTask,
  onCreateHabit,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AIAssistantSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Привет! Я AI-помощник. Я могу помочь вам создать задачи или привычки. Просто опишите, что вы хотите сделать!',
    },
  ]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: habits = [] } = useHabits();
  const { data: tasks = [] } = useTasks();
  const { data: goals = [] } = useGoals();

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/ai/assistant", {
        message: input.trim(),
        context: {
          habits: habits.slice(0, 5),
          tasks: tasks.slice(0, 5),
          goals: goals.slice(0, 5),
        },
      }, getAuthOptions());
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw { json: Promise.resolve(errorData), message: errorData.message || errorData.error || `HTTP ${res.status}` };
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw { json: Promise.resolve(data), message: data.message || data.error };
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // Try to parse JSON from response for creating items
      try {
        const jsonMatch = data.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.title) {
            if (parsed.category || parsed.repeatType) {
              // It's a habit
              onCreateHabit?.(parsed);
            } else {
              // It's a task
              onCreateTask?.(parsed);
            }
          }
        }
      } catch {
        // Not JSON, just show the response
      }
    } catch (error: any) {
      let errorContent = 'Извините, произошла ошибка.';
      
      // Проверяем ответ от API
      if (error.json) {
        try {
          const errorData = await error.json();
          if (errorData.message) {
            errorContent = errorData.message;
          } else if (errorData.error) {
            errorContent = errorData.error === 'OpenAI API недоступен в вашем регионе' 
              ? 'OpenAI API недоступен в вашем регионе. Возможно, требуется VPN или прокси.'
              : errorData.error;
          }
        } catch {
          // Если не удалось распарсить JSON, используем дефолтное сообщение
        }
      }
      
      if (error.message?.includes('503') || error.message?.includes('AI service is not configured')) {
        errorContent = 'AI-помощник временно недоступен. Для активации необходим API ключ OpenAI.';
      } else if (error.message && !errorContent.includes('OpenAI')) {
        errorContent = `Извините, произошла ошибка: ${error.message}`;
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'ru-RU';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
        setIsListening(true);
      }
    }
  };

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  const content = (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {messages.map((msg) => (
                  <div
              key={msg.id}
                    className={cn(
                "flex gap-3",
                msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
              {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                    )}
              <Card
                className={cn(
                  "max-w-[80%] p-3",
                  msg.role === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </Card>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <Card className="bg-muted p-3">
                <p className="text-sm">Думаю...</p>
              </Card>
              </div>
            )}
        </div>
          </ScrollArea>

      <div className="border-t p-4 space-y-2">
        <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
            placeholder="Опишите задачу или привычку..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
            className="min-h-[60px] resize-none"
            disabled={isLoading}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleListening}
            disabled={isLoading}
            className={cn(isListening && "bg-red-500 text-white hover:bg-red-600")}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <Button
                onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="w-full gap-2"
              >
                <Send className="w-4 h-4" />
          Отправить
              </Button>
            </div>
          </div>
  );

  if (trigger) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>AI Assistant</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>AI Assistant</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}
