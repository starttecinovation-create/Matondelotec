'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useUser } from '@/firebase/provider';
import React, { useEffect, useState } from 'react';
import { signInWithEmailAndPassword, type User as FirebaseAuthUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleRedirect = async (loggedInUser: FirebaseAuthUser | null) => {
        if (loggedInUser && firestore) {
            const userDocRef = doc(firestore, 'users', loggedInUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                if (userData.role === 'vendor' || userData.role === 'admin') {
                    router.push('/partner/dashboard');
                } else {
                    router.push('/dashboard');
                }
            } else {
                router.push('/dashboard');
            }
        }
    };
    
    if (!isUserLoading && user) {
      handleRedirect(user);
    }
  }, [user, isUserLoading, router, firestore]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Erro de Autenticação',
        description: 'O serviço de autenticação não está disponível. Tente novamente mais tarde.',
      });
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro no Login',
        description: 'As credenciais estão incorretas. Por favor, tente novamente.',
      });
      setIsLoading(false);
    }
  };

  if (isUserLoading || user) {
     return (
      <div className="flex min-h-[80vh] items-center justify-center bg-[#f7f9fa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#F6780A]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f9fa] px-4 py-8">
      <div className="w-full max-w-[450px] overflow-hidden rounded-lg bg-white shadow-sm border border-gray-100">
        <div className="p-8 md:p-10">
          <form onSubmit={handleLogin} className="flex flex-col items-center">
            <div className="mb-4 flex flex-col items-center gap-2">
              <Logo className="mb-2" />
            </div>
            
            <h5 className="mb-8 text-center text-[15px] font-bold text-gray-800">
              Entra com o seu email e senha
            </h5>

            <div className="w-full space-y-5 text-left">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-600">Email</label>
                <Input 
                  type="email" 
                  placeholder="exmple@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-11 bg-white border-gray-300 focus-visible:ring-[#F6780A] focus-visible:ring-1 focus-visible:border-[#F6780A]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-600">Senha</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="*********"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-11 bg-white pr-10 border-gray-300 focus-visible:ring-[#F6780A] focus-visible:ring-1 focus-visible:border-[#F6780A]"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="mt-6 h-11 w-full bg-[#d47a24] font-semibold text-white hover:bg-[#c36d1b]"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {isLoading ? 'A entrar...' : 'Entrar'}
              </Button>

              <div className="mt-6 flex justify-center gap-1.5 text-[14px]">
                <span className="text-gray-500">Não tem uma conta?</span>
                <Link href="/cadastro" className="font-semibold text-[#3483fa] hover:underline">
                  Criar conta
                </Link>
              </div>

              <div className="mt-4 flex flex-col items-center gap-1 text-[13px] border-t border-gray-100 pt-3">
                <p className="text-gray-500">
                  Quer ser um parceiro?{' '}
                  <Link href="/partner-signup" className="font-semibold text-[#d47a24] hover:underline">
                    Registe o seu negócio
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-center bg-[#f8f9fa] py-5 text-[14px] text-gray-500 border-t border-gray-100">
          <span className="mr-1.5">Esqueceu sua senha?</span>
          <Link href="/forgot-password" className="font-semibold text-[#3483fa] underline">
            Redefinir
          </Link>
        </div>
      </div>
    </div>
  );
}
