'use client';

import { useDoc, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { PageContent } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { usePartner } from '@/context/partner-context';

const pageContentSchema = z.object({
    title: z.string().min(1, "O título é obrigatório."),
    headline: z.string().min(1, "A manchete é obrigatória."),
    paragraphs: z.array(z.object({
        value: z.string().min(1, "O parágrafo não pode estar vazio."),
    })).min(1, "É necessário pelo menos um parágrafo."),
});

type PageContentFormValues = z.infer<typeof pageContentSchema>;

export default function ContentManagementPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { isAdmin } = usePartner();

    // For now, we hardcode editing the 'about' page.
    const contentRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_content', 'about') : null, [firestore]);
    const { data: content, isLoading } = useDoc<PageContent>(contentRef);

    const form = useForm<PageContentFormValues>({
        resolver: zodResolver(pageContentSchema),
        defaultValues: {
            title: '',
            headline: '',
            paragraphs: [{ value: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "paragraphs",
    });

    useEffect(() => {
        if (content) {
            form.reset({
                title: content.title,
                headline: content.headline,
                paragraphs: content.paragraphs.map(p => ({ value: p })),
            });
        }
    }, [content, form]);

    async function onSubmit(values: PageContentFormValues) {
        if (!contentRef) return;
        
        const dataToSave: Omit<PageContent, 'id'> = {
            title: values.title,
            headline: values.headline,
            paragraphs: values.paragraphs.map(p => p.value),
        };

        setDoc(contentRef, dataToSave, { merge: true })
            .then(() => {
                toast({
                    title: "Conteúdo Atualizado!",
                    description: `A página "Sobre" foi guardada com sucesso.`
                });
            })
            .catch((e) => {
                toast({
                    title: "Erro ao atualizar",
                    description: "Não foi possível guardar as alterações. Tente novamente.",
                    variant: "destructive"
                });
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: contentRef.path,
                    operation: 'update',
                    requestResourceData: dataToSave,
                }));
            });
    }

    const { isSubmitting } = form.formState;

    if (!isAdmin) {
        return (
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-3xl mx-auto">
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
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-3xl mx-auto">
                 <div className="mb-8">
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">Gestão de Conteúdo</h1>
                    <p className="text-muted-foreground mt-2">
                        Edite o conteúdo das páginas do seu site.
                    </p>
                </div>
                
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <Card>
                             <CardHeader>
                                <CardTitle>Editar Página "Sobre"</CardTitle>
                             </CardHeader>
                             <CardContent className="pt-6 space-y-6">
                                 {isLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-20 w-full" />
                                    </div>
                                 ) : (
                                 <>
                                     <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Título Principal</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Sobre a Matondelo" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="headline"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Subtítulo / Manchete</FormLabel>
                                            <FormControl>
                                                <Input placeholder="A nossa missão..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div>
                                        <FormLabel>Parágrafos</FormLabel>
                                        <div className="mt-2 space-y-4">
                                            {fields.map((field, index) => (
                                                 <FormField
                                                    key={field.id}
                                                    control={form.control}
                                                    name={`paragraphs.${index}.value`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <div className="flex items-start gap-2">
                                                                 <FormControl>
                                                                    <Textarea rows={4} placeholder={`Parágrafo ${index + 1}...`} {...field} />
                                                                </FormControl>
                                                                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                            <Button type="button" variant="outline" size="sm" onClick={() => append({ value: "" })}>
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Adicionar Parágrafo
                                            </Button>
                                        </div>
                                    </div>
                                 </>
                                 )}
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={isSubmitting || isLoading}>
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
