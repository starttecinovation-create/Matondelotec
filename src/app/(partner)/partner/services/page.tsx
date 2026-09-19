'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { type Service } from '@/lib/types';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle } from 'lucide-react';
import { getCategoryConfig } from '@/lib/category-helper';
import { usePartner } from '@/context/partner-context';
import { useMemo } from 'react';

function ServiceItem({ service }: { service: Service }) {
    const config = getCategoryConfig(service.category);
    const catalogPath = `/partner/services/${service.id}`;
    const editPath = `/partner/services/${service.id}/edit`;
    const canManageCatalog = config.hasCatalog;
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{service.name}</CardTitle>
                <CardDescription>{service.category}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                    <Link href={editPath}>Editar {config.serviceSingular}</Link>
                </Button>
                {canManageCatalog && (
                    <Button asChild>
                        <Link href={catalogPath}>Gerir {config.catalogPlural}</Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}


export default function PartnerServicesPage() {
    const { user } = useUser();
    const { userProfile } = usePartner();
    const firestore = useFirestore();

    const categoryConfig = useMemo(() => {
        return getCategoryConfig(userProfile?.category);
    }, [userProfile?.category]);

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
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">{categoryConfig.servicePlural}</h1>
                    <p className="text-muted-foreground mt-2">
                        {categoryConfig.serviceDescription}
                    </p>
                </div>
                 <Button asChild>
                    <Link href="/partner/services/new">
                        <PlusCircle className="mr-2"/>
                        Novo(a) {categoryConfig.serviceSingular}
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
                        <h2 className="text-xl font-semibold">Nenhum(a) {categoryConfig.serviceSingular.toLowerCase()} registado(a)</h2>
                        <p className="text-muted-foreground mt-2 mb-4">Ainda não adicionou nenhum(a) {categoryConfig.serviceSingular.toLowerCase()} ao seu perfil de parceiro.</p>
                         <Button asChild>
                            <Link href="/partner/services/new">
                                <PlusCircle className="mr-2"/>
                                Registar primeiro(a) {categoryConfig.serviceSingular.toLowerCase()}
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
