'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy, collectionGroup, getDocs, limit } from 'firebase/firestore';
import type { UserProfile, Order, Booking } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart as BarChartIcon, Users, ShoppingCart, CalendarCheck, UserPlus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { format, subDays } from 'date-fns';
import React, { useMemo, useEffect, useState } from 'react';
import { usePartner } from '@/context/partner-context';

function StatCard({ title, value, icon: Icon, isLoading }: { title: string, value: string | number, icon: React.ElementType, isLoading: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{value}</div>}
            </CardContent>
        </Card>
    )
}

function UserGrowthChart({ users }: { users: UserProfile[] | null }) {
    const data = useMemo(() => {
        if (!users) return [];
        const today = new Date();
        const past7Days = Array.from({ length: 7 }).map((_, i) => {
            const date = subDays(today, i);
            return format(date, 'yyyy-MM-dd');
        }).reverse();

        const signupsByDay = users.reduce((acc, user) => {
            if (user.createdAt?.seconds) {
                const signupDate = format(new Date(user.createdAt.seconds * 1000), 'yyyy-MM-dd');
                if (past7Days.includes(signupDate)) {
                    acc[signupDate] = (acc[signupDate] || 0) + 1;
                }
            }
            return acc;
        }, {} as Record<string, number>);

        return past7Days.map(day => ({
            date: format(new Date(day), 'dd/MM'),
            signups: signupsByDay[day] || 0,
        }));
    }, [users]);
    
    const chartConfig = {
        signups: {
            label: 'Novos Utilizadores',
            color: 'hsl(var(--primary))',
        },
    };

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>Novos Utilizadores (Últimos 7 Dias)</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="signups" fill="var(--color-signups)" radius={4} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

type RecentActivityItem = { type: 'signup'; data: UserProfile; timestamp: Timestamp } | { type: 'order'; data: Order; timestamp: Timestamp } | { type: 'booking'; data: Booking; timestamp: Timestamp };

function RecentActivityFeed() {
    const firestore = useFirestore();
    const { isAdmin } = usePartner();

    const recentUsersQuery = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'), limit(5));
    }, [firestore, isAdmin]);

    const recentOrdersQuery = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        return query(collectionGroup(firestore, 'orders'), orderBy('createdAt', 'desc'), limit(5));
    }, [firestore, isAdmin]);

    const recentBookingsQuery = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        // Bookings have a string date, not a timestamp, so we can't directly use a Firestore timestamp query here
        // We will fetch and then sort client-side. This is less efficient but necessary with the current schema.
        return query(collectionGroup(firestore, 'bookings'), orderBy('date', 'desc'), limit(5));
    }, [firestore, isAdmin]);

    const { data: recentUsers, isLoading: usersLoading } = useCollection<UserProfile>(recentUsersQuery);
    const { data: recentOrders, isLoading: ordersLoading } = useCollection<Order>(recentOrdersQuery);
    const { data: recentBookings, isLoading: bookingsLoading } = useCollection<Booking>(recentBookingsQuery);

    const combinedFeed = useMemo(() => {
        if (!isAdmin) return [];
        const feed: RecentActivityItem[] = [];
        if (recentUsers) {
            feed.push(...recentUsers.map(u => ({ type: 'signup' as const, data: u, timestamp: u.createdAt })));
        }
        if (recentOrders) {
            feed.push(...recentOrders.map(o => ({ type: 'order' as const, data: o, timestamp: o.createdAt })));
        }
        if (recentBookings) {
             recentBookings.forEach(b => {
                 // Convert string date to a pseudo-timestamp for sorting.
                 const date = new Date(b.date);
                 if (!isNaN(date.getTime())) {
                    feed.push({ type: 'booking' as const, data: b, timestamp: Timestamp.fromDate(date) });
                 }
             })
        }
        
        const validFeed = feed.filter(item => item.timestamp && item.timestamp.seconds);
        
        return validFeed.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds).slice(0, 10);

    }, [recentUsers, recentOrders, recentBookings, isAdmin]);

    const renderActivity = (activity: RecentActivityItem) => {
        const time = format(new Date(activity.timestamp.seconds * 1000), 'HH:mm');
        switch (activity.type) {
            case 'signup':
                return <><UserPlus className="h-4 w-4 text-green-500" /> <p>Novo registo: <strong>{activity.data.displayName}</strong> ({activity.data.role})</p> <span className="text-muted-foreground">{time}</span></>;
            case 'order':
                return <><ShoppingCart className="h-4 w-4 text-blue-500" /> <p>Nova encomenda de <strong>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(activity.data.totalAmount)}</strong></p> <span className="text-muted-foreground">{time}</span></>;
            case 'booking':
                return <><CalendarCheck className="h-4 w-4 text-orange-500" /> <p>Nova reserva para <strong>{activity.data.serviceName}</strong></p> <span className="text-muted-foreground">{time}</span></>;
        }
    }

    if (!isAdmin) {
        return (
            <Card className="col-span-1 lg:col-span-2">
                 <CardHeader>
                    <CardTitle>Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Não tem permissão para ver esta informação.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {(usersLoading || ordersLoading || bookingsLoading) ? (
                    Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
                ) : combinedFeed.length > 0 ? (
                    combinedFeed.map((activity, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                           {renderActivity(activity)}
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente.</p>
                )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function AnalyticsPage() {
    const firestore = useFirestore();
    const { isAdmin, isProfileLoading } = usePartner();

    // Query for all users, only if the user is an admin.
    const usersQuery = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        return query(collection(firestore, 'users'));
    }, [firestore, isAdmin]);
    
    const { data: users, isLoading: areUsersLoading } = useCollection<UserProfile>(usersQuery);
    
    const [dailyStats, setDailyStats] = useState({ signups: 0, orders: 0 });
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    useEffect(() => {
        if (!firestore || !isAdmin) {
            setIsLoadingStats(false);
            return;
        };

        const fetchDailyStats = async () => {
            setIsLoadingStats(true);
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayTimestamp = Timestamp.fromDate(todayStart);

            const dailySignupsQuery = query(collection(firestore, 'users'), where('createdAt', '>=', todayTimestamp));
            const dailyOrdersQuery = query(collectionGroup(firestore, 'orders'), where('createdAt', '>=', todayTimestamp));

            try {
                const [signupsSnap, ordersSnap] = await Promise.all([
                    getDocs(dailySignupsQuery),
                    getDocs(dailyOrdersQuery)
                ]);
                setDailyStats({
                    signups: signupsSnap.size,
                    orders: ordersSnap.size,
                });
            } catch (error) {
                console.error("Error fetching daily stats:", error);
            } finally {
                setIsLoadingStats(false);
            }
        };

        fetchDailyStats();
    }, [firestore, isAdmin]);
    
    const totalUsers = users?.length ?? 0;
    const totalVendors = users?.filter(u => u.role === 'vendor').length ?? 0;
    const isLoading = areUsersLoading || isLoadingStats || isProfileLoading;

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="space-y-8">
                 <div className="mb-8">
                     <h1 className="font-headline text-3xl md:text-4xl font-bold flex items-center gap-2">
                        <BarChart className="h-8 w-8" />
                        Análise em Tempo Real
                    </h1>
                    <p className="text-muted-foreground mt-2">
                       Acompanhe o crescimento e a atividade da sua plataforma.
                    </p>
                </div>
                
                {!isAdmin && !isLoading && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Acesso Negado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Não tem permissão para aceder a esta página de análise.</p>
                        </CardContent>
                    </Card>
                )}

                {isAdmin && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Total de Utilizadores" value={totalUsers} icon={Users} isLoading={isLoading} />
                        <StatCard title="Total de Parceiros" value={totalVendors} icon={Users} isLoading={isLoading} />
                        <StatCard title="Novos Registos (Hoje)" value={dailyStats.signups} icon={UserPlus} isLoading={isLoading} />
                        <StatCard title="Encomendas (Hoje)" value={dailyStats.orders} icon={ShoppingCart} isLoading={isLoading} />
                    </div>
                    
                    <div className="grid gap-4 lg:grid-cols-4">
                        <UserGrowthChart users={users} />
                        <RecentActivityFeed />
                    </div>
                  </>
                )}

                 {isLoading && (
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                           <Skeleton className="h-28 w-full" />
                           <Skeleton className="h-28 w-full" />
                           <Skeleton className="h-28 w-full" />
                           <Skeleton className="h-28 w-full" />
                        </div>
                         <div className="grid gap-4 lg:grid-cols-4">
                            <Skeleton className="h-80 w-full lg:col-span-2" />
                            <Skeleton className="h-80 w-full lg:col-span-2" />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

    

    