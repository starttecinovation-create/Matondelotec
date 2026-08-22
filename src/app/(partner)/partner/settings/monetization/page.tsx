'use client';

import { useDoc, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { SiteSettings } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { Loader2, DollarSign, Key, Settings } from 'lucide-react';
import { usePartner } from '@/context/partner-context';

const monetizationSchema = z.object({
    subscriptionPrice: z.coerce.number().min(0, "O preço não pode ser negativo."),
    paypalUsdToAoaRate: z.coerce.number().positive("A taxa de conversão deve ser positiva."),
    paypalProcessingFee: z.coerce.number().min(0).max(100, "A taxa deve ser entre 0 e 100."),
    multicaixaPublicKey: z.string().optional(),
    multicaixaApiToken: z.string().optional(),
});

type MonetizationFormValues = z.infer<typeof monetizationSchema>;

export default function MonetizationSettingsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { isAdmin } = usePartner();

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'monetization') : null, [firestore]);
    const { data: settings, isLoading } = useDoc<SiteSettings>(settingsRef);

    const form = useForm<MonetizationFormValues>({
        resolver: zodResolver(monetizationSchema),
        defaultValues: {
            subscriptionPrice: 0,
            paypalUsdToAoaRate: 850,
            paypalProcessingFee: 5,
            multicaixaPublicKey: '',
            multicaixaApiToken: '',
        },
    });

    useEffect(() => {
        if (settings) {
            form.reset({
                subscriptionPrice: settings.subscriptionPrice,
                paypalUsdToAoaRate: settings.paypalUsdToAoaRate,
                paypalProcessingFee: settings.paypalProcessingFee,
                multicaixaPublicKey: settings.multicaixaPublicKey || '',
                multicaixaApiToken: settings.multicaixaApiToken || '',
            });
        }
    }, [settings, form]);

    async function onSubmit(values: MonetizationFormValues) {
        if (!settingsRef) return;
        
        setDoc(settingsRef, values, { merge: true })
            .then(() => {
                toast({
                    title: "Configurações Atualizadas!",
                    description: `As definições de monetização foram guardadas.`
                });
            })
            .catch((e) => {
                 toast({
                    title: "Erro ao atualizar",
                    description: "Não foi possível guardar as alterações. Tente novamente.",
                    variant: "destructive"
                });
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: settingsRef.path,
                    operation: 'update',
                    requestResourceData: values,
                }));
            });
    }

    const { isSubmitting } = form.formState;

    if (!isAdmin) {
        return (
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Acesso Negado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Não tem permissão para aceder a esta página.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-2xl mx-auto">
                 <div className="mb-8">
                    <h1 className="font-headline text-3xl md:text-4xl font-bold flex items-center gap-2">
                        <Settings />
                        Configurações de Monetização
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Gira as definições globais de preços, taxas e integrações de pagamento da plataforma.
                    </p>
                </div>
                
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="space-y-8">
                            <Card>
                                 <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><DollarSign />Preços e Taxas</CardTitle>
                                 </CardHeader>
                                 <CardContent className="space-y-6">
                                     {isLoading ? (
                                        <div className="space-y-4">
                                            <Skeleton className="h-16 w-full" />
                                            <Skeleton className="h-16 w-full" />
                                        </div>
                                     ) : (
                                     <>
                                         <FormField
                                            control={form.control}
                                            name="subscriptionPrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Preço da Mensalidade do Parceiro (AOA)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="25000" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="paypalUsdToAoaRate"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Taxa de Conversão (USD para AOA)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="850" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="paypalProcessingFee"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Taxa de Processamento PayPal (%)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="5" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                     </>
                                     )}
                                 </CardContent>
                            </Card>

                             <Card>
                                 <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Key />APIs de Pagamento</CardTitle>
                                 </CardHeader>
                                 <CardContent className="space-y-6">
                                     {isLoading ? (
                                        <div className="space-y-4">
                                            <Skeleton className="h-16 w-full" />
                                            <Skeleton className="h-16 w-full" />
                                        </div>
                                     ) : (
                                     <>
                                         <FormField
                                            control={form.control}
                                            name="multicaixaPublicKey"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Chave Pública Multicaixa Express</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Cole a sua chave pública aqui" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="multicaixaApiToken"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Token da API Multicaixa Express</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Cole o seu token da API aqui" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                     </>
                                     )}
                                 </CardContent>
                                <CardFooter className="border-t pt-6">
                                    <Button type="submit" disabled={isSubmitting || isLoading}>
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Guardar Configurações"}
                                    </Button>
                                </CardFooter>
                            </Card>

                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
}
