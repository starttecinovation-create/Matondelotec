'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDoc, useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { collection, collectionGroup, doc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getAreaInsights } from '@/ai/flows/area-insights-flow';
import { Loader2, ShoppingBag, CalendarCheck } from 'lucide-react';
import { type Service, type UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { usePartner } from '@/context/partner-context';
import { useRouter } from 'next/navigation';
import { subscriptionReminderFlow } from '@/ai/flows/payment-reminder-flow';

// Example component to fetch and display an insight
function AreaInsightCard() {
    const [insightCount, setInsightCount] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInsight = async () => {
            setIsLoading(true);
            try {
                // This is the Place ID for "Luanda, Angola"
                const luandaPlaceId = "ChIJIQBpAG2ahYAR_6128GcTUEo";

                const result = await getAreaInsights({
                    locationFilter: {
                        region: {
                            place: luandaPlaceId,
                        },
                    },
                    typeFilter: {
                        includedTypes: ["restaurant"],
                    },
                    ratingFilter: {
                        minRating: 4.0,
                    },
                });

                if (result.insightCount) {
                    setInsightCount(result.insightCount.count);
                }
            } catch (error) {
                console.error("Failed to fetch area insights:", error);
                setInsightCount(null); // Or handle error state appropriately
            } finally {
                setIsLoading(false);
            }
        };

        fetchInsight();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Insights do Mercado</CardTitle>
                <CardDescription>Restaurantes com avaliação 4.0+ em Luanda</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                 {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                ) : (
                    <p className="text-3xl font-bold">{insightCount !== null ? insightCount.toLocaleString() : 'N/A'}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">Fonte: Google</p>
            </CardContent>
        </Card>
    )
}

function StatsCards() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [monthlyBookings, setMonthlyBookings] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Query for vendor's services
    const servicesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/services`));
    }, [firestore, user]);

    const { data: services, isLoading: areServicesLoading } = useCollection<Service>(servicesQuery);

    // Get all bookings for this vendor
    useEffect(() => {
        if (!user || !firestore) return;

        const getMonthlyBookings = async () => {
            setIsLoading(true);
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            
            const bookingsRef = collectionGroup(firestore, 'bookings');
            const q = query(
                bookingsRef,
                where('vendorId', '==', user.uid),
                where('date', '>=', startOfMonth.toISOString().split('T')[0])
            );

            try {
                const querySnapshot = await getDocs(q);
                setMonthlyBookings(querySnapshot.size);
            } catch (error) {
                console.error("Error fetching monthly bookings: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        getMonthlyBookings();
    }, [user, firestore]);
    
    const totalServices = services?.length || 0;
    const areStatsLoading = isLoading || areServicesLoading;

    return (
        <div className="grid grid-cols-2 gap-4 text-center">
            <div>
                {areStatsLoading ? <Skeleton className="h-9 w-12 mx-auto" /> : <p className="text-3xl font-bold">{monthlyBookings}</p>}
                <p className="text-sm text-muted-foreground mt-1">Reservas este mês</p>
            </div>
            <div>
                {areStatsLoading ? <Skeleton className="h-9 w-12 mx-auto" /> : <p className="text-3xl font-bold">{totalServices}</p>}
                <p className="text-sm text-muted-foreground mt-1">Serviços Ativos</p>
            </div>
        </div>
    )
}

export default function PartnerDashboardPage() {
    const router = useRouter();
    const { userProfile, isProfileLoading, isAdmin } = usePartner();

    // Redirect to welcome page if partner is not yet approved
    useEffect(() => {
        if (!isProfileLoading && userProfile?.verificationStatus === 'pending') {
            router.replace('/partner/welcome');
        }
    }, [userProfile, isProfileLoading, router]);

    // Admin-only effect to trigger reminder checks
    useEffect(() => {
        if (isAdmin) {
            console.log("Admin detected, running subscription reminder check...");
            subscriptionReminderFlow().then(result => {
                if (result.success && result.remindersSent > 0) {
                    console.log(`${result.remindersSent} lembretes de subscrição enviados.`);
                }
            }).catch(error => {
                console.error("Error running subscription reminder flow:", error);
            });
        }
    }, [isAdmin]);

    // Render loading or a placeholder until the check is complete and redirection happens
    if (isProfileLoading || !userProfile || userProfile.verificationStatus === 'pending') {
         return (
            <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="space-y-12">
             <div className="w-full bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 text-white">
                <div className="container mx-auto px-4 py-8 md:py-12">
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">Painel do Parceiro</h1>
                     {isProfileLoading ? <Skeleton className="h-7 w-64 mt-2" /> : (
                        <p className="mt-2 text-lg text-white/90">
                            Bem-vindo, {userProfile?.displayName || 'Parceiro'}. Gira o seu negócio a partir daqui.
                        </p>
                     )}
                </div>
            </div>

             <div className="container mx-auto px-4 space-y-12">
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Perfil & Serviços</CardTitle>
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground mb-4">Gira as suas informações e serviços.</p>
                            <Button asChild size="sm">
                                <Link href="/partner/services">Gerir Serviços</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                             <CardTitle className="text-sm font-medium">Reservas</CardTitle>
                             <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                         <CardContent>
                            <p className="text-xs text-muted-foreground mb-4">Acompanhe as reservas dos seus clientes.</p>
                             <Button asChild size="sm">
                                <Link href="/partner/bookings">Ver Reservas</Link>
                            </Button>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                             <CardTitle className="text-sm font-medium">Visão Geral Mensal</CardTitle>
                        </CardHeader>
                         <CardContent>
                            <StatsCards />
                        </CardContent>
                    </Card>
                 </div>
             </div>
        </div>
    )
}
