'use client';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { PageContent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function AboutPage() {
  const firestore = useFirestore();
  const contentRef = useMemoFirebase(() => firestore ? doc(firestore, 'site_content', 'about') : null, [firestore]);
  const { data: content, isLoading } = useDoc<PageContent>(contentRef);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold">{content?.title || 'Sobre a Matondelo'}</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {content?.headline || 'A nossa missão é conectar Angola aos melhores serviços disponíveis.'}
          </p>
        </div>
        <div className="prose prose-lg max-w-none text-foreground/80">
          {content && content.paragraphs ? (
            content.paragraphs.map((p, i) => <p key={i}>{p}</p>)
          ) : (
            <>
              <p>
                A Matondelo nasceu da necessidade de criar uma plataforma centralizada, segura e eficiente para que os angolanos e visitantes possam descobrir, reservar e desfrutar de uma vasta gama de serviços de alta qualidade em todo o país. Desde estadias em hotéis de luxo, a jantares em restaurantes autênticos, passando por cuidados pessoais e soluções para negócios, a nossa plataforma é a ponte entre si e as melhores experiências que Angola tem para oferecer.
              </p>
              <p>
                Acreditamos no potencial do mercado angolano e na qualidade dos seus prestadores de serviços. O nosso objetivo é capacitar tanto os utilizadores, oferecendo-lhes uma forma fácil e segura de aceder a serviços, como os próprios prestadores, dando-lhes a visibilidade e as ferramentas necessárias para crescerem os seus negócios.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
