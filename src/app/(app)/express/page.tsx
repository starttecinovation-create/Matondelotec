'use client';

import { Truck } from 'lucide-react';

export default function DeliverPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary/10 rounded-full">
            <Truck className="w-12 h-12 text-primary" />
          </div>
        </div>
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Matondelo Deliver</h1>
        <p className="text-muted-foreground mt-4 text-lg">
          O nosso serviço de entregas rápidas e seguras estará disponível muito em breve.
        </p>
        <p className="mt-2 text-muted-foreground">
          Desde documentos a encomendas, o Matondelo Deliver vai conectar Angola com a rapidez que precisa. Volte em breve!
        </p>
      </div>
    </div>
  );
}
