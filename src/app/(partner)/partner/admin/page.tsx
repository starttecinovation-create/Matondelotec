'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import type { UserProfile, VerificationStatus } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, X, ShieldAlert, Pencil } from 'lucide-react';
import Link from 'next/link';
import { usePartner } from '@/context/partner-context';

function UserVerificationRow({ userProfile }: { userProfile: UserProfile }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const handleUpdateStatus = (newStatus: VerificationStatus) => {
        if (!firestore) return;
        
        const userDocRef = doc(firestore, 'users', userProfile.id);
        const updateData = { verificationStatus: newStatus };
        
        updateDoc(userDocRef, updateData)
            .then(() => {
                toast({
                    title: 'Estado Atualizado!',
                    description: `O utilizador ${userProfile.displayName} foi ${newStatus === 'approved' ? 'aprovado' : 'rejeitado'}.`
                })
            })
            .catch((error) => {
                console.error("Error updating verification status:", error);
                toast({
                    variant: 'destructive',
                    title: 'Erro!',
                    description: 'Não foi possível atualizar o estado do utilizador.'
                });
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                }));
            });
    }

    return (
        <TableRow>
            <TableCell>
                <div className="font-medium">{userProfile.displayName}</div>
                <div className="text-sm text-muted-foreground">{userProfile.email}</div>
            </TableCell>
            <TableCell>
                <Badge variant="secondary">{userProfile.role}</Badge>
            </TableCell>
            <TableCell>
                <Badge 
                    variant={userProfile.verificationStatus === 'approved' ? 'default' : userProfile.verificationStatus === 'pending' ? 'secondary' : 'destructive'}
                    className={userProfile.verificationStatus === 'approved' ? 'bg-green-600' : ''}
                >
                    {userProfile.verificationStatus || 'N/D'}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                    {userProfile.verificationStatus === 'pending' && (
                        <>
                            <Button size="sm" onClick={() => handleUpdateStatus('approved')} className="bg-green-600 hover:bg-green-700">
                                <Check className="mr-2 h-4 w-4" /> Aprovar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus('rejected')}>
                                 <X className="mr-2 h-4 w-4" /> Rejeitar
                            </Button>
                        </>
                    )}
                    <Button asChild size="sm" variant="outline">
                        <Link href={`/partner/admin/edit/${userProfile.id}`}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                        </Link>
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    )
}

export default function AdminVerificationPage() {
    const firestore = useFirestore();
    const { isAdmin } = usePartner();

    const usersToVerifyQuery = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        
        return query(
            collection(firestore, 'users'),
            where('role', 'in', ['vendor', 'driver']),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, isAdmin]);

    const { data: users, isLoading: areUsersLoading } = useCollection<UserProfile>(usersToVerifyQuery);

    const pendingUsers = users?.filter(u => u.verificationStatus === 'pending') || [];
    const processedUsers = users?.filter(u => u.verificationStatus !== 'pending') || [];
    
    if (!isAdmin) {
        return (
             <div className="container mx-auto px-4 py-8 md:py-12">
                 <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Acesso Negado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Não tem permissão para aceder a esta página de gestão de utilizadores.</p>
                        </CardContent>
                    </Card>
                 </div>
            </div>
        )
    }


    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-4xl mx-auto">
                 <div className="mb-8">
                     <h1 className="font-headline text-3xl md:text-4xl font-bold flex items-center gap-2">
                        <ShieldAlert className="h-8 w-8" />
                        Gestão de Utilizadores
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Aprove, rejeite ou edite os vendedores e motoristas registados na plataforma.
                    </p>
                </div>
                
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pendentes de Aprovação</CardTitle>
                            <CardDescription>Estes utilizadores estão a aguardar a sua revisão.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Utilizador</TableHead>
                                        <TableHead>Função</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {areUsersLoading ? (
                                        Array.from({ length: 2 }).map((_, i) => (
                                            <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                                        ))
                                     ) : pendingUsers.length > 0 ? (
                                        pendingUsers.map(userProfile => <UserVerificationRow key={userProfile.id} userProfile={userProfile} />)
                                     ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">Nenhum utilizador pendente.</TableCell>
                                        </TableRow>
                                     )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Utilizadores Processados</CardTitle>
                             <CardDescription>Lista de utilizadores que já foram revistos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Utilizador</TableHead>
                                        <TableHead>Função</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {areUsersLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                                        ))
                                     ) : processedUsers.length > 0 ? (
                                        processedUsers.map(userProfile => (
                                            <UserVerificationRow key={userProfile.id} userProfile={userProfile} />
                                        ))
                                     ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">Nenhum utilizador processado.</TableCell>
                                        </TableRow>
                                     )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
