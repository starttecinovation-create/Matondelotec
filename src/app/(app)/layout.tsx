'use client';

import React, { useEffect } from "react";
import { AnnouncementBar } from "@/components/announcement-bar";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { CartSheet } from "@/components/cart-sheet";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";
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
  const { user, isUserLoading } = useUser();
  const router = useRouter();

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
      <AnnouncementBar />
      <AppHeader />
      
      <main className="flex-1 bg-muted/20 relative">
        {/* CRÍTICO: Children renderizado obrigatoriamente para que o Next.js encontre as rotas */}
        {children}
      </main>
      
      <AppFooter />
      <CartSheet />
      <FloatingChatButton />
    </div>
  );
}
