'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { serviceCategories } from '@/lib/types';
import { categoryDetails, CategoryIcon } from '@/components/category-icon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Search, Car, Loader2 } from 'lucide-react';
import { ServiceCard } from '@/components/service-card';
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { collection, collectionGroup, doc, query, limit, orderBy } from 'firebase/firestore';
import { type Service, type Booking, PlaceResult } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import React, { useEffect } from 'react';
import { PlaceSearchInput } from '@/components/place-search-input';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function RecentBookingItem({ booking }: { booking: Booking }) {
    const firestore = useFirestore();

    const serviceRef = useMemoFirebase(() => {
        if (!firestore) return null;
        try {
            if (booking.serviceId.includes('/')) {
                return doc(firestore, booking.serviceId);
            }
        } catch (e) {
             console.error("Error creating doc ref from serviceId: ", booking.serviceId, e);
        }
        return null;
    }, [firestore, booking.serviceId]);
    
    const { data: service, isLoading } = useDoc<Service>(serviceRef);
    const bookingDate = booking.date ? new Date(booking.date) : new Date();

    if (isLoading) {
        return <Skeleton className="h-10 w-full" />;
    }

    if (!service) {
        return null; 
    }

    return (
        <div className="flex justify-between items-center">
            <div>
                <p className="font-semibold">{service.name}</p>
                <p className="text-sm text-muted-foreground">{bookingDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric'})}</p>
            </div>
            <Link href="/bookings">
                <ArrowRight className="h-5 w-5 text-muted-foreground hover:text-primary"/>
            </Link>
        </div>
    );
}

function Banners() {
    const banners = [
        {
            id: 'taxi',
            title: 'Chegue mais rápido com Matondelo Táxi',
            description: 'Peça uma viagem e chegue ao seu destino com segurança e conforto. Toque para começar.',
            imageUrlId: 'banner-taxi',
            link: '/taxi'
        },
        {
            id: 'deliver',
            title: 'Entregas Rápidas com Matondelo Deliver',
            description: 'Envie e receba encomendas em tempo recorde. O nosso serviço de entregas estará disponível em breve!',
            imageUrlId: 'banner-deliver',
            link: '/express'
        },
        {
            id: 'services',
            title: 'Descubra e Reserve os Melhores Serviços',
            description: 'Hotéis, restaurantes, salões e muito mais. A sua próxima experiência está a um clique de distância.',
            imageUrlId: 'banner-services',
            link: '/services'
        }
    ];

    return (
        <Carousel className="w-full" opts={{ loop: true }}>
            <CarouselContent>
                {banners.map(banner => {
                    const image = PlaceHolderImages.find(img => img.id === banner.imageUrlId);
                    return (
                        <CarouselItem key={banner.id}>
                            <Card className="overflow-hidden">
                                <div className="relative aspect-[3/1] w-full">
                                    {image && (
                                        <Image
                                            src={image.imageUrl}
                                            alt={banner.title}
                                            fill
                                            className="object-cover"
                                            data-ai-hint={image.imageHint}
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent p-8 md:p-12 flex flex-col justify-center">
                                        <div className="max-w-md text-white">
                                            <h2 className="font-headline text-2xl md:text-3xl font-bold">{banner.title}</h2>
                                            <p className="mt-2 text-sm md:text-base text-white/90">{banner.description}</p>
                                            <Button asChild className="mt-4">
                                                <Link href={banner.link}>Saber Mais</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </CarouselItem>
                    )
                })}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
        </Carousel>
    );
}

export default function DashboardPage() {
    const firestore = useFirestore();
    const { user, isLoading: isUserLoading } = useUser();
    const router = useRouter();

    // INTERCETOR DE AUTENTICAÇÃO
    useEffect(() => {
        if (!isUserLoading && !user) {
            // Se o carregamento do usuário terminou e não há sessão ativa, manda para o cadastro
            router.push('/cadastro');
        }
    }, [user, isUserLoading, router]);

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile } = useDoc(userProfileRef);
    
    const bookingsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, `users/${user.uid}/bookings`),
            orderBy('date', 'desc'),
            limit(3)
        );
    }, [firestore, user]);

    const { data: recentBookings, isLoading: areBookingsLoading } = useCollection<Booking>(bookingsQuery);

    const handlePlaceSelect = (place: PlaceResult | null) => {
        if (place?.place_id) {
            router.push(`/map?placeId=${place.place_id}`);
        }
    }

  // Se o Firebase ainda estiver a validar se existe uma sessão iniciada, barra o ecrã com um loader de segurança
  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            A verificar autenticação...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
        <div className="w-full bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 text-white">
            <div className="container mx-auto px-4 py-8 md:py-12 space-y-4">
                <div>
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">Bem-vindo à matondelo</h1>
                    <p className="mt-2 text-lg text-white/90">
                        Explore, reserve e desfrute dos melhores serviços em Angola e no Mundo.
                    </p>
                </div>
                <div className="max-w-md">
                   <PlaceSearchInput onPlaceSelect={handlePlaceSelect} />
                </div>
            </div>
        </div>

        <div className="container mx-auto px-4 space-y-12">

            <Banners />
            
            <div>
              <h2 className="text-2xl font-headline font-semibold mb-4">Explorar Categorias</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {serviceCategories.map((category) => {
                  const details = categoryDetails[category];
                  if (!details) return null;
                  return (
                    <Link href={`/services?category=${encodeURIComponent(category)}`} key={category}>
                        <Card className="flex flex-col items-center justify-center p-4 h-full text-center hover:bg-accent hover:text-accent-foreground transition-colors group">
                            <CategoryIcon category={category} className="h-8 w-8" />
                            <p className="mt-2 text-sm font-semibold">{details.label}</p>
                        </Card>
                    </Link>
                  );
                })}
                 <Link href="/taxi" key="taxi">
                    <Card className="flex flex-col items-center justify-center p-4 h-full text-center hover:bg-accent hover:text-accent-foreground transition-colors group">
                        <Car className="h-8 w-8" style={{ stroke: 'url(#matondelo-gradient)' }} />
                        <p className="mt-2 text-sm font-semibold">Matondelo Táxi</p>
                    </Card>
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-2xl font-headline font-semibold mb-4">Reservas Recentes</h2>
                    <Card>
                        <CardContent className="p-4">
                            <div className="space-y-4">
                                {areBookingsLoading ? (
                                    <>
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                    </>
                                ) : recentBookings && recentBookings.length > 0 ? (
                                    recentBookings.map(booking => (
                                        <RecentBookingItem key={booking.id} booking={booking} />
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">Ainda não tem reservas.</p>
                                )}
                            </div>
                        </CardContent>
                         <CardContent className="p-4 border-t">
                            <Button variant="outline" className="w-full" asChild>
                                <Link href="/bookings">Ver todas as reservas</Link>
                            </Button>
                         </CardContent>
                    </Card>
                </div>
                 <div>
                    <h2 className="text-2xl font-headline font-semibold mb-4">Saldo Virtual</h2>
                     <Card className="h-full flex flex-col justify-center">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Disponível</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(userProfile?.balance || 0)}</div>
                             <Button className="mt-4" asChild>
                                <Link href="/profile">Gerir Saldo</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </div>
  );
}