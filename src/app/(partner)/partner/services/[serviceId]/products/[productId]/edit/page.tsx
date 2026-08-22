'use client';

import { useDoc, useFirestore, useUser, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { type Product } from '@/lib/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect, use } from 'react';

const productFormSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
    description: z.string().optional(),
    price: z.coerce.number().positive("O preço deve ser um valor positivo."),
    imageUrl: z.string().url("Por favor, insira um URL de imagem válido.").optional().or(z.literal('')),
});

export default function PartnerProductEditPage({ params }: { params: Promise<{ serviceId: string, productId: string }> }) {
    const unwrappedParams = use(params);
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const productRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `users/${user.uid}/services/${unwrappedParams.serviceId}/products/${unwrappedParams.productId}`);
    }, [firestore, user, unwrappedParams.serviceId, unwrappedParams.productId]);

    const { data: product, isLoading: isProductLoading } = useDoc<Product>(productRef);

    const form = useForm<z.infer<typeof productFormSchema>>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: '',
            description: '',
            price: 0,
            imageUrl: '',
        },
    });
    
    useEffect(() => {
        if (product) {
            form.reset({
                name: product.name,
                description: product.description || '',
                price: product.price,
                imageUrl: product.imageUrl || '',
            });
        }
    }, [product, form]);
    
    const { isSubmitting } = form.formState;

    async function onSubmit(values: z.infer<typeof productFormSchema>) {
        if (!productRef) return;

        updateDoc(productRef, values)
            .then(() => {
                toast({
                    title: "Produto Atualizado!",
                    description: `As informações de "${values.name}" foram guardadas com sucesso.`
                });
                router.push(`/partner/services/${unwrappedParams.serviceId}`);
            })
            .catch((e) => {
                 toast({
                    title: "Erro ao atualizar",
                    description: "Não foi possível guardar as alterações. Tente novamente.",
                    variant: "destructive"
                });
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: productRef.path,
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
                        <Link href={`/partner/services/${unwrappedParams.serviceId}`}><ArrowLeft className="mr-2"/>Voltar ao Catálogo</Link>
                    </Button>
                    {isProductLoading ? (
                        <>
                            <Skeleton className="h-10 w-2/3" />
                            <Skeleton className="h-5 w-1/3 mt-2" />
                        </>
                    ) : (
                        <>
                            <h1 className="font-headline text-3xl md:text-4xl font-bold">Editar Produto</h1>
                            <p className="text-muted-foreground mt-2">
                                Modifique as informações de "{product?.name}".
                            </p>
                        </>
                    )}
                </div>
                
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <Card>
                             <CardContent className="pt-6 space-y-4">
                                 {isProductLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-16 w-full" />
                                        <Skeleton className="h-16 w-full" />
                                        <Skeleton className="h-24 w-full" />
                                        <Skeleton className="h-16 w-full" />
                                    </div>
                                 ) : (
                                 <>
                                     <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Nome do Produto</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: T-shirt Personalizada" {...field} />
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
                                            <FormLabel>Preço (em AOA)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>URL da Imagem do Produto</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://exemplo.com/imagem.png" {...field} />
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
                                            <FormLabel>Descrição</FormLabel>
                                            <FormControl>
                                                <Textarea rows={4} placeholder="Descreva o produto..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                 </>
                                 )}
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={isSubmitting || isProductLoading}>
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Guardar Alterações"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </Form>
            </div>
        </div>
    );
}
