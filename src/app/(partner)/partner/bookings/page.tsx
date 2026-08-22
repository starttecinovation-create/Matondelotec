'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collectionGroup, query, where, orderBy, writeBatch, doc as firestoreDoc, getDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { type Booking, type Order, type CartItem, type UserProfile } from '@/lib/types';
import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { 
  CalendarCheck, 
  ShoppingBag, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Search, 
  Filter, 
  DollarSign, 
  MessageSquare, 
  User, 
  ChevronRight,
  Loader2,
  Calendar,
  X,
  CreditCard,
  Truck,
  Copy,
  ExternalLink,
  ChevronDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Automated WhatsApp Message Generator Dialog ---
function WhatsAppMessageDialog({ 
  isOpen, 
  onClose, 
  clientName, 
  clientPhone, 
  itemName, 
  type, 
  id, 
  totalAmount 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  clientName: string; 
  clientPhone?: string; 
  itemName: string; 
  type: 'booking' | 'order'; 
  id: string; 
  totalAmount?: number; 
}) {
  const [phone, setPhone] = useState(clientPhone || '');
  const { toast } = useToast();

  const formattedAmount = totalAmount 
    ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(totalAmount)
    : '';

  const templates = {
    booking: {
      confirm: `Olá ${clientName}! Aqui é da nossa empresa. Confirmamos o seu agendamento para o serviço "${itemName}". Estamos ansiosos por recebê-lo!`,
      reminder: `Olá ${clientName}, gostaríamos de lembrar do seu agendamento do serviço "${itemName}" agendado para breve. Se tiver alguma dúvida, fale connosco!`,
      cancel: `Olá ${clientName}, infelizmente precisamos de cancelar o seu agendamento para "${itemName}". Pedimos desculpas pelo transtorno e se o pagamento foi feito via Saldo Virtual, o valor já foi totalmente estornado.`
    },
    order: {
      confirm: `Olá ${clientName}! A sua encomenda #${id.substring(0, 6).toUpperCase()} no valor de ${formattedAmount} já foi recebida e está a ser processada. Obrigado pela preferência!`,
      shipped: `Olá ${clientName}! Boas notícias! A sua encomenda #${id.substring(0, 6).toUpperCase()} já foi enviada e está a caminho do seu endereço.`,
      cancel: `Olá ${clientName}, a sua encomenda #${id.substring(0, 6).toUpperCase()} teve de ser cancelada. Se pagou com Saldo Virtual, o reembolso de ${formattedAmount} já está disponível na sua conta.`
    }
  };

  const [activeTemplate, setActiveTemplate] = useState<keyof typeof templates.booking>('confirm');
  const activeMessage = type === 'booking' ? templates.booking[activeTemplate] : templates.order[activeTemplate as keyof typeof templates.order];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeMessage);
    toast({
      title: "Copiado!",
      description: "A mensagem foi copiada para a área de transferência."
    });
  };

  const handleSend = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      toast({
        variant: "destructive",
        title: "Telemóvel necessário",
        description: "Introduza o número de telemóvel do cliente para enviar."
      });
      return;
    }
    const url = `https://wa.me/${cleanPhone.startsWith('244') ? cleanPhone : '244' + cleanPhone}?text=${encodeURIComponent(activeMessage)}`;
    window.open(url, '_blank');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card w-full max-w-md rounded-xl shadow-2xl border border-border overflow-hidden text-left"
      >
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
          <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
            <MessageSquare className="w-5 h-5 text-green-600 fill-green-600/10" /> Mensagem WhatsApp
          </h3>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Telemóvel do Cliente</label>
            <input 
              type="text" 
              placeholder="Ex: 923000000" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs px-3 py-2 border rounded-lg bg-background text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Escolha o Modelo de Mensagem</label>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant={activeTemplate === 'confirm' ? 'default' : 'outline'} 
                size="sm" 
                className="text-[10px] h-8 px-2"
                onClick={() => setActiveTemplate('confirm')}
              >
                Confirmação
              </Button>
              <Button 
                variant={activeTemplate === 'reminder' || activeTemplate === 'shipped' ? 'default' : 'outline'} 
                size="sm" 
                className="text-[10px] h-8 px-2"
                onClick={() => setActiveTemplate(type === 'booking' ? 'reminder' : 'shipped')}
              >
                {type === 'booking' ? 'Lembrete' : 'Envio'}
              </Button>
              <Button 
                variant={activeTemplate === 'cancel' ? 'default' : 'outline'} 
                size="sm" 
                className="text-[10px] h-8 px-2"
                onClick={() => setActiveTemplate('cancel')}
              >
                Cancelamento
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Antevisão da Mensagem</label>
            <div className="p-3 bg-muted rounded-lg text-xs leading-relaxed text-slate-600 whitespace-pre-wrap border border-slate-200">
              {activeMessage}
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted/30 border-t border-border flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs">
            <Copy className="w-3.5 h-3.5 mr-1" /> Copiar Texto
          </Button>
          <Button onClick={handleSend} size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs">
            <ExternalLink className="w-3.5 h-3.5 mr-1" /> Enviar WhatsApp
          </Button>
        </div>
      </motion.div>
    </div>
  );
}


