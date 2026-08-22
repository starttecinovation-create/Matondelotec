'use client';

import { useCollection, useDoc, useFirestore, useUser, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, deleteDoc, writeBatch, query } from 'firebase/firestore';
import { type Service, type Product } from '@/lib/types';
import { Card, CardDescription, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import React, { use } from 'react';

const productFormSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
    description: z.string().optional(),
    price: z.coerce.number().positive("O preço deve ser um valor positivo."),
    imageUrl: z.string().url("Por favor, insira um URL de imagem válido.").optional().or(z.literal('')),
});


function ProductForm({ serviceId }: { serviceId: string }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof productFormSchema>>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: '',
            description: '',
            price: 0,
            imageUrl: '',
        },
    });

    async function onSubmit(values: z.infer<typeof productFormSchema>) {
        if (!user || !firestore) return;

        const newProductRef = doc(collection(firestore, `users/${user.uid}/services/${serviceId}/products`));
        
        const newProductData: Product = {
          ...values,
          id: newProductRef.id,
          vendorId: user.uid,
        }

        const batch = writeBatch(firestore);
        batch.set(newProductRef, newProductData);
        batch.commit()
            .then(() => {
                toast({
                    title: "Produto Adicionado!",
                    description: `O produto "${values.name}" foi adicionado ao seu catálogo.`
                });
                form.reset();
            })
            .catch((e) => {
                 toast({
                    title: "Erro ao adicionar produto",
                    description: "Não foi possível adicionar o produto. Tente novamente.",
                    variant: "destructive"
                });
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: newProductRef.path,
                    operation: 'create',
                    requestResourceData: newProductData,
                }));
            });
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Adicionar Novo Produto</CardTitle>
                <CardDescription>Preencha os detalhes do novo produto para o seu catálogo.</CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
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
                                    <Input type="number" placeholder="Ex: 8500" {...field} />
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
                                    <Textarea placeholder="Descreva o produto, materiais, tamanhos disponíveis, etc." {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "A adicionar..." : "Adicionar Produto"}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}

function ProductList({ products, serviceId }: { products: Product[], serviceId: string }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    
    const handleDelete = (productId: string) => {
        if (!firestore || !user) return;
        const productRef = doc(firestore, `users/${user.uid}/services/${serviceId}/products/${productId}`);
        
        deleteDoc(productRef)
            .then(() => {
                toast({
                    title: "Produto Removido!",
                    description: "O produto foi removido do seu catálogo."
                });
            })
            .catch((error) => {
                toast({
                    variant: 'destructive',
                    title: "Erro ao remover",
                    description: "Não foi possível remover o produto."
                });
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: productRef.path,
                    operation: 'delete',
                }));
            });
    };
    
    if (products.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Lista de Produtos</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Imagem</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Preço</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map(product => (
                             <TableRow key={product.id}>
                                <TableCell>
                                    <div className="relative h-12 w-12 rounded-md overflow-hidden border">
                                        {product.imageUrl ? (
                                            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                        ) : (
                                            <div className="h-full w-full bg-muted"></div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)}</TableCell>
                                <TableCell className="text-right space-x-2">
                                     <Button variant="outline" size="sm" asChild>
                                        <Link href={`/partner/services/${serviceId}/products/${product.id}/edit`}>
                                            <Pencil className="h-3 w-3" />
                                        </Link>
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta ação não pode ser desfeita. Isto irá remover permanentemente o produto do seu catálogo.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(product.id)}>
                                                    Sim, Remover
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}


export default function PartnerProductManagementPage({ params }: { params: Promise<{ serviceId: string }> }) {
    const unwrappedParams = use(params);
    const { user } = useUser();
    const firestore = useFirestore();

    const serviceRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `users/${user.uid}/services/${unwrappedParams.serviceId}`);
    }, [firestore, user, unwrappedParams.serviceId]);

    const { data: service, isLoading: isServiceLoading } = useDoc<Service>(serviceRef);
    
    const productsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/services/${unwrappedParams.serviceId}/products`));
    }, [firestore, user, unwrappedParams.serviceId]);

    const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-4xl mx-auto space-y-8">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                         <Button variant="ghost" asChild>
                            <Link href="/partner/services"><ArrowLeft className="mr-2"/>Voltar aos Serviços</Link>
                        </Button>
                         <Button variant="outline" asChild>
                            <Link href={`/partner/services/${unwrappedParams.serviceId}/edit`}><Pencil className="mr-2"/>Editar Serviço</Link>
                        </Button>
                    </div>
                    {isServiceLoading ? (
                        <Skeleton className="h-10 w-2/3" />
                    ) : (
                         <h1 className="font-headline text-3xl md:text-4xl font-bold">Gerir Catálogo de "{service?.name}"</h1>
                    )}
                    <p className="text-muted-foreground mt-2">
                        Adicione e gira os produtos disponíveis neste serviço.
                    </p>
                </div>
                
                {areProductsLoading ? (
                    <Skeleton className="h-80 w-full" />
                ) : (
                    <ProductList products={products || []} serviceId={unwrappedParams.serviceId} />
                )}

                <ProductForm serviceId={unwrappedParams.serviceId} />

            </div>
        </div>
    );
}
