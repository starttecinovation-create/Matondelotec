import { NextRequest, NextResponse } from "next/server";

let stripeClient: any = null;

function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return null;
    }
    try {
      // Lazy load stripe to prevent crashes if missing
      const Stripe = require("stripe");
      stripeClient = new Stripe(key);
    } catch (err) {
      console.error("Falha ao inicializar o SDK do Stripe:", err);
      return null;
    }
  }
  return stripeClient;
}

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = "aoa" } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valor de pagamento inválido" },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    if (!stripe) {
      // Graceful fallback: return simulation token for sandbox preview
      return NextResponse.json({
        clientSecret: `pi_mock_${Math.random().toString(36).substring(2)}`,
        sandbox: true,
        message: "Stripe em modo de demonstração. Configure STRIPE_SECRET_KEY para pagamentos reais.",
      });
    }

    // Stripe expects amount in cents (e.g. 100 AOA = 10000 cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      payment_method_types: ["card"],
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      sandbox: false,
    });
  } catch (error: any) {
    console.error("Erro na criação do Stripe PaymentIntent:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno ao processar transação" },
      { status: 500 }
    );
  }
}
