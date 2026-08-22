'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Wallet, Truck } from 'lucide-react';


function OrderItem({ order }: { order: Order }) {
    const orderDate = new Date(order.createdAt.seconds * 1000);
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Encomenda #{order.id.substring(0, 6).toUpperCase()}</CardTitle>
                        <CardDescription>
                            Realizada em: {orderDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </CardDescription>
                    </div>
                    <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>{order.status}</Badge>
                </div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                    {order.paymentMethod === 'virtual_balance' ? <Wallet className="h-4 w-4"/> : <Truck className="h-4 w-4"/>}
                    <span>{order.paymentMethod === 'virtual_balance' ? 'Pago com Saldo Virtual' : 'Pagamento na Entrega'}</span>
                 </div>
            </CardHeader>
            <CardContent>
                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>Ver {order.items.length} {order.items.length > 1 ? 'itens' : 'item'}</AccordionTrigger>
                        <AccordionContent>
                           <div className="space-y-4 pt-2">
                             {order.items.map(item => (
                                <div key={item.id} className="flex items-center gap-4">
                                     <div className="relative w-12 h-12 rounded-md overflow-hidden border shrink-0">
                                        <Image src={item.imageUrl || `https://picsum.photos/seed/${item.id}/100/100`} alt={item.productName} fill className="object-cover" />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-sm">{item.productName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.quantity} x {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.price)}
                                        </p>
                                    </div>
                                    <p className="font-medium text-sm">
                                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.price * item.quantity)}
                                    </p>
                                </div>
                            ))}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
            <CardFooter className="bg-muted/50 p-4 flex justify-end font-semibold">
                <div className="flex items-baseline gap-2">
                    <span className="text-sm text-muted-foreground">Total:</span>
                     <span className="text-xl">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.totalAmount)}</span>
                </div>
            </CardFooter>
        </Card>
    );
}

export default function OrdersPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const ordersQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, `users/${user.uid}/orders`),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">Minhas Encomendas</h1>
                    <p className="text-muted-foreground mt-2">
                        Acompanhe o histórico de todas as suas compras.
                    </p>
                </div>

                <div className="space-y-6">
                    {isLoading ? (
                        <>
                            <Skeleton className="h-40 w-full" />
                            <Skeleton className="h-40 w-full" />
                        </>
                    ) : orders && orders.length > 0 ? (
                        orders.map(order => (
                            <OrderItem key={order.id} order={order} />
                        ))
                    ) : (
                        <div className="text-center py-16 border rounded-lg bg-card">
                            <h2 className="text-xl font-semibold">Nenhuma encomenda encontrada</h2>
                            <p className="text-muted-foreground mt-2 mb-4">As suas compras de produtos aparecerão aqui.</p>
                            <Button asChild>
                                <Link href="/dashboard">Começar a comprar</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