// --- Invoice/Receipt Printing Component ---
function PrintReceiptDialog({ 
  isOpen, 
  onClose, 
  order, 
  client, 
  vendorItems, 
  vendorTotal 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  order: Order; 
  client: UserProfile | null; 
  vendorItems: CartItem[]; 
  vendorTotal: number; 
}) {
  const handlePrint = () => {
    const printContent = document.getElementById('receipt-print-area')?.innerHTML;
    if (printContent) {
      const win = window.open('', '', 'height=600,width=400');
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Recibo - Matondelo</title>
              <style>
                body { font-family: 'Courier New', Courier, monospace; font-size: 12px; line-height: 1.4; color: #000; padding: 20px; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .bold { font-weight: bold; }
                .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
                .header { margin-bottom: 15px; }
                .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .totals { margin-top: 15px; }
                @media print {
                  body { padding: 0; }
                }
              </style>
            </head>
            <body>
              ${printContent}
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                }
              </script>
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  if (!isOpen) return null;

  const orderDate = new Date(order.createdAt?.seconds * 1000 || Date.now());

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card w-full max-w-sm rounded-xl shadow-2xl border border-border overflow-hidden text-left"
      >
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#0F3460]" /> Visualizar Recibo Térmico
          </h3>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 max-h-[400px] overflow-y-auto bg-slate-50 dark:bg-slate-900 border-b border-border">
          <div id="receipt-print-area" className="p-4 bg-white text-black border border-dashed border-slate-300 font-mono text-[11px] leading-relaxed max-w-xs mx-auto shadow-inner">
            <div className="text-center header">
              <p className="bold text-sm">MATONDELO ECOSSISTEMA</p>
              <p>Luanda, Angola</p>
              <p>Apoio ao Empreendedor Local</p>
              <div className="divider"></div>
              <p className="bold">TALÃO DE PEDIDO / ENCOMENDA</p>
              <p>ID: #{order.id.substring(0, 8).toUpperCase()}</p>
              <p>Data: {orderDate.toLocaleString('pt-BR')}</p>
            </div>

            <div className="divider"></div>

            <div>
              <p className="bold">CLIENTE:</p>
              <p>{client?.displayName || 'Cliente Matondelo'}</p>
              <p>E-mail: {client?.email || 'N/D'}</p>
              <p>Pagamento: {order.paymentMethod === 'virtual_balance' ? 'Saldo Virtual' : 'Dinheiro na Entrega'}</p>
            </div>

            <div className="divider"></div>

            <p className="bold">ARTIGOS PEDIDOS:</p>
            <div className="space-y-2 mt-2">
              {vendorItems.map((item) => (
                <div key={item.id}>
                  <div className="item-row">
                    <span>{item.productName}</span>
                    <span className="bold">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.price * item.quantity)}</span>
                  </div>
                  <div className="text-slate-500 pl-2">
                    {item.quantity} un x {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.price)}
                  </div>
                </div>
              ))}
            </div>

            <div className="divider"></div>

            <div className="totals space-y-1">
              <div className="item-row bold text-xs">
                <span>SUBTOTAL VENDEDOR:</span>
                <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(vendorTotal)}</span>
              </div>
              <div className="item-row text-[9px] text-slate-500">
                <span>Taxa Matondelo (0%):</span>
                <span>0,00 Kz</span>
              </div>
              <div className="divider"></div>
              <div className="item-row bold text-sm">
                <span>TOTAL A RECEBER:</span>
                <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(vendorTotal)}</span>
              </div>
            </div>

            <div className="divider"></div>
            <div className="text-center mt-4">
              <p className="bold">Obrigado pelo seu negócio!</p>
              <p>Gerado de forma inteligente via Matondelo.</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-muted/30 border-t border-border flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancelar
          </Button>
          <Button onClick={handlePrint} size="sm" className="bg-[#0F3460] hover:bg-[#15457c] text-white text-xs">
            <Printer className="w-3.5 h-3.5 mr-1" /> Imprimir Talão
          </Button>
        </div>
      </motion.div>
    </div>
  );
}


