'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useUser } from '@/firebase';
import { matondeloAssistantFlow, AssistantInput } from '@/ai/flows/matondelo-assistant-flow';
import { Loader2, Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';
import { useRouter } from 'next/navigation';

type Message = {
  role: 'user' | 'model';
  content: string;
};

export default function AssistantPage() {
  const router = useRouter();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initial greeting from the model
  useEffect(() => {
    if (messages.length === 0 && !isLoading) {
      setIsLoading(true);
      const flowInput: AssistantInput = {
        history: [],
        userName: user?.displayName || undefined,
      };
      
      matondeloAssistantFlow(flowInput)
        .then((output) => {
          setMessages([{ role: 'model', content: output.response }]);
        })
        .catch((e) => {
          console.error('Error on initial message:', e);
          setMessages([
            {
              role: 'model',
              content: 'Olá! Ocorreu um erro ao iniciar o nosso chat. Por favor, tente recarregar a página.',
            },
          ]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [messages.length, isLoading, user]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const flowInput: AssistantInput = {
        history: newMessages,
        userName: user?.displayName || undefined,
      };
      const output = await matondeloAssistantFlow(flowInput);
      setMessages((prev) => [...prev, { role: 'model', content: output.response }]);
    } catch (error) {
      console.error('Error in matondeloAssistantFlow:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: 'Desculpe, ocorreu um erro. Por favor, tente novamente.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <header className="flex items-center gap-4 border-b bg-card p-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft />
        </Button>
        <Avatar>
          <AvatarFallback>
            <Logo className="text-xl"/>
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-semibold">Assistente Matondelo</h1>
          <p className="text-sm text-muted-foreground">Online</p>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="space-y-4 p-4 md:p-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-end gap-2',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'model' && (
                  <Avatar className="h-8 w-8 self-end">
                    <AvatarFallback>
                      <Logo className="text-lg"/>
                    </AvatarFallback>
                  </Avatar>
                )}
                 <div
                    className={cn(
                        'max-w-xs rounded-lg px-4 py-2 md:max-w-md',
                        message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                    >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && messages.length > 0 && (
              <div className="flex items-end gap-2 justify-start">
                  <Avatar className="h-8 w-8">
                      <AvatarFallback>
                          <Logo className="text-lg"/>
                      </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <Skeleton className="h-2 w-4 animate-bounce" />
                  </div>
              </div>
            )}
            {messages.length === 0 && isLoading && (
                 <div className="flex items-end gap-2 justify-start">
                  <Avatar className="h-8 w-8">
                      <AvatarFallback>
                          <Logo className="text-lg"/>
                      </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <Skeleton className="h-2 w-4 animate-bounce" />
                  </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </main>
      <footer className="border-t bg-card p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Fale com a assistente Mati..."
            autoComplete="off"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </form>
      </footer>
    </div>
  );
}
