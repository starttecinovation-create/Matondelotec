'use client';

import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" asChild>
          <Link href="/">&larr; Voltar à página inicial</Link>
        </Button>
      </div>
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
