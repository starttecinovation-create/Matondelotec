'use client';

import { useImperativeHandle, forwardRef, useRef } from 'react';
import { Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import type { Map as GoogleMap } from '@vis.gl/react-google-maps';
import { type Service, type PlaceResult } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import Link from 'next/link';

interface MapViewProps {
  services: Service[];
  searchedPlace?: PlaceResult | null;
  selectedServiceId?: string | null;
  onMarkerClick?: (serviceId: string) => void;
  onInfoWindowClose?: () => void;
}

export interface MapViewHandle {
    panTo: (position: google.maps.LatLngLiteral) => void;
}

const LUANDA_POSITION = { lat: -8.8368, lng: 13.2343 };

const MapViewComponent = forwardRef<MapViewHandle, MapViewProps>(
  ({ services, searchedPlace, selectedServiceId, onMarkerClick, onInfoWindowClose }, ref) => {
    const map = useMap();

    useImperativeHandle(ref, () => ({
        panTo: (position) => {
            if (map) {
                map.panTo(position);
                map.setZoom(15);
            }
        }
    }));

    const getPosition = (item: Service | PlaceResult): google.maps.LatLngLiteral => {
      // Check if it's a Service with a valid location
      if ('location' in item && item.location && typeof item.location.latitude === 'number' && typeof item.location.longitude === 'number') {
          return { 
              lat: item.location.latitude,
              lng: item.location.longitude 
          };
      }
      // Check if it's a PlaceResult from Google
      if ('geometry' in item && item.geometry?.location) {
          return item.geometry.location.toJSON();
      }
      // Fallback position to avoid crashes, with a small random offset
      return {
        lat: LUANDA_POSITION.lat + (Math.random() - 0.5) * 0.01,
        lng: LUANDA_POSITION.lng + (Math.random() - 0.5) * 0.01,
      };
    }

    const getServiceUrl = (service: Service) => {
        // The service is stored as a subcollection of the user/vendor who created it.
        const docPath = `users/${service.vendorId}/services/${service.id}`;
        return `/services/${encodeURIComponent(docPath)}`;
    }
    
    const selectedService = services.find(s => s.id === selectedServiceId);
    
    // The InfoWindow should show either the selected service from our DB, or the searched place from Google
    const infoWindowItem = selectedService || searchedPlace;

    return (
        <Map
          ref={mapRef}
          defaultCenter={LUANDA_POSITION}
          defaultZoom={12}
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID"}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          className='w-full h-full'
        >
          {/* Markers for services from our database */}
          {services.map((service) => (
            <AdvancedMarker
              key={`service-${service.id}`}
              position={getPosition(service)}
              onClick={() => onMarkerClick?.(service.id)}
            >
              <Pin 
                background={'hsl(var(--primary))'}
                borderColor={'hsl(var(--primary))'}
                glyphColor={'hsl(var(--primary-foreground))'}
              />
            </AdvancedMarker>
          ))}
          
          {/* Marker for a place searched on Google */}
          {searchedPlace && (
             <AdvancedMarker
                key={`place-${searchedPlace.place_id}`}
                position={getPosition(searchedPlace)}
              >
                <Pin 
                    background={'#4285F4'} // Google Blue
                    borderColor={'#FFFFFF'}
                    glyphColor={'#FFFFFF'}
                />
              </AdvancedMarker>
          )}

          {/* InfoWindow for the selected item (service or place) */}
          {infoWindowItem && (
            <InfoWindow
              position={getPosition(infoWindowItem)}
              onCloseClick={onInfoWindowClose}
              pixelOffset={[0, -40]}
            >
              {'price' in infoWindowItem ? (
                // It's a Service from our DB
                 <Card className="border-none shadow-none max-w-xs">
                  <CardHeader className="p-2">
                      <CardTitle className="text-base font-headline">{infoWindowItem.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                      <p className="text-xs text-muted-foreground mb-2">{infoWindowItem.category}</p>
                       <p className="font-semibold text-sm">
                          {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(infoWindowItem.price)}
                      </p>
                      <Button asChild size="sm" className="w-full mt-2">
                          <Link href={getServiceUrl(infoWindowItem)}>Ver Detalhes</Link>
                      </Button>
                  </CardContent>
              </Card>
              ) : (
                // It's a PlaceResult from Google
                 <Card className="border-none shadow-none max-w-xs">
                  <CardHeader className="p-2">
                      <CardTitle className="text-base font-headline">{infoWindowItem.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                      {infoWindowItem.formatted_address && <p className="text-xs text-muted-foreground">{infoWindowItem.formatted_address}</p>}
                      {infoWindowItem.types?.[0] && <p className="text-xs text-muted-foreground mt-1 capitalize">{infoWindowItem.types[0].replace(/_/g, ' ')}</p>}
                  </CardContent>
              </Card>
              )}
            </InfoWindow>
          )}
        </Map>
    );
  }
);

MapViewComponent.displayName = 'MapView';

export const MapView = MapViewComponent;
