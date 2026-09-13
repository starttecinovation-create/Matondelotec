'use client';

import React, { useMemo, type ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { seedDevUsers } from '@/lib/seed-dev-users';
import { APIProvider } from '@vis.gl/react-google-maps';
import { CartProvider } from '@/context/cart-context';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && firebaseServices.auth) {
      seedDevUsers(firebaseServices.auth);
    }
  }, [firebaseServices.auth]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('CUSTOM_GOOGLE_MAPS_API_KEY');
      const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const fallbackKey = "AIzaSyDCtuRXSEaG6UMacGdDTIK9aKhHUavXSCY";
      
      let finalKey = saved || envKey;
      if (!finalKey || finalKey === "undefined" || finalKey === "" || finalKey.startsWith("YOUR_")) {
        finalKey = fallbackKey;
      }
      
      if (finalKey) {
        setActiveKey(finalKey);
      }
    }
  }, []);
  
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
      {activeKey ? (
        <APIProvider apiKey={activeKey} key={activeKey}>
          {content}
        </APIProvider>
      ) : (
        content
      )}
    </FirebaseProvider>
  );
}
