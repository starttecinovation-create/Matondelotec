'use client';

import React, { useEffect } from "react";
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
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasMapsKey = !!apiKey && apiKey !== "undefined" && apiKey !== "";
  const { user, isUserLoading } = useUser();
  const router = useRouter();

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
      {/* Aviso discreto em vez de bloqueio para evitar erro 404 de roteamento */}
      {!hasMapsKey && (
        <div className="bg-yellow-500 text-black text-[10px] py-1 text-center font-bold uppercase tracking-wider z-[100]">
          <div className="container mx-auto flex items-center justify-center gap-2">
            <AlertTriangle className="h-3 w-3" />
            Funcionalidades limitadas: Configuração de API pendente.
          </div>
        </div>
      )}
      
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
