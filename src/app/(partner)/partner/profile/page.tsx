'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, doc, serverTimestamp, writeBatch, query, getDoc, orderBy } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CircleUser, CreditCard, Edit, Wallet, Landmark } from 'lucide-react';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Skeleton } from '@/components/ui/skeleton';
import type { Transaction, ServiceCategory, SiteSettings } from '@/lib/types';
import { cn } from '@/lib/utils';
import { serviceCategories } from '@/lib/types';
import { categoryDetails } from '@/components/category-icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const profileFormSchema = z.object({
  displayName: z.string().min(1, 'O nome do negócio é obrigatório.'),
  email: z.string().email('Por favor, insira um email válido.'),
  category: z.string().min(1, "A categoria é obrigatória.")
});

const balanceFormSchema = z.object({
  amount: z.coerce.number().positive('O valor deve ser positivo.').min(5, "O valor mínimo para carregar é de 5 USD."),
});


function PayPalPaymentButtons({ amount, rate, fee }: { amount: number, rate: number, fee: number }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    if (!user || !firestore) return null;

    const createOrder = (data: any, actions: any) => {
        return actions.order.create({
            purchase_units: [
                {
                    description: `Carregamento de Saldo Matondelo - ${user.displayName}`,
                    amount: {
                        currency_code: 'USD',
                        value: amount.toFixed(2),
                    },
                },
            ],
        });
    };

    const onApprove = (data: any, actions: any) => {
        return actions.order.capture().then(async (details: any) => {
            if (details.status !== 'COMPLETED') {
                 toast({
                    variant: 'destructive',
                    title: 'Falha no Pagamento',
                    description: 'Não foi possível completar o pagamento. Por favor, tente novamente.',
                });
                return;
            }

            const batch = writeBatch(firestore);
            
            const userProfileRef = firestore && user ? doc(firestore, 'users', user.uid) : null;
            if (!userProfileRef) throw new Error("Referência de perfil inválida");
            const newTransactionRef = doc(collection(firestore, `users/${user.uid}/transactions`));

            const userDoc = await getDoc(userProfileRef);
             if (!userDoc.exists()) {
                throw new Error("Perfil do utilizador não encontrado.");
            }
            const currentBalance = userDoc.data()?.balance || 0;
            
            const amountInAOA = amount * rate;
            const feeAmount = amountInAOA * (fee / 100);
            const finalAmount = amountInAOA - feeAmount;
            
            const newBalance = currentBalance + finalAmount;

            batch.update(userProfileRef as any, { balance: newBalance });
            
            const transactionData = {
                id: newTransactionRef.id,
                userId: user.uid,
                amount: finalAmount,
                type: 'credit',
                description: `Carregamento de saldo via PayPal (ID: ${details.id})`,
                transactionDate: serverTimestamp(),
            };
            batch.set(newTransactionRef, transactionData);


            batch.commit()
                .then(() => {
                    toast({
                        title: 'Pagamento Concluído!',
                        description: `O seu saldo foi atualizado.`,
                    });
                })
                .catch((err) => {
                    toast({
                        variant: 'destructive',
                        title: 'Erro na Captura',
                        description: 'Ocorreu um erro ao finalizar a transação.',
                    });
                    console.error('PayPal onApprove Error:', err);
                     errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: userProfileRef.path,
                        operation: 'update',
                        requestResourceData: { balance: newBalance },
                    }));
                });

        }).catch((err: any) => {
             toast({
                variant: 'destructive',
                title: 'Erro na Captura',
                description: 'Ocorreu um erro ao finalizar a transação.',
            });
            console.error('PayPal onApprove Error:', err);
        });
    };

    return (
        <PayPalButtons
            style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' }}
            createOrder={createOrder}
            onApprove={onApprove}
            forceReRender={[amount, rate, fee]}
            disabled={!amount || amount < 5}
        />
    );
}

