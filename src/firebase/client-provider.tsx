'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { seedDevUsers } from '@/lib/seed-dev-users';
import { APIProvider } from '@vis.gl/react-google-maps';
import { CartProvider } from '@/context/cart-context';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && firebaseServices.auth) {
      seedDevUsers(firebaseServices.auth);
    }
  }, [firebaseServices.auth]);
  
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasMapsKey = !!googleMapsKey && googleMapsKey !== "undefined" && googleMapsKey !== "";

  // Garante que os filhos são renderizados mesmo sem Firebase para evitar o erro 404
  const content = (
    <CartProvider>
      {children}
    </CartProvider>
  );

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {hasMapsKey ? (
        <APIProvider apiKey={googleMapsKey}>
          {content}
        </APIProvider>
      ) : (
        content
      )}
    </FirebaseProvider>
  );
}
