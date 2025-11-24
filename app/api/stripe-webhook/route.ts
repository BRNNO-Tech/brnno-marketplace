import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-06-20' });
  const sig = req.headers.get('stripe-signature') as string;
  const buf = Buffer.from(await req.arrayBuffer());
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle successful payments
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const bookingId = (pi.metadata as any)?.bookingId;
    const providerId = (pi.metadata as any)?.providerId;

    if (bookingId && providerId) {
      try {
        await updateDoc(doc(db, 'bookings', bookingId), { 
          status: 'confirmed',
          paymentIntentId: pi.id,
          paidAt: new Date().toISOString(),
        });
        await setDoc(doc(db, 'providers', providerId, 'jobs', bookingId), { 
          status: 'confirmed',
          paymentIntentId: pi.id,
        }, { merge: true });
      } catch (error) {
        console.error('Error updating booking on payment success:', error);
        // Log error but don't fail webhook - Stripe will retry
      }
    }
  }

  // Handle failed payments
  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const bookingId = (pi.metadata as any)?.bookingId;
    const providerId = (pi.metadata as any)?.providerId;

    if (bookingId) {
      try {
        await updateDoc(doc(db, 'bookings', bookingId), { 
          status: 'pending', // Keep as pending so customer can retry
          paymentError: pi.last_payment_error?.message || 'Payment failed',
          paymentIntentId: pi.id,
        });
        
        if (providerId) {
          await setDoc(doc(db, 'providers', providerId, 'jobs', bookingId), { 
            status: 'pending',
            paymentError: pi.last_payment_error?.message || 'Payment failed',
          }, { merge: true });
        }
      } catch (error) {
        console.error('Error updating booking on payment failure:', error);
      }
    }
  }

  // Handle cancelled/failed payment intents
  if (event.type === 'payment_intent.canceled') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const bookingId = (pi.metadata as any)?.bookingId;
    const providerId = (pi.metadata as any)?.providerId;

    if (bookingId) {
      try {
        await updateDoc(doc(db, 'bookings', bookingId), { 
          status: 'pending', // Keep as pending so customer can retry
          paymentError: 'Payment was cancelled',
          paymentIntentId: pi.id,
        });
        
        if (providerId) {
          await setDoc(doc(db, 'providers', providerId, 'jobs', bookingId), { 
            status: 'pending',
            paymentError: 'Payment cancelled',
          }, { merge: true });
        }
      } catch (error) {
        console.error('Error updating booking on payment cancellation:', error);
      }
    }
  }

  return NextResponse.json({ received: true });
}

export const dynamic = 'force-dynamic';

