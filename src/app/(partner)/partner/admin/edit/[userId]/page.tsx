'use client';

import React, { useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, updateDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { serviceCategories } from '@/lib/types';
import { categoryDetails } from '@/components/category-icon';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

const userEditSchema = z.object({
  displayName: z.string().min(1, 'O nome é obrigatório.'),
  role: z.enum(['user', 'vendor', 'driver', 'admin']),
  balance: z.coerce.number().min(0, "O saldo não pode ser negativo."),
  verificationStatus: z.enum(['pending', 'approved', 'rejected']),
  category: z.string().optional(),
  location: z.object({
      country: z.string().min(1, "O país é obrigatório."),
      province: z.string().min(1, "A província é obrigatória."),
      city: z.string().min(1, "A cidade é obrigatória."),
      district: z.string().optional(),
      commune: z.string().optional(),
  })
});

export default function AdminUserEditPage({ params }: { params: Promise<{ userId: string }> }) {
    const unwrappedParams = use(params);
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => 
        firestore ? doc(firestore, 'users', unwrappedParams.userId) : null, 
    [firestore, unwrappedParams.userId]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
    
    const form = useForm<z.infer<typeof userEditSchema>>({
        resolver: zodResolver(userEditSchema),
        defaultValues: {
            displayName: '',
            role: 'user',
            balance: 0,
            verificationStatus: 'pending',
            category: '',
            location: {
                country: '',
                province: '',
                city: '',
                district: '',
                commune: '',
            }
        },
    });

    useEffect(() => {
        if (userProfile) {
            form.reset({
                displayName: userProfile.displayName,
                role: userProfile.role,
                balance: userProfile.balance,
                verificationStatus: userProfile.verificationStatus || 'pending',
                category: userProfile.category || '',
                location: {
                    country: userProfile.location?.country || 'Angola',
                    province: userProfile.location?.province || '',
                    city: userProfile.location?.city || '',
                    district: userProfile.location?.district || '',
                    commune: userProfile.location?.commune || '',
                }
            });
        }
    }, [userProfile, form]);
    
    const { isSubmitting } = form.formState;

    const onProfileSubmit = (values: z.infer<typeof userEditSchema>) => {
        if (!userProfileRef) return;
        
        updateDoc(userProfileRef, values)
            .then(() => {
                toast({
                    title: 'Perfil Atualizado!',
                    description: `As informações de ${values.displayName} foram guardadas com sucesso.`,
                });
                router.push('/partner/admin');
            })
            .catch ((error: any) => {
                 console.error("Admin profile update error:", error);
                toast({
                    variant: 'destructive',
                    title: 'Erro ao Atualizar',
                    description: 'Não foi possível guardar as alterações. Verifique as suas permissões.',
                });
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: userProfileRef.path,
                    operation: 'update',
                    requestResourceData: values,
                }));
            });
    };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
            <Button asChild variant="ghost" className="mb-4">
                <Link href="/partner/admin">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para a lista
                </Link>
            </Button>
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Editar Utilizador</h1>
          {isProfileLoading ? (
            <Skeleton className="h-6 w-1/2 mt-2" />
          ) : (
             <p className="text-muted-foreground mt-2">
                A modificar o perfil de <span className="font-semibold text-foreground">{userProfile?.displayName}</span>.
             </p>
          )}
        </div>

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onProfileSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Informações do Perfil</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isProfileLoading ? (
                             <div className="space-y-4">
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                        ) : (
                        <>
                        <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nome Completo / Negócio</FormLabel>
                                <FormControl>
                                    <Input placeholder="Nome do utilizador ou negócio" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Função</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="user">Utilizador</SelectItem>
                                        <SelectItem value="vendor">Vendedor</SelectItem>
                                        <SelectItem value="driver">Motorista</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="verificationStatus"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Estado de Verificação</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                     <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="pending">Pendente</SelectItem>
                                        <SelectItem value="approved">Aprovado</SelectItem>
                                        <SelectItem value="rejected">Rejeitado</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Categoria (para Vendedores)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                     <FormControl><SelectTrigger><SelectValue placeholder="Nenhuma"/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {serviceCategories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{categoryDetails[cat]?.label || cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="balance"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Saldo (AOA)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Separator />
                        <h3 className="text-lg font-medium">Localização</h3>

                         <FormField
                            control={form.control}
                            name="location.country"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>País</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="location.province"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Província</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="location.city"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Cidade</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="location.district"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Distrito (Opcional)</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                               <FormField
                                control={form.control}
                                name="location.commune"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Comuna (Opcional)</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                         </div>
                        </>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSubmitting || isProfileLoading}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'A guardar...' : 'Guardar Alterações'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
      </div>
    </div>
  );
}
