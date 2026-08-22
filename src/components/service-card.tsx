import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';

import { type Service } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CategoryIcon } from './category-icon';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface ServiceCardProps {
  service: Service;
  layout?: 'vertical' | 'horizontal';
}

export function ServiceCard({ service, layout = 'vertical' }: ServiceCardProps) {
  const serviceImage = PlaceHolderImages.find((img) => img.id === (service.imageUrls && service.imageUrls[0]));
  
  const isHorizontal = layout === 'horizontal';

  const getServiceUrl = (service: Service) => {
    // The service is stored as a subcollection of the user/vendor who created it.
    const docPath = `users/${service.vendorId}/services/${service.id}`;
    return `/services/${encodeURIComponent(docPath)}`;
  }

  return (
    <Link href={getServiceUrl(service)} className="block group">
      <Card className={cn("overflow-hidden transition-all duration-300 hover:shadow-lg", isHorizontal && "flex flex-col md:flex-row")}>
        <div className={cn("relative w-full overflow-hidden", isHorizontal ? "md:w-1/3 lg:w-1/4 aspect-video md:aspect-square" : "aspect-video")}>
          {serviceImage ? (
            <Image
              src={serviceImage.imageUrl}
              alt={service.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              data-ai-hint={serviceImage.imageHint}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
                {service.category && <CategoryIcon category={service.category} className="w-12 h-12 text-muted-foreground" />}
            </div>
          )}
        </div>
        <div className={cn("flex flex-col flex-grow", isHorizontal && "md:w-2/3 lg:w-3/4")}>
            <CardHeader className={cn(!isHorizontal && "pb-2", isHorizontal && "py-4 px-4")}>
                {isHorizontal ? (
                    <div className="flex justify-between items-start gap-4">
                        <CardTitle className="font-headline text-xl leading-tight group-hover:text-primary transition-colors">
                            {service.name}
                        </CardTitle>
                        <div className="font-bold text-lg text-right shrink-0">
                            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(service.price)}
                        </div>
                    </div>
                ) : (
                    <>
                        {service.category && <Badge variant="secondary" className="w-fit">{service.category}</Badge>}
                         <CardTitle className="font-headline text-2xl leading-tight group-hover:text-primary transition-colors pt-2">
                            {service.name}
                        </CardTitle>
                    </>
                )}
            </CardHeader>
            <CardContent className={cn("flex-grow flex flex-col justify-between", isHorizontal ? "pt-0 px-4 pb-4" : "pt-2")}>
                <div>
                    {isHorizontal && service.category && (
                         <div className="flex items-center gap-4 mb-2 text-sm">
                            <Badge variant="outline">{service.category}</Badge>
                             {/* Mock data for rating and reviews until it's in the schema */}
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-primary fill-primary" />
                                <span className="font-semibold">4.8</span>
                                <span className="text-muted-foreground">(123 avaliações)</span>
                            </div>
                        </div>
                    )}
                    <CardDescription className="mt-2 line-clamp-2">{service.description}</CardDescription>
                </div>

                {isHorizontal ? (
                    <div className="mt-4 flex justify-end">
                        <Button variant="link" className="h-auto p-0 text-primary hover:text-primary/80">
                            Ver detalhes <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                     <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                            {/* Mock data for rating and reviews until it's in the schema */}
                            <Star className="w-4 h-4 text-primary fill-primary" />
                            <span className="font-semibold">4.8</span>
                            <span className="text-muted-foreground">(123 avaliações)</span>
                        </div>
                        <div className="font-semibold text-lg">
                            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(service.price)}
                        </div>
                    </div>
                )}
            </CardContent>
        </div>
      </Card>
    </Link>
  );
}
