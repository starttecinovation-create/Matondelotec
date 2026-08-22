'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { 
  Crown, 
  Wallet, 
  Check, 
  TrendingUp, 
  Sparkles, 
  Calculator, 
  BadgePercent, 
  Download, 
  Briefcase,
  CheckCircle2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SubscriptionPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    // 1. Interactive Projections States for the Entrepreneur
    const [pricePerService, setPricePerService] = useState<number>(15000); // Default average service price in AOA
    const [bookingsPerDay, setBookingsPerDay] = useState<number>(5);       // Average bookings/clients per day
    const [workingDays, setWorkingDays] = useState<number>(24);           // Working days per month
    const [operatingCostPct, setOperatingCostPct] = useState<number>(20);  // Estimated expenses percentage (e.g. 20%)

    // Calculated metrics
    const [dailyRevenue, setDailyRevenue] = useState<number>(0);
    const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0);
    const [annualRevenue, setAnnualRevenue] = useState<number>(0);
    const [monthlyNetProfit, setMonthlyNetProfit] = useState<number>(0);
    const [commissionSavings, setCommissionSavings] = useState<number>(0); // Matondelo 0% vs standard 15% booking commission

    // Recalculate whenever inputs change
    useEffect(() => {
        const daily = pricePerService * bookingsPerDay;
        const monthly = daily * workingDays;
        const annual = monthly * 12;
        const netProfit = monthly * (1 - operatingCostPct / 100);
        const savings = monthly * 0.15; // Typical 15% saved from commissions on other apps

        setDailyRevenue(daily);
        setMonthlyRevenue(monthly);
        setAnnualRevenue(annual);
        setMonthlyNetProfit(netProfit);
        setCommissionSavings(savings);
    }, [pricePerService, bookingsPerDay, workingDays, operatingCostPct]);

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<any>(userProfileRef);

    const handleExportProjections = () => {
        const summaryText = `
=== MATONDELO ANGOLA: PLANO DE CRESCIMENTO ===
Nome do Parceiro: ${userProfile?.displayName || 'Empreendedor'}
E-mail: ${user?.email || ''}

PROJEÇÃO FINANCEIRA SIMULADA:
- Preço Médio por Serviço: ${pricePerService.toLocaleString('pt-AO')} Kz
- Clientes / Reservas por Dia: ${bookingsPerDay}
- Dias de Trabalho no Mês: ${workingDays} dias
- Margem de Custos Operacionais: ${operatingCostPct}%

RESULTADOS CALCULADOS:
- Faturamento Diário Estimado: ${dailyRevenue.toLocaleString('pt-AO')} Kz
- Faturamento Mensal Bruto: ${monthlyRevenue.toLocaleString('pt-AO')} Kz
- Faturamento Anual Bruto: ${annualRevenue.toLocaleString('pt-AO')} Kz
- Lucro Líquido Mensal Estimado: ${monthlyNetProfit.toLocaleString('pt-AO')} Kz
- Poupança Mensal em Comissões (0% Matondelo vs 15% Outros): ${commissionSavings.toLocaleString('pt-AO')} Kz

Plano Ativo: Plano Empreendedor Angola (100% Gratuito & Vitalício)
==============================================
        `;
        
        const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Matondelo_Projecao_Financeira.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "Projecções Exportadas!",
            description: "O rascunho do seu plano financeiro foi descarregado com sucesso.",
        });
    };

    return (
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl space-y-10" id="subscription_partner_root">
            
            {/* Header Area */}
            <div className="text-left space-y-2">
                <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0F3460]/10 text-[#0F3460] border border-[#0F3460]/20 flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Sem Mensalidades
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20">
                        Apoio ao Empreendedorismo
                    </span>
                </div>
                <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                    Seu Plano & Projeções de Negócio
                </h1>
                <p className="text-muted-foreground text-sm max-w-3xl leading-relaxed">
                    No Matondelo, acreditamos que o sucesso do empreendedor local é o motor de Angola. Por isso, **removemos todas as taxas de subscrição mensal e comissões**. Use nosso ecossistema de graça para crescer!
                </p>
            </div>

            {/* Grid Layout: Active Plan vs Smart Projection Calculator */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Active Plan Card (Left side, takes 4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-t-4 border-t-[#0F3460] shadow-md bg-card">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Crown className="w-5 h-5 text-[#0F3460] fill-[#0F3460]" /> Plano Empreendedor
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Seu acesso total e ilimitado às ferramentas integradas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-[#0F3460]/5 rounded-xl border border-[#0F3460]/10 text-left space-y-1.5">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Status da Conta</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
                                    <strong className="text-sm text-foreground">Ativo e Vitalício</strong>
                                </div>
                                <div className="text-2xl font-black text-[#0F3460] mt-2">
                                    0 Kz <span className="text-xs font-normal text-muted-foreground">/ para sempre</span>
                                </div>
                            </div>

                            <div className="space-y-2.5 pt-2">
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Acessos Liberados:</h4>
                                <ul className="space-y-2 text-xs">
                                    <li className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                        <span><strong>CRM Inteligente:</strong> Integração com Gmail, Sheets, Docs, Slides, Classroom, Meet e Keep.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                        <span><strong>Mati IA Assistente:</strong> Criação de materiais, cronogramas de aula e propostas via Gemini.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                        <span><strong>Visibilidade de Serviços:</strong> Serviços listados de graça para busca pública.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                        <span><strong>Taxa de Comissão:</strong> 0% retido. Todo faturamento direto é 100% seu.</span>
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-2">
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg w-full text-left">
                                <Wallet className="h-5 w-5 text-[#0F3460] shrink-0" />
                                <div className="truncate">
                                    <span className="text-[10px] text-muted-foreground block">Seu Saldo Virtual</span>
                                    {isProfileLoading ? (
                                        <Skeleton className="h-4 w-20" />
                                    ) : (
                                        <strong className="text-sm text-foreground">
                                            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(userProfile?.balance || 0)}
                                        </strong>
                                    )}
                                </div>
                            </div>
                        </CardFooter>
                    </Card>

                    <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-2 text-left">
                        <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                            <Sparkles className="w-4 h-4 fill-amber-500 text-amber-600" /> Nota de Compromisso
                        </span>
                        <p className="text-[11px] leading-relaxed text-amber-900/95">
                            O Ecossistema Matondelo apoia microempreendedores, motoristas autónomos e freelancers em Luanda e províncias. Todas as opções de agendamento, faturamento e sincronização em nuvem permanecem livres de encargos ocultos.
                        </p>
                    </div>
                </div>

                {/* Smart ROI & Projection Calculator (Right side, takes 8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="shadow-lg border border-muted-foreground/10">
                        <CardHeader className="bg-muted/30 border-b border-border/60">
                            <div className="flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-[#0F3460]" />
                                <CardTitle className="text-lg font-bold">Simulador Inteligente de Crescimento (Angola)</CardTitle>
                            </div>
                            <CardDescription className="text-xs">
                                Ajuste os parâmetros do seu negócio para visualizar o faturamento estimado e a economia de taxas de comissão.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            
                            {/* Inputs section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="priceInput" className="text-xs font-bold text-slate-700">Preço Médio do seu Serviço (AOA)</Label>
                                    <div className="relative">
                                        <Input 
                                            id="priceInput"
                                            type="number"
                                            value={pricePerService}
                                            onChange={(e) => setPricePerService(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="h-9 pl-12 text-xs"
                                        />
                                        <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-semibold">Kz</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground block">Ex: 15.000 Kz para serviços padrão em Angola.</span>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="bookingsInput" className="text-xs font-bold text-slate-700">Reservas / Clientes por Dia</Label>
                                    <Input 
                                        id="bookingsInput"
                                        type="number"
                                        value={bookingsPerDay}
                                        onChange={(e) => setBookingsPerDay(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="h-9 text-xs"
                                    />
                                    <span className="text-[10px] text-muted-foreground block">Quantos agendamentos ou vendas consegue fazer por dia.</span>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="daysInput" className="text-xs font-bold text-slate-700">Dias de Trabalho no Mês</Label>
                                    <Input 
                                        id="daysInput"
                                        type="number"
                                        value={workingDays}
                                        onChange={(e) => setWorkingDays(Math.max(1, Math.min(31, parseInt(e.target.value) || 24)))}
                                        className="h-9 text-xs"
                                    />
                                    <span className="text-[10px] text-muted-foreground block">Média de dias activos por mês (padrão de 20 a 26 dias).</span>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="costsInput" className="text-xs font-bold text-slate-700">Custos Operacionais Est. (%)</Label>
                                    <Input 
                                        id="costsInput"
                                        type="number"
                                        value={operatingCostPct}
                                        onChange={(e) => setOperatingCostPct(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                                        className="h-9 text-xs"
                                    />
                                    <span className="text-[10px] text-muted-foreground block">Combustível, internet, ingredientes ou insumos (média 20%).</span>
                                </div>
                            </div>

                            {/* Outputs Dashboard visual blocks */}
                            <div className="pt-4 border-t border-border/80 space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <TrendingUp className="w-4 h-4 text-green-600" /> Resultados Projetados
                                </h3>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-[#0F3460]/5 p-3 rounded-xl border border-[#0F3460]/10 text-left">
                                        <span className="text-[10px] text-muted-foreground block font-medium">Faturamento Diário</span>
                                        <strong className="text-sm md:text-base text-[#0F3460]">
                                            {dailyRevenue.toLocaleString('pt-AO')} Kz
                                        </strong>
                                    </div>
                                    <div className="bg-[#0F3460]/5 p-3 rounded-xl border border-[#0F3460]/10 text-left">
                                        <span className="text-[10px] text-muted-foreground block font-medium">Faturamento Mensal</span>
                                        <strong className="text-sm md:text-base text-[#0F3460]">
                                            {monthlyRevenue.toLocaleString('pt-AO')} Kz
                                        </strong>
                                    </div>
                                    <div className="bg-green-500/5 p-3 rounded-xl border border-green-500/10 text-left">
                                        <span className="text-[10px] text-green-700 block font-bold flex items-center gap-1">
                                            Lucro Líquido <Sparkles className="w-3 h-3 text-orange-500 animate-pulse" />
                                        </span>
                                        <strong className="text-sm md:text-base text-green-700">
                                            {monthlyNetProfit.toLocaleString('pt-AO')} Kz
                                        </strong>
                                    </div>
                                    <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 text-left">
                                        <span className="text-[10px] text-emerald-800 block font-bold flex items-center gap-1">
                                            Poupança de Taxas <BadgePercent className="w-3 h-3 text-emerald-600" />
                                        </span>
                                        <strong className="text-sm md:text-base text-emerald-800">
                                            +{commissionSavings.toLocaleString('pt-AO')} Kz
                                        </strong>
                                    </div>
                                </div>

                                <div className="bg-[#0F3460]/5 p-4 rounded-xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4 text-[#0F3460]" /> Projeção de Crescimento Anual Bruto
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Com a escala do seu negócio no ecossistema e ferramentas inteligentes de e-mail e CRM, você pode atingir:
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-muted-foreground block">Faturamento Anual</span>
                                        <strong className="text-lg md:text-xl text-[#0F3460] font-black">
                                            {annualRevenue.toLocaleString('pt-AO')} Kz
                                        </strong>
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                        <CardFooter className="bg-muted/10 border-t border-border/60 flex flex-col sm:flex-row justify-between items-center gap-3 py-3">
                            <span className="text-[11px] text-muted-foreground text-center sm:text-left">
                                Use esses números para o seu planejamento financeiro ou plano de negócios.
                            </span>
                            <Button 
                                onClick={handleExportProjections} 
                                size="sm" 
                                className="bg-[#0F3460] hover:bg-[#15457c] text-white flex items-center gap-1.5 text-xs h-8 shrink-0"
                            >
                                <Download className="w-3.5 h-3.5" /> Descarregar Plano de Negócio
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* How to leverage features block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <div className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                                <Briefcase className="w-4 h-4" />
                            </div>
                            <h4 className="text-xs font-bold text-slate-800">1. Cadastre Seus Serviços</h4>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Publique seus táxis, agendamentos, pacotes de entrega ou serviços de catering na nossa seção de Serviços para aparecer instantaneamente.
                            </p>
                        </div>

                        <div className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <h4 className="text-xs font-bold text-slate-800">2. Use o CRM Inteligente</h4>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Acesse a aba **CRM Inteligente** para gerar propostas de email personalizadas, organizar planilhas e produzir relatórios de audio via NotebookLM.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}
