'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase/provider';
import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: 'O serviço de autenticação não está disponível.',
      });
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setIsSent(true);
      toast({
        title: 'Email Enviado',
        description: 'Se existir uma conta com este email, receberá um link para redefinir a sua senha.',
      });
    } catch (error: any) {
      // We show a generic message even on error to prevent email enumeration
      setIsSent(true);
      toast({
        title: 'Email Enviado',
        description: 'Se existir uma conta com este email, receberá um link para redefinir a sua senha.',
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
                <Logo className="text-primary text-3xl" />
            </div>
            <CardTitle className="font-headline text-2xl">Recuperar Senha</CardTitle>
            <CardDescription>
                Insira o seu email para receber um link de recuperação.
            </CardDescription>
        </CardHeader>
        {isSent ? (
            <CardContent>
                <div className="text-center text-sm text-muted-foreground p-4 bg-muted rounded-md">
                    <p>Enviámos um link de recuperação para o seu email. Por favor, verifique a sua caixa de entrada (e a pasta de spam).</p>
                </div>
            </CardContent>
        ) : (
        <form onSubmit={handlePasswordReset}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'A enviar...' : 'Enviar Link de Recuperação'}
            </Button>
          </CardFooter>
        </form>
        )}
         <CardFooter>
            <Button variant="link" className="w-full" asChild>
                <Link href="/login">Voltar ao Login</Link>
            </Button>
        </CardFooter>
      </Card>
  );
}
