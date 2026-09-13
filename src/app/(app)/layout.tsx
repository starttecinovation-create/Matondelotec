'use client';

import React, { useEffect, useState } from "react";
import { AnnouncementBar } from "@/components/announcement-bar";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { CartSheet } from "@/components/cart-sheet";
import { Button } from "@/components/ui/button";
import { MessageSquare, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";

function FloatingChatButton() {
  return (
    <Button
      asChild
      className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50"
      aria-label="Abrir assistente de chat"
    >
      <Link href="/assistant">
        <MessageSquare className="h-8 w-8" />
      </Link>
    </Button>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempKey, setTempKey] = useState("");
  const [isCustomKeyActive, setIsCustomKeyActive] = useState(false);

  const rawApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const fallbackKey = "AIzaSyDCtuRXSEaG6UMacGdDTIK9aKhHUavXSCY";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('CUSTOM_GOOGLE_MAPS_API_KEY');
      if (saved) {
        setTempKey(saved);
        setIsCustomKeyActive(true);
      }
    }
  }, []);

  const apiKey = (typeof window !== "undefined" && localStorage.getItem('CUSTOM_GOOGLE_MAPS_API_KEY')) || rawApiKey;
  const hasMapsKey = !!apiKey && apiKey !== "undefined" && apiKey !== "" && !apiKey.startsWith("YOUR_");

  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const handleSaveKey = () => {
    if (typeof window !== "undefined") {
      const cleaned = tempKey.trim();
      if (cleaned === "") {
        localStorage.removeItem('CUSTOM_GOOGLE_MAPS_API_KEY');
      } else {
        localStorage.setItem('CUSTOM_GOOGLE_MAPS_API_KEY', cleaned);
      }
      setShowConfigModal(false);
      window.location.reload();
    }
  };

  const handleClearKey = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem('CUSTOM_GOOGLE_MAPS_API_KEY');
      setTempKey("");
      setIsCustomKeyActive(false);
      setShowConfigModal(false);
      window.location.reload();
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalConsoleError = console.error;
      console.error = function (...args) {
        const message = args.map(arg => String(arg?.message || arg || '')).join(' ');
        if (
          message.includes('Quota exceeded') ||
          message.includes('AutocompletePlacesRequest') ||
          message.includes('places.googleapis.com') ||
          message.includes('limit') ||
          message.includes('OVER_QUERY_LIMIT') ||
          message.includes('ApiProjectMapError') ||
          message.includes('BillingNotEnabledMapError') ||
          message.includes('Console RpcError')
        ) {
          console.warn("[Matondelo SafeMap] Suppressed Google Maps console error/quota overlay:", ...args);
          return;
        }
        originalConsoleError.apply(console, args);
      };

      const handleGlobalRejection = (event: PromiseRejectionEvent) => {
        const reason = event.reason;
        const message = reason?.message || String(reason || '');
        if (
          message.includes('Quota exceeded') ||
          message.includes('AutocompletePlacesRequest') ||
          message.includes('places.googleapis.com') ||
          message.includes('limit') ||
          message.includes('OVER_QUERY_LIMIT') ||
          message.includes('ApiProjectMapError') ||
          message.includes('BillingNotEnabledMapError')
        ) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          console.warn("[Matondelo SafeMap] Suppressed Google Maps unhandled rejection:", message);
        }
      };

      const handleGlobalError = (event: ErrorEvent) => {
        const message = event.message || '';
        if (
          message.includes('Quota exceeded') ||
          message.includes('AutocompletePlacesRequest') ||
          message.includes('places.googleapis.com') ||
          message.includes('limit') ||
          message.includes('OVER_QUERY_LIMIT') ||
          message.includes('ApiProjectMapError') ||
          message.includes('BillingNotEnabledMapError')
        ) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          console.warn("[Matondelo SafeMap] Suppressed Google Maps error event:", message);
        }
      };

      window.addEventListener('unhandledrejection', handleGlobalRejection, true);
      window.addEventListener('error', handleGlobalError, true);

      return () => {
        console.error = originalConsoleError;
        window.removeEventListener('unhandledrejection', handleGlobalRejection, true);
        window.removeEventListener('error', handleGlobalError, true);
      };
    }
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/cadastro');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            A verificar autenticação...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Banner de Status do Google Maps com Configuração Interativa */}
      <div className={`${isCustomKeyActive ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-black'} text-[11px] py-1 text-center font-semibold tracking-wider z-[100] transition-colors shadow-sm`}>
        <div className="container mx-auto flex items-center justify-center gap-2 flex-wrap px-4">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>
            {isCustomKeyActive 
              ? "Google Maps: Ativo com Chave Personalizada" 
              : "Google Maps: A usar Chave Padrão (Limitada para Produção)"}
          </span>
          <button 
            type="button"
            onClick={() => setShowConfigModal(true)} 
            className="ml-2 bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] normal-case font-bold hover:bg-neutral-800 transition active:scale-95 shadow-sm"
          >
            {isCustomKeyActive ? "Alterar Chave" : "Configurar Minha Chave"}
          </button>
        </div>
      </div>
      
      <AnnouncementBar />
      <AppHeader />
      
      <main className="flex-1 bg-muted/20 relative">
        {/* CRÍTICO: Children renderizado obrigatoriamente para que o Next.js encontre as rotas */}
        {children}
      </main>
      
      <AppFooter />
      <CartSheet />
      <FloatingChatButton />

      {/* Modal de Configuração de API do Google Maps */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white text-neutral-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="text-base font-bold tracking-tight text-neutral-900">
                Configurar Google Maps API Key
              </h3>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="text-neutral-400 hover:text-neutral-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              Insira a sua chave de API do Google Maps para ativar navegações, rotas de táxi e mapas personalizados de forma ilimitada na aplicação.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Chave de API do Google Maps
                </label>
                <input
                  type="text"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-mono outline-none"
                />
              </div>
              
              <div className="flex gap-2 justify-end pt-2">
                {isCustomKeyActive && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition"
                  >
                    Remover Chave
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition shadow-sm"
                >
                  Salvar e Ativar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
