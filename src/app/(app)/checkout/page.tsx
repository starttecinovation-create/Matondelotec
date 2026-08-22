'use client';

import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useUser, useDoc, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, writeBatch, serverTimestamp, getDoc, collection } from "firebase/firestore";
import type { UserProfile, Order, Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Loader2, Wallet, ShoppingCart, Truck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";


export default function CheckoutPage() {
    const { cart, total, clearCart, isUpdating, removeProductFromCart, updateProductQuantity } = useCart();
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const [paymentMethod, setPaymentMethod] = useState<'virtual_balance' | 'cash_on_delivery'>('virtual_balance');
    const [isProcessing, setIsProcessing] = useState(false);

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const canPayWithBalance = userProfile && userProfile.balance >= total;
    
    const handleCheckout = async () => {
        if (!user || !firestore || !userProfile || cart.length === 0) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não é possível processar a encomenda.' });
            return;
        }

        if (paymentMethod === 'virtual_balance' && !canPayWithBalance) {
            toast({ variant: 'destructive', title: 'Saldo Insuficiente', description: 'Por favor, carregue o seu saldo para continuar.' });
            router.push('/profile');
            return;
        }

        setIsProcessing(true);
        const batch = writeBatch(firestore);

        // 1. Create Order
        const newOrderRef = doc(collection(firestore, `users/${user.uid}/orders`));
        const orderData: Omit<Order, 'id'> = {
            userId: user.uid,
            createdAt: serverTimestamp() as any, // Let server generate timestamp
            items: cart,
            totalAmount: total,
            status: 'pending',
            paymentMethod: paymentMethod,
        };
        batch.set(newOrderRef, { ...orderData, id: newOrderRef.id });

        if (paymentMethod === 'virtual_balance') {
            // 2. Debit client's balance
            const newClientBalance = userProfile.balance - total;
            batch.update(userProfileRef!, { balance: newClientBalance });

            // 3. Create client transaction
            const clientTransactionRef = doc(collection(firestore, `users/${user.uid}/transactions`));
            const clientTransactionData: Omit<Transaction, 'id' | 'transactionDate'> = {
                userId: user.uid,
                amount: total,
                type: 'debit',
                description: `Pagamento da encomenda #${newOrderRef.id.substring(0, 6)}`,
            };
            batch.set(clientTransactionRef, { ...clientTransactionData, id: clientTransactionRef.id, transactionDate: serverTimestamp() });
            
            // 4. Group items by vendor and credit each vendor
            const vendorTotals: { [vendorId: string]: number } = {};
            cart.forEach(item => {
                vendorTotals[item.vendorId] = (vendorTotals[item.vendorId] || 0) + (item.price * item.quantity);
            });

            for (const vendorId in vendorTotals) {
                const vendorRef = doc(firestore, 'users', vendorId);
                const vendorDoc = await getDoc(vendorRef);
                if (vendorDoc.exists()) {
                    const vendorProfile = vendorDoc.data() as UserProfile;
                    const newVendorBalance = vendorProfile.balance + vendorTotals[vendorId];
                    batch.update(vendorRef, { balance: newVendorBalance });
                    
                    // Create vendor transaction
                    const vendorTransactionRef = doc(collection(firestore, `users/${vendorId}/transactions`));
                    const vendorTransactionData: Omit<Transaction, 'id' | 'transactionDate'> = {
                        userId: vendorId,
                        amount: vendorTotals[vendorId],
                        type: 'credit',
                        description: `Recebimento da encomenda #${newOrderRef.id.substring(0, 6)}`,
                    };
                    batch.set(vendorTransactionRef, {...vendorTransactionData, id: vendorTransactionRef.id, transactionDate: serverTimestamp() });
                }
            }
        }
        
        // 5. Clear the cart in Firestore
        for (const item of cart) {
            const cartItemRef = doc(firestore, `users/${user.uid}/cart/${item.id}`);
            batch.delete(cartItemRef);
        }
        
        batch.commit()
            .then(() => {
                clearCart(); // Clear local state
                toast({ title: 'Encomenda Realizada!', description: paymentMethod === 'virtual_balance' ? 'O seu pagamento foi processado com sucesso.' : 'A sua encomenda foi registada. Prepare o pagamento para a entrega.' });
                router.push('/orders');
            })
            .catch((error) => {
                console.error('Checkout error:', error);
                toast({ variant: 'destructive', title: 'Erro de Checkout', description: 'Não foi possível finalizar a sua encomenda.' });
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `users/${user.uid}/orders`,
                    operation: 'create',
                    requestResourceData: orderData,
                }));
            })
            .finally(() => {
                 setIsProcessing(false);
            });
    };


    if (cart.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="text-center py-16 border rounded-lg bg-card max-w-lg mx-auto">
                    <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold">O seu carrinho está vazio</h2>
                    <p className="text-muted-foreground mt-2 mb-4">Adicione produtos para poder finalizar a compra.</p>
                    <Button asChild>
                        <Link href="/dashboard">Explorar Serviços</Link>
                    </Button>
                </div>
            </div>
        )
    }

    const isButtonDisabled = isProcessing || isUpdating || isProfileLoading || (paymentMethod === 'virtual_balance' && !canPayWithBalance);

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="max-w-3xl mx-auto space-y-8">
                 <div>
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">Finalizar Compra</h1>
                    <p className="text-muted-foreground mt-2">
                        Reveja os seus itens e confirme a encomenda.
                    </p>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Resumo da Encomenda</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {cart.map(item => (
                            <div key={item.id} className="flex items-center gap-4">
                                <div className="relative w-16 h-16 rounded-md overflow-hidden border">
                                    <Image src={item.imageUrl || `https://picsum.photos/seed/${item.id}/100/100`} alt={item.productName} fill className="object-cover" />
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold">{item.productName}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.price)}
                                    </p>
                                </div>
                                 <div className="flex items-center gap-2">
                                    <Button size="icon" variant="outline" onClick={() => updateProductQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>-</Button>
                                    <span>{item.quantity}</span>
                                    <Button size="icon" variant="outline" onClick={() => updateProductQuantity(item.id, item.quantity + 1)}>+</Button>
                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeProductFromCart(item.id)}>Remover</Button>
                                </div>
                            </div>
                        ))}
                        <Separator />
                         <div className="flex justify-between font-semibold text-lg">
                            <span>Total</span>
                            <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(total)}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Método de Pagamento</CardTitle>
                        <CardDescription>Escolha como prefere pagar a sua encomenda.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as any)} className="space-y-4">
                           <Label htmlFor="virtual_balance" className="flex items-center gap-4 p-4 border rounded-lg has-[:checked]:border-primary cursor-pointer">
                                <RadioGroupItem value="virtual_balance" id="virtual_balance" />
                                <div className="flex-grow">
                                    <div className="flex justify-between">
                                        <p className="font-semibold">Pagar com Saldo Virtual</p>
                                        <div className="text-sm font-bold flex items-center gap-2">
                                            <Wallet className="h-4 w-4"/>
                                            {isProfileLoading ? "..." : new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(userProfile?.balance || 0)}
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        O pagamento é imediato e seguro usando o seu saldo na plataforma.
                                    </p>
                                    {!isProfileLoading && !canPayWithBalance && (
                                        <p className="text-xs text-destructive mt-1">Saldo insuficiente para esta transação.</p>
                                    )}
                                </div>
                           </Label>
                            <Label htmlFor="cash_on_delivery" className="flex items-center gap-4 p-4 border rounded-lg has-[:checked]:border-primary cursor-pointer">
                                <RadioGroupItem value="cash_on_delivery" id="cash_on_delivery" />
                                 <div className="flex-grow">
                                    <div className="flex justify-between">
                                        <p className="font-semibold">Pagamento na Entrega</p>
                                        <Truck className="h-5 w-5 text-muted-foreground"/>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Pague em dinheiro ou por transferência no momento em que receber a sua encomenda.
                                    </p>
                                </div>
                           </Label>
                       </RadioGroup>
                    </CardContent>
                    <CardFooter>
                         <Button size="lg" className="w-full" onClick={handleCheckout} disabled={isButtonDisabled}>
                            {isProcessing ? <Loader2 className="animate-spin" /> : <Wallet className="mr-2 h-4 w-4"/>}
                            {paymentMethod === 'virtual_balance' && !canPayWithBalance ? 'Saldo Insuficiente' : 'Confirmar Encomenda'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
