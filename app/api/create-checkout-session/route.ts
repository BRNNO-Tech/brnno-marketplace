import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-06-20' });

export async function POST(req: Request) {
  try {
    const { providerId, amount, bookingId } = await req.json();

    // TODO: Fetch provider's Stripe account id from Firestore using providerId
    const destination = 'acct_provider_stripe_id';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Detailing Service' },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/profile?success=1`,
      cancel_url: `${req.headers.get('origin')}/profile?cancel=1`,
      payment_intent_data: {
        transfer_data: { destination },
        metadata: { bookingId, providerId },
      },
      metadata: { bookingId, providerId },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Unable to create checkout session' }, { status: 500 });
  }
}


