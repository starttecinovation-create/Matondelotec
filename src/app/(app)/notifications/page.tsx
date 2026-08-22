'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import type { Notification as NotificationType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { BellRing, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

function NotificationItem({ notification }: { notification: NotificationType }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleMarkAsRead = () => {
        if (!firestore) return;
        const notifRef = doc(firestore, `users/${notification.userId}/notifications/${notification.id}`);
        const updateData = { status: 'read' };
        
        updateDoc(notifRef, updateData)
            .catch(error => {
                console.error("Error marking notification as read: ", error);
                toast({
                    variant: 'destructive',
                    title: 'Erro',
                    description: 'Não foi possível marcar a notificação como lida.',
                });
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: notifRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                }));
            });
    };

    return (
        <Card className={cn("transition-all", notification.status === 'unread' && "bg-primary/5 border-primary/20")}>
            <CardContent className="p-4 flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-full mt-1">
                    <BellRing className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-grow">
                    <p className="text-sm text-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                         {new Date(notification.createdAt.seconds * 1000).toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                {notification.status === 'unread' && (
                    <Button variant="ghost" size="sm" onClick={handleMarkAsRead} className="text-muted-foreground">
                        <Check className="w-4 h-4 mr-1" />
                        Marcar como lida
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

export default function NotificationsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const notificationsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, `users/${user.uid}/notifications`),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const { data: notifications, isLoading } = useCollection<NotificationType>(notificationsQuery);

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">Notificações</h1>
                    <p className="text-muted-foreground mt-2">
                        Acompanhe todas as atualizações sobre as suas reservas e conta.
                    </p>
                </div>

                <div className="space-y-4">
                    {isLoading ? (
                        <>
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </>
                    ) : notifications && notifications.length > 0 ? (
                        notifications.map(notification => (
                            <NotificationItem key={notification.id} notification={notification} />
                        ))
                    ) : (
                        <div className="text-center py-16 border rounded-lg bg-card">
                            <h2 className="text-xl font-semibold">Nenhuma notificação por agora</h2>
                            <p className="text-muted-foreground mt-2">As suas notificações aparecerão aqui.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
