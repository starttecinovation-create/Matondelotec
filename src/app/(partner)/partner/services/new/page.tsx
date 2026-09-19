'use client';

import { useFirestore, useUser, errorEmitter, FirestorePermissionError, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { type Service } from '@/lib/types';
import { generateServiceDescription } from '@/ai/flows/service-description-flow';
import { useState, useMemo } from 'react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { getCategoryConfig } from '@/lib/category-helper';

const serviceFormSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
    description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
    price: z.coerce.number().min(0, "O preço não pode ser negativo."),
    duration: z.coerce.number().min(5, "A duração deve ser de pelo menos 5 minutos."),
});

export default function PartnerServiceNewPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const userProfileRef = useMemoFirebase(() => user ? firestore && user ? doc(firestore, 'users', user.uid) : null : null, [firestore, user]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

    const categoryConfig = useMemo(() => {
        return getCategoryConfig(userProfile?.category);
    }, [userProfile?.category]);

    const form = useForm<z.infer<typeof serviceFormSchema>>({
        resolver: zodResolver(serviceFormSchema),
        defaultValues: {
            name: '',
            description: '',
            price: 0,
            duration: 30,
        },
    });

    async function handleGenerateWithAI() {
        if (!aiPrompt.trim() || !userProfile?.category) return;
        setIsGenerating(true);
        try {
            const result = await generateServiceDescription({
                userInput: aiPrompt,
                category: userProfile.category,
            });
            if (result.serviceName && result.serviceDescription) {
                form.setValue('name', result.serviceName);
                form.setValue('description', result.serviceDescription);
                toast({
                    title: "Conteúdo Gerado!",
                    description: "O nome e a descrição foram preenchidos com sucesso."
                });
            } else {
                 toast({
                    variant: 'destructive',
                    title: "Erro da IA",
                    description: "Não foi possível gerar o conteúdo. Tente novamente."
                });
            }
        } catch (error) {
            console.error("Error generating service description:", error);
            toast({
                variant: 'destructive',
                title: "Erro ao Gerar Conteúdo",
                description: "Ocorreu um problema ao comunicar com a IA."
            });
        } finally {
            setIsGenerating(false);
        }
    }

    async function onSubmit(values: z.infer<typeof serviceFormSchema>) {
        if (!user || !firestore) return;

        const serviceCollectionRef = collection(firestore, `users/${user.uid}/services`);
        const newServiceRef = doc(serviceCollectionRef);
        
        const userCategory = userProfile?.category;

        if (!userCategory) {
            toast({
                title: "Erro ao registar",
                description: "A categoria do seu negócio não está definida no seu perfil.",
                variant: "destructive"
            });
            return;
        }
        
        const newServiceData: Omit<Service, 'id'> = {
            ...values,
            vendorId: user.uid,
            category: userCategory,
            imageUrls: [],
            location: { latitude: 0, longitude: 0 }, // Default location
        };

        const batch = writeBatch(firestore);
        batch.set(newServiceRef, {...newServiceData, id: newServiceRef.id});
        
        batch.commit()
            .then(() => {
                toast({
                    title: `${categoryConfig.serviceSingular} Registado(a)!`,
                    description: `O(A) ${categoryConfig.serviceSingular.toLowerCase()} "${values.name}" foi adicionado(a) com sucesso.`
                });
                router.push('/partner/services');
            })
            .catch((e) => {
                 toast({
                    title: "Erro ao registar",
                    description: "Não foi possível guardar as alterações. Tente novamente.",
                    variant: "destructive"
                });
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: newServiceRef.path,
                    operation: 'create',
                    requestResourceData: newServiceData,
                }));
            });
    }
    
    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-2xl mx-auto">
                 <div className="mb-8">
                    <Button variant="ghost" asChild className="mb-4">
                        <Link href="/partner/services"><ArrowLeft className="mr-2"/>Voltar a {categoryConfig.servicePlural}</Link>
                    </Button>
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">Adicionar Novo(a) {categoryConfig.serviceSingular}</h1>
                    <p className="text-muted-foreground mt-2">
                        Preencha os detalhes abaixo para adicionar um(a) novo(a) {categoryConfig.serviceSingular.toLowerCase()} ao seu perfil.
                    </p>
                </div>
                
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <Card>
                             <CardHeader>
                                <CardTitle>Cadastro Inteligente com IA</CardTitle>
                                <p className="text-sm text-muted-foreground">Descreva a sua ideia em poucas palavras e deixe a nossa IA criar um nome e uma descrição para si.</p>
                             </CardHeader>
                             <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ai-prompt">Ideia para o(a) {categoryConfig.serviceSingular.toLowerCase()}</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            id="ai-prompt"
                                            placeholder={categoryConfig.aiPromptPlaceholder} 
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            disabled={isGenerating || isProfileLoading}
                                        />
                                        <Button type="button" onClick={handleGenerateWithAI} disabled={isGenerating || isProfileLoading || !aiPrompt.trim()}>
                                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                            <span className="ml-2 hidden sm:inline">Gerar</span>
                                        </Button>
                                    </div>
                                </div>
                             </CardContent>
                             <CardContent><Separator /></CardContent>
                             <CardContent className="pt-6 space-y-4">
                                 <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Nome do(a) {categoryConfig.serviceSingular}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={`Ex: ${categoryConfig.serviceSingular}`} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Descrição do(a) {categoryConfig.serviceSingular}</FormLabel>
                                        <FormControl>
                                            <Textarea rows={5} placeholder={`Descreva detalhadamente o(a) seu(sua) ${categoryConfig.serviceSingular.toLowerCase()}, o que inclui, etc.`} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>{categoryConfig.priceLabel}</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="duration"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>{categoryConfig.durationLabel}</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={form.formState.isSubmitting || isUserLoading}>
                                    {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : `Adicionar ${categoryConfig.serviceSingular}`}
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </Form>
            </div>
        </div>
    );
}
