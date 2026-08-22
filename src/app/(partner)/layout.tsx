'use client';

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { doc } from "firebase/firestore";
import { useUser, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { PartnerHeader } from "@/components/partner-header";
import { AppFooter } from "@/components/app-footer";
import { Loader2 } from "lucide-react";
import type { UserProfile } from "@/lib/types";
import { PartnerProvider } from "@/context/partner-context";

function PartnerLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  
  const isVerifying = isUserLoading || isProfileLoading;

  useEffect(() => {
    if (!isVerifying && firestore) {
        if (!user) {
            router.push('/dashboard');
            return;
        }

        if (userProfile) {
            const { role } = userProfile;
            if (role !== 'vendor' && role !== 'admin' && role !== 'driver') {
                router.push('/dashboard');
            }
        }
    }
  }, [user, userProfile, isVerifying, router, firestore]);

  // Se o Firebase não estiver configurado, permite renderizar para evitar 404,
  // mas as proteções de rota agirão assim que os dados carregarem.
  if (isVerifying && firestore) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">A carregar ambiente de parceiro...</p>
        </div>
      </div>
    );
  }
  
  return (
    <PartnerProvider>
      <div className="flex min-h-screen flex-col">
        <PartnerHeader />
        <main className="flex-1 bg-muted/20">{children}</main>
        <AppFooter />
      </div>
    </PartnerProvider>
  );
}

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
      <PartnerLayoutContent>{children}</PartnerLayoutContent>
  );
}
