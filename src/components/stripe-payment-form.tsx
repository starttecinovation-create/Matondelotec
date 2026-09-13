'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Lock, Calendar, Hash, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Lazy load Stripe client
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface StripeFormProps {
  amount: number;
  onSuccess: (paymentId: string) => void;
  onCancel?: () => void;
  isProcessingExternal?: boolean;
}

// Inner payment component that uses stripe hooks
function RealStripeForm({ amount, onSuccess, onCancel, isProcessingExternal }: StripeFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Fetch Client Secret from API
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao inicializar o pagamento.');
      }

      // 2. Confirm payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("CardElement não encontrado");

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      } else if (result.paymentIntent?.status === 'succeeded') {
        onSuccess(result.paymentIntent.id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao processar pagamento.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
        <div className="flex justify-between items-center mb-4">
          <Label className="text-sm font-semibold">Dados do Cartão</Label>
          <div className="flex gap-1">
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">VISA</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">MC</span>
          </div>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1e293b',
                  '::placeholder': {
                    color: '#94a3b8',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
            }}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="text-xs text-destructive bg-destructive/5 p-3 rounded-lg border border-destructive/20">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isProcessing || isProcessingExternal}>
            Cancelar
          </Button>
        )}
        <Button type="submit" className="flex-1 bg-[#FF7A00] hover:bg-[#D45500]" disabled={!stripe || isProcessing || isProcessingExternal}>
          {isProcessing || isProcessingExternal ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lock className="mr-2 h-4 w-4" />
          )}
          Pagar {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(amount)}
        </Button>
      </div>
    </form>
  );
}

// Simulated Sandbox Card Form when keys are missing
function SandboxStripeForm({ amount, onSuccess, onCancel, isProcessingExternal }: StripeFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.substring(0, 16);
    // Format: XXXX XXXX XXXX XXXX
    const matches = val.match(/.{1,4}/g);
    setCardNumber(matches ? matches.join(' ') : val);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.substring(0, 4);
    if (val.length >= 3) {
      setExpiry(`${val.slice(0, 2)}/${val.slice(2)}`);
    } else {
      setExpiry(val);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 4) setCvv(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cardNumber.replace(/\s/g, '').length < 16) {
      setError('Número de cartão inválido. Deve ter 16 dígitos.');
      return;
    }
    if (expiry.length < 5) {
      setError('Data de validade inválida. Use o formato MM/AA.');
      return;
    }
    if (cvv.length < 3) {
      setError('Código CVV inválido. Deve conter pelo menos 3 dígitos.');
      return;
    }
    if (!cardName.trim()) {
      setError('Nome do titular é obrigatório.');
      return;
    }

    setIsProcessing(true);

    // Simulate Payment Processing
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess(`ch_sim_${Math.random().toString(36).substring(2)}`);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Interactive Metal Visual Card Card Graphic */}
      <div className="relative w-full aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-slate-900 via-[#1e293b] to-slate-950 text-white p-5 shadow-lg overflow-hidden border border-slate-800 transition-all">
        {/* Decorative Chip & Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] tracking-widest text-slate-400 uppercase">Cartão de Crédito</p>
            <p className="font-semibold text-lg font-headline tracking-wide mt-1">Matondelo Card</p>
          </div>
          <div className="h-8 w-12 bg-white/5 rounded-md flex items-center justify-center border border-white/10">
            <span className="text-xs font-black font-mono text-orange-400">VISA</span>
          </div>
        </div>

        {/* Card Chip Visual */}
        <div className="mt-6 w-10 h-8 rounded bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-300 border border-amber-400/50 flex flex-col justify-between p-1 opacity-90">
          <div className="grid grid-cols-3 gap-0.5 h-full opacity-60">
            <div className="border-r border-slate-900/40"></div>
            <div className="border-r border-slate-900/40"></div>
            <div></div>
          </div>
        </div>

        {/* Dynamic Card Number */}
        <div className="mt-4 text-lg md:text-xl font-mono tracking-[0.15em] font-medium text-slate-100">
          {cardNumber || '•••• •••• •••• ••••'}
        </div>

        {/* Footer info */}
        <div className="mt-auto pt-3 flex justify-between items-end">
          <div className="max-w-[70%]">
            <p className="text-[8px] uppercase text-slate-400 tracking-wider">Titular do Cartão</p>
            <p className="font-medium text-xs tracking-wide uppercase truncate mt-0.5">
              {cardName || 'NOME DO TITULAR'}
            </p>
          </div>
          <div>
            <p className="text-[8px] uppercase text-slate-400 tracking-wider">Validade</p>
            <p className="font-mono text-xs mt-0.5">{expiry || 'MM/AA'}</p>
          </div>
        </div>
      </div>

      <div className="bg-orange-500/5 border border-orange-200/50 p-3 rounded-lg text-xs text-orange-800 text-center">
        💡 <strong>Modo Sandbox Ativo:</strong> Insira qualquer número de teste realista para experimentar o checkout!
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cardName" className="text-xs">Nome do Titular (Como no cartão)</Label>
          <div className="relative">
            <Input
              id="cardName"
              placeholder="Ex: Manuel Antunes"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="pl-9"
              required
            />
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cardNumber" className="text-xs">Número do Cartão</Label>
          <div className="relative">
            <Input
              id="cardNumber"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={handleCardNumberChange}
              className="pl-9 font-mono"
              required
            />
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiry" className="text-xs">Validade</Label>
            <div className="relative">
              <Input
                id="expiry"
                placeholder="MM/AA"
                value={expiry}
                onChange={handleExpiryChange}
                className="pl-9 font-mono"
                required
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cvv" className="text-xs">CVV / CVC</Label>
            <Input
              id="cvv"
              type="password"
              placeholder="123"
              value={cvv}
              onChange={handleCvvChange}
              className="font-mono"
              required
            />
          </div>
        </div>

        {error && (
          <div className="text-xs text-destructive bg-destructive/5 p-3 rounded-lg border border-destructive/20">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isProcessing || isProcessingExternal}>
              Cancelar
            </Button>
          )}
          <Button type="submit" className="flex-1 bg-[#FF7A00] hover:bg-[#D45500]" disabled={isProcessing || isProcessingExternal}>
            {isProcessing || isProcessingExternal ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lock className="mr-2 h-4 w-4" />
            )}
            Pagar {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(amount)}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function StripePaymentForm(props: StripeFormProps) {
  // If we have a public key, load elements wrapper, otherwise use sandbox
  if (stripePromise) {
    return (
      <Elements stripe={stripePromise}>
        <RealStripeForm {...props} />
      </Elements>
    );
  }

  return <SandboxStripeForm {...props} />;
}
