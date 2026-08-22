'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collectionGroup, query, where, orderBy, writeBatch, doc as firestoreDoc, getDoc, collection, serverTimestamp } from 'firebase/firestore';
import { type Booking, type UserProfile } from '@/lib/types';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';


function BookingItem({ booking }: { booking: Booking }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const clientUserRef = useMemoFirebase(() => {
        if (!firestore || !booking.userId) return null;
        return doc(firestore, 'users', booking.userId);
    }, [firestore, booking.userId]);

    const { data: client, isLoading: isClientLoading } = useDoc<UserProfile>(clientUserRef);
    
    const handleUpdateStatus = async (newStatus: 'Confirmada' | 'Cancelada') => {
        if (!firestore) return;
        setIsLoading(true);

        const bookingDocRef = firestoreDoc(firestore, `users/${booking.userId}/bookings/${booking.id}`);
        const batch = writeBatch(firestore);
        
        try {
            batch.update(bookingDocRef, { status: newStatus });
            
            // If cancelling, we should refund the client and debit the vendor
            if (newStatus === 'Cancelada' && clientUserRef) {
                const serviceDocRef = firestoreDoc(firestore, booking.serviceId);
                const [serviceDoc, clientDoc, vendorDoc] = await Promise.all([
                    getDoc(serviceDocRef),
                    getDoc(clientUserRef),
                    getDoc(firestoreDoc(firestore, 'users', booking.vendorId))
                ]);

                if (serviceDoc.exists() && clientDoc.exists() && vendorDoc.exists()) {
                    const servicePrice = serviceDoc.data().price;
                    const clientProfile = clientDoc.data() as UserProfile;
                    const vendorProfile = vendorDoc.data() as UserProfile;

                    // Refund client
                    batch.update(clientUserRef, { balance: clientProfile.balance + servicePrice });
                    // Debit vendor
                    batch.update(vendorDoc.ref, { balance: vendorProfile.balance - servicePrice });

                    // Create transactions for audit
                    const clientTransactionRef = firestoreDoc(collection(firestore, `users/${clientProfile.id}/transactions`));
                    batch.set(clientTransactionRef, {
                        id: clientTransactionRef.id,
                        userId: clientProfile.id,
                        amount: servicePrice,
                        type: 'credit',
                        description: `Reembolso da reserva cancelada: ${booking.serviceName}`,
                        transactionDate: serverTimestamp(),
                    });

                     const vendorTransactionRef = firestoreDoc(collection(firestore, `users/${vendorProfile.id}/transactions`));
                    batch.set(vendorTransactionRef, {
                        id: vendorTransactionRef.id,
                        userId: vendorProfile.id,
                        amount: servicePrice,
                        type: 'debit',
                        description: `Estorno da reserva cancelada: ${booking.serviceName}`,
                        transactionDate: serverTimestamp(),
                    });
                }
            }
            
            await batch.commit();

            toast({
                title: 'Reserva Atualizada!',
                description: `A reserva foi marcada como ${newStatus}.`
            });
        } catch (error) {
            console.error("Error updating booking status: ", error);
            toast({
                variant: "destructive",
                title: 'Erro!',
                description: 'Não foi possível atualizar o estado da reserva.'
            });
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: bookingDocRef.path,
                operation: 'update',
                requestResourceData: { status: newStatus },
            }));
        } finally {
            setIsLoading(false);
        }
    }
    
    if (isClientLoading) {
        return <Skeleton className="h-28 w-full" />;
    }

    const isPending = booking.status === 'Pendente';

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{booking.serviceName}</CardTitle>
                        <CardDescription>
                            Reserva para: {new Date(booking.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </CardDescription>
                    </div>
                     <Badge variant={booking.status === 'Confirmada' ? 'default' : booking.status === 'Pendente' ? 'secondary' : 'destructive'} className={booking.status === 'Confirmada' ? 'bg-green-600' : ''}>
                        {booking.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm font-medium">Cliente: {client?.displayName || 'A carregar...'}</p>
                <p className="text-sm text-muted-foreground">Email: {client?.email}</p>
                <div className="flex gap-2 mt-4">
                    <Button onClick={() => handleUpdateStatus('Confirmada')} disabled={isLoading || !isPending} size="sm">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Confirmar
                    </Button>
                    <Button onClick={() => handleUpdateStatus('Cancelada')} variant="destructive" disabled={isLoading || !isPending} size="sm">
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Cancelar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function PartnerBookingsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const bookingsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collectionGroup(firestore, 'bookings'),
            where('vendorId', '==', user.uid),
            orderBy('date', 'desc')
        );
    }, [firestore, user]);

    const { data: bookings, isLoading } = useCollection<Booking>(bookingsQuery);

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-4xl mx-auto">
                 <div className="mb-8">
                     <h1 className="font-headline text-3xl md:text-4xl font-bold">Minhas Reservas</h1>
                    <p className="text-muted-foreground mt-2">
                        Gira e acompanhe as reservas feitas pelos seus clientes.
                    </p>
                </div>
                
                <div className="space-y-6">
                    {isLoading ? (
                         <>
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </>
                    ) : bookings && bookings.length > 0 ? (
                        bookings.map(booking => (
                           <BookingItem key={booking.id} booking={booking} />
                        ))
                    ) : (
                        <div className="text-center py-16 border rounded-lg bg-card">
                            <h2 className="text-xl font-semibold">Sem reservas por agora</h2>
                            <p className="text-muted-foreground mt-2 mb-4">Assim que um cliente fizer uma reserva para um dos seus serviços, ela aparecerá aqui.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
