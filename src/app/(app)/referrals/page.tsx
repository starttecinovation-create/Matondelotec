'use client';

import React, { useMemo } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Copy, Users, TrendingUp, Handshake, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';


function ReferralLinkCard({ referralCode }: { referralCode: string | undefined }) {
    const { toast } = useToast();
    
    const referralLink = useMemo(() => {
        if (typeof window === 'undefined' || !referralCode) return '';
        return `${window.location.origin}/partner-signup?ref=${referralCode}`;
    }, [referralCode]);

    const handleCopy = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        toast({
            title: "Link Copiado!",
            description: "O seu link de afiliação foi copiado. Partilhe-o agora!",
        });
    };

    if (!referralCode) {
        return <Skeleton className="h-40 w-full" />
    }

    return (
        <Card className="bg-primary text-primary-foreground">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><LinkIcon /> O Seu Link de Afiliação</CardTitle>
                <CardDescription className="text-primary-foreground/80">Partilhe este link com novos parceiros.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input 
                    readOnly 
                    value={referralLink} 
                    className="bg-primary-foreground/20 text-white border-primary-foreground/30"
                />
                <Button variant="secondary" className="w-full" onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" /> Copiar Link
                </Button>
            </CardContent>
        </Card>
    );
}

export default function ReferralsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const referredUsersQuery = useMemoFirebase(() => {
        if (!user || !firestore || !userProfile?.referralCode) return null;
        return query(
            collection(firestore, 'users'),
            where('referredBy', '==', userProfile.referralCode),
            orderBy('createdAt', 'desc')
        );
    }, [user, firestore, userProfile?.referralCode]);
    const { data: referredUsers, isLoading: areReferredUsersLoading } = useCollection<UserProfile>(referredUsersQuery);

    const totalReferrals = referredUsers?.length || 0;
    const totalEarnings = userProfile?.referralEarnings || 0;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h1 className="font-headline text-3xl md:text-4xl font-bold flex items-center gap-3"><Handshake /> Programa de Afiliados</h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Seja nosso afiliado e ganhe dinheiro connosco.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
                 <div className="md:col-span-1">
                    <ReferralLinkCard referralCode={userProfile?.referralCode} />
                 </div>
                 <Card className="md:col-span-1">
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Indicações</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isProfileLoading ? <Skeleton className="h-8 w-12 mt-2"/> : <div className="text-2xl font-bold">{totalReferrals}</div>}
                        <p className="text-xs text-muted-foreground">Parceiros que usaram o seu código.</p>
                    </CardContent>
                 </Card>
                 <Card className="md:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ganhos Totais</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isProfileLoading ? <Skeleton className="h-8 w-24 mt-2"/> : <div className="text-2xl font-bold">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(totalEarnings)}</div>}
                        <p className="text-xs text-muted-foreground">Comissões recebidas das subscrições.</p>
                    </CardContent>
                 </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Como Funciona</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                    <p>1. Partilhe o seu link de afiliação único com potenciais parceiros (prestadores de serviços).</p>
                    <p>2. Quando um novo parceiro se regista na Matondelo através do seu link, ele fica associado a si.</p>
                    <p>3. Por cada subscrição que esse parceiro pagar, você recebe uma comissão de **5%** diretamente no seu saldo virtual.</p>
                    <p>É simples assim! Quanto mais parceiros indicar, mais pode ganhar. Comece a partilhar o seu link hoje mesmo!</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Parceiros Indicados por Si</CardTitle>
                    <CardDescription>Acompanhe os parceiros que se registaram com o seu código.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome do Negócio</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Data de Registo</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {areReferredUsersLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">A carregar...</TableCell>
                                </TableRow>
                            ) : referredUsers && referredUsers.length > 0 ? (
                                referredUsers.map(referred => (
                                    <TableRow key={referred.id}>
                                        <TableCell className="font-medium">{referred.displayName}</TableCell>
                                        <TableCell>{referred.category}</TableCell>
                                        <TableCell>{referred.createdAt?.seconds ? new Date(referred.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant={referred.verificationStatus === 'approved' ? 'default' : 'secondary'} className={referred.verificationStatus === 'approved' ? 'bg-green-600' : ''}>
                                                {referred.verificationStatus === 'approved' ? 'Ativo' : 'Pendente'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Ainda não indicou nenhum parceiro.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    </div>
  )
}
