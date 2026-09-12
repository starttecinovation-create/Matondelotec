'use client';

import React, { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { CameraOff, MessageSquare, Clock, User, Check, AlertCircle } from 'lucide-react';

import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { collection, doc, query, writeBatch, serverTimestamp, getDoc, collectionGroup, where } from 'firebase/firestore';
import { type Service, type Product, type UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
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
  const [selectedProId, setSelectedProId] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
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

  // Load vendor's professionals
  const professionalsQuery = useMemoFirebase(() => {
    if (!firestore || !service) return null;
    return query(collection(firestore, `users/${service.vendorId}/professionals`));
  }, [firestore, service]);

  const { data: professionals, isLoading: isProLoading } = useCollection<any>(professionalsQuery);

  const dateStr = date ? date.toISOString().split('T')[0] : '';

  // Load existing vendor bookings on that day for schedule conflict check
  const vendorBookingsQuery = useMemoFirebase(() => {
    if (!firestore || !service || !dateStr) return null;
    return query(
      collectionGroup(firestore, 'bookings'),
      where('vendorId', '==', service.vendorId),
      where('date', '==', dateStr)
    );
  }, [firestore, service, dateStr]);

  const { data: vendorBookings } = useCollection<any>(vendorBookingsQuery);

  // Calculate available time slots for selected professional on selected date
  const availableSlots = React.useMemo(() => {
    if (!date || !selectedProId || !professionals) return [];
    const pro = professionals.find((p) => p.id === selectedProId);
    if (!pro || !pro.shifts) return [];

    const dayOfWeek = date.getDay();
    const shift = pro.shifts.find((s: any) => s.dayOfWeek === dayOfWeek);
    if (!shift || !shift.active) return [];

    const [startHour, startMin] = shift.start.split(':').map(Number);
    const [endHour, endMin] = shift.end.split(':').map(Number);
    
    const slots = [];
    let currentHour = startHour;
    let currentMin = startMin;
    const duration = service?.duration || 30;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const slotStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      
      // Check conflict
      const isBooked = vendorBookings?.some(
        (b) => b.professionalId === selectedProId && b.time === slotStr && b.status !== 'Cancelada'
      );

      slots.push({
        time: slotStr,
        available: !isBooked,
      });

      currentMin += duration;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }

    return slots;
  }, [date, selectedProId, professionals, vendorBookings, service?.duration]);

  const handleBooking = async () => {
    if (!user || !firestore || !service || !date || !serviceRef) return;
    
    // Check if professional is required (for Barbearia and categories with active professionals)
    const hasProfessionals = professionals && professionals.length > 0;
    if (hasProfessionals && !selectedProId) {
      toast({ variant: 'destructive', title: 'Profissional Necessário', description: 'Por favor, selecione um profissional.' });
      return;
    }
    if (hasProfessionals && !selectedTimeSlot) {
      toast({ variant: 'destructive', title: 'Horário Necessário', description: 'Por favor, selecione um horário disponível.' });
      return;
    }

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

        // Check conflict again on server-side local state to avoid race condition
        if (hasProfessionals && selectedProId && selectedTimeSlot) {
            const isConflicted = vendorBookings?.some(
                (b) => b.professionalId === selectedProId && b.time === selectedTimeSlot && b.status !== 'Cancelada'
            );
            if (isConflicted) {
                toast({ variant: 'destructive', title: 'Horário Ocupado', description: 'Este horário já foi reservado por outro cliente.' });
                return;
            }
        }

        batch.update(clientProfileRef, { balance: clientProfile.balance - service.price });
        batch.update(vendorProfileRef, { balance: (vendorDoc.data().balance || 0) + service.price });
        
        const newBookingRef = doc(collection(firestore, `users/${user.uid}/bookings`));
        const selectedPro = professionals?.find(p => p.id === selectedProId);

        const bookingData: any = {
            id: newBookingRef.id,
            userId: user.uid,
            vendorId: service.vendorId,
            serviceId: serviceRef.path,
            serviceName: service.name,
            date: date.toISOString().split('T')[0],
            status: 'Confirmada',
            price: service.price,
        };

        if (selectedProId && selectedPro) {
            bookingData.professionalId = selectedProId;
            bookingData.professionalName = selectedPro.name;
        }
        if (selectedTimeSlot) {
            bookingData.time = selectedTimeSlot;
        }

        batch.set(newBookingRef, bookingData);

        // Save real notification for client
        const clientNotifRef = doc(collection(firestore, `users/${user.uid}/notifications`));
        batch.set(clientNotifRef, {
            id: clientNotifRef.id,
            userId: user.uid,
            title: 'Reserva Confirmada!',
            message: `O seu agendamento para "${service.name}" com ${selectedPro?.name || 'profissional'} no dia ${date.toLocaleDateString()} às ${selectedTimeSlot || 'horário selecionado'} foi efetuado.`,
            createdAt: serverTimestamp(),
            read: false,
        });

        // Save real notification for partner/vendor
        const vendorNotifRef = doc(collection(firestore, `users/${service.vendorId}/notifications`));
        batch.set(vendorNotifRef, {
            id: vendorNotifRef.id,
            userId: service.vendorId,
            title: 'Nova Reserva Recebida!',
            message: `O cliente ${clientProfile.displayName} agendou o serviço "${service.name}" com ${selectedPro?.name || 'profissional'} para o dia ${date.toLocaleDateString()} às ${selectedTimeSlot || 'horário selecionado'}.`,
            createdAt: serverTimestamp(),
            read: false,
        });

        await batch.commit();
        toast({ title: 'Reserva Confirmada!' });
        router.push('/bookings');
    } catch (error: any) {
        console.error("Error booking: ", error);
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
              {service.duration && (
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-3.5 h-3.5" /> Duração: {service.duration} minutos
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold mb-2 block text-slate-500">Escolha a Data</Label>
                  <Calendar mode="single" selected={date} onSelect={(d) => { setDate(d); setSelectedTimeSlot(''); }} disabled={(day) => day < new Date()} className="border rounded-md" />
                </div>

                {/* Professionals Selection */}
                {professionals && professionals.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-muted">
                    <Label className="text-xs font-semibold block text-slate-500">Selecione o Profissional</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {professionals
                        .filter((p: any) => !p.specialties || p.specialties.length === 0 || p.specialties.includes(service.id) || p.specialties.includes(unwrappedParams.id.split('/').pop() || ''))
                        .map((pro: any) => {
                          const isSelected = selectedProId === pro.id;
                          return (
                            <div
                              key={pro.id}
                              onClick={() => { setSelectedProId(pro.id); setSelectedTimeSlot(''); }}
                              className={`flex items-center gap-3 p-2.5 border rounded-lg cursor-pointer transition-colors ${
                                isSelected ? 'bg-primary/5 border-primary' : 'bg-background hover:bg-muted/30'
                              }`}
                            >
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <User className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate text-slate-800">{pro.name}</p>
                              </div>
                              {isSelected && (
                                <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center text-white">
                                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Time Slots Selection */}
                {selectedProId && (
                  <div className="space-y-2 pt-2 border-t border-muted">
                    <Label className="text-xs font-semibold block text-slate-500">Horários Disponíveis</Label>
                    {availableSlots.length > 0 ? (
                      <div className="grid grid-cols-4 gap-1.5">
                        {availableSlots.map((slot) => {
                          const isSelected = selectedTimeSlot === slot.time;
                          return (
                            <button
                              key={slot.time}
                              disabled={!slot.available}
                              onClick={() => setSelectedTimeSlot(slot.time)}
                              className={`py-1.5 rounded text-xs font-bold transition-all ${
                                !slot.available
                                  ? 'bg-muted text-muted-foreground/40 cursor-not-allowed line-through'
                                  : isSelected
                                  ? 'bg-primary text-white font-black'
                                  : 'bg-background border border-input hover:bg-muted/50 text-slate-700'
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic flex items-center gap-1 pt-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Sem horários de expediente disponíveis neste dia.
                      </p>
                    )}
                  </div>
                )}

                <Button size="lg" className="w-full mt-4" onClick={handleBooking} disabled={!date || isBooking || (professionals && professionals.length > 0 && (!selectedProId || !selectedTimeSlot))}>
                    {isBooking ? 'A processar...' : 'Pagar e Reservar'}
                </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
