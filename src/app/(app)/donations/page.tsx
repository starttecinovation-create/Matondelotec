'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  HeartHandshake, 
  Loader2, 
  Wallet, 
  BookOpen, 
  Users, 
  Target, 
  ShieldCheck, 
  Briefcase, 
  Cpu, 
  Wrench, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Award, 
  TrendingUp, 
  Layers, 
  Printer, 
  Camera, 
  Monitor, 
  Heart, 
  Building, 
  CheckCircle2, 
  Gift, 
  Sprout,
  Play,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
export type CharityProject = any;
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { processDonation } from '@/ai/flows/donation-flow';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'motion/react';

// Slide metadata and types
const SLIDES = [
  { id: 1, title: "Meu Mentor, Minha Prosperidade", tagline: "Projeto Nacional de Inclusão, Formação Profissional e Empreendedorismo", type: "cover" },
  { id: 2, title: "Missão & Visão de Futuro", tagline: "O alicerce estratégico para a transformação de Angola", type: "mission" },
  { id: 3, title: "Os Cinco Eixos Estratégicos", tagline: "Visão integrada de capacitação e desenvolvimento", type: "axes" },
  { id: 4, title: "A Solução: Mais que um Centro, um Movimento", tagline: "Os três pilares da inclusão produtiva", type: "pillars" },
  { id: 5, title: "Público-Alvo: A Quem Servimos?", tagline: "Foco integral nas comunidades em maior vulnerabilidade", type: "audience" },
  { id: 6, title: "Infraestrutura: Oficinas & Laboratórios", tagline: "Simulação prática em ambientes reais de trabalho", type: "infrastructure" },
  { id: 7, title: "Eixo 1: Tecnologia & Criatividade", tagline: "Preparar o talento angolano para a era digital", type: "tech" },
  { id: 8, title: "Eixo 2: Indústria, Construção & Produção", tagline: "Cursos práticos rigorosamente alinhados com a demanda", type: "industry" },
  { id: 9, title: "O Grande Diferencial: A Mentoria", tagline: "Acompanhamento pessoal e orientação para a vida", type: "mentorship" },
  { id: 10, title: "Do Laboratório para o Mercado", tagline: "Assegurando a transição e a sustentabilidade", type: "market" },
  { id: 11, title: "O Ciclo de Autossustentabilidade", tagline: "Um ecossistema circular onde o trabalho financia o futuro", type: "sustainability" },
  { id: 12, title: "Estaleiro de Obra: 7 Fases de Implementação", tagline: "O plano prático de execução e expansão", type: "fases" },
  { id: 13, title: "O Impacto Social Esperado", tagline: "Mudando realidades e elevando o rendimento local", type: "impact" },
  { id: 14, title: "Juntos, Vamos Mudar Histórias", tagline: "Seja um investidor social da transformação", type: "partners" }
];

