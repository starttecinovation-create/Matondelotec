'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Truck, MapPin, Package, Phone, User, Loader2, ClipboardCheck, CheckCircle2, Navigation, DollarSign, Wallet } from 'lucide-react';
import Link from 'next/link';

export default function DeliverPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    // Fetch user profile for balance check and update
    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<any>(userProfileRef);

    // Form inputs state
    const [senderName, setSenderName] = useState('');
    const [senderPhone, setSenderPhone] = useState('');
    const [pickupAddress, setPickupAddress] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [recipientPhone, setRecipientPhone] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [packageType, setPackageType] = useState('Documents');
    const [packageWeight, setPackageWeight] = useState(1);
    const [speedClass, setSpeedClass] = useState<'standard' | 'express'>('standard');

    // Simulation states
    const [simulationState, setSimulationState] = useState<'idle' | 'searching' | 'on_way' | 'delivered'>('idle');
    const [countdown, setCountdown] = useState(0);

    const price = React.useMemo(() => {
        let base = 1200;
        if (speedClass === 'express') base = 2200;
        const weightAddon = Math.max(0, (packageWeight - 1) * 300);
        return base + weightAddon;
    }, [speedClass, packageWeight]);

    // Handle automated state progression
    useEffect(() => {
        let timer: any;
        if (simulationState === 'searching') {
            setCountdown(3);
            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setSimulationState('on_way');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (simulationState === 'on_way') {
            setCountdown(5);
            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleDeliveryCompleted();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(timer);
    }, [simulationState]);

    const handleDeliveryCompleted = async () => {
        if (!user || !firestore) return;

        try {
            const currentBalance = userProfile?.balance || 0;
            const newBalance = Math.max(0, currentBalance - price);

            // 1. Update user balance
            if (userProfileRef) {
                await updateDoc(userProfileRef, { balance: newBalance });
            }

            // 2. Add Transaction record
            const transactionsCol = collection(firestore, `users/${user.uid}/transactions`);
            await addDoc(transactionsCol, {
                userId: user.uid,
                amount: price,
                type: 'debit',
                description: `Matondelo Deliver (${packageType}) de ${pickupAddress} para ${deliveryAddress}`,
                transactionDate: Timestamp.now()
            });

            // 3. Add to User's Orders collection (so it shows under "Minhas Encomendas")
            const ordersCol = collection(firestore, `users/${user.uid}/orders`);
            await addDoc(ordersCol, {
                userId: user.uid,
                createdAt: Timestamp.now(),
                totalAmount: price,
                status: 'delivered',
                paymentMethod: 'virtual_balance',
                items: [
                    {
                        id: 'delivery-' + Math.floor(Math.random() * 100000),
                        productId: 'deliv-service',
                        productName: `Matondelo Deliver: ${packageType} (${packageWeight}kg)`,
                        price: price,
                        quantity: 1,
                        imageUrl: 'https://picsum.photos/seed/delivery/400/400',
                        vendorId: 'matondelo-express'
                    }
                ]
            });

            setSimulationState('delivered');
            toast({
                title: "Encomenda Entregue!",
                description: `A sua encomenda de ${packageType} foi entregue com sucesso a ${recipientName}. Valor debitado: ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(price)}`,
            });
        } catch (error) {
            console.error("Error finalizing delivery simulated task:", error);
            setSimulationState('delivered');
        }
    };

    const handleStartDelivery = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: 'destructive', title: 'Não autenticado', description: 'Inicie sessão para solicitar uma entrega.' });
            return;
        }

        if (!senderName || !senderPhone || !pickupAddress || !recipientName || !recipientPhone || !deliveryAddress) {
            toast({ variant: 'destructive', title: 'Dados Incompletos', description: 'Por favor, preencha todos os campos obrigatórios.' });
            return;
        }

        const balance = userProfile?.balance || 0;
        if (balance < price) {
            toast({
                variant: 'destructive',
                title: 'Saldo Insuficiente',
                description: `O envio custa ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(price)}, mas o seu saldo atual é de ${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(balance)}. Por favor, recarregue na página de Perfil.`,
            });
            return;
        }

        // Start delivery simulation
        setSimulationState('searching');
    };

    const resetForm = () => {
        setSimulationState('idle');
        setSenderName('');
        setSenderPhone('');
        setPickupAddress('');
        setRecipientName('');
        setRecipientPhone('');
        setDeliveryAddress('');
        setPackageWeight(1);
    };

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Block */}
                <div className="text-center">
                    <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                        <Truck className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">Matondelo Deliver</h1>
                    <p className="text-muted-foreground mt-2 text-lg max-w-2xl mx-auto">
                        Envie documentos, mercadorias e encomendas para qualquer ponto de Luanda de forma rápida, segura e totalmente monitorizada.
                    </p>
                </div>

                {simulationState === 'idle' && (
                    <form onSubmit={handleStartDelivery}>
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* SENDER & PICKUP DETAILS */}
                            <Card className="border-slate-150">
                                <CardHeader className="pb-3 border-b">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <div className="p-1 bg-orange-100 rounded text-orange-600"><MapPin className="h-4 w-4" /></div>
                                        Ponto de Recolha (Remetente)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600">Seu Nome *</label>
                                        <Input 
                                            placeholder="Ex: Pedro André" 
                                            value={senderName} 
                                            onChange={e => setSenderName(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600">Seu Telemóvel *</label>
                                        <Input 
                                            type="tel" 
                                            placeholder="Ex: 923 456 789" 
                                            value={senderPhone} 
                                            onChange={e => setSenderPhone(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600">Endereço Completo de Recolha *</label>
                                        <Input 
                                            placeholder="Ex: Talatona, Rua do Banco Sol, Edifício 4" 
                                            value={pickupAddress} 
                                            onChange={e => setPickupAddress(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* RECIPIENT & DELIVERY DETAILS */}
                            <Card className="border-slate-150">
                                <CardHeader className="pb-3 border-b">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <div className="p-1 bg-sky-100 rounded text-sky-600"><Navigation className="h-4 w-4" /></div>
                                        Ponto de Entrega (Destinatário)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600">Nome do Destinatário *</label>
                                        <Input 
                                            placeholder="Ex: Sandra Custódio" 
                                            value={recipientName} 
                                            onChange={e => setRecipientName(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600">Telemóvel do Destinatário *</label>
                                        <Input 
                                            type="tel" 
                                            placeholder="Ex: 931 987 654" 
                                            value={recipientPhone} 
                                            onChange={e => setRecipientPhone(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600">Endereço Completo de Entrega *</label>
                                        <Input 
                                            placeholder="Ex: Maianga, Rua Amílcar Cabral, Casa 24" 
                                            value={deliveryAddress} 
                                            onChange={e => setDeliveryAddress(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* PACKAGE & SPECIFICATIONS */}
                        <Card className="border-slate-150 mt-8">
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Package className="h-5 w-5 text-primary" />
                                    Especificações do Volume & Envio
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-3 gap-6 pt-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Tipo de Conteúdo</label>
                                    <select 
                                        value={packageType} 
                                        onChange={e => setPackageType(e.target.value)}
                                        className="w-full text-sm rounded-lg border border-input p-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="Documents">Documentos / Papéis</option>
                                        <option value="Food">Alimentos / Refeições</option>
                                        <option value="Clothing">Roupas / Calçado</option>
                                        <option value="Electronics">Eletrónicos / Acessórios</option>
                                        <option value="Other">Outros Volumes</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Peso Estimado (kg)</label>
                                    <Input 
                                        type="number" 
                                        value={packageWeight} 
                                        onChange={e => setPackageWeight(Math.max(1, Number(e.target.value)))} 
                                        min="1" 
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Velocidade do Serviço</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button 
                                            type="button" 
                                            variant={speedClass === 'standard' ? 'default' : 'outline'} 
                                            onClick={() => setSpeedClass('standard')}
                                            className="text-xs font-semibold h-10"
                                        >
                                            Standard
                                        </Button>
                                        <Button 
                                            type="button" 
                                            variant={speedClass === 'express' ? 'default' : 'outline'} 
                                            onClick={() => setSpeedClass('express')}
                                            className="text-xs font-semibold h-10"
                                        >
                                            Express (Flash)
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="bg-slate-50/50 p-6 flex flex-col sm:flex-row items-center justify-between border-t gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Wallet className="h-6 w-6" /></div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Preço Estimado:</p>
                                        <p className="text-2xl font-bold text-[#F6780A]">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(price)}</p>
                                    </div>
                                </div>
                                <Button 
                                    type="submit" 
                                    className="bg-[#F6780A] hover:bg-[#D45500] text-white font-bold px-8 h-11 w-full sm:w-auto"
                                    disabled={isProfileLoading}
                                >
                                    {isProfileLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirmar e Enviar'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                )}

                {/* SIMULATOR SCREEN 1: WAITING PICKUP */}
                {simulationState === 'searching' && (
                    <Card className="border-slate-150 p-8 max-w-md mx-auto text-center space-y-6">
                        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-[#F6780A] animate-spin" />
                            <Truck className="h-10 w-10 text-[#F6780A]" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Procurando estafeta...</CardTitle>
                            <CardDescription>A designar o estafeta Matondelo Deliver mais próximo de {pickupAddress}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs px-3 py-1">Encontrando em {countdown}s...</Badge>
                    </Card>
                )}

                {/* SIMULATOR SCREEN 2: IN TRANSIT */}
                {simulationState === 'on_way' && (
                    <Card className="border-slate-150 overflow-hidden max-w-md mx-auto">
                        <div className="bg-[#0F3460] text-white p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                                <span className="text-sm font-semibold">Envio em Trânsito...</span>
                            </div>
                            <Badge className="bg-amber-500 text-slate-950 font-bold">{countdown}s restante</Badge>
                        </div>
                        <CardContent className="p-6 space-y-4 text-center">
                            <div className="space-y-1 text-left">
                                <div className="p-3 border rounded-lg bg-slate-50 space-y-2">
                                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Status do Envio:</p>
                                    <div className="flex items-start gap-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                        <p className="text-xs text-slate-600"><span className="font-semibold text-slate-800">Recolhido:</span> O estafeta efetuou a recolha em {pickupAddress}</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <div className="h-2 w-2 rounded-full bg-[#F6780A] mt-1.5 shrink-0 animate-ping" />
                                        <p className="text-xs text-slate-600"><span className="font-semibold text-[#F6780A]">A caminho:</span> Transportando {packageType} para {deliveryAddress}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-[#F6780A] h-full animate-pulse" style={{ width: `${(5 - countdown) * 20}%` }} />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* SIMULATOR SCREEN 3: DELIVERED */}
                {simulationState === 'delivered' && (
                    <Card className="border-emerald-200 bg-emerald-50/50 p-8 max-w-md mx-auto text-center space-y-6">
                        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-emerald-600 animate-bounce" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg text-slate-800">Encomenda Entregue com Sucesso!</CardTitle>
                            <CardDescription>O volume de {packageType} foi entregue em segurança no destino final.</CardDescription>
                        </div>
                        <div className="p-4 border rounded-lg bg-white shadow-xs text-left space-y-2 text-xs">
                            <p className="text-[#F6780A] font-bold text-center border-b pb-2 mb-2">Comprovativo de Entrega Digital</p>
                            <p><span className="font-semibold text-slate-500">Destinatário:</span> {recipientName} ({recipientPhone})</p>
                            <p><span className="font-semibold text-slate-500">Local de Entrega:</span> {deliveryAddress}</p>
                            <p><span className="font-semibold text-slate-500">Tipo de Conteúdo:</span> {packageType}</p>
                            <p><span className="font-semibold text-slate-500">Valor Pago:</span> {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(price)}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={resetForm} className="w-full">Efetuar Novo Envio</Button>
                            <Button variant="outline" asChild className="w-full">
                                <Link href="/orders">Ver Encomendas</Link>
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