export default function PartnerProfilePage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const userProfileRef = useMemoFirebase(() => user ? firestore && user ? doc(firestore, 'users', user.uid) : null : null, [firestore, user]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'monetization') : null, [firestore]);
    const { data: siteSettings, isLoading: areSettingsLoading } = useDoc<SiteSettings>(settingsRef);
    
    const transactionsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/transactions`), orderBy('transactionDate', 'desc'));
    }, [firestore, user]);
    
    const { data: transactions, isLoading: areTransactionsLoading } = useCollection<Transaction>(transactionsQuery);

    const sortedTransactions = React.useMemo(() => {
        if (!transactions) return [];
        return [...transactions].sort((a, b) => (b.transactionDate?.seconds || 0) - (a.transactionDate?.seconds || 0));
    }, [transactions]);

    const profileForm = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        values: {
            displayName: userProfile?.displayName || '',
            email: user?.email || '',
            category: userProfile?.category || '',
        },
        reValidateMode: 'onChange',
    });
    
    React.useEffect(() => {
        if (userProfile) {
            profileForm.reset({
                displayName: userProfile.displayName,
                email: user?.email || '',
                category: userProfile.category,
            });
        }
    }, [userProfile, user, profileForm]);

    const balanceForm = useForm<z.infer<typeof balanceFormSchema>>({
        resolver: zodResolver(balanceFormSchema),
        defaultValues: { amount: 10 },
    });

    const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
        if (!user || !userProfileRef || !firestore) return;
        
        const batch = writeBatch(firestore);
        
        if (user.displayName !== values.displayName) {
            await updateProfile(user, { displayName: values.displayName });
        }
        
        const updateData = {
            displayName: values.displayName,
            category: values.category,
        };
        batch.update(userProfileRef, updateData);

        batch.commit()
            .then(() => {
                toast({
                    title: 'Perfil Atualizado!',
                    description: 'As informações do seu negócio foram guardadas.',
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
    
    const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const amountToCharge = balanceForm.watch('amount');
    const conversionRate = siteSettings?.paypalUsdToAoaRate || 850;
    const processingFee = siteSettings?.paypalProcessingFee || 0;


    const avatarImage = PlaceHolderImages.find(img => img.id === 'avatar-1');

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">Perfil do Negócio</h1>
                    <p className="text-muted-foreground mt-2">
                        Gira as informações do seu negócio, saldo e transações.
                    </p>
                </div>

                <Card>
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                            <CardHeader>
                                <CardTitle>Informações do Negócio</CardTitle>
                                <CardDescription>Mantenha os dados do seu negócio atualizados.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20">
                                        {avatarImage && <AvatarImage src={user?.photoURL || avatarImage.imageUrl} alt="User Avatar" data-ai-hint={avatarImage.imageHint} />}
                                        <AvatarFallback><CircleUser className="h-10 w-10" /></AvatarFallback>
                                    </Avatar>
                                    <Button variant="outline" type="button" disabled><Edit className="mr-2 h-4 w-4" />Alterar logo (brevemente)</Button>
                                </div>
                                {isProfileLoading ? <Skeleton className="h-48 w-full" /> : (
                                    <>
                                        <FormField
                                            control={profileForm.control}
                                            name="displayName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nome do Negócio</FormLabel>
                                                    <FormControl><Input placeholder="O nome do seu negócio" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={profileForm.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Categoria do Negócio</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value} disabled={profileForm.formState.isSubmitting}>
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
                                                                )
                                                            })}
                                                        </SelectContent>
                                                    </Select>
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

                <Card>
                    <CardHeader>
                        <CardTitle>Saldo Virtual</CardTitle>
                        <CardDescription>O seu saldo para operações na plataforma.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4 p-6 border rounded-lg bg-background">
                            <div className="p-3 bg-primary/10 rounded-full"><Wallet className="h-8 w-8 text-primary" /></div>
                            <div>
                                <p className="text-sm text-muted-foreground">Saldo Atual</p>
                                {isProfileLoading ? <Skeleton className="h-9 w-40 mt-1" /> :
                                    <p className="text-3xl font-bold">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(userProfile?.balance || 0)}</p>
                                }
                            </div>
                        </div>

                        <Form {...balanceForm}>
                           <form>
                                <FormField
                                    control={balanceForm.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-base font-medium">Carregar com PayPal (USD)</FormLabel>
                                            <div className="mt-2 flex items-center gap-4">
                                                <FormControl>
                                                    <Input type="number" placeholder="Ex: 10.00" className="max-w-xs" {...field} />
                                                </FormControl>
                                                <p className="text-sm text-muted-foreground">Valor em USD</p>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                           </form>
                        </Form>

                        {paypalClientId && !areSettingsLoading ? (
                            <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "USD", intent: "capture" }}>
                                <PayPalPaymentButtons amount={amountToCharge} rate={conversionRate} fee={processingFee} />
                            </PayPalScriptProvider>
                        ) : areSettingsLoading ? (
                            <Skeleton className="h-12 w-full" />
                        ) : (
                            <p className="text-sm text-destructive">A chave de cliente do PayPal não está configurada. Pagamentos desativados.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Outros Métodos (Manuais)</CardTitle>
                        <CardDescription>Para carregar o seu saldo ou solicitar levantamentos usando outros métodos.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <Landmark className="h-4 w-4" />
                            <AlertTitle>Pagamentos e Levantamentos Manuais</AlertTitle>
                            <AlertDescription>
                                De momento, as operações com Redotpay (USDT), Unitel Money, Afrimoney, Multicaixa Express, BAI Paga, Airtm, depósito bancário, ou dinheiro vivo são processadas manualmente pela nossa equipa.
                                <br /><br />
                                Para prosseguir, por favor, entre em contacto com o nosso suporte através do email <a href="mailto:pagamentos@matondelo.co.ao" className="font-semibold underline">pagamentos@matondelo.co.ao</a> com o assunto "Carregamento de Saldo" ou "Levantamento de Fundos" e receberá todas as instruções.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

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
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : sortedTransactions.length > 0 ? (
                                    sortedTransactions.map(tx => (
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
