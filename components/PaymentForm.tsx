"use client";

import { useState, FormEvent, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);

interface PaymentFormProps {
  amount: number;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  bookingId?: string;
  providerId?: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  customerAddress?: string; // Address for tax calculation
}

function PaymentFormInner({
  amount,
  onSuccess,
  onError,
  customerEmail,
  customerName,
  customerAddress,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent any bubbling

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Submit the form
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      // The clientSecret is already set in the Elements options
      // so we can confirm directly
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess?.(paymentIntent.id);
      } else {
        throw new Error("Payment was not successful");
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      const message = error.message || "Payment failed. Please try again.";
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      onKeyDown={(e) => {
        // Prevent accidental Enter key submission
        if (e.key === 'Enter' && e.target !== e.currentTarget) {
          const target = e.target as HTMLElement;
          // Only prevent if not the submit button
          if (target.tagName !== 'BUTTON' || target.getAttribute('type') !== 'submit') {
            e.preventDefault();
          }
        }
      }}
      className="space-y-4"
    >
      <div className="p-4 border rounded-lg bg-gray-50">
        <PaymentElement
          options={{
            layout: "tabs",
            // Disable wallets for now (will enable later)
            wallets: {
              applePay: 'never',
              googlePay: 'never',
            },
            // Pre-fill customer info for saved payment methods
            defaultValues: {
              billingDetails: {
                email: customerEmail,
                name: customerName,
              },
            },
          }}
        />
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Processing..." : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function PaymentForm(props: PaymentFormProps) {
  const [options, setOptions] = useState<StripeElementsOptions | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: Math.round(props.amount * 100), // Convert to cents
            bookingId: props.bookingId,
            providerId: props.providerId,
            customerId: props.customerId, // Add customer ID for saved payment methods
            customerAddress: props.customerAddress, // Add address for tax calculation
          }),
        });

        if (!response.ok) {
          let errorMessage = `API error: ${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If response is not JSON, use status text
            errorMessage = response.status === 404 
              ? 'Payment API route not found. Please check your server configuration.'
              : `Failed to create payment intent: ${response.statusText}`;
          }
          console.error(`Payment Intent API error: ${response.status}`, errorMessage);
          throw new Error(errorMessage);
        }

        const { clientSecret: secret, error: apiError } = await response.json();

        if (apiError || !secret) {
          throw new Error(apiError || "Failed to create payment intent");
        }

        setOptions({
          clientSecret: secret,
          appearance: {
            theme: "stripe",
          },
        });
      } catch (err: any) {
        const message = err.message || "Failed to initialize payment";
        setError(message);
        props.onError?.(message);
      }
    };

    createPaymentIntent();
  }, [props.amount, props.bookingId, props.providerId, props.customerId, props.customerAddress]);

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!options) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Initializing payment form...</p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormInner {...props} />
    </Elements>
  );
}

