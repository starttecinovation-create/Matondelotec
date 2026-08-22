'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, onSnapshot, writeBatch } from 'firebase/firestore';
import type { CartItem, Product } from '@/lib/types';
import { useDebounce } from '@/hooks/use-debounce';

interface CartContextType {
  cart: CartItem[];
  addProductToCart: (product: Product) => void;
  removeProductFromCart: (productId: string) => void;
  updateProductQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartLoading: boolean;
  isSheetOpen: boolean;
  setIsSheetOpen: (isOpen: boolean) => void;
  total: number;
  isUpdating: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartLoading, setIsCartLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    
    // State for batch updates
    const [pendingUpdates, setPendingUpdates] = useState<Map<string, number>>(new Map());
    const debouncedUpdates = useDebounce(pendingUpdates, 1000); // 1-second debounce delay

    // Effect to listen to Firestore cart changes
    useEffect(() => {
        if (user && firestore) {
            setIsCartLoading(true);
            const cartColRef = collection(firestore, `users/${user.uid}/cart`);
            const unsubscribe = onSnapshot(cartColRef, (snapshot) => {
                const newCart = snapshot.docs.map(doc => doc.data() as CartItem);
                setCart(newCart);
                setIsCartLoading(false);
            }, (error) => {
                console.error("Error fetching cart:", error);
                setIsCartLoading(false);
            });
            return () => unsubscribe();
        } else {
            setCart([]);
            setIsCartLoading(false);
        }
    }, [user, firestore]);

    // Effect to process batched updates
    useEffect(() => {
        const processUpdates = () => {
            if (debouncedUpdates.size === 0 || !user || !firestore) return;
            
            setIsUpdating(true);
            const batch = writeBatch(firestore);
            
            debouncedUpdates.forEach((quantity, productId) => {
                const cartItemRef = doc(firestore, `users/${user.uid}/cart/${productId}`);
                if (quantity > 0) {
                    batch.update(cartItemRef, { quantity });
                } else {
                    batch.delete(cartItemRef);
                }
            });

            batch.commit()
                .catch((error) => {
                    console.error("Error batch updating cart:", error);
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: `users/${user.uid}/cart`,
                        operation: 'update',
                        requestResourceData: Object.fromEntries(debouncedUpdates),
                    }));
                })
                .finally(() => {
                    setPendingUpdates(new Map()); // Clear pending updates
                    setIsUpdating(false);
                });
        };
        processUpdates();
    }, [debouncedUpdates, user, firestore]);

    const addProductToCart = useCallback(async (product: Product) => {
        if (!user || !firestore) return;
        setIsUpdating(true);

        const cartItemRef = doc(firestore, `users/${user.uid}/cart/${product.id}`);
        const batch = writeBatch(firestore);
        
        try {
            const existingItem = cart.find(item => item.id === product.id);
            if (existingItem) {
                // Let the debounced update handle this
                updateProductQuantity(product.id, existingItem.quantity + 1);
                 setIsUpdating(false);
            } else {
                const newCartItem: CartItem = {
                    id: product.id,
                    productId: product.id,
                    productName: product.name,
                    price: product.price,
                    quantity: 1,
                    imageUrl: product.imageUrl,
                    vendorId: product.vendorId,
                };
                batch.set(cartItemRef, newCartItem);
                await batch.commit();
                setIsUpdating(false);
            }
        } catch (error) {
            console.error("Error adding product to cart:", error);
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: cartItemRef.path,
                operation: 'create',
                requestResourceData: { productId: product.id, quantity: 1 }
            }));
            setIsUpdating(false);
        }

    }, [user, firestore, cart]);

    const removeProductFromCart = useCallback(async (productId: string) => {
        if (!user || !firestore) return;
        setIsUpdating(true);
        const cartItemRef = doc(firestore, `users/${user.uid}/cart/${productId}`);
        
        const batch = writeBatch(firestore);
        batch.delete(cartItemRef);
        
        try {
            await batch.commit();
        } catch (error) {
            console.error("Error removing product from cart:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: cartItemRef.path,
                operation: 'delete',
            }));
        } finally {
            setIsUpdating(false);
        }
    }, [user, firestore]);

    const updateProductQuantity = (productId: string, quantity: number) => {
        if(quantity < 0) return;
        // Update local state immediately for responsiveness
        setCart(currentCart =>
            currentCart.map(item =>
                item.id === productId ? { ...item, quantity } : item
            ).filter(item => item.quantity > 0)
        );

        // Add to the pending updates map for debouncing
        setPendingUpdates(prev => new Map(prev).set(productId, quantity));
    };


    const clearCart = useCallback(() => {
        // This is now mainly for local state clearing after checkout
        setCart([]);
    }, []);

    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const value = {
        cart,
        addProductToCart,
        removeProductFromCart,
        updateProductQuantity,
        clearCart,
        isCartLoading,
        isSheetOpen,
        setIsSheetOpen,
        total,
        isUpdating,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
