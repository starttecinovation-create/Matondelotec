'use client';

import { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { PlaceResult } from '@/lib/types';
import { MapView, type MapViewHandle } from '@/components/map-view';
import { type Service, type ServiceCategory, serviceCategories } from '@/lib/types';
import { categoryDetails } from '@/components/category-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collectionGroup, query } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CategoryIcon } from '@/components/category-icon';
import { PlaceSearchInput } from '@/components/place-search-input';
import { useSearchParams } from 'next/navigation';

const filterCategories: ServiceCategory[] = ['Hotel', 'Restaurante', 'Salão de Beleza', 'Barbearia'];

function ServiceListItem({ service, isSelected, onClick }: { service: Service, isSelected: boolean, onClick: () => void }) {
    const serviceImage = PlaceHolderImages.find((img) => img.id === (service.imageUrls && service.imageUrls[0]));

    return (
        <Card 
            className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected ? "border-primary shadow-lg" : "border-transparent"
            )}
            onClick={onClick}
        >
            <div className="flex gap-4">
                <div className="relative w-24 h-24 aspect-square shrink-0">
                    {serviceImage ? (
                        <Image
                        src={serviceImage.imageUrl}
                        alt={service.name}
                        fill
                        className="object-cover rounded-l-lg"
                        data-ai-hint={serviceImage.imageHint}
                        />
                    ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center rounded-l-lg">
                            <CategoryIcon category={service.category} className="w-8 h-8 text-muted-foreground" />
                        </div>
                    )}
                </div>
                <div className="py-2 pr-4 flex-grow overflow-hidden">
                    <p className="text-sm font-semibold leading-snug truncate">{service.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{service.category}</p>
                    <p className="font-bold text-sm mt-2">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(service.price)}
                    </p>
                </div>
            </div>
        </Card>
    );
}

function MapPageContent() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [searchedPlace, setSearchedPlace] = useState<PlaceResult | null>(null);
  
  const mapRef = useRef<MapViewHandle>(null);
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const firestore = useFirestore();
  const servicesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'services'));
  }, [firestore]);

  const { data: services, isLoading: areServicesLoading } = useCollection<Service>(servicesQuery);

  const filteredServices = useMemo(() => {
    return selectedCategory
    ? (services || []).filter((service) => service.category === selectedCategory)
    : (services || []);
  }, [services, selectedCategory]);


  // Effect to handle incoming search from dashboard
  const map = useMap();
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !map) return;

    const placeId = searchParams.get('placeId');
    if (placeId) {
      const placesService = new places.PlacesService(map);
      placesService.getDetails({
        placeId,
        fields: ['place_id', 'name', 'geometry', 'formatted_address', 'types']
      }, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          handlePlaceSelect(place as PlaceResult);
        }
      });
    }
  }, [searchParams, places, map]);


  const handleMarkerClick = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setSearchedPlace(null);
    const serviceElement = scrollRefs.current[serviceId];
    if (serviceElement) {
        serviceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  
  const handleListItemClick = (service: Service) => {
      setSelectedServiceId(service.id);
      setSearchedPlace(null);
      if (service.location && mapRef.current) {
        mapRef.current.panTo({
            lat: service.location.latitude,
            lng: service.location.longitude,
        });
      }
  }

  const handlePlaceSelect = (place: PlaceResult | null) => {
    setSearchedPlace(place);
    setSelectedServiceId(null);
    if (place?.geometry?.location && mapRef.current) {
        mapRef.current.panTo(place.geometry.location.toJSON());
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)] grid md:grid-cols-3 lg:grid-cols-4">
        <div className="hidden md:flex flex-col h-full border-r bg-card">
            <div className="p-4 border-b space-y-4">
                <h2 className="font-headline text-xl font-semibold">Explorar no Mapa</h2>
            </div>
            <div className="p-4 border-b">
                <div className="grid grid-cols-2 gap-2">
                    {filterCategories.map((category) => {
                        const details = categoryDetails[category];
                        if (!details) return null;
                        const Icon = details.icon;
                        return (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? 'default' : 'outline'}
                            onClick={() => setSelectedCategory(prev => prev === category ? null : category)}
                            className="flex items-center justify-start gap-2 h-auto py-2 text-left"
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-xs">{details.label}</span>
                        </Button>
                        );
                    })}
                </div>
            </div>
            <ScrollArea className="flex-grow">
                <div className="space-y-2 p-4">
                    {areServicesLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full" />
                        ))
                    ) : filteredServices.length > 0 ? (
                        filteredServices.map(service => (
                            <div key={service.id} ref={el => { scrollRefs.current[service.id] = el; }}>
                                <ServiceListItem 
                                    service={service}
                                    isSelected={service.id === selectedServiceId}
                                    onClick={() => handleListItemClick(service)}
                                />
                            </div>
                        ))
                    ) : (
                        <p className="p-4 text-center text-sm text-muted-foreground">Nenhum serviço encontrado para esta categoria.</p>
                    )}
                </div>
            </ScrollArea>
        </div>
        <div className="relative md:col-span-2 lg:col-span-3 h-full">
             <div className="absolute top-4 left-4 z-10 w-full max-w-sm md:max-w-md">
                <PlaceSearchInput onPlaceSelect={handlePlaceSelect} />
            </div>
            <MapView 
                ref={mapRef}
                services={filteredServices} 
                searchedPlace={searchedPlace}
                selectedServiceId={selectedServiceId}
                onMarkerClick={handleMarkerClick}
                onInfoWindowClose={() => {
                    setSelectedServiceId(null);
                    setSearchedPlace(null);
                }}
            />
        </div>
    </div>
  );
}


export default function MapPage() {
    return (
        <Suspense fallback={<div className="flex h-full w-full items-center justify-center p-12"><Skeleton className="w-full h-64" /></div>}>
            <MapPageContent />
        </Suspense>
    );
}