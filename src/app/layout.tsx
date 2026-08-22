import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { FirebaseClientProvider } from "@/firebase";
import React from "react";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "matondelo",
  description: "Encontre e reserve serviços em Angola de forma prática e segura.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#D45500" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id="matondelo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F9A03F" />
              <stop offset="100%" stopColor="#EB4A24" />
            </linearGradient>
          </defs>
        </svg>
        <FirebaseClientProvider>{children}</FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
