'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HeartHandshake, Loader2, Wallet } from 'lucide-react';
import Image from 'next/image';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
export type CharityProject = any;
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { processDonation } from '@/ai/flows/donation-flow';
import { Label } from '@/components/ui/label';

function DonationDialog({ project, isOpen, onOpenChange }: { project: CharityProject | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [amount, setAmount] = useState(1000);
    const [isProcessing, setIsProcessing] = useState(false);

    const userProfileRef = useMemoFirebase(() => user ? firestore && user ? doc(firestore, 'users', user.uid) : null : null, [firestore, user]);
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Doar para "{project.title}"</DialogTitle>
                    <DialogDescription>A sua contribuição faz a diferença. Insira o valor que deseja doar.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted">
                        <div className="flex items-center gap-2">
                             <Wallet className="h-5 w-5 text-muted-foreground"/>
                             <span className="text-sm font-medium">Seu Saldo:</span>
                        </div>
                        {isProfileLoading ? <Skeleton className="h-5 w-24"/> : 
                            <span className="font-bold">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(userProfile?.balance || 0)}</span>
                        }
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount">Valor da Doação (AOA)</Label>
                        <Input 
                            id="amount" 
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            min="100"
                            step="100"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleDonate} disabled={isProcessing || amount <= 0 || isProfileLoading}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Doar {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(amount)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


function ProjectCard({ project, onDonateClick }: { project: CharityProject, onDonateClick: (project: CharityProject) => void }) {
    const percentage = (project.raised / project.goal) * 100;
    return (
        <Card className="flex flex-col">
            <div className="relative aspect-video w-full overflow-hidden rounded-t-lg border-b">
                <Image src={project.imageUrl} alt={project.title} fill className="object-cover" />
            </div>
            <CardHeader>
                <CardTitle>{project.title}</CardTitle>
                <CardDescription>Por: {project.organization}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <p className="text-sm text-muted-foreground">{project.description}</p>
                <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                        <span className="font-semibold">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(project.raised)}</span>
                        <span className="text-muted-foreground">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(project.goal)}</span>
                    </div>
                    <Progress value={percentage} />
                     <p className="text-xs text-center mt-1 text-muted-foreground">{percentage.toFixed(0)}% da meta atingida</p>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={() => onDonateClick(project)}>
                    <HeartHandshake className="mr-2 h-4 w-4"/>
                    Doar Agora
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function DonationsPage() {
    const firestore = useFirestore();
    const [selectedProject, setSelectedProject] = useState<CharityProject | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const projectsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'charity_projects');
    }, [firestore]);

    const { data: projects, isLoading } = useCollection<CharityProject>(projectsQuery);

    const handleDonateClick = (project: CharityProject) => {
        setSelectedProject(project);
        setIsModalOpen(true);
    }
    
    return (
        <>
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-4xl mx-auto space-y-8">
                 <div className="text-center">
                    <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                        <HeartHandshake className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">Projetos de Responsabilidade Social</h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Faça a diferença. Apoie uma causa e ajude a construir um futuro melhor para Angola.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                         Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-[450px] w-full" />)
                    ) : projects && projects.length > 0 ? (
                        projects.map(proj => (
                            <ProjectCard key={proj.id} project={proj} onDonateClick={handleDonateClick} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-muted-foreground">Nenhum projeto de caridade disponível no momento.</p>
                    )}
                </div>
            </div>
        </div>
        <DonationDialog project={selectedProject} isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
        </>
    )
}
