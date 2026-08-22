'use client';

import { useState, useRef, useEffect, FormEvent, ChangeEvent, use } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { type Service, type ServiceCategory } from '@/lib/types';
import { printOrderFlow, PrintOrderInput } from '@/ai/flows/print-order-flow';
import { taxAppointmentFlow, TaxAppointmentInput } from '@/ai/flows/tax-appointment-flow';
import { schoolRegistrationFlow, SchoolRegistrationInput } from '@/ai/flows/school-registration-flow';
import { Loader2, Send, ArrowLeft, Paperclip, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

type MessageContent = {
    type: 'text';
    text: string;
} | {
    type: 'media';
    media: {
        url: string;
        contentType?: string;
    };
};

type Message = {
  role: 'user' | 'model';
  content: MessageContent[];
};

const educationalCategories: ServiceCategory[] = ['Faculdades', 'Colégios', 'Institutos Superiores'];
const emergencyServiceNames = ['Polícia Nacional', 'Serviço de Bombeiros', 'SIC - Serviço de Investigação Criminal'];


function getChatFlow(service?: Service) {
    if (!service) return printOrderFlow; // Default
    if (educationalCategories.includes(service.category)) return schoolRegistrationFlow;
    if (service.category === 'Bairro Fiscal' || emergencyServiceNames.includes(service.name)) return taxAppointmentFlow;
    if (service.category === 'Gráfica') return printOrderFlow;
    return printOrderFlow; // Fallback
}


function ChatPageContent({ params }: { params: Promise<{ serviceId: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  // Get product name from URL if present
  const productName = searchParams.get('product');

  const serviceRef = useMemoFirebase(() => {
    if (!firestore) return null;
    try {
      const docPath = decodeURIComponent(unwrappedParams.serviceId);
      if (docPath.includes('/')) {
        return doc(firestore, docPath);
      }
    } catch (e) {
      console.error('Error creating doc ref: ', e);
    }
    return null;
  }, [firestore, unwrappedParams.serviceId]);

  const { data: service, isLoading: isServiceLoading } = useDoc<Service>(serviceRef);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine which flow to use based on service category
  const chatFlow = getChatFlow(service as any);
  const isPrintShop = service?.category === 'Gráfica';

  // Initial greeting from the model
  useEffect(() => {
    if (service && messages.length === 0 && !isLoading) {
      setIsLoading(true);

      let initialHistory: Message[] = [];
      // If a product is specified in the URL (for print shops), create an initial user message
      if (productName && isPrintShop) {
        initialHistory.push({ role: 'user', content: [{ type: 'text', text: `Olá, gostaria de um orçamento para o produto: ${productName}` }] });
      }

      const flowInput: PrintOrderInput | TaxAppointmentInput | SchoolRegistrationInput = {
        serviceName: service.name,
        history: initialHistory as any,
      };
      
      chatFlow(flowInput as any)
        .then((output) => {
           // Combine the history (if any) with the model's response
           setMessages([...initialHistory, { role: 'model', content: [{ type: 'text', text: output.response }] }]);
        })
        .catch((e) => {
          console.error('Error on initial message:', e);
          setMessages([
            {
              role: 'model',
              content: [
                { type: 'text', text: 'Olá! Ocorreu um erro ao iniciar o nosso chat. Por favor, tente recarregar a página.' }
              ],
            },
          ]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [service, messages.length, isLoading, productName, chatFlow, isPrintShop]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleImageAttach = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedImage) || isLoading || !service) return;

    const userMessageContent: MessageContent[] = [];
    if(input.trim()) {
        userMessageContent.push({ type: 'text', text: input });
    }
    if (attachedImage) {
        userMessageContent.push({
            type: 'media',
            media: { url: attachedImage },
        });
    }

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessageContent }];
    setMessages(newMessages);
    setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const flowInput: PrintOrderInput | TaxAppointmentInput | SchoolRegistrationInput = {
        serviceName: service.name,
        history: newMessages as any,
      };
      const output = await chatFlow(flowInput as any);
      setMessages((prev) => [...prev, { role: 'model', content: [{ type: 'text', text: output.response }] }]);
    } catch (error) {
      console.error('Error in chatFlow:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: [{ type: 'text', text: 'Desculpe, ocorreu um erro. Por favor, tente novamente.'}],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isServiceLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">A carregar o chat...</p>
      </div>
    );
  }

  const allowImageUpload = service?.category === 'Gráfica';

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
          <h1 className="font-semibold">{service?.name || 'Chat de Assistência'}</h1>
          <p className="text-sm text-muted-foreground">Assistente Virtual</p>
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
                 <div className="flex flex-col gap-2">
                 {message.content.map((part, partIndex) => {
                    if (part.type === 'text') {
                        return (
                             <div
                                key={partIndex}
                                className={cn(
                                    'max-w-xs rounded-lg px-4 py-2 md:max-w-md',
                                    message.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                )}
                                >
                                <p className="whitespace-pre-wrap text-sm">{part.text}</p>
                            </div>
                        )
                    }
                    if (part.type === 'media' && part.media.url) {
                        return (
                            <div key={partIndex} className="relative h-48 w-48 overflow-hidden rounded-lg border">
                                <Image src={part.media.url} alt="Imagem do utilizador" fill className="object-cover" />
                            </div>
                        )
                    }
                    return null;
                 })}
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
          </div>
        </ScrollArea>
      </main>
      <footer className="border-t bg-card p-4">
        {attachedImage && (
            <div className="relative mb-2 h-20 w-20 rounded-md border p-1">
                <Image src={attachedImage} alt="Preview" fill className="object-cover rounded-md" />
                <button
                    onClick={() => setAttachedImage(null)}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            {allowImageUpload && (
                <>
                    <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleImageAttach} 
                        accept="image/*"
                    />
                </>
            )}
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escreva a sua mensagem..."
            autoComplete="off"
            disabled={isLoading || !service}
          />
          <Button type="submit" size="icon" disabled={isLoading || (!input.trim() && !attachedImage)}>
            {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </form>
      </footer>
    </div>
  );
}

import { Suspense } from 'react';

export default function ChatPage({ params }: { params: Promise<{ serviceId: string }> }) {
  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center p-12"><Skeleton className="w-full h-64" /></div>}>
      <ChatPageContent params={params} />
    </Suspense>
  )
}
