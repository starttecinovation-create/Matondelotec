'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { UserProfile } from '@/lib/types';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

interface PartnerContextType {
    userProfile: UserProfile | null;
    isProfileLoading: boolean;
    isAdmin: boolean;
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export function PartnerProvider({ children }: { children: ReactNode }) {
    const { user } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
    
    const isAdmin = userProfile?.role === 'admin';

    const value = {
        userProfile,
        isProfileLoading,
        isAdmin,
    };

    return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>;
}

export function usePartner() {
    const context = useContext(PartnerContext);
    if (context === undefined) {
        throw new Error('usePartner must be used within a PartnerProvider');
    }
    return context;
}
