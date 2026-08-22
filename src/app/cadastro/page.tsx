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
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { Loader2, MailCheck } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// FUNÇÕES DO FIREBASE (Incluindo a verificação de e-mail)
import { getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const signupFormSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [carregando, setCarregando] = useState(false);
  const [contaCriada, setContaCriada] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState('');

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: SignupFormValues) {
    setCarregando(true);
    try {
      const app = getApps().length > 0 ? getApp() : undefined;
      if (!app) throw new Error("Firebase não foi inicializado no projeto.");

      const auth = getAuth(app);
      const db = getFirestore(app);

      // 1. Criar o utilizador no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // 2. Enviar o link de confirmação/verificação para o e-mail
      await sendEmailVerification(user);

      // 3. Criar o registo na base de dados Firestore
      await setDoc(doc(db, 'users', user.uid), {
        nome: data.name,
        email: data.email,
        emailVerificado: false,
        createdAt: new Date().toISOString(),
      });

      // 4. Fazer logout imediato para que ele não navegue sem confirmar o e-mail
      await signOut(auth);

      toast({
        title: 'Verifique o seu e-mail!',
        description: `Enviámos um link de confirmação para ${data.email}.`,
      });

      setEmailEnviado(data.email);
      setContaCriada(true);
    } catch (err: any) {
      console.error(err);
      let mensagemErro = 'Ocorreu um erro ao criar a conta.';
      
      if (err.code === 'auth/email-already-in-use') {
        mensagemErro = 'Este e-mail já está a ser utilizado.';
      } else if (err.code === 'auth/weak-password') {
        mensagemErro = 'A senha escolhida é demasiado fraca.';
      }

      toast({
        variant: 'destructive',
        title: 'Erro no cadastro',
        description: mensagemErro,
      });
    } finally {
      setCarregando(false);
    }
  }

  // Se a conta foi criada com sucesso, mostra uma tela informativa de sucesso em vez do formulário
  if (contaCriada) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <div className="mb-6">
          <Logo />
        </div>
        <Card className="w-full max-w-md text-center">
          <CardHeader className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-primary/10 rounded-full text-primary mb-2">
              <MailCheck className="h-10 w-10" />
            </div>
            <CardTitle className="text-2xl">Confirme o seu e-mail</CardTitle>
            <CardDescription>
              Quase lá! Enviámos um link de ativação para o e-mail: <br />
              <strong className="text-foreground">{emailEnviado}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Por favor, aceda à sua caixa de entrada (ou spam) e clique no link enviado para validar e ativar a sua conta na Matondelo.
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild variant="link" className="text-primary font-medium">
              <Link href="/login">Ir para a página de Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mb-6">
        <Logo />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription>
            Insira os seus dados abaixo para se cadastrar na plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" {...field} disabled={carregando} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} disabled={carregando} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} disabled={carregando} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={carregando}>
                {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {carregando ? 'A processar...' : 'Cadastrar'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Fazer login
            </Link>
          </p>
          <div className="border-t border-border w-full my-1" />
          <p className="text-xs text-muted-foreground">
            Já tem uma conta de parceiro?{' '}
            <Link href="/login" className="text-[#d47a24] hover:underline font-semibold">
              Entrar como parceiro
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            Quer ser um parceiro?{' '}
            <Link href="/partner-signup" className="text-[#d47a24] hover:underline font-semibold">
              Registar como parceiro
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}