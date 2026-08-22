'use client';

import { useDoc, useFirestore, useUser, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { type Service } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { generateServiceDescription } from '@/ai/flows/service-description-flow';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const serviceFormSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
    description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
    price: z.coerce.number().min(0, "O preço não pode ser negativo."),
});

export default function PartnerServiceEditPage({ params }: { params: Promise<{ serviceId: string }> }) {
    const unwrappedParams = use(params);
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const serviceRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `users/${user.uid}/services/${unwrappedParams.serviceId}`);
    }, [firestore, user, unwrappedParams.serviceId]);

    const { data: service, isLoading: isServiceLoading } = useDoc<Service>(serviceRef);

    const form = useForm<z.infer<typeof serviceFormSchema>>({
        resolver: zodResolver(serviceFormSchema),
        defaultValues: {
            name: '',
            description: '',
            price: 0,
        },
    });
    
    useEffect(() => {
        if (service) {
            form.reset({
                name: service.name,
                description: service.description,
                price: service.price,
            });
        }
    }, [service, form]);

    async function handleGenerateWithAI() {
        if (!aiPrompt.trim() || !service) return;
        setIsGenerating(true);
        try {
            const result = await generateServiceDescription({
                userInput: aiPrompt,
                category: service.category,
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
        if (!serviceRef) return;
        
        updateDoc(serviceRef, values)
            .then(() => {
                toast({
                    title: "Serviço Atualizado!",
                    description: `As informações de "${values.name}" foram guardadas com sucesso.`
                });
                router.push('/partner/services');
            })
            .catch((e) => {
                 toast({
                    title: "Erro ao atualizar",
                    description: "Não foi possível guardar as alterações. Tente novamente.",
                    variant: "destructive"
                });
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: serviceRef.path,
                    operation: 'update',
                    requestResourceData: values,
                }));
            });
    }
    
    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-2xl mx-auto">
                 <div className="mb-8">
                    <Button variant="ghost" asChild className="mb-4">
                        <Link href="/partner/services"><ArrowLeft className="mr-2"/>Voltar aos Serviços</Link>
                    </Button>
                    {isServiceLoading ? (
                        <>
                            <Skeleton className="h-10 w-2/3" />
                            <Skeleton className="h-5 w-1/3 mt-2" />
                        </>
                    ) : (
                        <>
                            <h1 className="font-headline text-3xl md:text-4xl font-bold">Editar Serviço</h1>
                            <p className="text-muted-foreground mt-2">
                                Modifique as informações de "{service?.name}".
                            </p>
                        </>
                    )}
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
                                    <Label htmlFor="ai-prompt">Ideia para o serviço</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            id="ai-prompt"
                                            placeholder="Ex: Corte de cabelo masculino com barba" 
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            disabled={isGenerating || isServiceLoading}
                                        />
                                        <Button type="button" onClick={handleGenerateWithAI} disabled={isGenerating || isServiceLoading || !aiPrompt.trim()}>
                                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                            <span className="ml-2 hidden sm:inline">Gerar</span>
                                        </Button>
                                    </div>
                                </div>
                             </CardContent>
                             <CardContent><Separator /></CardContent>
                             <CardContent className="pt-6 space-y-4">
                                 {isServiceLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-20 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                 ) : (
                                 <>
                                     <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Nome do Serviço</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Hotel Baía" {...field} />
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
                                            <FormLabel>Descrição do Serviço</FormLabel>
                                            <FormControl>
                                                <Textarea rows={5} placeholder="Descreva detalhadamente o seu serviço..." {...field} />
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
                                            <FormLabel>Preço Base (em AOA)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                 </>
                                 )}
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={form.formState.isSubmitting || isServiceLoading}>
                                    {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Guardar Alterações"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </Form>
            </div>
        </div>
    );
}
