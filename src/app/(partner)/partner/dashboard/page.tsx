'use client';

import { useEffect, useState, useMemo } from 'react';
import { useDoc, useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { collection, collectionGroup, doc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getAreaInsights } from '@/ai/flows/area-insights-flow';
import { 
  Loader2, 
  ShoppingBag, 
  CalendarCheck, 
  User, 
  Handshake, 
  Crown, 
  Building, 
  ShieldCheck, 
  BarChart, 
  Megaphone, 
  UserPlus, 
  FileText, 
  DollarSign, 
  Settings,
  ClipboardList,
  Wallet,
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { type Service, type UserProfile, type Booking, type CrmLog } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { usePartner } from '@/context/partner-context';
import { useRouter } from 'next/navigation';
import { subscriptionReminderFlow } from '@/ai/flows/payment-reminder-flow';
import { getCategoryConfig } from '@/lib/category-helper';

// Widget component to fetch and display area insights
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
                setInsightCount(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInsight();
    }, []);

    return (
        <Card className="border border-[#0F3460]/10 shadow-sm overflow-hidden bg-card">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                  <TrendingUp className="w-4 h-4 text-[#0F3460]" /> Insights de Mercado
                </CardTitle>
                <CardDescription className="text-xs">Restaurantes com avaliação 4.0+ em Luanda</CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-4">
                 {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                ) : (
                    <p className="text-2xl font-black text-[#0F3460]">{insightCount !== null ? insightCount.toLocaleString() : 'N/A'}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">Fonte: Google Maps Platform API</p>
            </CardContent>
        </Card>
    );
}

export default function PartnerDashboardPage() {
    const router = useRouter();
    const { userProfile, isProfileLoading, isAdmin } = usePartner();
    const { user } = useUser();
    const firestore = useFirestore();

    const categoryConfig = useMemo(() => {
        return getCategoryConfig(userProfile?.category);
    }, [userProfile?.category]);

    const [monthlyBookings, setMonthlyBookings] = useState(0);
    const [isBookingsLoading, setIsBookingsLoading] = useState(true);

    // Queries for business statistics
    const servicesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/services`));
    }, [firestore, user]);

    const professionalsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/professionals`));
    }, [firestore, user]);

    const crmLogsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/crmLogs`));
    }, [firestore, user]);

    const { data: services, isLoading: areServicesLoading } = useCollection<Service>(servicesQuery);
    const { data: professionals, isLoading: areProfessionalsLoading } = useCollection<any>(professionalsQuery);
    const { data: crmLogs, isLoading: isCrmLogsLoading } = useCollection<CrmLog>(crmLogsQuery);

    // Get all bookings for this vendor
    useEffect(() => {
        if (!user || !firestore) return;

        const getMonthlyBookings = async () => {
            setIsBookingsLoading(true);
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
                setIsBookingsLoading(false);
            }
        };

        getMonthlyBookings();
    }, [user, firestore]);

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

    // Redirect to welcome page if partner is not yet approved
    useEffect(() => {
        if (!isProfileLoading && userProfile?.verificationStatus === 'pending') {
            router.replace('/partner/welcome');
        }
    }, [userProfile, isProfileLoading, router]);

    if (isProfileLoading || !userProfile || userProfile.verificationStatus === 'pending') {
         return (
            <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const revenueAccumulated = crmLogs ? crmLogs.reduce((acc, log) => acc + (log.price || 0), 0) : 0;

    return (
        <div className="space-y-10 pb-12">
            {/* Elegant Header Banner */}
            <div className="w-full bg-gradient-to-r from-slate-900 via-[#0F3460] to-indigo-900 text-white rounded-2xl overflow-hidden shadow-md">
                <div className="px-6 py-10 md:px-10 md:py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Painel do Empreendedor
                        </span>
                        <h1 className="font-headline text-3xl md:text-4xl font-black tracking-tight">
                            {userProfile?.companyName || 'Minha Empresa'}
                        </h1>
                        <p className="text-slate-200/90 text-sm max-w-xl leading-relaxed">
                            Bem-vindo de volta, <strong className="text-white">{userProfile?.displayName || 'Parceiro'}</strong>. Controle todos os aspectos do seu negócio, de serviços e profissionais a CRM e automações inteligentes.
                        </p>
                    </div>
                    
                    <div className="flex gap-3">
                        <Button asChild variant="outline" className="border-white/20 text-white bg-white/5 hover:bg-white/10 text-xs">
                            <Link href="/partner/profile">Editar Perfil</Link>
                        </Button>
                        <Button asChild className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-sm">
                            <Link href="/partner/bookings">Ver Marcações</Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Business Performance Counters */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-slate-100 shadow-sm bg-card hover:border-[#0F3460]/20 transition-all">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Reservas (Mês)</span>
                            {isBookingsLoading ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <span className="text-3xl font-black text-slate-800">{monthlyBookings}</span>
                            )}
                        </div>
                        <span className="p-3 bg-blue-50 text-[#0F3460] rounded-xl"><CalendarCheck className="w-5 h-5" /></span>
                    </CardContent>
                </Card>

                <Card className="border border-slate-100 shadow-sm bg-card hover:border-[#0F3460]/20 transition-all">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Serviços Ativos</span>
                            {areServicesLoading ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <span className="text-3xl font-black text-slate-800">{services?.length || 0}</span>
                            )}
                        </div>
                        <span className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><ShoppingBag className="w-5 h-5" /></span>
                    </CardContent>
                </Card>

                <Card className="border border-slate-100 shadow-sm bg-card hover:border-[#0F3460]/20 transition-all">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Profissionais</span>
                            {areProfessionalsLoading ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <span className="text-3xl font-black text-slate-800">{professionals?.length || 0}</span>
                            )}
                        </div>
                        <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><User className="w-5 h-5" /></span>
                    </CardContent>
                </Card>

                <Card className="border border-slate-100 shadow-sm bg-card hover:border-[#0F3460]/20 transition-all">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Faturamento (CRM)</span>
                            {isCrmLogsLoading ? (
                                <Skeleton className="h-8 w-24" />
                            ) : (
                                <span className="text-lg font-black text-emerald-700">
                                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(revenueAccumulated)}
                                </span>
                            )}
                        </div>
                        <span className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Wallet className="w-5 h-5" /></span>
                    </CardContent>
                </Card>
            </div>

            {/* Core Functions Bento Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                    <h3 className="font-headline text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Building className="w-5 h-5 text-[#0F3460]" /> Funcionalidades Corporativas
                    </h3>
                    <span className="text-xs text-muted-foreground">Clique para gerir cada módulo</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Module 1: Perfil da Empresa */}
                    <Card className="hover:shadow-md transition-all border border-slate-150 flex flex-col justify-between group">
                        <CardHeader className="pb-3">
                            <span className="p-2.5 rounded-lg bg-orange-50 text-orange-600 w-fit mb-2 block group-hover:scale-105 transition-transform">
                                <Building className="w-5 h-5" />
                            </span>
                            <CardTitle className="text-base font-bold text-slate-800">1. Minha Empresa</CardTitle>
                            <CardDescription className="text-xs leading-relaxed">
                                Complete o perfil da empresa com logotipo, descrição comercial, contactos de suporte, horários semanais e localização geográfica.
                              </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4">
                            <Button asChild variant="ghost" size="sm" className="w-full justify-between hover:bg-slate-50 text-xs">
                                <Link href="/partner/profile">
                                    Gerir Informações <ArrowRight className="w-4 h-4 ml-1 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Module 2: Catálogo de Serviços */}
                    <Card className="hover:shadow-md transition-all border border-slate-150 flex flex-col justify-between group">
                        <CardHeader className="pb-3">
                            <span className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 w-fit mb-2 block group-hover:scale-105 transition-transform">
                                <ShoppingBag className="w-5 h-5" />
                            </span>
                            <CardTitle className="text-base font-bold text-slate-800">2. {categoryConfig.servicePlural}</CardTitle>
                            <CardDescription className="text-xs leading-relaxed">
                                {categoryConfig.serviceDescription}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4">
                            <Button asChild variant="ghost" size="sm" className="w-full justify-between hover:bg-slate-50 text-xs">
                                <Link href="/partner/services">
                                    Gerir {categoryConfig.servicePlural} <ArrowRight className="w-4 h-4 ml-1 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Module 3: Equipa de Profissionais */}
                    <Card className="hover:shadow-md transition-all border border-slate-150 flex flex-col justify-between group">
                        <CardHeader className="pb-3">
                            <span className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 w-fit mb-2 block group-hover:scale-105 transition-transform">
                                <User className="w-5 h-5" />
                            </span>
                            <CardTitle className="text-base font-bold text-slate-800">3. {categoryConfig.professionalPlural}</CardTitle>
                            <CardDescription className="text-xs leading-relaxed">
                                {categoryConfig.professionalDescription}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4">
                            <Button asChild variant="ghost" size="sm" className="w-full justify-between hover:bg-slate-50 text-xs">
                                <Link href="/partner/professionals">
                                    Gerir {categoryConfig.professionalPlural} <ArrowRight className="w-4 h-4 ml-1 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Module 4: Gestão de Reservas */}
                    <Card className="hover:shadow-md transition-all border border-slate-150 flex flex-col justify-between group">
                        <CardHeader className="pb-3">
                            <span className="p-2.5 rounded-lg bg-blue-50 text-blue-600 w-fit mb-2 block group-hover:scale-105 transition-transform">
                                <CalendarCheck className="w-5 h-5" />
                            </span>
                            <CardTitle className="text-base font-bold text-slate-800">4. Reservas & Conflitos</CardTitle>
                            <CardDescription className="text-xs leading-relaxed">
                                Visualize agendamentos recebidos, aprove ou recuse marcações e evite conflitos de horário com sincronização automática do calendário.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4">
                            <Button asChild variant="ghost" size="sm" className="w-full justify-between hover:bg-slate-50 text-xs">
                                <Link href="/partner/bookings">
                                    Gerir Reservas <ArrowRight className="w-4 h-4 ml-1 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Module 5: CRM Inteligente & Clientes */}
                    <Card className="hover:shadow-md transition-all border border-slate-150 flex flex-col justify-between group">
                        <CardHeader className="pb-3">
                            <span className="p-2.5 rounded-lg bg-green-50 text-green-600 w-fit mb-2 block group-hover:scale-105 transition-transform">
                                <ClipboardList className="w-5 h-5" />
                            </span>
                            <CardTitle className="text-base font-bold text-slate-800">5. CRM Inteligente & Logs</CardTitle>
                            <CardDescription className="text-xs leading-relaxed">
                                Histórico completo do cliente, notas de acompanhamento registadas após cada serviço e faturamento acumulado por atendimento.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4">
                            <Button asChild variant="ghost" size="sm" className="w-full justify-between hover:bg-slate-50 text-xs">
                                <Link href="/partner/crm">
                                    Abrir CRM Hub <ArrowRight className="w-4 h-4 ml-1 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Module 6: Planos de Subscrição */}
                    <Card className="hover:shadow-md transition-all border border-slate-150 flex flex-col justify-between group">
                        <CardHeader className="pb-3">
                            <span className="p-2.5 rounded-lg bg-amber-50 text-amber-600 w-fit mb-2 block group-hover:scale-105 transition-transform">
                                <Crown className="w-5 h-5" />
                            </span>
                            <CardTitle className="text-base font-bold text-slate-800">6. Subscrição & Saldo</CardTitle>
                            <CardDescription className="text-xs leading-relaxed">
                                Escolha o seu plano de subscrição mensal, gerencie faturas ativas, comissões de serviço e resgate de saldo do Saldo Virtual.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4">
                            <Button asChild variant="ghost" size="sm" className="w-full justify-between hover:bg-slate-50 text-xs">
                                <Link href="/partner/subscription">
                                    Controlar Faturas <ArrowRight className="w-4 h-4 ml-1 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Module 7: Afiliados */}
                    <Card className="hover:shadow-md transition-all border border-slate-150 flex flex-col justify-between group">
                        <CardHeader className="pb-3">
                            <span className="p-2.5 rounded-lg bg-purple-50 text-purple-600 w-fit mb-2 block group-hover:scale-105 transition-transform">
                                <Handshake className="w-5 h-5" />
                            </span>
                            <CardTitle className="text-base font-bold text-slate-800">7. Rede de Afiliados</CardTitle>
                            <CardDescription className="text-xs leading-relaxed">
                                Convide outros parceiros e negócios locais para a plataforma Matondelo usando o seu link exclusivo e ganhe bónus de recomendação.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 pb-4">
                            <Button asChild variant="ghost" size="sm" className="w-full justify-between hover:bg-slate-50 text-xs">
                                <Link href="/partner/referrals">
                                    Ver Meus Indicados <ArrowRight className="w-4 h-4 ml-1 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Widget: Insight do Mercado */}
                    <AreaInsightCard />
                </div>
            </div>

            {/* General Admin Functions Panel */}
            {isAdmin && (
                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2 pb-1">
                        <ShieldCheck className="w-5 h-5 text-red-600 animate-pulse" />
                        <h3 className="font-headline text-lg font-bold text-slate-800">
                            Painel de Administração Global (Admin)
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {/* Admin Action 1: Verificações de Parceiros */}
                        <Card className="border border-red-100 bg-red-50/10 hover:shadow-sm transition-all">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800">
                                    <ShieldCheck className="w-4 h-4 text-red-600" /> Aprovar Parceiros
                                </CardTitle>
                                <CardDescription className="text-xs">Validação de documentos de novas barbearias e negócios.</CardDescription>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <Button asChild size="sm" className="w-full text-xs bg-red-600 hover:bg-red-700 text-white font-semibold">
                                    <Link href="/partner/admin">Aceder Verificações</Link>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Admin Action 2: Criar Anúncios */}
                        <Card className="border border-red-100 bg-red-50/10 hover:shadow-sm transition-all">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800">
                                    <Megaphone className="w-4 h-4 text-red-600" /> Anúncios da Plataforma
                                </CardTitle>
                                <CardDescription className="text-xs">Enviar comunicados importantes para todos os parceiros.</CardDescription>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <Button asChild size="sm" variant="outline" className="w-full text-xs border-red-200 text-red-700 hover:bg-red-50">
                                    <Link href="/partner/admin/announcements">Gerir Anúncios</Link>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Admin Action 3: Registar Motoristas */}
                        <Card className="border border-red-100 bg-red-50/10 hover:shadow-sm transition-all">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800">
                                    <UserPlus className="w-4 h-4 text-red-600" /> Registar Motorista
                                </CardTitle>
                                <CardDescription className="text-xs">Adicionar novos motoristas de táxi ao ecossistema.</CardDescription>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <Button asChild size="sm" variant="outline" className="w-full text-xs border-red-200 text-red-700 hover:bg-red-50">
                                    <Link href="/partner/admin/register-driver">Registar</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