// --- Single Booking Item ---
function BookingItem({ booking }: { booking: Booking }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isMsgOpen, setIsMsgOpen] = useState(false);

  const clientUserRef = useMemoFirebase(() => {
    if (!firestore || !booking.userId) return null;
    return doc(firestore, 'users', booking.userId);
  }, [firestore, booking.userId]);

  const { data: client, isLoading: isClientLoading } = useDoc<UserProfile>(clientUserRef);
  
  const handleUpdateStatus = async (newStatus: 'Confirmada' | 'Cancelada') => {
    if (!firestore) return;
    setIsLoading(true);

    const bookingDocRef = firestoreDoc(firestore, `users/${booking.userId}/bookings/${booking.id}`);
    const batch = writeBatch(firestore);
    
    try {
      batch.update(bookingDocRef, { status: newStatus });
      
      // If cancelling, we should refund the client and debit the vendor
      if (newStatus === 'Cancelada' && clientUserRef) {
        const serviceDocRef = firestoreDoc(firestore, booking.serviceId);
        const [serviceDoc, clientDoc, vendorDoc] = await Promise.all([
          getDoc(serviceDocRef),
          getDoc(clientUserRef),
          getDoc(firestoreDoc(firestore, 'users', booking.vendorId))
        ]);

        if (serviceDoc.exists() && clientDoc.exists() && vendorDoc.exists()) {
          const servicePrice = serviceDoc.data().price;
          const clientProfile = clientDoc.data() as UserProfile;
          const vendorProfile = vendorDoc.data() as UserProfile;

          // Refund client
          batch.update(clientUserRef, { balance: (clientProfile.balance || 0) + servicePrice });
          // Debit vendor
          batch.update(vendorDoc.ref, { balance: (vendorProfile.balance || 0) - servicePrice });

          // Create transactions for audit
          const clientTransactionRef = firestoreDoc(collection(firestore, `users/${clientProfile.id}/transactions`));
          batch.set(clientTransactionRef, {
            id: clientTransactionRef.id,
            userId: clientProfile.id,
            amount: servicePrice,
            type: 'credit',
            description: `Reembolso da reserva cancelada: ${booking.serviceName}`,
            transactionDate: serverTimestamp(),
          });

          const vendorTransactionRef = firestoreDoc(collection(firestore, `users/${vendorProfile.id}/transactions`));
          batch.set(vendorTransactionRef, {
            id: vendorTransactionRef.id,
            userId: vendorProfile.id,
            amount: servicePrice,
            type: 'debit',
            description: `Estorno da reserva cancelada: ${booking.serviceName}`,
            transactionDate: serverTimestamp(),
          });
        }
      }
      
      await batch.commit();

      toast({
        title: 'Reserva Atualizada!',
        description: `A reserva foi marcada como ${newStatus}.`
      });
    } catch (error) {
      console.error("Error updating booking status: ", error);
      toast({
        variant: "destructive",
        title: 'Erro!',
        description: 'Não foi possível atualizar o estado da reserva.'
      });
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: bookingDocRef.path,
        operation: 'update',
        requestResourceData: { status: newStatus },
      }));
    } finally {
      setIsLoading(false);
    }
  };

  if (isClientLoading) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }

  const isPending = booking.status === 'Pendente';
  const bookingDate = new Date(booking.date);

  return (
    <Card className="border border-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden text-left bg-card">
      <div className="p-5 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <Calendar className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-base text-foreground leading-snug">{booking.serviceName}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <CalendarCheck className="w-3.5 h-3.5" />
                {bookingDate.toLocaleDateString('pt-AO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          
          <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700">
              <User className="w-3.5 h-3.5 text-[#0F3460]" />
              <strong>Cliente:</strong> {client?.displayName || 'Utilizador Matondelo'}
            </div>
            <div className="text-muted-foreground">
              <strong>Email:</strong> {client?.email}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:items-end justify-between gap-3 shrink-0">
          <Badge 
            variant={booking.status === 'Confirmada' ? 'default' : booking.status === 'Pendente' ? 'secondary' : 'destructive'} 
            className={`text-xs px-2.5 py-1 ${
              booking.status === 'Confirmada' ? 'bg-green-600 text-white hover:bg-green-700' : 
              booking.status === 'Pendente' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200' : 
              'bg-red-100 text-red-800 hover:bg-red-200'
            }`}
          >
            {booking.status}
          </Badge>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setIsMsgOpen(true)} 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs border-green-200 hover:bg-green-50 text-green-700 gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
            </Button>

            {isPending && (
              <>
                <Button 
                  onClick={() => handleUpdateStatus('Confirmada')} 
                  disabled={isLoading} 
                  size="sm" 
                  className="bg-[#0F3460] hover:bg-[#15457c] text-white h-8 text-xs font-semibold"
                >
                  {isLoading && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                  Confirmar
                </Button>
                <Button 
                  onClick={() => handleUpdateStatus('Cancelada')} 
                  variant="destructive" 
                  disabled={isLoading} 
                  size="sm" 
                  className="h-8 text-xs font-semibold"
                >
                  {isLoading && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                  Recusar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <WhatsAppMessageDialog 
        isOpen={isMsgOpen} 
        onClose={() => setIsMsgOpen(false)} 
        clientName={client?.displayName || 'Cliente'} 
        itemName={booking.serviceName} 
        type="booking" 
        id={booking.id} 
      />
    </Card>
  );
}


// --- Single Order Item ---
function OrderItem({ order, partnerUserId }: { order: Order; partnerUserId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isMsgOpen, setIsMsgOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const clientUserRef = useMemoFirebase(() => {
    if (!firestore || !order.userId) return null;
    return doc(firestore, 'users', order.userId);
  }, [firestore, order.userId]);

  const { data: client, isLoading: isClientLoading } = useDoc<UserProfile>(clientUserRef);

  // Filter items in this order that belong to THIS vendor
  const vendorItems = useMemo(() => {
    return order.items?.filter(item => item.vendorId === partnerUserId) || [];
  }, [order.items, partnerUserId]);

  const vendorTotal = useMemo(() => {
    return vendorItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [vendorItems]);

  const handleUpdateStatus = async (newStatus: 'processing' | 'shipped' | 'delivered' | 'cancelled') => {
    if (!firestore) return;
    setIsLoading(true);

    const orderDocRef = doc(firestore, `users/${order.userId}/orders/${order.id}`);
    const batch = writeBatch(firestore);

    try {
      // If cancelling and the payment method was virtual balance, we refund the client
      if (newStatus === 'cancelled' && order.paymentMethod === 'virtual_balance' && clientUserRef) {
        const [clientDoc, vendorDoc] = await Promise.all([
          getDoc(clientUserRef),
          getDoc(doc(firestore, 'users', partnerUserId))
        ]);

        if (clientDoc.exists() && vendorDoc.exists()) {
          const clientProfile = clientDoc.data() as UserProfile;
          const vendorProfile = vendorDoc.data() as UserProfile;

          // Refund the vendor's total portion of this order
          const refundAmount = vendorTotal;

          // Refund client
          batch.update(clientUserRef, { balance: (clientProfile.balance || 0) + refundAmount });
          // Debit vendor
          batch.update(vendorDoc.ref, { balance: (vendorProfile.balance || 0) - refundAmount });

          // Log client transaction
          const clientTxRef = doc(collection(firestore, `users/${clientProfile.id}/transactions`));
          batch.set(clientTxRef, {
            id: clientTxRef.id,
            userId: clientProfile.id,
            amount: refundAmount,
            type: 'credit',
            description: `Estorno de encomenda cancelada #${order.id.substring(0, 6).toUpperCase()}`,
            transactionDate: serverTimestamp()
          });

          // Log vendor transaction
          const vendorTxRef = doc(collection(firestore, `users/${partnerUserId}/transactions`));
          batch.set(vendorTxRef, {
            id: vendorTxRef.id,
            userId: partnerUserId,
            amount: refundAmount,
            type: 'debit',
            description: `Reembolso de encomenda cancelada #${order.id.substring(0, 6).toUpperCase()}`,
            transactionDate: serverTimestamp()
          });
        }
      }

      batch.update(orderDocRef, { status: newStatus });
      await batch.commit();

      toast({
        title: 'Encomenda Atualizada!',
        description: `O estado foi alterado para: ${
          newStatus === 'processing' ? 'Em Processamento' : 
          newStatus === 'shipped' ? 'Enviada' : 
          newStatus === 'delivered' ? 'Entregue' : 'Cancelada'
        }.`
      });
    } catch (error) {
      console.error("Error updating order status: ", error);
      toast({
        variant: "destructive",
        title: 'Erro ao atualizar',
        description: 'Não foi possível alterar o estado da encomenda.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isClientLoading) {
    return <Skeleton className="h-44 w-full rounded-xl" />;
  }

  const orderDate = new Date(order.createdAt?.seconds * 1000 || Date.now());

  // Portuguese translations for order statuses
  const statusLabels = {
    pending: 'Pendente',
    processing: 'Em Processamento',
    shipped: 'Enviada',
    delivered: 'Entregue',
    cancelled: 'Cancelada'
  };

  return (
    <Card className="border border-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden text-left bg-card">
      <CardHeader className="pb-3 border-b border-muted/50 bg-muted/10">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                <ShoppingBag className="w-4 h-4" />
              </span>
              <CardTitle className="text-sm md:text-base font-bold">
                Encomenda #{order.id.substring(0, 6).toUpperCase()}
              </CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">
              {orderDate.toLocaleDateString('pt-AO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </CardDescription>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge 
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 ${
                order.status === 'delivered' ? 'bg-green-600 hover:bg-green-700 text-white' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                order.status === 'shipped' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200' :
                order.status === 'processing' ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200' :
                'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200'
              }`}
            >
              {statusLabels[order.status] || order.status}
            </Badge>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
              {order.paymentMethod === 'virtual_balance' ? (
                <>
                  <CreditCard className="w-3 h-3 text-[#0F3460]" />
                  <span>Pago (Saldo Virtual)</span>
                </>
              ) : (
                <>
                  <Truck className="w-3 h-3 text-orange-600" />
                  <span>Dinheiro na Entrega</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Products List for THIS vendor */}
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Produtos do seu Catálogo:</p>
          <div className="divide-y divide-border/60">
            {vendorItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 text-xs">
                <div>
                  <span className="font-semibold text-foreground">{item.productName}</span>
                  <span className="text-slate-500 ml-1.5">({item.quantity}x)</span>
                </div>
                <span className="font-medium">
                  {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Details info block */}
        <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
          <div className="flex items-center gap-1 font-bold text-slate-800">
            <User className="w-3.5 h-3.5 text-[#0F3460]" />
            <span>Cliente: {client?.displayName || 'Utilizador Matondelo'}</span>
          </div>
          <p className="text-muted-foreground">E-mail: {client?.email}</p>
        </div>
      </CardContent>

      <CardFooter className="p-4 border-t border-border flex flex-col sm:flex-row justify-between items-center bg-muted/5 gap-3">
        <div className="flex items-baseline gap-1.5 text-xs text-left w-full sm:w-auto">
          <span className="text-muted-foreground">Seu Subtotal:</span>
          <strong className="text-base text-[#0F3460] font-black">
            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(vendorTotal)}
          </strong>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <Button 
            onClick={() => setIsPrintOpen(true)} 
            variant="outline" 
            size="sm" 
            className="h-8 text-[11px] gap-1 px-2.5"
          >
            <Printer className="w-3.5 h-3.5" /> Recibo
          </Button>

          <Button 
            onClick={() => setIsMsgOpen(true)} 
            variant="outline" 
            size="sm" 
            className="h-8 text-[11px] border-green-200 text-green-700 hover:bg-green-50 gap-1 px-2.5"
          >
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
          </Button>

          {/* Quick advanced flow buttons */}
          {order.status === 'pending' && (
            <Button 
              onClick={() => handleUpdateStatus('processing')} 
              disabled={isLoading}
              size="sm" 
              className="h-8 text-[11px] bg-[#0F3460] hover:bg-[#15457c] text-white px-2.5"
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Processar
            </Button>
          )}

          {order.status === 'processing' && (
            <Button 
              onClick={() => handleUpdateStatus('shipped')} 
              disabled={isLoading}
              size="sm" 
              className="h-8 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white px-2.5"
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Enviar
            </Button>
          )}

          {order.status === 'shipped' && (
            <Button 
              onClick={() => handleUpdateStatus('delivered')} 
              disabled={isLoading}
              size="sm" 
              className="h-8 text-[11px] bg-green-600 hover:bg-green-700 text-white px-2.5"
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Entregar
            </Button>
          )}

          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <Button 
              onClick={() => handleUpdateStatus('cancelled')} 
              disabled={isLoading}
              variant="destructive" 
              size="sm" 
              className="h-8 text-[11px] px-2.5"
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Cancelar
            </Button>
          )}
        </div>
      </CardFooter>

      <WhatsAppMessageDialog 
        isOpen={isMsgOpen} 
        onClose={() => setIsMsgOpen(false)} 
        clientName={client?.displayName || 'Cliente'} 
        itemName={vendorItems[0]?.productName || 'Artigos'} 
        type="order" 
        id={order.id} 
        totalAmount={vendorTotal} 
      />

      <PrintReceiptDialog 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        order={order} 
        client={client} 
        vendorItems={vendorItems} 
        vendorTotal={vendorTotal} 
      />
    </Card>
  );
}


// --- Main Partner Bookings & Orders Page ---
export default function PartnerBookingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Selected sub-tab: 'bookings' or 'orders'
  const [activeTab, setActiveTab] = useState<'bookings' | 'orders'>('bookings');

  // Search and status filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // 1. Fetch Bookings
  const bookingsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collectionGroup(firestore, 'bookings'),
      where('vendorId', '==', user.uid),
      orderBy('date', 'desc')
    );
  }, [firestore, user]);

  const { data: bookings, isLoading: isBookingsLoading } = useCollection<Booking>(bookingsQuery);

  // 2. Fetch Orders
  const ordersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collectionGroup(firestore, 'orders'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: orders, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery);

  // Filter orders client-side for this partner vendor
  const vendorOrders = useMemo(() => {
    if (!orders || !user) return [];
    return orders.filter(order => 
      order.items?.some(item => item.vendorId === user.uid)
    );
  }, [orders, user]);

  // --- Calculate Metrics ---
  const stats = useMemo(() => {
    const activeBookings = bookings?.filter(b => b.status === 'Confirmada') || [];
    const pendingBookings = bookings?.filter(b => b.status === 'Pendente') || [];
    const pendingOrders = vendorOrders.filter(o => o.status === 'pending' || o.status === 'processing' || o.status === 'shipped');
    const completedOrders = vendorOrders.filter(o => o.status === 'delivered');

    // Revenue from confirmed bookings (Mock estimate or service price average)
    const bookingsRevenue = activeBookings.length * 15000; 

    // Revenue from delivered orders
    const ordersRevenue = completedOrders.reduce((sum, order) => {
      const vendorItems = order.items?.filter(item => item.vendorId === user?.uid) || [];
      const orderTotal = vendorItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      return sum + orderTotal;
    }, 0);

    const totalFaturamento = bookingsRevenue + ordersRevenue;

    return {
      faturamento: totalFaturamento,
      reservasPendentes: pendingBookings.length,
      encomendasPendentes: pendingOrders.length,
      totalReservas: bookings?.length || 0,
      totalEncomendas: vendorOrders.length
    };
  }, [bookings, vendorOrders, user?.uid]);

  // --- Filter Bookings ---
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter(b => {
      const matchesSearch = b.serviceName.toLowerCase().includes(searchText.toLowerCase());
      const matchesStatus = statusFilter === 'todos' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchText, statusFilter]);

  // --- Filter Orders ---
  const filteredOrders = useMemo(() => {
    return vendorOrders.filter(o => {
      const itemNames = o.items?.map(i => i.productName).join(' ') || '';
      const matchesSearch = itemNames.toLowerCase().includes(searchText.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter !== 'todos') {
        matchesStatus = o.status === statusFilter;
      }
      return matchesSearch && matchesStatus;
    });
  }, [vendorOrders, searchText, statusFilter]);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl space-y-8" id="partner_bookings_center_root">
      
      {/* Dynamic Dashboard Header */}
      <div className="text-left space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0F3460]/10 text-[#0F3460] border border-[#0F3460]/20 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" /> Painel de Agendamentos e Vendas
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20">
            Faturamento Inteligent
          </span>
        </div>
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Reservas & Encomendas
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
          Gira os agendamentos de serviços e entregas de produtos em um único painel. Comunique com os clientes via WhatsApp e imprima recibos térmicos instantâneos.
        </p>
      </div>

      {/* KPI/Stats bar (Anti-Slop Clean Design) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0F3460]/5 p-4 rounded-xl border border-[#0F3460]/10 text-left">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Faturamento Est.</span>
          <strong className="text-lg md:text-xl font-black text-[#0F3460] mt-1 block">
            {stats.faturamento.toLocaleString('pt-AO')} Kz
          </strong>
          <span className="text-[9px] text-muted-foreground mt-0.5 block">0% comissão cobrada</span>
        </div>

        <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/15 text-left">
          <span className="text-[10px] uppercase font-bold text-amber-800 block">Reservas Pendentes</span>
          <strong className="text-lg md:text-xl font-black text-amber-700 mt-1 block">
            {stats.reservasPendentes}
          </strong>
          <span className="text-[9px] text-amber-600 mt-0.5 block">Aguardando aprovação</span>
        </div>

        <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/15 text-left">
          <span className="text-[10px] uppercase font-bold text-indigo-800 block">Encomendas Ativas</span>
          <strong className="text-lg md:text-xl font-black text-indigo-700 mt-1 block">
            {stats.encomendasPendentes}
          </strong>
          <span className="text-[9px] text-indigo-600 mt-0.5 block">Em processamento/envio</span>
        </div>

        <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/15 text-left">
          <span className="text-[10px] uppercase font-bold text-emerald-800 block">Volume Total</span>
          <strong className="text-lg md:text-xl font-black text-emerald-700 mt-1 block">
            {stats.totalReservas + stats.totalEncomendas}
          </strong>
          <span className="text-[9px] text-emerald-600 mt-0.5 block">Interações gerais</span>
        </div>
      </div>

      {/* Segment Selector / Animated Tabs */}
      <div className="flex border-b border-border">
        <button 
          onClick={() => { setActiveTab('bookings'); setStatusFilter('todos'); }} 
          className={`flex items-center gap-2 py-3 px-6 text-sm font-semibold relative transition-colors ${
            activeTab === 'bookings' ? 'text-[#0F3460]' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Agendamentos de Serviços ({stats.totalReservas})</span>
          {activeTab === 'bookings' && (
            <motion.div 
              layoutId="activeTabUnderline" 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F3460]" 
            />
          )}
        </button>

        <button 
          onClick={() => { setActiveTab('orders'); setStatusFilter('todos'); }} 
          className={`flex items-center gap-2 py-3 px-6 text-sm font-semibold relative transition-colors ${
            activeTab === 'orders' ? 'text-[#0F3460]' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Encomendas de Produtos ({stats.totalEncomendas})</span>
          {activeTab === 'orders' && (
            <motion.div 
              layoutId="activeTabUnderline" 
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0F3460]" 
            />
          )}
        </button>
      </div>

      {/* Control Filters Area */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder={activeTab === 'bookings' ? "Pesquise por serviço..." : "Pesquise por produto..."}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#0F3460]"
          />
        </div>

        {/* Dynamic status filters based on selected tab */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 pr-1.5">
            <Filter className="w-3.5 h-3.5" /> Estado:
          </span>
          
          <Button 
            variant={statusFilter === 'todos' ? 'default' : 'outline'} 
            size="sm" 
            className="text-[11px] h-7"
            onClick={() => setStatusFilter('todos')}
          >
            Todos
          </Button>

          {activeTab === 'bookings' ? (
            <>
              <Button 
                variant={statusFilter === 'Pendente' ? 'default' : 'outline'} 
                size="sm" 
                className="text-[11px] h-7"
                onClick={() => setStatusFilter('Pendente')}
              >
                Pendente
              </Button>
              <Button 
                variant={statusFilter === 'Confirmada' ? 'default' : 'outline'} 
                size="sm" 
                className="text-[11px] h-7"
                onClick={() => setStatusFilter('Confirmada')}
              >
                Confirmada
              </Button>
              <Button 
                variant={statusFilter === 'Cancelada' ? 'default' : 'outline'} 
                size="sm" 
                className="text-[11px] h-7"
                onClick={() => setStatusFilter('Cancelada')}
              >
                Cancelada
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant={statusFilter === 'pending' ? 'default' : 'outline'} 
                size="sm" 
                className="text-[11px] h-7"
                onClick={() => setStatusFilter('pending')}
              >
                Pendente
              </Button>
              <Button 
                variant={statusFilter === 'processing' ? 'default' : 'outline'} 
                size="sm" 
                className="text-[11px] h-7"
                onClick={() => setStatusFilter('processing')}
              >
                Em Processo
              </Button>
              <Button 
                variant={statusFilter === 'shipped' ? 'default' : 'outline'} 
                size="sm" 
                className="text-[11px] h-7"
                onClick={() => setStatusFilter('shipped')}
              >
                Enviada
              </Button>
              <Button 
                variant={statusFilter === 'delivered' ? 'default' : 'outline'} 
                size="sm" 
                className="text-[11px] h-7"
                onClick={() => setStatusFilter('delivered')}
              >
                Entregue
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === 'bookings' ? (
            <motion.div 
              key="bookings-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              {isBookingsLoading ? (
                <>
                  <Skeleton className="h-28 w-full rounded-xl" />
                  <Skeleton className="h-28 w-full rounded-xl" />
                  <Skeleton className="h-28 w-full rounded-xl" />
                </>
              ) : filteredBookings.length > 0 ? (
                filteredBookings.map(booking => (
                  <BookingItem key={booking.id} booking={booking} />
                ))
              ) : (
                <div className="text-center py-16 border rounded-xl bg-card">
                  <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">Sem agendamentos encontrados</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Não existem reservas de serviços correspondentes aos filtros ativos.
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="orders-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              {isOrdersLoading ? (
                <>
                  <Skeleton className="h-44 w-full rounded-xl" />
                  <Skeleton className="h-44 w-full rounded-xl" />
                </>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <OrderItem key={order.id} order={order} partnerUserId={user?.uid || ''} />
                ))
              ) : (
                <div className="text-center py-16 border rounded-xl bg-card">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">Sem encomendas encontradas</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Não existem encomendas de produtos correspondentes aos filtros ativos.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
