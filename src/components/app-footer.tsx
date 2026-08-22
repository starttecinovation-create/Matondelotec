
'use client';

import Link from "next/link";
import { Button } from "./ui/button";
import { Logo } from "./logo";

export function AppFooter() {
    return (
        <footer className="bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500">
            <div className="container mx-auto px-4 py-12 text-center">
                <div className="flex justify-center mb-6">
                    <Logo isWhite />
                </div>
                <h2 className="font-headline text-3xl font-bold text-white">Impulsione o futuro dos negócios em Angola</h2>
                <p className="mt-2 text-lg text-white/90 max-w-3xl mx-auto">Junte-se à plataforma que está a transformar a maneira como os serviços são descobertos e reservados. Registe o seu negócio e alcance mais clientes do que nunca.</p>
                <Button asChild size="lg" className="mt-6 bg-white text-[#EB4A24] hover:bg-gray-100 hover:text-[#EB4A24] font-bold border-none shadow-md">
                    <Link href="/partner-signup">Junte-se a nós como parceiro</Link>
                </Button>
            </div>
             <div className="py-4 text-center text-[10px] text-white/70 border-t border-white/20">
                <p>Todos direitos reservados à ©matondelo 2026 tel: +244 941 359 379</p>
            </div>
        </footer>
    )
}
