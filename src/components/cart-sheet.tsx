'use client';

import { useCart } from "@/context/cart-context";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import Image from "next/image";
import { Trash2, ShoppingCart } from "lucide-react";
import { Separator } from "./ui/separator";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function CartSheet() {
    const { cart, isSheetOpen, setIsSheetOpen, removeProductFromCart, updateProductQuantity, total, isUpdating } = useCart();
    const router = useRouter();

    const handleCheckout = () => {
        setIsSheetOpen(false);
        router.push('/checkout');
    };

    return (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent className="flex w-full flex-col pr-0 sm:max-w-xl">
                <SheetHeader className="px-6">
                    <SheetTitle>Carrinho de Compras</SheetTitle>
                </SheetHeader>
                <div className="relative flex-1 overflow-y-auto">
                    <ScrollArea className="h-full">
                        <div className="px-6">
                        {cart.length > 0 ? (
                             <div className="flex flex-col gap-6">
                                {cart.map(item => (
                                     <div key={item.id} className="flex items-center gap-4">
                                        <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                                            <Image 
                                                src={item.imageUrl || `https://picsum.photos/seed/${item.id}/100/100`} 
                                                alt={item.productName} 
                                                fill 
                                                className="object-cover" 
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="font-semibold text-sm">{item.productName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                 {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.price)}
                                            </p>
                                            <div className="flex items-center gap-2 pt-1">
                                                <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateProductQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1 || isUpdating}>-</Button>
                                                <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                                <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateProductQuantity(item.id, item.quantity + 1)} disabled={isUpdating}>+</Button>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removeProductFromCart(item.id)} disabled={isUpdating}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center space-y-2 text-center">
                                <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                                <p className="text-lg font-medium">O seu carrinho está vazio</p>
                                <p className="text-sm text-muted-foreground">Adicione produtos para começar a comprar.</p>
                            </div>
                        )}
                        </div>
                    </ScrollArea>
                </div>
                {cart.length > 0 && (
                    <SheetFooter className="px-6 py-4 border-t bg-background">
                         <div className="w-full space-y-4">
                             <div className="flex justify-between text-base font-semibold">
                                <p>Total</p>
                                <p>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(total)}</p>
                            </div>
                            <Button className="w-full" size="lg" onClick={handleCheckout}>
                                Finalizar Compra
                            </Button>
                        </div>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}