function DonationDialog({ project, isOpen, onOpenChange }: { project: CharityProject | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [amount, setAmount] = useState(1000);
    const [isProcessing, setIsProcessing] = useState(false);

    const userProfileRef = useMemoFirebase(() => user ? (firestore ? doc(firestore, 'users', user.uid) : null) : null, [firestore, user]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const handleDonate = async () => {
        if (!user || !project) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Utilizador ou projeto inválido.' });
            return;
        }

        if ((userProfile?.balance || 0) < amount) {
             toast({ variant: 'destructive', title: 'Saldo Insuficiente', description: 'Não tem saldo suficiente para fazer esta doação.' });
             return;
         }

        setIsProcessing(true);
        try {
            const result = await processDonation({ userId: user.uid, projectId: project.id, amount });
            if (result.success) {
                toast({ title: 'Doação Efetuada!', description: 'Obrigado pela sua contribuição.' });
                onOpenChange(false);
            } else {
                toast({ variant: 'destructive', title: 'Erro na Doação', description: result.error });
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Erro Inesperado', description: e.message || 'Ocorreu um erro ao processar a doação.' });
        } finally {
            setIsProcessing(false);
        }
    };

    if (!project) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="font-headline font-bold text-lg">Apoiar Causa</DialogTitle>
                    <DialogDescription className="text-xs">Apoie "{project.title}". Insira o valor da sua contribuição.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between p-3 border rounded-xl bg-slate-50">
                        <div className="flex items-center gap-2">
                             <Wallet className="h-4 w-4 text-[#0F3460]"/>
                             <span className="text-xs font-semibold text-slate-600">Seu Saldo:</span>
                        </div>
                        {isProfileLoading ? <Skeleton className="h-5 w-24"/> : 
                            <span className="font-bold text-slate-800 text-sm">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(userProfile?.balance || 0)}</span>
                        }
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-xs font-bold text-slate-700">Valor (AOA)</Label>
                        <Input 
                            id="amount" 
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            min="100"
                            step="100"
                            className="rounded-xl border-slate-200"
                        />
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" className="rounded-xl text-xs" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button className="bg-[#0F3460] hover:bg-[#164275] text-white rounded-xl text-xs font-bold" onClick={handleDonate} disabled={isProcessing || amount <= 0 || isProfileLoading}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Confirmar Doação
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ProjectCard({ project, onDonateClick }: { project: CharityProject, onDonateClick: (project: CharityProject) => void }) {
    const percentage = (project.raised / project.goal) * 100;
    return (
        <Card className="flex flex-col border border-slate-100 hover:shadow-md transition-all rounded-xl overflow-hidden bg-card">
            <div className="relative aspect-video w-full overflow-hidden border-b border-slate-50">
                <Image src={project.imageUrl} alt={project.title} fill className="object-cover" referrerPolicy="no-referrer" />
                <span className="absolute top-3 left-3 bg-[#0F3460] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {project.id === 'proj-mentor-prosperidade' ? 'Destaque' : 'Campanha'}
                </span>
            </div>
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-bold text-slate-800 line-clamp-1">{project.title}</CardTitle>
                <CardDescription className="text-xs text-[#0F3460]/80 font-medium">Por: {project.organization}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow space-y-4">
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{project.description}</p>
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[#0F3460]">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(project.raised)}</span>
                        <span className="text-muted-foreground font-semibold">Meta: {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(project.goal)}</span>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                    <p className="text-[10px] text-right text-slate-400 font-medium">{percentage.toFixed(0)}% recolhido</p>
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Button className="w-full bg-[#0F3460] hover:bg-[#164275] text-white rounded-xl font-bold text-xs" onClick={() => onDonateClick(project)}>
                    <HeartHandshake className="mr-2 h-4 w-4"/>
                    Apoiar Causa
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function DonationsPage() {
    const firestore = useFirestore();
    const [selectedProject, setSelectedProject] = useState<CharityProject | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'apresentacao' | 'causas'>('apresentacao');
    const [currentSlide, setCurrentSlide] = useState(0);

    const projectsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'charity_projects');
    }, [firestore]);

    const { data: projects, isLoading } = useCollection<CharityProject>(projectsQuery);

    // Seed "Meu Mentor, Minha Prosperidade" as a featured project alongside the others
    useEffect(() => {
        if (!isLoading && (!projects || projects.length === 0) && firestore) {
            const seedProjects = async () => {
                const defaultProjects = [
                    {
                        id: 'proj-mentor-prosperidade',
                        title: 'Meu Mentor, Minha Prosperidade',
                        organization: 'Tchofeca & Somestar',
                        description: 'Plano Director do Centro Nacional de Inclusão, Formação Profissional e Empreendedorismo na República de Angola. Focado na capacitação de pessoas com deficiência física, jovens vulneráveis e mulheres chefes de família.',
                        raised: 4500000,
                        goal: 15000000,
                        imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800'
                    },
                    {
                        id: 'proj-educar',
                        title: 'Educar Angola',
                        organization: 'Fundação Kiandando',
                        description: 'Apoio à construção e renovação de salas de aula e fornecimento de material escolar básico para crianças carenciadas no Bié.',
                        raised: 1200000,
                        goal: 3000000,
                        imageUrl: 'https://picsum.photos/seed/edu/600/400'
                    },
                    {
                        id: 'proj-fome-zero',
                        title: 'Fome Zero Huíla',
                        organization: 'Aliança Solidária',
                        description: 'Distribuição de cabazes alimentares, sementes agrícolas e sistemas de captação de água para as famílias afetadas pela seca extrema na Huíla.',
                        raised: 2500000,
                        goal: 5000000,
                        imageUrl: 'https://picsum.photos/seed/food/600/400'
                    },
                    {
                        id: 'proj-sorrisos',
                        title: 'Sorrisos Saudáveis',
                        organization: 'Médicos do Futuro',
                        description: 'Campanha de cuidados de saúde oral e geral nas comunidades periurbanas de Luanda, oferecendo consultas de rastreio e kits de higiene.',
                        raised: 800000,
                        goal: 2000000,
                        imageUrl: 'https://picsum.photos/seed/health/600/400'
                    }
                ];

                for (const p of defaultProjects) {
                    try {
                        await setDoc(doc(firestore, 'charity_projects', p.id), p);
                    } catch (e) {
                        console.error("Error seeding charity project:", p.id, e);
                    }
                }
            };
            seedProjects();
        }
    }, [projects, isLoading, firestore]);

    const handleDonateClick = (project: CharityProject) => {
        setSelectedProject(project);
        setIsModalOpen(true);
    };

    const handleSupportMentorProject = () => {
        if (projects) {
            const mentorProj = projects.find(p => p.id === 'proj-mentor-prosperidade');
            if (mentorProj) {
                handleDonateClick(mentorProj);
                return;
            }
        }
        handleDonateClick({
            id: 'proj-mentor-prosperidade',
            title: 'Meu Mentor, Minha Prosperidade',
            organization: 'Tchofeca & Somestar',
            raised: 4500000,
            goal: 15000000
        });
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
    };

    const renderSlideContent = (type: string) => {
        switch (type) {
            case "cover":
                return (
                    <div className="grid md:grid-cols-12 gap-6 items-center h-full py-4">
                        <div className="md:col-span-7 space-y-5 text-left">
                            <div className="flex gap-2 justify-start items-center">
                                <span className="text-[9px] bg-slate-900 text-white font-black px-2.5 py-0.5 rounded-full border tracking-widest uppercase">
                                    TCHOFECA
                                </span>
                                <span className="text-[9px] bg-indigo-50 text-indigo-700 font-black px-2.5 py-0.5 rounded-full border border-indigo-100 tracking-widest uppercase">
                                    SOMESTAR
                                </span>
                            </div>
                            <h2 className="font-headline text-2xl md:text-4xl font-black text-[#0F3460] tracking-tight leading-tight">
                                MEU MENTOR,<br/>MINHA PROSPERIDADE
                            </h2>
                            <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
                                Plano Director do Centro Nacional de Inclusão, Formação Profissional e Empreendedorismo na República de Angola. Um marco para o desenvolvimento sustentável e humano.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full pt-2">
                                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center text-center">
                                    <Users className="w-4 h-4 text-indigo-600 mb-0.5" />
                                    <span className="text-[9px] font-bold text-slate-800">Inclusão</span>
                                </div>
                                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center text-center">
                                    <BookOpen className="w-4 h-4 text-emerald-600 mb-0.5" />
                                    <span className="text-[9px] font-bold text-slate-800">Formação</span>
                                </div>
                                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center text-center">
                                    <Briefcase className="w-4 h-4 text-amber-600 mb-0.5" />
                                    <span className="text-[9px] font-bold text-slate-800">Negócios</span>
                                </div>
                                <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center text-center">
                                    <Cpu className="w-4 h-4 text-purple-600 mb-0.5" />
                                    <span className="text-[9px] font-bold text-slate-800">Inovação</span>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-5 h-48 md:h-64 lg:h-72 w-full relative overflow-hidden rounded-xl border border-slate-150 shadow-xs">
                            <img 
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800" 
                                alt="Young professional team collaborating in Angola" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>
                );

            case "mission":
                return (
                    <div className="grid md:grid-cols-12 gap-6 items-center h-full py-2">
                        <div className="md:col-span-7 space-y-3">
                            <div className="p-4 border rounded-xl bg-indigo-50/20 border-indigo-100 flex flex-col justify-between">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg inline-block">
                                            <Target className="w-4 h-4" />
                                        </span>
                                        <h3 className="font-headline text-sm font-bold text-indigo-950">A Nossa Missão</h3>
                                    </div>
                                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                        Promover a inclusão social através de formação profissional de excelência, do empreendedorismo e da inovação, gerando oportunidades reais de emprego e auto-emprego.
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 border rounded-xl bg-emerald-50/20 border-emerald-100 flex flex-col justify-between">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg inline-block">
                                            <Award className="w-4 h-4" />
                                        </span>
                                        <h3 className="font-headline text-sm font-bold text-emerald-950">A Nossa Visão</h3>
                                    </div>
                                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                        Ser a maior referência nacional em inclusão produtiva e empreendedorismo assistido, contribuindo ativamente para uma Angola mais justa, competitiva e digna para todos.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-5 h-48 md:h-64 lg:h-72 w-full relative overflow-hidden rounded-xl border border-slate-150 shadow-xs">
                            <img 
                                src="https://images.unsplash.com/photo-1455849318743-b2233052fcff?auto=format&fit=crop&q=80&w=800" 
                                alt="Inclusive education and target vision planning" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>
                );

            case "axes":
                return (
                    <div className="grid md:grid-cols-12 gap-6 items-center h-full py-2">
                        <div className="md:col-span-7 space-y-2">
                            <h3 className="font-headline text-sm font-bold text-[#0F3460] border-b pb-1">5 Eixos de Atuação</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { id: "01", name: "Inclusão Social", desc: "Acessibilidade e igualdade de oportunidades para pessoas vulneráveis.", color: "bg-blue-50/50 border-blue-100" },
                                    { id: "02", name: "Formação Técnica", desc: "Instalação de oficinas profissionais focadas nas necessidades do mercado.", color: "bg-indigo-50/50 border-indigo-100" },
                                    { id: "03", name: "Empreendedorismo", desc: "Incubação estruturada para dar suporte à criação de microempresas.", color: "bg-amber-50/50 border-amber-100" },
                                    { id: "04", name: "Inovação", desc: "Capacitação digital contínua, incluindo Inteligência Artificial aplicada.", color: "bg-purple-50/50 border-purple-100" },
                                    { id: "05", name: "Sustentabilidade", desc: "Modelo financeiro circular onde o trabalho cobre custos de formação.", color: "bg-emerald-50/50 border-emerald-100" }
                                ].map((item, idx) => (
                                    <div key={idx} className={`p-2 border rounded-lg ${item.color} flex items-start gap-2.5`}>
                                        <span className="text-[10px] font-black text-slate-400 mt-0.5">{item.id}</span>
                                        <div>
                                            <h4 className="font-bold text-[11px] text-slate-800 leading-none">{item.name}</h4>
                                            <p className="text-[9.5px] text-slate-500 leading-normal mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-5 h-48 md:h-64 lg:h-72 w-full relative overflow-hidden rounded-xl border border-slate-150 shadow-xs">
                            <img 
                                src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=800" 
                                alt="Strategic development blueprint visualization" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>
                );

            case "pillars":
                return (
                    <div className="grid md:grid-cols-12 gap-6 items-center h-full py-2">
                        <div className="md:col-span-7 space-y-3">
                            <div className="space-y-2">
                                <div className="p-3 border rounded-xl bg-slate-50 flex items-center gap-3">
                                    <span className="p-2 bg-blue-50 text-blue-600 rounded-full flex-shrink-0"><Wrench className="w-4 h-4"/></span>
                                    <div>
                                        <h4 className="font-bold text-xs text-slate-800">Formação Técnica Prática</h4>
                                        <p className="text-[10px] text-slate-500">Desenvolvimento ágil de competências nas áreas industriais e criativas.</p>
                                    </div>
                                </div>

                                <div className="p-3 border rounded-xl bg-slate-50 flex items-center gap-3">
                                    <span className="p-2 bg-emerald-50 text-emerald-600 rounded-full flex-shrink-0"><Users className="w-4 h-4"/></span>
                                    <div>
                                        <h4 className="font-bold text-xs text-slate-800">Inclusão Produtiva Integral</h4>
                                        <p className="text-[10px] text-slate-500">Garantir dignidade profissional para cidadãos historicamente vulneráveis.</p>
                                    </div>
                                </div>

                                <div className="p-3 border rounded-xl bg-slate-50 flex items-center gap-3">
                                    <span className="p-2 bg-amber-50 text-amber-600 rounded-full flex-shrink-0"><Briefcase className="w-4 h-4"/></span>
                                    <div>
                                        <h4 className="font-bold text-xs text-slate-800">Empreendedorismo de Sucesso</h4>
                                        <p className="text-[10px] text-slate-500">Apoio contínuo e infraestrutura para criação de novos negócios sustentáveis.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#0F3460] text-white text-center py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase mt-2">
                                CAPACITAR É INCLUIR. INCLUIR É PROSPERAR!
                            </div>
                        </div>
                        <div className="md:col-span-5 h-48 md:h-64 lg:h-72 w-full relative overflow-hidden rounded-xl border border-slate-150 shadow-xs">
                            <img 
                                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800" 
                                alt="Professional training and execution framework" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>
                );

            case "audience":
                return (
                    <div className="grid md:grid-cols-12 gap-6 items-center h-full py-2">
                        <div className="md:col-span-7 space-y-3">
                            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                Nossos centros e planos de mentoria são estruturados para garantir acesso prioritário e adaptabilidade às populações desfavorecidas.
                            </p>
                            <div className="space-y-2">
                                {[
                                    { title: "Pessoas com deficiência física e mobilidade reduzida", color: "text-blue-600 bg-blue-50/50" },
                                    { title: "Jovens desempregados e em situação de risco social", color: "text-emerald-600 bg-emerald-50/50" },
                                    { title: "Mulheres chefes de família, viúvas e desamparadas", color: "text-rose-600 bg-rose-50/50" },
                                    { title: "Antigos combatentes e veteranos de guerra", color: "text-amber-600 bg-amber-50/50" },
                                    { title: "Famílias de baixa renda e jovens sem qualificações", color: "text-purple-600 bg-purple-50/50" }
                                ].map((item, idx) => (
                                    <div key={idx} className="p-2.5 border rounded-lg flex items-center gap-3 bg-white hover:shadow-xs transition-shadow">
                                        <span className={`w-2 h-2 rounded-full ${item.color.split(' ')[0]} bg-current`} />
                                        <span className="text-[10.5px] font-bold text-slate-700">{item.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-5 h-48 md:h-64 lg:h-72 w-full relative overflow-hidden rounded-xl border border-slate-150 shadow-xs">
                            <img 
                                src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800" 
                                alt="Angolan inclusive education, diverse community smiling" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>
                );

            case "infrastructure":
                return (
                    <div className="grid md:grid-cols-12 gap-6 items-center h-full py-2">
                        <div className="md:col-span-7 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { title: "Marcenaria", icon: Wrench, desc: "Fabrico de móveis modernos" },
                                    { title: "Caixilharia", icon: Building, desc: "Portas e janelas em alumínio" },
                                    { title: "Gráfica Rápida", icon: Printer, desc: "Sinalética e grandes formatos" },
                                    { title: "Serigrafia", icon: Gift, desc: "Impressão de brindes e vestuário" },
                                    { title: "Design Gráfico", icon: Layers, desc: "Edição criativa multimédia" },
                                    { title: "Fotografia", icon: Camera, desc: "Estúdio comercial profissional" },
                                    { title: "Informática", icon: Monitor, desc: "Literacia digital e produtividade" },
                                    { title: "Inteligência Artificial", icon: Cpu, desc: "Automação digital aplicada" }
                                ].map((item, idx) => (
                                    <div key={idx} className="p-2 border rounded-lg bg-slate-50 flex items-center gap-2">
                                        <item.icon className="w-4 h-4 text-[#0F3460] flex-shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-[10px] text-slate-800 leading-tight">{item.title}</h4>
                                            <p className="text-[8.5px] text-slate-500 leading-none mt-0.5">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-5 h-48 md:h-64 lg:h-72 w-full relative overflow-hidden rounded-xl border border-slate-150 shadow-xs">
                            <img 
                                src="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=800" 
                                alt="Modern industrial workshop equipment tools" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>
                );

            case "tech":
                return (
                    <div className="grid md:grid-cols-12 gap-6 items-center h-full py-2">
                        <div className="md:col-span-7 space-y-3">
                            <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                Tecnologias Emergentes
                            </span>
                            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                Formação voltada para as exigências da era tecnológica de Angola. Preparação ativa para postos de alto rendimento intelectual.
                            </p>
                            <div className="space-y-2">
                                {[
                                    "Artes Gráficas: Impressão e produção de brindes comerciais",
                                    "Design Gráfico & Comunicação Visual Empresarial",
                                    "Informática Geral, Microsoft Office e Ferramentas Cloud",
                                    "Marketing de Redes Sociais e Estratégias de Venda Digital",
                                    "Inteligência Artificial e Prompt Engineering para Negócios"
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg bg-slate-50">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                        <span className="text-[10px] font-bold text-slate-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-5 h-48 md:h-64 lg:h-72 w-full relative overflow-hidden rounded-xl border border-slate-150 shadow-xs">
                            <img 
                                src="https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=800" 
                                alt="Young digital workspace programmer in Luanda tech class" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>
                );

            case "industry":
                return (
                    <div className="grid md:grid-cols-12 gap-6 items-center h-full py-2">
                        <div className="md:col-span-7 space-y-3">
                            <span className="text-[9px] bg-amber-50 border border-amber-150 text-amber-700 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                Indústria Prática
                            </span>
                            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                Oficinas orientadas a responder de forma rápida à demanda de marcenaria, caixilharia de alumínio e serviços gráficos.
                            </p>
                            <div className="space-y-2">
                                {[
                                    "Marcenaria Moderna: Fabricação de portas, cadeiras, roupeiros",
                                    "Caixilharia de Alumínio: Portas, janelas, grades e estruturas",
                                    "Produção Publicitária: Placas de publicidade e reclamos luminosos",
                                    "Serigrafia Têxtil: Personalização de uniformes e brindes corporativos",
                                    "Horticultura Integrada: Gestão de estufas, sementes e hidroponia"
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg bg-slate-50">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                        <span className="text-[10px] font-bold text-slate-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-5 h-48 md:h-64 lg:h-72 w-full relative overflow-hidden rounded-xl border border-slate-150 shadow-xs">
                            <img 
                                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800" 
                                alt="Carpenter workshop and aluminum fabrication" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>
                );

            case "mentorship":
                return (
                    <div className="grid md:grid-cols-12 gap-6 items-center h-full py-2">
                        <div className="md:col-span-7 space-y-3 flex flex-col justify-between h-full">
                            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                                Muito além do diploma técnico, cada beneficiário é acompanhado de forma holística com mentoria espiritual, emocional e financeira.
                            </p>
                            <div className="space-y-2">
                                {[
                                    { id: "01", name: "Alinhamento", desc: "Estruturação das ambições de vida e autoconhecimento." },
                                    { id: "02", name: "Capacitação", desc: "Aprendizagem prática com foco nos produtos de alta procura." },
                                    { id: "03", name: "Ética e Postura", desc: "Desenvolvimento comportamental e liderança pessoal." },
                                    { id: "04", name: "Finanças Básicas", desc: "Introdução à gestão financeira pessoal e empresarial." },
                                    { id: "05", name: "Independência", desc: "Lançamento da própria microempresa ou colocação de emprego." }
                                ].map((step, idx) => (
                                    <div key={idx} className="p-2 border rounded-lg bg-slate-50 flex items-start gap-2.5">
                                        <span className="text-[9.5px] font-black text-[#0F3460] mt-0.5">{step.id}</span>
                                        <div>
                                            <h4 className="font-bold text-[10.5px] text-slate-800 leading-none">{step.name}</h4>
                                            <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-5 h-48 md:h-64 lg:h-72 w-full relative overflow-hidden rounded-xl border border-slate-150 shadow-xs">
                            <img 
                                src="https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800" 
                                alt="Supportive mentorship and classroom guidance" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>
                );

            case "market":
                return (
                    <div className="grid md:grid-cols-12 gap-6 items-center h-full py-2">
                        <div className="md:col-span-7 space-y-3">
                            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                O percurso não acaba na graduação. A incubadora de empresas garante a mentoria comercial por 6 meses para garantir a sobrevivência e crescimento do negócio.
                            </p>
                            <div className="space-y-2">
                                {[
                                    "Abertura formal de atividade comercial e microempresa",
                                    "Concessão de microcrédito e fornecimento de kits de ferramentas",
                                    "Integração na plataforma nacional de vendas Meu Mentor",
                                    "Geração de parcerias com clientes corporativos e contratos B2B",
                                    "Monitoramento de faturação e saúde financeira do empreendedor"
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-2 border rounded-lg bg-slate-50">
                                        <span className="w-4 h-4 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-700 text-[9px] font-black">
                                            {idx + 1}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-700">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-5 h-48 md:h-64 lg:h-72 w-full relative overflow-hidden rounded-xl border border-slate-150 shadow-xs">
                            <img 
                                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800" 
                                alt="Angolan local commerce, entrepreneur success" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>
                );

            case "sustainability":
                return (
                    <div className="grid md:grid-cols-12 gap-6 items-center h-full py-2">
                        <div className="md:col-span-7 space-y-3">
                            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                Um modelo de negócio circular onde a produção realizada nas próprias oficinas cobre os custos e gera financiamento de novas turmas de formação.
                            </p>
                            <div className="space-y-2">
                                <div className="p-2.5 border rounded-lg bg-slate-50 flex items-center gap-3">
                                    <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Wallet className="w-4 h-4"/></span>
                                    <p className="text-[9.5px] text-slate-600 font-bold leading-tight">Fundos Iniciais: Aquisição de maquinarias industriais avançadas.</p>
                                </div>
                                <div className="p-2.5 border rounded-lg bg-slate-50 flex items-center gap-3">
                                    <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><Briefcase className="w-4 h-4"/></span>
                                    <p className="text-[9.5px] text-slate-600 font-bold leading-tight">Vendas Diretas: Comercialização de móveis, esquadrias e serviços de sinalética.</p>
                                </div>
                                <div className="p-2.5 border rounded-lg bg-slate-50 flex items-center gap-3">
                                    <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><Sprout className="w-4 h-4"/></span>
                                    <p className="text-[9.5px] text-slate-600 font-bold leading-tight">Bolsas de Estudos Circulares: O excedente é reinvestido integralmente na educação.</p>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-5 h-48 md:h-64 lg:h-72 w-full relative overflow-hidden rounded-xl border border-slate-150 shadow-xs">
                            <img 
                                src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800" 
                                alt="Ecosystem growth, circular sustainability" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>
                );

            case "fases":
                return (
                    <div className="grid md:grid-cols-12 gap-6 items-center h-full py-2">
                        <div className="md:col-span-7 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { f: "Fase 1", name: "Fundação", d: "Registo formal do projeto e instalações base." },
                                    { f: "Fase 2", name: "Formação Inicial", d: "Acolhimento de beneficiários e primeiras turmas." },
                                    { f: "Fase 3", name: "Oficinas Industriais", d: "Montagem dos maquinários e fabricação prática." },
                                    { f: "Fase 4", name: "Incubadora", d: "Arranque do suporte à criação de negócios." },
                                    { f: "Fase 5", name: "Sustentabilidade", d: "Faturação comercial e consolidação financeira B2B." },
                                    { f: "Fase 6", name: "Expansão Regional", d: "Abertura em Benguela, Huambo, Huíla." },
                                    { f: "Fase 7", name: "Rede Nacional", d: "Integração digital em toda a República de Angola." }
                                ].map((phase, idx) => (
                                    <div key={idx} className="p-2 border rounded-lg bg-slate-50 flex flex-col justify-between h-full">
                                        <span className="text-[8.5px] font-black text-[#0F3460] uppercase">{phase.f}</span>
                                        <h4 className="font-bold text-[10px] text-slate-800 leading-none my-0.5">{phase.name}</h4>
                                        <p className="text-[8px] text-slate-500 leading-normal">{phase.d}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-5 h-48 md:h-64 lg:h-72 w-full relative overflow-hidden rounded-xl border border-slate-150 shadow-xs">
                            <img 
                                src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=800" 
                                alt="Construction blueprint roadmap execution" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>
                );

            case "impact":
                return (
                    <div className="grid md:grid-cols-12 gap-6 items-center h-full py-2">
                        <div className="md:col-span-7 space-y-3">
                            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                                O impacto do projeto mede-se no prato de comida e no sustento autónomo das famílias vulneráveis de Angola.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 border rounded-lg bg-slate-50 text-center">
                                    <span className="block text-lg font-black text-[#0F3460]">Anual</span>
                                    <span className="text-[9px] font-bold text-slate-500 mt-0.5 block leading-tight">Centenas de jovens qualificados</span>
                                </div>
                                <div className="p-3 border rounded-lg bg-slate-50 text-center">
                                    <span className="block text-lg font-black text-[#0F3460]">+60%</span>
                                    <span className="text-[9px] font-bold text-slate-500 mt-0.5 block leading-tight">Taxa de inserção real no mercado</span>
                                </div>
                                <div className="p-3 border rounded-lg bg-slate-50 text-center">
                                    <span className="block text-lg font-black text-[#0F3460]">Nacional</span>
                                    <span className="text-[9px] font-bold text-slate-500 mt-0.5 block leading-tight">Criação ativa de novos negócios locais</span>
                                </div>
                                <div className="p-3 border rounded-lg bg-slate-50 text-center">
                                    <span className="block text-lg font-black text-[#0F3460]">Familiar</span>
                                    <span className="text-[9px] font-bold text-slate-500 mt-0.5 block leading-tight">Aumento direto no rendimento familiar médio</span>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-5 h-48 md:h-64 lg:h-72 w-full relative overflow-hidden rounded-xl border border-slate-150 shadow-xs">
                            <img 
                                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800" 
                                alt="High impact positive social outcome" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>
                );

            case "partners":
                return (
                    <div className="grid md:grid-cols-12 gap-6 items-center h-full py-2">
                        <div className="md:col-span-7 space-y-3">
                            <div className="flex gap-2 items-center">
                                <span className="p-1 bg-indigo-50 text-indigo-600 rounded-full animate-pulse">
                                    <Heart className="w-4 h-4 fill-indigo-600" />
                                </span>
                                <h4 className="font-headline text-xs font-black text-slate-800">Parceiros da Transformação</h4>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                                Convidamos empresas privadas, organizações não governamentais e cidadãos generosos a participarem no financiamento desta causa em Angola.
                            </p>
                            
                            <div className="grid grid-cols-1 gap-1.5 pt-1">
                                <div className="p-2 border rounded-lg bg-slate-50 flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                    <span className="text-[10px] font-bold text-slate-700">923 61 82 44</span>
                                </div>

                                <div className="p-2 border rounded-lg bg-slate-50 flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                                    <span className="text-[10px] font-bold text-slate-700">tchofeca@gmail.com</span>
                                </div>

                                <div className="p-2 border rounded-lg bg-slate-50 flex items-center gap-2">
                                    <Globe className="w-3.5 h-3.5 text-[#0F3460] flex-shrink-0" />
                                    <span className="text-[10px] font-bold text-slate-700">www.tchofeca.com</span>
                                </div>
                            </div>

                            <Button 
                                onClick={handleSupportMentorProject}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] px-4 py-1.5 shadow-sm mt-1 w-full"
                            >
                                <HeartHandshake className="w-3.5 h-3.5 mr-1.5" /> Fazer uma Doação Direta
                            </Button>
                        </div>
                        <div className="md:col-span-5 h-48 md:h-64 lg:h-72 w-full relative overflow-hidden rounded-xl border border-slate-150 shadow-xs">
                            <img 
                                src="https://images.unsplash.com/photo-1521791136368-1a46827d0adf?auto=format&fit=crop&q=80&w=800" 
                                alt="Cooperative partners agreement handshake" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <>
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
            {/* Header minimal, premium feel */}
            <div className="text-center space-y-3 mb-10">
                <div className="inline-flex p-3 bg-slate-50 border border-slate-100 text-[#0F3460] rounded-2xl shadow-xs">
                    <HeartHandshake className="w-8 h-8" />
                </div>
                <h1 className="font-headline text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
                    Inclusão & Responsabilidade Social
                </h1>
                <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
                    Apoie projetos sociais genuínos em Angola e faça parte de um ecossistema que transforma talentos e constrói dignidade.
                </p>

                {/* Switcher tabs */}
                <div className="flex justify-center pt-4">
                    <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setActiveTab('apresentacao')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'apresentacao' ? 'bg-[#0F3460] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            Apresentação do Projeto
                        </button>
                        <button
                            onClick={() => setActiveTab('causas')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'causas' ? 'bg-[#0F3460] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                            Causas para Doar
                        </button>
                    </div>
                </div>
            </div>

            {/* View Panels */}
            {activeTab === 'apresentacao' ? (
                <div className="space-y-6">
                    {/* Presentation Slider Wrapper */}
                    <Card className="border border-slate-150 overflow-hidden shadow-md rounded-2xl bg-white max-w-5xl mx-auto flex flex-col justify-between min-h-[460px] md:min-h-[500px]">
                        {/* Slide Top Navigation Info */}
                        <div className="border-b border-slate-100 p-4 bg-slate-50 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">
                                    Slide {SLIDES[currentSlide].id} de {SLIDES.length}
                                </span>
                                <h3 className="font-headline text-sm font-black text-slate-800">
                                    {SLIDES[currentSlide].title}
                                </h3>
                            </div>
                            <span className="text-[10px] bg-amber-100 text-slate-800 font-bold px-2.5 py-0.5 rounded border border-amber-200 uppercase">
                                PROJETO NACIONAL
                            </span>
                        </div>

                        {/* Slide Frame Stage */}
                        <div className="p-6 md:p-8 flex-grow flex flex-col justify-center">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentSlide}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.18 }}
                                    className="h-full"
                                >
                                    {renderSlideContent(SLIDES[currentSlide].type)}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Slide Bottom Controls */}
                        <div className="border-t border-slate-100 p-4 bg-slate-50 flex items-center justify-between">
                            {/* Slide dot indicator index */}
                            <div className="flex gap-1 overflow-x-auto max-w-[200px] md:max-w-none py-1">
                                {SLIDES.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentSlide(idx)}
                                        className={`h-1.5 rounded-full transition-all flex-shrink-0 ${idx === currentSlide ? 'w-4 bg-[#0F3460]' : 'w-1.5 bg-slate-300 hover:bg-slate-400'}`}
                                    />
                                ))}
                            </div>
                            
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={prevSlide}
                                    className="border-slate-200 hover:bg-slate-100 h-9 w-9 p-0 rounded-lg"
                                >
                                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={nextSlide}
                                    className="border-slate-200 hover:bg-slate-100 h-9 w-9 p-0 rounded-lg"
                                >
                                    <ChevronRight className="w-4 h-4 text-slate-600" />
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Quick navigation index deck */}
                    <div className="max-w-5xl mx-auto p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-400 block mb-3 uppercase tracking-wider text-center">Índice da Apresentação</span>
                        <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
                            {SLIDES.map((slide, idx) => (
                                <button
                                    key={slide.id}
                                    onClick={() => setCurrentSlide(idx)}
                                    className={`p-2 rounded-lg text-[9px] font-bold transition-all text-center leading-tight truncate ${idx === currentSlide ? 'bg-[#0F3460] text-white' : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-150'}`}
                                >
                                    {slide.id}. {slide.title.split(":")[0]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading ? (
                             Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-[420px] w-full rounded-xl" />)
                        ) : projects && projects.length > 0 ? (
                            projects.map(proj => (
                                <ProjectCard key={proj.id} project={proj} onDonateClick={handleDonateClick} />
                            ))
                        ) : (
                            <p className="col-span-full text-center text-muted-foreground">Nenhuma causa ativa disponível para apoiar de momento.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
        <DonationDialog project={selectedProject} isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
        </>
    );
}
