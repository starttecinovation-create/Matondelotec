'use client';

import { usePartner } from '@/context/partner-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { SiteSettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function WelcomePage() {
    const { userProfile, isProfileLoading } = usePartner();
    const router = useRouter();
    const firestore = useFirestore();

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_settings', 'monetization') : null, [firestore]);
    const { data: siteSettings, isLoading: areSettingsLoading } = useDoc<SiteSettings>(settingsRef);
    
    // Redirect approved users away from this page
    useEffect(() => {
        if (!isProfileLoading && userProfile?.verificationStatus === 'approved') {
            router.replace('/partner/dashboard');
        }
    }, [userProfile, isProfileLoading, router]);

    const isLoading = isProfileLoading || areSettingsLoading;
    const subscriptionPrice = siteSettings?.subscriptionPrice || 0;

    if (isLoading || !userProfile) {
        return (
            <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    // Fallback in case the redirect hasn't happened yet
    if (userProfile.verificationStatus !== 'pending') {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader className="items-center text-center">
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                            <Clock className="w-10 h-10 text-primary" />
                        </div>
                        <CardTitle className="font-headline text-2xl">Bem-vindo, {userProfile.displayName}!</CardTitle>
                        <CardDescription className="text-lg">A sua conta de parceiro está quase pronta.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 text-center">
                        <p className="text-muted-foreground">
                            Obrigado pelo seu registo. A sua conta está atualmente a ser revista pela nossa equipa de parcerias. Este processo é para garantir a qualidade e segurança da nossa plataforma.
                            Normalmente, a revisão demora menos de 24 horas.
                        </p>
                        <div className="p-4 border rounded-lg bg-background">
                            <p className="font-semibold">O seu plano já está ativo!</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                O Matondelo removeu todas as taxas de assinatura para apoiar o empreendedorismo em Angola. Sua conta é e sempre será 100% gratuita. Enquanto sua conta passa pela aprovação final, você já pode projetar suas metas financeiras.
                            </p>
                            <div className="mt-4">
                                <p className="text-lg font-bold text-[#0F3460]">
                                    Plano Empreendedor: Grátis & Vitalício
                                </p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-[#0F3460] hover:bg-[#15457c] text-white" size="lg" asChild>
                            <Link href="/partner/subscription">
                                <Clock className="mr-2 h-4 w-4" />
                                Visualizar Projeções de Negócio & ROI
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
