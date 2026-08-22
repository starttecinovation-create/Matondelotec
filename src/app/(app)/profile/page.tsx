'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CircleUser, Edit, Wallet, HeartHandshake } from 'lucide-react';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Skeleton } from '@/components/ui/skeleton';
import type { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const profileFormSchema = z.object({
  displayName: z.string().min(1, 'O nome é obrigatório.'),
  email: z.string().email('Por favor, insira um email válido.'),
});

export default function ProfilePage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const userProfileRef = useMemoFirebase(() => user ? firestore && user ? doc(firestore, 'users', user.uid) : null : null, [firestore, user]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);
    
    const transactionsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/transactions`), orderBy('transactionDate', 'desc'));
    }, [firestore, user]);
    
    const { data: transactions, isLoading: areTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

    const profileForm = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        values: {
            displayName: userProfile?.displayName || '',
            email: user?.email || '',
        },
        reValidateMode: 'onChange',
    });
    
    React.useEffect(() => {
        if (userProfile) {
            profileForm.reset({
                displayName: userProfile.displayName,
                email: user?.email || '',
            });
        }
    }, [userProfile, user, profileForm]);


    const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
        if (!user || !userProfileRef || !firestore) return;
        
        if (user.displayName !== values.displayName) {
            await updateProfile(user, { displayName: values.displayName });
        }
        
        const updateData = { displayName: values.displayName };
        updateDoc(userProfileRef, updateData)
            .then(() => {
                toast({
                    title: 'Perfil Atualizado!',
                    description: 'As suas informações foram guardadas com sucesso.',
                });
            })
            .catch ((error: any) => {
                console.error("Profile update error:", error);
                toast({
                    variant: 'destructive',
                    title: 'Erro ao Atualizar',
                    description: 'Não foi possível atualizar o perfil. Tente novamente.',
                });
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: userProfileRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                }));
            });
    };
    
    const avatarImage = PlaceHolderImages.find(img => img.id === 'avatar-1');

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground mt-2">
            Gira as suas informações, saldo e transações.
          </p>
        </div>

        <Card>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <CardHeader>
                    <CardTitle>As Minhas Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            {avatarImage && <AvatarImage src={user?.photoURL || avatarImage.imageUrl} alt="User Avatar" data-ai-hint={avatarImage.imageHint}/>}
                            <AvatarFallback><CircleUser className="h-10 w-10"/></AvatarFallback>
                        </Avatar>
                        <Button variant="outline" type="button" disabled><Edit className="mr-2 h-4 w-4"/>Alterar foto (brevemente)</Button>
                    </div>
                    {isProfileLoading ? <Skeleton className="h-32 w-full" /> : (
                    <>
                    <FormField
                        control={profileForm.control}
                        name="displayName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl><Input placeholder="O seu nome completo" {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input type="email" readOnly disabled {...field} /></FormControl>
                             <FormMessage />
                            </FormItem>
                        )}
                        />
                    </>
                     )}
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button type="submit" disabled={profileForm.formState.isSubmitting || isProfileLoading}>
                        {profileForm.formState.isSubmitting ? 'A Guardar...' : 'Guardar Alterações'}
                    </Button>
                </CardFooter>
            </form>
          </Form>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Saldo Virtual</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 p-6 border rounded-lg bg-background">
                        <div className="p-3 bg-primary/10 rounded-full"><Wallet className="h-8 w-8 text-primary"/></div>
                        <div>
                            <p className="text-sm text-muted-foreground">Saldo Atual</p>
                            {isProfileLoading ? <Skeleton className="h-9 w-40 mt-1" /> :
                            <p className="text-3xl font-bold">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(userProfile?.balance || 0)}</p>
                            }
                        </div>
                    </div>
                     <p className="text-sm text-muted-foreground mt-4">Para carregar o seu saldo, por favor, registe-se como parceiro ou contacte o suporte.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Responsabilidade Social</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center text-center gap-4 p-6 border rounded-lg bg-background">
                         <div className="p-3 bg-primary/10 rounded-full"><HeartHandshake className="h-8 w-8 text-primary"/></div>
                         <p className="text-sm text-muted-foreground">A sua generosidade pode mudar vidas. Apoie uma causa em que acredita.</p>
                         <Button asChild>
                            <Link href="/donations">Ver Projetos e Doar</Link>
                         </Button>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
                <CardDescription>Veja as suas transações mais recentes.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {areTransactionsLoading ? (
                             Array.from({length: 3}).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                </TableRow>
                             ))
                        ) : transactions && transactions.length > 0 ? (
                            transactions.map(tx => (
                                <TableRow key={tx.id}>
                                    <TableCell>{tx.transactionDate ? new Date(tx.transactionDate.seconds * 1000).toLocaleDateString('pt-BR') : 'Pendente'}</TableCell>
                                    <TableCell>{tx.description}</TableCell>
                                    <TableCell>
                                        <Badge variant={tx.type === 'credit' ? 'default' : 'destructive'} className={cn(tx.type === 'credit' ? 'bg-green-600 hover:bg-green-600/80' : 'bg-red-600 hover:bg-red-600/80', 'border-transparent')}>{tx.type}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(tx.amount)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">Ainda não tem transações.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
