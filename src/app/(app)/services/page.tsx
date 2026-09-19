
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, MapPin } from 'lucide-react';
import { ServiceCard } from '@/components/service-card';
import { Input } from '@/components/ui/input';
import { type Service, type ServiceCategory, type TouristSpot, type PlaceResult } from '@/lib/types';
import { PlaceSearchInput } from '@/components/place-search-input';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockTouristSpots } from '@/lib/data';

function TouristSpotCard({ spot }: { spot: TouristSpot }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video w-full">
        <Image 
          src={spot.imageUrls[0]} 
          alt={spot.name} 
          fill 
          className="object-cover" 
          data-ai-hint={spot.imageHint}
        />
      </div>
      <CardHeader>
        <CardTitle className="font-headline">{spot.name}</CardTitle>
        <CardDescription className="flex items-center gap-2 pt-1">
          <MapPin className="h-4 w-4"/> {spot.location}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">{spot.description}</p>
      </CardContent>
    </Card>
  )
}

function FeaturedServices() {
    const firestore = useFirestore();
    const servicesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'services'), limit(3));
    }, [firestore]);

    const { data: services, isLoading: areServicesLoading } = useCollection<Service>(servicesQuery);

    return (
        <div className="mt-12">
            <Separator />
            <div className="mt-12">
                <h2 className="text-2xl font-headline font-semibold mb-4 text-center">Serviços em destaque</h2>
                 {areServicesLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Skeleton className="h-96 w-full" />
                        <Skeleton className="h-96 w-full" />
                        <Skeleton className="h-96 w-full" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(services || []).map(service => (
                            <ServiceCard key={service.id} service={service} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function ServicesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = searchParams.get('category') as ServiceCategory | null;
  const [searchTerm, setSearchTerm] = useState('');
  
  const firestore = useFirestore();
  const servicesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'services'));
  }, [firestore]);

  const { data: services, isLoading: areServicesLoading } = useCollection<Service>(servicesQuery);

  const filteredServices = services?.filter((service) => {
    const matchesCategory = !initialCategory || service.category === initialCategory;
    const matchesSearch = service.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  const isTourismCategory = initialCategory === 'Agências de Turismo e Viagens';

  const handlePlaceSelect = (place: PlaceResult | null) => {
    if (!place) return;

    let lat: number | undefined;
    let lng: number | undefined;
    if (place.geometry?.location) {
      const loc = place.geometry.location;
      if (typeof loc.lat === 'function' && typeof loc.lng === 'function') {
        lat = loc.lat();
        lng = loc.lng();
      } else if (typeof (loc as any).lat === 'number' && typeof (loc as any).lng === 'number') {
        lat = (loc as any).lat;
        lng = (loc as any).lng;
      }
    }

    if (lat !== undefined && lng !== undefined) {
      router.push(`/map?placeId=${place.place_id || 'custom'}&placeName=${encodeURIComponent(place.name)}&lat=${lat}&lng=${lng}`);
    } else if (place.place_id) {
      router.push(`/map?placeId=${place.place_id}`);
    } else if (place.name) {
      router.push(`/map?query=${encodeURIComponent(place.name)}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="font-headline text-3xl md:text-4xl font-bold">
            {initialCategory ? `Serviços de ${initialCategory}` : 'Explore os nossos serviços'}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Encontre os melhores serviços disponíveis na nossa plataforma, desde hotéis a salões de beleza.
          </p>
        </div>
        
        <div className="relative max-w-2xl mx-auto w-full flex justify-center">
          <PlaceSearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Procurar por nome do serviço ou local..."
            onPlaceSelect={handlePlaceSelect}
          />
        </div>

        {areServicesLoading ? (
            <div className="space-y-6">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-48 w-full rounded-lg" />
            </div>
        ) : filteredServices && filteredServices.length > 0 ? (
          <div className="space-y-6">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} layout="horizontal" />
            ))}
          </div>
        ) : (
          !isTourismCategory && (
            <div className="text-center py-16 border rounded-lg bg-card">
              <h2 className="text-xl font-semibold">Nenhum serviço encontrado</h2>
              <p className="text-muted-foreground mt-2">Tente ajustar a sua pesquisa ou explorar outra categoria.</p>
              <Button asChild className="mt-4">
                  <Link href="/dashboard">Voltar ao Início</Link>
              </Button>
            </div>
          )
        )}
        
        {isTourismCategory && (
          <div className="mt-12">
              <Separator />
              <div className="mt-12 text-center">
                 <h2 className="text-2xl font-headline font-semibold mb-2">Maravilhas e Pontos Turísticos de Angola</h2>
                 <p className="text-muted-foreground max-w-2xl mx-auto">Descubra a beleza de Angola. Estes são alguns dos destinos mais emblemáticos do país.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {mockTouristSpots.map(spot => (
                  <TouristSpotCard key={spot.id} spot={spot} />
                ))}
              </div>
          </div>
        )}

        {!isTourismCategory && <FeaturedServices />}

      </div>
    </div>
  );
}

import { Suspense } from 'react';

export default function ServicesPage() {
    return (
        <Suspense fallback={<div className="container mx-auto p-12"><Skeleton className="w-full h-80"/></div>}>
            <ServicesPageContent />
        </Suspense>
    )
}
