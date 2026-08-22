'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, query, orderBy, getDocs, where, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Announcement } from '@/lib/types';
import { Card, CardDescription, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Megaphone, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { usePartner } from '@/context/partner-context';

const announcementSchema = z.object({
  message: z.string().min(10, 'A mensagem deve ter pelo menos 10 caracteres.'),
  link: z.string().url('Por favor, insira um URL válido.').optional().or(z.literal('')),
});

function AnnouncementForm() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof announcementSchema>>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      message: '',
      link: '',
    },
  });

  async function onSubmit(values: z.infer<typeof announcementSchema>) {
    if (!user || !firestore) return;

    const newAnnouncementRef = doc(collection(firestore, 'announcements'));
    
    const newAnnouncementData = {
      ...values,
      id: newAnnouncementRef.id,
      isActive: false, // Always created as inactive
      createdAt: serverTimestamp(),
    };

    writeBatch(firestore).set(newAnnouncementRef, newAnnouncementData).commit()
      .then(() => {
        toast({
          title: 'Anúncio Criado!',
          description: 'O anúncio foi guardado. Ative-o para o mostrar aos utilizadores.',
        });
        form.reset();
      })
      .catch((e) => {
        toast({
          title: 'Erro ao criar anúncio',
          description: 'Não foi possível guardar o anúncio. Tente novamente.',
          variant: 'destructive',
        });
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: newAnnouncementRef.path,
          operation: 'create',
          requestResourceData: newAnnouncementData,
        }));
      });
  }

  const { isSubmitting } = form.formState;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Novo Anúncio</CardTitle>
        <CardDescription>Crie uma nova barra de anúncio para o site.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem do Anúncio</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Nova coleção de verão já disponível!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://matondelo.com/servicos/nova-colecao" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Criar Anúncio'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function AnnouncementItem({ announcement }: { announcement: Announcement }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const toggleActive = async (isActive: boolean) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'announcements', announcement.id);
    const updateData = { isActive };
    try {
        if (isActive) {
            // Deactivate all other announcements first
            const q = query(collection(firestore, 'announcements'), where('isActive', '==', true));
            const activeDocs = await getDocs(q);
            const batch = writeBatch(firestore);
            activeDocs.forEach(activeDoc => {
                batch.update(activeDoc.ref, { isActive: false });
            });
            batch.update(docRef, updateData);
            await batch.commit();
        } else {
            await updateDoc(docRef, updateData);
        }
      toast({ title: 'Estado atualizado!' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar.' });
      errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: updateData,
      }));
    }
  };

  const handleDelete = async () => {
    if (!firestore) return;
    const docRef = doc(firestore, 'announcements', announcement.id);
    deleteDoc(docRef)
        .then(() => {
            toast({ title: 'Anúncio removido!' });
        })
        .catch(e => {
            toast({ variant: 'destructive', title: 'Erro ao remover anúncio.' });
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: docRef.path,
                operation: 'delete',
            }));
        });
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="flex-1 space-y-1">
        <p className="font-medium">{announcement.message}</p>
        {announcement.link && <p className="text-sm text-muted-foreground truncate">{announcement.link}</p>}
      </div>
      <div className="flex items-center gap-4">
         <Badge variant={announcement.isActive ? 'default' : 'outline'} className={announcement.isActive ? 'bg-green-600' : ''}>
          {announcement.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
        <div className="flex items-center space-x-2">
            <Switch
                checked={announcement.isActive}
                onCheckedChange={toggleActive}
                aria-label="Ativar anúncio"
            />
        </div>
        <Button size="icon" variant="ghost" className="text-destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const firestore = useFirestore();
  const { isAdmin } = usePartner();

  const announcementsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'announcements'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: announcements, isLoading } = useCollection<Announcement>(announcementsQuery);

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
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
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Megaphone /> Gestão de Anúncios
          </h1>
          <p className="text-muted-foreground mt-2">
            Crie e gira as barras de anúncio que aparecem no topo do site. Só pode haver um anúncio ativo de cada vez.
          </p>
        </div>

        <AnnouncementForm />

        <Card>
            <CardHeader>
                <CardTitle>Anúncios Criados</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {isLoading ? (
                    <>
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    </>
                ) : announcements && announcements.length > 0 ? (
                    announcements.map((ann) => <AnnouncementItem key={ann.id} announcement={ann} />)
                ) : (
                    <p className="text-center text-sm text-muted-foreground py-8">Nenhum anúncio criado.</p>
                )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
