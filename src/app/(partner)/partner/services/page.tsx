'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { type Service, type ServiceCategory } from '@/lib/types';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle } from 'lucide-react';

function ServiceItem({ service }: { service: Service }) {
    const catalogPath = `/partner/services/${service.id}`;
    const editPath = `/partner/services/${service.id}/edit`;
    const canManageCatalog = true; // Habilitado para todas as categorias de parceiros
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{service.name}</CardTitle>
                <CardDescription>{service.category}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                    <Link href={editPath}>Editar Serviço</Link>
                </Button>
                {canManageCatalog && (
                    <Button asChild>
                        <Link href={catalogPath}>Gerir Catálogo</Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}


export default function PartnerServicesPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const servicesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, `users/${user.uid}/services`)
        );
    }, [firestore, user]);

    const { data: services, isLoading } = useCollection<Service>(servicesQuery);

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">Meus Serviços</h1>
                    <p className="text-muted-foreground mt-2">
                        Gira os seus serviços e os produtos associados.
                    </p>
                </div>
                 <Button asChild>
                    <Link href="/partner/services/new">
                        <PlusCircle className="mr-2"/>
                        Novo Serviço
                    </Link>
                </Button>
            </div>

            <div className="space-y-6">
                {isLoading ? (
                    <>
                        <Skeleton className="h-36 w-full" />
                        <Skeleton className="h-36 w-full" />
                    </>
                ) : services && services.length > 0 ? (
                    services.map(service => (
                        <ServiceItem key={service.id} service={service} />
                    ))
                ) : (
                    <div className="text-center py-16 border rounded-lg bg-card">
                        <h2 className="text-xl font-semibold">Nenhum serviço criado</h2>
                        <p className="text-muted-foreground mt-2 mb-4">Ainda não adicionou nenhum serviço ao seu perfil de parceiro.</p>
                         <Button asChild>
                            <Link href="/partner/services/new">
                                <PlusCircle className="mr-2"/>
                                Criar primeiro serviço
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
