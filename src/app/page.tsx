'use client';

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            A verificar autenticação...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-orange-gradient text-white py-12 px-4 relative" style={{ background: "linear-gradient(135deg, #FF7A00 0%, #D45500 100%)" }}>
      <div className="text-center animate-in fade-in zoom-in duration-500 mb-2">
        <Logo className="text-6xl text-white" />
        <p className="mt-4 text-2xl font-semibold">O seu parceiro diário</p>
      </div>

       <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-in slide-in-from-bottom-4 duration-700 w-full max-w-xs sm:max-w-md">
            <Button asChild size="lg" className="bg-white text-[#D45500] hover:bg-gray-100 font-bold border-none shadow-md flex-1">
               <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-2 border-white hover:bg-white/10 font-bold flex-1">
               <Link href="/cadastro">Cadastrar</Link>
            </Button>
       </div>

       <div className="mt-12 w-full max-w-xs sm:max-w-md animate-in slide-in-from-bottom-6 duration-1000">
         <div className="bg-[#0F3460] text-white p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col items-center text-center gap-4">
           <h3 className="text-xl font-bold font-sans tracking-wide">PAINEL CORPORATIVO</h3>
           <p className="text-sm text-white/80 leading-relaxed font-medium">
             Cadastre a sua organização, sua marca ou Instituição e fique mais próximo do seu público alvo.
           </p>
           <div className="flex flex-col gap-2.5 w-full mt-2">
             <Button asChild size="lg" className="bg-white text-[#0F3460] hover:bg-gray-100 font-extrabold border-none shadow-md w-full">
               <Link href="/partner-signup">Cadastrar Parceiro</Link>
             </Button>
             <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-2 border-white hover:bg-white/15 font-bold w-full">
               <Link href="/login">Entrar no Painel</Link>
             </Button>
           </div>
         </div>
       </div>

       <footer className="mt-16 text-center text-[10px] text-white/70">
         <p>Todos direitos reservados à ©matondelo 2026 tel: +244 941 359 379</p>
       </footer>
     </div>
  );
}
