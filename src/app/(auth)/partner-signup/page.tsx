'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import React, { useState, Suspense } from 'react';
import { Loader2, MailCheck } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { serviceCategories } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categoryDetails } from '@/components/category-icon';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

// Importações do Firebase
import { getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signOut, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';

const partnerSignupSchema = z.object({
  businessName: z.string().min(1, 'O nome do negócio é obrigatório.'),
  category: z.string().min(1, 'A categoria é obrigatória.'),
  email: z.string().email('Por favor, insira um email válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  phoneNumber: z.string().optional(),
  referralCode: z.string().optional(),
  country: z.string().min(1, 'O país é obrigatório.'),
  province: z.string().min(1, 'A província/estado é obrigatória.'),
  city: z.string().min(1, 'A cidade/município é obrigatória.'),
  district: z.string().optional(),
  commune: z.string().optional(),
});

type PartnerSignupFormValues = z.infer<typeof partnerSignupSchema>;

function PartnerSignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [carregando, setCarregando] = useState(false);
  const [contaCriada, setContaCriada] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState('');

  const refCodeFromUrl = searchParams.get('ref');

  const form = useForm<PartnerSignupFormValues>({
    resolver: zodResolver(partnerSignupSchema),
    defaultValues: {
      businessName: '',
      category: '',
      email: '',
      password: '',
      phoneNumber: '',
      referralCode: refCodeFromUrl || '',
      country: 'Angola',
      province: '',
      city: '',
      district: '',
      commune: '',
    },
  });

  const notifyAdmins = async (dbInstance: any, newPartnerName: string) => {
    const adminsQuery = query(collection(dbInstance, 'users'), where('role', '==', 'admin'));
    try {
      const adminSnapshot = await getDocs(adminsQuery);
      if (adminSnapshot.empty) return;

      const batch = writeBatch(dbInstance);
      const notificationMessage = `Novo parceiro registado: ${newPartnerName}. Aguarda aprovação.`;

      adminSnapshot.forEach(adminDoc => {
        const adminId = adminDoc.id;
        const notificationRef = doc(collection(dbInstance, `users/${adminId}/notifications`));
        batch.set(notificationRef, {
          id: notificationRef.id,
          userId: adminId,
          message: notificationMessage,
          status: 'unread',
          createdAt: serverTimestamp(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error("Error notifying admins: ", error);
    }
  };

  const handleSignup = async (values: PartnerSignupFormValues) => {
    setCarregando(true);
    try {
      const app = getApps().length > 0 ? getApp() : undefined;
      if (!app) {
        throw new Error("O Firebase não foi inicializado corretamente no projeto.");
      }

      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);

      // 1. Criar o parceiro no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(authInstance, values.email, values.password);
      const firebaseUser = userCredential.user;

      // Atualizar o perfil do Firebase Auth com o nome do negócio
      await updateProfile(firebaseUser, { displayName: values.businessName });

      // 2. Enviar o link de verificação para o e-mail
      await sendEmailVerification(firebaseUser);

      // 3. Salvar o perfil no Firestore
      const userProfileRef = doc(dbInstance, 'users', firebaseUser.uid);
      const userProfileData = {
        id: firebaseUser.uid,
        displayName: values.businessName,
        email: firebaseUser.email,
        phone: values.phoneNumber || null,
        role: 'vendor',
        category: values.category,
        balance: 0,
        location: {
          country: values.country,
          province: values.province,
          city: values.city,
          district: values.district || null,
          commune: values.commune || null,
        },
        createdAt: new Date().toISOString(),
        verificationStatus: 'pending',
        emailVerificado: false,
        referralCode: `${values.businessName.toLowerCase().replace(/\s+/g, '')}${Math.random().toString(36).substring(2, 6)}`,
        referredBy: values.referralCode || null,
      };

      await setDoc(userProfileRef, userProfileData);

      // Notificar os administradores
      await notifyAdmins(dbInstance, values.businessName);

      // 4. Efetuar o logout imediato para que o parceiro não navegue sem o e-mail verificado
      await signOut(authInstance);

      toast({
        title: 'Registo efetuado!',
        description: `Enviámos um link de verificação para o e-mail do negócio: ${values.email}.`,
      });

      setEmailEnviado(values.email);
      setContaCriada(true);
    } catch (error: any) {
      console.error(error);
      let mensagemErro = 'Não foi possível criar a conta. Tente novamente.';
      if (error.code === 'auth/email-already-in-use') {
        mensagemErro = 'Este e-mail já está a ser utilizado por outro utilizador.';
      } else if (error.code === 'auth/weak-password') {
        mensagemErro = 'A senha escolhida é demasiado fraca.';
      }

      toast({
        variant: 'destructive',
        title: 'Erro ao Criar Conta',
        description: mensagemErro,
      });
    } finally {
      setCarregando(false);
    }
  };

  // Se a conta de parceiro foi criada, exibe o ecrã de sucesso com as instruções de confirmação
  if (contaCriada) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <div className="mb-6">
          <Logo variant="partner" />
        </div>
        <Card className="w-full max-w-md text-center shadow-lg border border-border">
          <CardHeader className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-primary/10 rounded-full text-primary mb-2">
              <MailCheck className="h-10 w-10" />
            </div>
            <CardTitle className="text-2xl">Ative a sua conta de Parceiro</CardTitle>
            <CardDescription>
              Quase pronto! Enviámos um link de ativação para: <br />
              <strong className="text-foreground">{emailEnviado}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              Por favor, aceda à sua caixa de entrada (ou pasta de spam) e clique no link de ativação para confirmar o seu e-mail profissional.
            </p>
            <p className="text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 p-2 rounded-md border border-amber-200/30">
              Aviso: A sua conta ficará sob revisão da nossa equipa de administração. Assim que o e-mail for verificado e o perfil aprovado, poderá gerir os seus serviços.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild variant="link" className="text-primary font-medium">
              <Link href="/login">Ir para o Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 py-12">
      <div className="mb-6">
        <Logo variant="partner" />
      </div>
      <Card className="w-full max-w-lg shadow-md border border-border">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">Registo Matondelo Partner</CardTitle>
          <CardDescription>
            Junte-se à nossa rede de prestadores de serviços. O registo é gratuito!
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSignup)}>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Negócio</FormLabel>
                      <FormControl>
                        <Input placeholder="O nome do seu negócio" {...field} disabled={carregando} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria do Negócio</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={carregando}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {serviceCategories.map(category => {
                            const details = categoryDetails[category];
                            return (
                              <SelectItem key={category} value={category}>
                                {details ? details.label : category}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Localização do Negócio</h3>
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Angola" {...field} disabled={carregando} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="province"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Província / Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Luanda" {...field} disabled={carregando} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade / Município</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Luanda" {...field} disabled={carregando} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distrito / Bairro (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Ingombota" {...field} disabled={carregando} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="commune"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comuna (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Ingombota" {...field} disabled={carregando} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Credenciais de Acesso</h3>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email de Acesso</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="negocio@email.com" {...field} disabled={carregando} />
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
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telemóvel (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+244 9XX XXX XXX" {...field} disabled={carregando} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4" />

              <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Indicação (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Insira o código de quem o indicou" {...field} disabled={carregando} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={carregando}>
                {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {carregando ? 'A processar...' : 'Criar Conta de Parceiro'}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link href="/login" className="underline hover:text-primary font-medium">
                  Entrar
                </Link>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

export default function PartnerSignupPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-12"><Skeleton className="w-full h-80"/></div>}>
      <PartnerSignupPageContent />
    </Suspense>
  );
}
