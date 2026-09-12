'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockTaxis } from '@/lib/data';
import { type Taxi, type TaxiClass, type UserProfile } from '@/lib/types';
import { Car, MapPin, Search, Compass, ShieldAlert, Sparkles, Loader2, Navigation, CheckCircle2, User, Wallet, History } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, addDoc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const LUANDA_LANDMARKS = [
    { id: '1', name: 'Aeroporto Internacional 4 de Fevereiro', lat: -8.8521, lng: 13.2325, description: 'Aeroporto principal' },
    { id: '2', name: 'Baía de Luanda (Marginal)', lat: -8.8115, lng: 13.2302, description: 'Centro histórico e lazer' },
    { id: '3', name: 'Talatona', lat: -8.9248, lng: 13.1856, description: 'Zona comercial e residencial nobre' },
    { id: '4', name: 'Kilamba', lat: -8.9958, lng: 13.2678, description: 'Centralidade residencial' },
    { id: '5', name: 'Viana', lat: -8.8992, lng: 13.3639, description: 'Zona industrial e habitacional' },
    { id: '6', name: 'Ilha de Luanda', lat: -8.7915, lng: 13.2428, description: 'Praias e restaurantes' },
];

export default function TaxiPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    // Fetch user profile for balance check and update
    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    // State managers for simulation
    const [pickup, setPickup] = useState<string>('2'); // Default: Baía de Luanda
    const [destination, setDestination] = useState<string>('3'); // Default: Talatona
    const [activeTab, setActiveTab] = useState<TaxiClass>('conforto');
    const [simulationState, setSimulationState] = useState<'idle' | 'searching' | 'driver_assigned' | 'in_progress' | 'completed'>('idle');
    const [simulationDriver, setSimulationDriver] = useState<Taxi | null>(null);
    const [countdown, setCountdown] = useState<number>(0);
    const [routeDetails, setRouteDetails] = useState<{ distance: number; time: number; price: number } | null>(null);

    const pickupLandmark = useMemo(() => LUANDA_LANDMARKS.find(l => l.id === pickup), [pickup]);
    const destinationLandmark = useMemo(() => LUANDA_LANDMARKS.find(l => l.id === destination), [destination]);

    // Calculate distance and pricing
    useEffect(() => {
        if (pickup === destination) {
            setRouteDetails(null);
            return;
        }
        // Basic simulation of distance
        const pLand = LUANDA_LANDMARKS.find(l => l.id === pickup);
        const dLand = LUANDA_LANDMARKS.find(l => l.id === destination);
        if (!pLand || !dLand) return;

        // Mock distance formula
        const latDiff = Math.abs(pLand.lat - dLand.lat);
        const lngDiff = Math.abs(pLand.lng - dLand.lng);
        const distanceKm = Math.max(2.5, Math.round((latDiff + lngDiff) * 111 * 10) / 10);
        const estTimeMin = Math.round(distanceKm * 1.8);

        // Pricing based on TaxiClass
        let basePrice = 1000;
        let perKmPrice = 150;
        if (activeTab === 'conforto') {
            basePrice = 1500;
            perKmPrice = 200;
        } else if (activeTab === 'executivo') {
            basePrice = 2500;
            perKmPrice = 350;
        }

        const totalPrice = Math.round(basePrice + (distanceKm * perKmPrice));

        setRouteDetails({
            distance: distanceKm,
            time: estTimeMin,
            price: totalPrice
        });
    }, [pickup, destination, activeTab]);

    // Handle simulation state updates
    useEffect(() => {
        let timer: any;
        if (simulationState === 'searching') {
            setCountdown(3);
            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        // Assign a mock driver of the appropriate class
                        const availableDrivers = mockTaxis.filter(t => t.taxiClass === activeTab);
                        const driver = availableDrivers.length > 0 ? availableDrivers[0] : mockTaxis[0];
                        setSimulationDriver(driver);
                        setSimulationState('driver_assigned');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (simulationState === 'driver_assigned') {
            setCountdown(4);
            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setSimulationState('in_progress');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (simulationState === 'in_progress') {
            setCountdown(5);
            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleTripCompleted();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(timer);
    }, [simulationState]);

    // Save records to Firestore on trip completion and update balance
    const handleTripCompleted = async () => {
        if (!user || !firestore || !routeDetails) return;

        try {
            const currentBalance = userProfile?.balance || 0;
            const newBalance = Math.max(0, currentBalance - routeDetails.price);

            // 1. Update user balance in Firestore
            if (userProfileRef) {
                await updateDoc(userProfileRef, { balance: newBalance });
            }

            // 2. Add Booking record
            const bookingsCol = collection(firestore, `users/${user.uid}/bookings`);
            await addDoc(bookingsCol, {
                userId: user.uid,
                vendorId: simulationDriver?.driverId || 'system-taxi',
                serviceId: `mock-taxi/${simulationDriver?.id || 'taxi'}`,
                serviceName: `Matondelo Táxi: ${pickupLandmark?.name} ➔ ${destinationLandmark?.name}`,
                date: new Date().toISOString().split('T')[0],
                status: 'Confirmada',
                createdAt: new Date().toISOString()
            });

            // 3. Add Transaction record
            const transactionsCol = collection(firestore, `users/${user.uid}/transactions`);
            await addDoc(transactionsCol, {
                userId: user.uid,
                amount: routeDetails.price,
                type: 'debit',
                description: `Viagem de Táxi (${activeTab.toUpperCase()}) - ${pickupLandmark?.name} para ${destinationLandmark?.name}`,
                transactionDate: Timestamp.now()
            });

            setSimulationState('completed');
            toast({
                title: "Viagem Concluída!",
                description: `Chegou em segurança. Débito de ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(routeDetails.price)} efetuado do seu saldo virtual.`,
            });
        } catch (error) {
            console.error("Error finalizing simulated trip: ", error);
            setSimulationState('completed');
        }
    };

    const handleRequestTrip = () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Não autenticado', description: 'Por favor, inicie sessão para solicitar um táxi.' });
            return;
        }

        if (pickup === destination) {
            toast({ variant: 'destructive', title: 'Rotas Inválidas', description: 'O ponto de partida e o destino não podem ser o mesmo.' });
            return;
        }

        if (!routeDetails) return;

        const currentBalance = userProfile?.balance || 0;
        if (currentBalance < routeDetails.price) {
            toast({
                variant: 'destructive',
                title: 'Saldo Insuficiente',
                description: `Esta viagem custa ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(routeDetails.price)}, mas o seu saldo atual é de ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(currentBalance)}. Por favor, carregue o seu saldo na página de Perfil.`,
            });
            return;
        }

        // Start simulation!
        setSimulationState('searching');
    };

    const resetSimulation = () => {
        setSimulationState('idle');
        setSimulationDriver(null);
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] w-full bg-background overflow-hidden">
            {/* LEFT COLUMN: INTERACTIVE MAP & SIMULATOR GRAPHIC */}
            <div className="flex-1 relative bg-slate-900 border-r min-h-[300px] lg:min-h-[500px] flex flex-col justify-between overflow-hidden">
                {/* Simulated Grid Map of Luanda */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }} />

                {/* Simulated Roads */}
                <svg className="absolute inset-0 w-full h-full stroke-slate-800 pointer-events-none" strokeWidth="2">
                    <line x1="10%" y1="0" x2="10%" y2="100%" />
                    <line x1="35%" y1="0" x2="35%" y2="100%" />
                    <line x1="60%" y1="0" x2="60%" y2="100%" />
                    <line x1="85%" y1="0" x2="85%" y2="100%" />
                    <line x1="0" y1="20%" x2="100%" y2="20%" />
                    <line x1="0" y1="50%" x2="100%" y2="50%" />
                    <line x1="0" y1="75%" x2="100%" y2="75%" />
                </svg>

                {/* Animated landmarks or driver location */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start z-10">
                        <Badge className="bg-sky-500/10 hover:bg-sky-500/10 text-sky-400 border border-sky-400/30 gap-1.5 py-1 px-3 backdrop-blur-md">
                            <Compass className="h-3.5 w-3.5 animate-spin" />
                            Mapa de Luanda Simulado Ativo
                        </Badge>
                        <div className="p-2 bg-slate-800/80 rounded-lg text-xs text-white border border-slate-700 backdrop-blur-md">
                            Saldo: <span className="font-bold text-emerald-400">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(userProfile?.balance || 0)}</span>
                        </div>
                    </div>

                    {/* Landmark Node Markers on the Map */}
                    <div className="relative w-full h-64 md:h-96">
                        {LUANDA_LANDMARKS.map((landmark, idx) => {
                            const isPickup = landmark.id === pickup;
                            const isDest = landmark.id === destination;
                            
                            // Distribute position for clean visual representation
                            const lefts = ["12%", "37%", "62%", "82%", "42%", "72%"];
                            const tops = ["18%", "45%", "22%", "78%", "72%", "48%"];

                            return (
                                <button
                                    key={landmark.id}
                                    style={{ left: lefts[idx], top: tops[idx] }}
                                    onClick={() => {
                                        if (simulationState !== 'idle') return;
                                        // Simple toggle: first click sets pickup, second sets destination
                                        if (pickup === landmark.id) {
                                            // do nothing
                                        } else {
                                            setDestination(landmark.id);
                                        }
                                    }}
                                    disabled={simulationState !== 'idle'}
                                    className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl flex items-center gap-2 border transition-all ${
                                        isPickup ? 'bg-orange-500 text-white border-orange-400 ring-4 ring-orange-500/20 scale-110 z-20' : 
                                        isDest ? 'bg-sky-500 text-white border-sky-400 ring-4 ring-sky-500/20 scale-110 z-20' : 
                                        'bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 border-slate-700'
                                    }`}
                                >
                                    <MapPin className={`h-4 w-4 shrink-0 ${isPickup || isDest ? 'text-white animate-bounce' : 'text-slate-400'}`} />
                                    <div className="text-left hidden md:block">
                                        <p className="text-[10px] font-bold whitespace-nowrap leading-tight">{landmark.name.split(' (')[0]}</p>
                                    </div>
                                </button>
                            );
                        })}

                        {/* Simulated Taxi vehicle moving animation during states */}
                        {simulationState === 'in_progress' && (
                            <div className="absolute top-[48%] left-[45%] -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-slate-900 font-bold px-3 py-1.5 rounded-full shadow-lg border border-white flex items-center gap-1.5 z-30 animate-pulse">
                                <Car className="h-4 w-4 animate-bounce" />
                                <span className="text-[10px]">A viajar...</span>
                            </div>
                        )}
                        {simulationState === 'driver_assigned' && (
                            <div className="absolute top-[35%] left-[50%] -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-full shadow-lg border border-emerald-400 flex items-center gap-1.5 z-30 animate-bounce">
                                <User className="h-4 w-4" />
                                <span className="text-[10px]">Motorista a caminho</span>
                            </div>
                        )}
                    </div>

                    <div className="text-slate-400 text-xs text-center backdrop-blur-sm py-1">
                        Selecione as localizações e veja a magia da Matondelo simular a viagem em tempo real.
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: RIDE BOOKING INTERFACE */}
            <div className="w-full lg:w-[420px] bg-card p-6 flex flex-col justify-between overflow-y-auto max-h-screen">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-headline font-bold text-slate-800 flex items-center gap-2">
                            <Car className="text-[#D45500] h-6 w-6" />
                            Matondelo Táxi
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">Solicite uma viagem rápida e económica em Luanda com total segurança.</p>
                    </div>

                    {simulationState === 'idle' && (
                        <Card className="border-slate-150">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Planear Viagem</CardTitle>
                                <CardDescription>Introduza os pontos de embarque e destino</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                                        <div className="h-2 w-2 rounded-full bg-orange-500" />
                                        Ponto de Partida
                                    </label>
                                    <select 
                                        value={pickup} 
                                        onChange={(e) => setPickup(e.target.value)}
                                        className="w-full text-sm rounded-lg border border-input p-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        {LUANDA_LANDMARKS.map(l => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                                        <div className="h-2 w-2 rounded-full bg-sky-500" />
                                        Destino Final
                                    </label>
                                    <select 
                                        value={destination} 
                                        onChange={(e) => setDestination(e.target.value)}
                                        className="w-full text-sm rounded-lg border border-input p-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        {LUANDA_LANDMARKS.map(l => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5 pt-2">
                                    <label className="text-xs font-semibold text-slate-600">Classe de Conforto</label>
                                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                                        <TabsList className="grid w-full grid-cols-3 h-10">
                                            <TabsTrigger value="economico" className="text-xs font-semibold">Económico</TabsTrigger>
                                            <TabsTrigger value="conforto" className="text-xs font-semibold">Conforto</TabsTrigger>
                                            <TabsTrigger value="executivo" className="text-xs font-semibold">Executivo</TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>

                                {routeDetails && (
                                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-2 mt-4">
                                        <div className="flex justify-between text-xs text-slate-600">
                                            <span>Distância estimada:</span>
                                            <span className="font-semibold text-slate-800">{routeDetails.distance} km</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-600">
                                            <span>Tempo estimado:</span>
                                            <span className="font-semibold text-slate-800">{routeDetails.time} min</span>
                                        </div>
                                        <div className="border-t border-slate-200/60 my-1 pt-1.5 flex justify-between text-sm">
                                            <span className="font-bold text-slate-700">Preço Estimado:</span>
                                            <span className="font-bold text-[#D45500]">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(routeDetails.price)}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            <CardContent className="pt-0">
                                <Button 
                                    onClick={handleRequestTrip} 
                                    className="w-full bg-[#D45500] hover:bg-[#b44500] text-white font-bold h-11"
                                    disabled={pickup === destination || isProfileLoading}
                                >
                                    {isProfileLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Solicitar Táxi'}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* SIMULATOR SCREEN 1: SEARCHING FOR DRIVER */}
                    {simulationState === 'searching' && (
                        <Card className="border-slate-150 p-6 text-center space-y-6">
                            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin" />
                                <Car className="h-10 w-10 text-orange-500" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-lg">Procurando motoristas...</CardTitle>
                                <CardDescription>A contactar as viaturas {activeTab} mais próximas de si</CardDescription>
                            </div>
                            <Badge variant="outline" className="text-xs px-3 py-1">Encontrando em {countdown}s...</Badge>
                        </Card>
                    )}

                    {/* SIMULATOR SCREEN 2: DRIVER ASSIGNED & ON WAY */}
                    {simulationState === 'driver_assigned' && (
                        <Card className="border-slate-150 overflow-hidden">
                            <div className="bg-emerald-500 text-white p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 animate-pulse" />
                                    <span className="text-sm font-semibold">Motorista Encontrado!</span>
                                </div>
                                <Badge className="bg-white/20 text-white hover:bg-white/20">Chega em {countdown}s</Badge>
                            </div>
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                                        <User className="h-6 w-6 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{simulationDriver?.driverName}</p>
                                        <p className="text-xs text-muted-foreground">Avaliação: ⭐ 4.9 • Matondelo Driver</p>
                                    </div>
                                </div>
                                <div className="p-3 border rounded-lg bg-slate-50 space-y-1">
                                    <p className="text-xs text-slate-500">Veículo:</p>
                                    <p className="text-sm font-bold text-slate-700">{simulationDriver?.model}</p>
                                    <p className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded inline-block">{simulationDriver?.plateNumber}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* SIMULATOR SCREEN 3: TRIP IN PROGRESS */}
                    {simulationState === 'in_progress' && (
                        <Card className="border-slate-150 overflow-hidden">
                            <div className="bg-slate-800 text-white p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                                    <span className="text-sm font-semibold">Viagem em Curso...</span>
                                </div>
                                <Badge className="bg-amber-500 text-slate-950 font-bold">{countdown}s restante</Badge>
                            </div>
                            <CardContent className="p-5 space-y-4 text-center">
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-500">A deslocar-se de:</p>
                                    <p className="text-sm font-bold text-slate-700">{pickupLandmark?.name}</p>
                                    <p className="text-xs text-slate-500 my-1">Para:</p>
                                    <p className="text-sm font-bold text-slate-700">{destinationLandmark?.name}</p>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-amber-500 h-full animate-pulse" style={{ width: `${(5 - countdown) * 20}%` }} />
                                </div>
                                <p className="text-xs text-muted-foreground">O motorista {simulationDriver?.driverName} está a conduzir em direção ao seu destino.</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* SIMULATOR SCREEN 4: TRIP COMPLETED */}
                    {simulationState === 'completed' && (
                        <Card className="border-emerald-200 bg-emerald-50/50 p-6 text-center space-y-4">
                            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-lg text-slate-800">Chegou ao seu destino!</CardTitle>
                                <CardDescription>A sua viagem foi concluída com sucesso e em segurança.</CardDescription>
                            </div>
                            <div className="p-3.5 border rounded-lg bg-white shadow-xs space-y-1 max-w-xs mx-auto">
                                <p className="text-xs text-slate-500">Valor Pago:</p>
                                <p className="text-lg font-bold text-slate-800">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(routeDetails?.price || 0)}</p>
                                <p className="text-[10px] text-slate-400">Pago via Saldo Virtual Matondelo</p>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button onClick={resetSimulation} className="w-full">Voltar</Button>
                                <Button variant="outline" asChild className="w-full">
                                    <Link href="/bookings">Ver Recibos</Link>
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Balance Summary Card */}
                <div className="mt-8 pt-4 border-t border-slate-150">
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                        <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-slate-500" />
                            <span className="text-xs font-semibold text-slate-600">O seu Saldo Virtual:</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-600">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(userProfile?.balance || 0)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
