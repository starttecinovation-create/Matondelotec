'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/category-icon';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, doc, orderBy } from 'firebase/firestore';
import React from 'react';
import { type Booking, type Service } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';


// Component to load service details for a single booking
function BookingCard({ booking }: { booking: Booking }) {
    const firestore = useFirestore();
    
    // The serviceId in the booking is the full path to the service document
    const serviceRef = useMemoFirebase(() => {
        if (!firestore) return null;
        try {
            // New format: full path
            if (booking.serviceId.includes('/')) {
                return doc(firestore, booking.serviceId);
            }
        } catch (e) {
            console.error("Error creating doc ref from serviceId: ", booking.serviceId, e);
        }
        return null;

    }, [firestore, booking.serviceId]);
    
    const { data: service, isLoading } = useDoc<Service>(serviceRef);

    if (isLoading || !service) {
        return <Skeleton className="h-48 w-full rounded-lg" />;
    }

    const serviceImage = PlaceHolderImages.find(img => img.id === (service.imageUrls && service.imageUrls[0]));
    const bookingDate = booking.date ? new Date(booking.date) : new Date();

    return (
        <Card className="flex flex-col md:flex-row">
            <div className="md:w-1/3 lg:w-1/4">
                <div className="relative aspect-video md:aspect-square w-full h-full overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-r-none">
                {serviceImage ? (
                    <Image
                    src={serviceImage.imageUrl}
                    alt={service.name}
                    fill
                    className="object-cover"
                    data-ai-hint={serviceImage.imageHint}
                    />
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                        {service.category && <CategoryIcon category={service.category} className="w-12 h-12 text-muted-foreground" />}
                    </div>
                )}
                </div>
            </div>
            <div className="flex-grow">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="font-headline text-xl">{service.name}</CardTitle>
                        <Badge variant={booking.status === 'Confirmada' ? 'default' : booking.status === 'Pendente' ? 'secondary' : 'destructive'} className={booking.status === 'Confirmada' ? 'bg-green-600' : ''}>
                            {booking.status}
                        </Badge>
                    </div>
                    <CardDescription>
                        Reserva para: {bookingDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Categoria: {service.category}
                    </p>
                    <p className="font-semibold text-lg mt-2">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(service.price)}
                    </p>
                </CardContent>
                <CardFooter className="flex gap-2">
                    <Button variant="outline">Gerir Reserva</Button>
                </CardFooter>
            </div>
        </Card>
    );
}


export default function BookingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const bookingsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/bookings`),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: userBookings, isLoading: areBookingsLoading } = useCollection<Booking>(bookingsQuery);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="space-y-8">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold">Minhas Reservas</h1>
          <p className="text-muted-foreground mt-2">
            Veja o histórico das suas reservas passadas e futuras.
          </p>
        </div>

        {areBookingsLoading ? (
            <div className="space-y-6">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-48 w-full rounded-lg" />
            </div>
        ) : userBookings && userBookings.length > 0 ? (
          <div className="space-y-6">
            {userBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold">Sem reservas por agora</h2>
            <p className="text-muted-foreground mt-2 mb-4">Parece que ainda não fez nenhuma reserva.</p>
            <Button asChild>
                <Link href="/services">Explorar Serviços</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
