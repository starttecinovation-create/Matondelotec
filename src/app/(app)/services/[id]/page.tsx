'use client';

import React, { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { CameraOff, MessageSquare } from 'lucide-react';

import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { collection, doc, query, writeBatch, serverTimestamp, getDoc } from 'firebase/firestore';
import { type Service, type Product, type UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getPlacePhoto } from '@/ai/flows/place-photo-flow';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';

function DynamicServiceImage({ service }: { service: Service }) {
  const mainImage = PlaceHolderImages.find((img) => img.id === (service.imageUrls && service.imageUrls[0]));
  const [photoUrl, setPhotoUrl] = useState<string | null>(mainImage?.imageUrl || null);
  const [attribution, setAttribution] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!mainImage);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (mainImage) return;

    const fetchPhoto = async () => {
      setIsLoading(true);
      setError(false);
      try {
        const result = await getPlacePhoto({ textQuery: service.name });
        if (result.photoUrl) {
          setPhotoUrl(result.photoUrl);
          setAttribution(result.attribution);
        } else {
          setError(true);
        }
      } catch (e) {
        console.error("Error fetching place photo:", e);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhoto();
  }, [service.name, mainImage]);

  if (isLoading) return <Skeleton className="w-full h-full" />;
  
  if (error || !photoUrl) {
    return (
        <div className="w-full h-full bg-muted flex flex-col items-center justify-center">
            <CameraOff className="w-16 h-16 text-muted-foreground" />
            <p className='text-sm text-muted-foreground mt-2'>Imagem não disponível</p>
        </div>
    );
  }

  return (
    <>
      <Image src={photoUrl} alt={service.name} fill className="object-cover" priority />
      {attribution && (
          <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded-sm" dangerouslySetInnerHTML={{ __html: attribution }}></div>
      )}
    </>
  );
}

function ProductListItem({ product, service }: { product: Product, service: Service }) {
    const chatUrl = `/chat/${encodeURIComponent(`users/${service.vendorId}/services/${service.id}`)}?product=${encodeURIComponent(product.name)}`;
    const { addProductToCart, isUpdating } = useCart();
    const { toast } = useToast();

    const handleAddToCart = () => {
        addProductToCart(product);
        toast({ title: "Produto Adicionado", description: `${product.name} foi adicionado ao seu carrinho.` });
    }

    const showChatButton = service.category === 'Gráfica';

    return (
        <Card className='flex flex-col'>
            {product.imageUrl && (
                <div className="relative aspect-video w-full overflow-hidden rounded-t-lg border-b">
                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover"/>
                </div>
            )}
            <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                 {product.description && <p className="text-sm text-muted-foreground pt-2">{product.description}</p>}
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-lg font-bold">
                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)}
                </p>
            </CardContent>
            <CardFooter>
                 {showChatButton ? (
                    <Button asChild className="w-full">
                        <Link href={chatUrl}><MessageSquare className="mr-2 h-4 w-4" /> Pedir Orçamento</Link>
                    </Button>
                ) : (
                    <Button className="w-full" onClick={handleAddToCart} disabled={isUpdating}>
                        {isUpdating ? 'A adicionar...' : 'Adicionar ao Carrinho'}
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isBooking, setIsBooking] = useState(false);

  const serviceRef = useMemoFirebase(() => {
    if (!firestore) return null;
    try {
        const docPath = decodeURIComponent(unwrappedParams.id);
        if (docPath.includes('/')) return doc(firestore, docPath);
    } catch (e) {
        console.error("Error creating doc ref: ", e);
    }
    return null;
  }, [firestore, unwrappedParams.id]);

  const { data: service, isLoading: isServiceLoading } = useDoc<Service>(serviceRef);
  
  const productsQuery = useMemoFirebase(() => {
    if (!serviceRef) return null;
    return query(collection(serviceRef, 'products'));
  }, [serviceRef]);

  const { data: products } = useCollection<Product>(productsQuery);

  const handleBooking = async () => {
    if (!user || !firestore || !service || !date || !serviceRef) return;
    setIsBooking(true);

    const batch = writeBatch(firestore);
    const clientProfileRef = doc(firestore, 'users', user.uid);
    const vendorProfileRef = doc(firestore, 'users', service.vendorId);

    try {
        const [clientDoc, vendorDoc] = await Promise.all([getDoc(clientProfileRef), getDoc(vendorProfileRef)]);
        if (!clientDoc.exists() || !vendorDoc.exists()) throw new Error("Perfil não encontrado");

        const clientProfile = clientDoc.data() as UserProfile;
        if (clientProfile.balance < service.price) {
            toast({ variant: 'destructive', title: 'Saldo Insuficiente' });
            return;
        }

        batch.update(clientProfileRef, { balance: clientProfile.balance - service.price });
        batch.update(vendorProfileRef, { balance: (vendorDoc.data().balance || 0) + service.price });
        
        const newBookingRef = doc(collection(firestore, `users/${user.uid}/bookings`));
        batch.set(newBookingRef, {
            id: newBookingRef.id,
            userId: user.uid,
            vendorId: service.vendorId,
            serviceId: serviceRef.path,
            serviceName: service.name,
            date: date.toISOString().split('T')[0],
            status: 'Confirmada',
        });

        await batch.commit();
        toast({ title: 'Reserva Confirmada!' });
        router.push('/bookings');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro na Reserva' });
    } finally {
        setIsBooking(false);
    }
  };

  if (isServiceLoading) return <div className="container mx-auto p-12"><Skeleton className="h-96 w-full" /></div>;
  if (!service) return <div className="container mx-auto p-12 text-center">Serviço não encontrado</div>;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
        <div className="md:col-span-2 space-y-6">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                <DynamicServiceImage service={service} />
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold">{service.name}</h1>
            <p className="text-muted-foreground leading-relaxed">{service.description}</p>
            {products && products.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6 pt-6">
                    {products.map(p => <ProductListItem key={p.id} product={p} service={service} />)}
                </div>
            )}
        </div>
        <div className="md:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Reservar</CardTitle>
              <div className="text-2xl font-bold">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(service.price)}</div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Calendar mode="single" selected={date} onSelect={setDate} disabled={(day) => day < new Date()} />
                <Button size="lg" className="w-full" onClick={handleBooking} disabled={!date || isBooking}>
                    {isBooking ? 'A processar...' : 'Pagar e Reservar'}
                </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
