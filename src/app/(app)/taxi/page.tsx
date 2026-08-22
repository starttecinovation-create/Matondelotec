'use client';

import React, { useState, useMemo } from 'react';
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockTaxis } from '@/lib/data';
import { type Taxi, type TaxiClass } from '@/lib/types';
import { Car, AlertTriangle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';

const LUANDA_POSITION = { lat: -8.8368, lng: 13.2343 };

/**
 * Componente interno para isolar a lógica do mapa e evitar erros de inicialização.
 */
function TaxiMapContent({ filteredTaxis, onTaxiSelect }: { filteredTaxis: Taxi[], onTaxiSelect: (taxi: Taxi) => void }) {
    return (
        <Map
            defaultCenter={LUANDA_POSITION}
            defaultZoom={13}
            mapId="TAXI_MAP_ID"
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            className="w-full h-full"
        >
            {filteredTaxis.map(taxi => (
                <AdvancedMarker 
                    key={taxi.id} 
                    position={taxi.location} 
                    onClick={() => onTaxiSelect(taxi)}
                >
                     <Pin background={taxi.taxiClass === 'executivo' ? '#000000' : '#D45500'} borderColor={'#FFFFFF'}>
                        <Car className="text-white w-3 h-3" />
                    </Pin>
                </AdvancedMarker>
            ))}
        </Map>
    );
}

export default function TaxiPage() {
    const [selectedTaxi, setSelectedTaxi] = useState<Taxi | null>(null);
    const [activeTab, setActiveTab] = useState<TaxiClass | 'all'>('all');
    
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const hasApiKey = !!apiKey && apiKey !== "undefined" && apiKey !== "";

    const filteredTaxis = useMemo(() => {
        if (activeTab === 'all') return mockTaxis;
        return mockTaxis.filter(taxi => taxi.taxiClass === activeTab);
    }, [activeTab]);

    if (!hasApiKey) {
        return (
            <div className="container mx-auto px-4 py-12">
                <Card className="max-w-md mx-auto text-center p-12 border-dashed">
                    <AlertTriangle className="mx-auto h-12 w-12 text-primary mb-4" />
                    <CardTitle>Mapas Temporariamente Indisponíveis</CardTitle>
                    <p className="text-muted-foreground mt-2">Estamos a configurar o serviço de localização. Por favor, tente mais tarde.</p>
                    <Button asChild className="mt-6" variant="outline">
                        <Link href="/dashboard">Voltar ao Início</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden">
            <TaxiMapContent filteredTaxis={filteredTaxis} onTaxiSelect={setSelectedTaxi} />

            <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 space-y-4 z-10">
                <Card className="shadow-xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Matondelo Táxi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Input placeholder="Onde está agora?" className="text-sm" />
                        <Input placeholder="Para onde deseja ir?" className="text-sm" />
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                            <TabsList className="grid w-full grid-cols-4 h-9">
                                <TabsTrigger value="all" className="text-[10px]">Todos</TabsTrigger>
                                <TabsTrigger value="economico" className="text-[10px]">Econ.</TabsTrigger>
                                <TabsTrigger value="conforto" className="text-[10px]">Conf.</TabsTrigger>
                                <TabsTrigger value="executivo" className="text-[10px]">Exec.</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button className="w-full font-bold">Solicitar Viagem</Button>
                    </CardContent>
                </Card>

                {selectedTaxi && (
                    <Card className="shadow-lg border-primary/20 animate-in slide-in-from-right-4">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex justify-between items-center">
                                <span>{selectedTaxi.driverName}</span>
                                <Badge variant="secondary" className="text-[9px] uppercase">{selectedTaxi.taxiClass}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-1">
                            <p className="font-semibold">{selectedTaxi.model} • {selectedTaxi.plateNumber}</p>
                            <p className="text-muted-foreground leading-relaxed">{selectedTaxi.pricingDescription}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
