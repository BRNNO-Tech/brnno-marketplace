import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const { amount, bookingId, providerId, customerId, customerAddress } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Helper function to parse address string into Stripe address format
    const parseAddress = (addressString: string): Stripe.AddressParam | undefined => {
      if (!addressString) return undefined;
      
      // Try to parse address (format: "123 Main St, City, State ZIP" or similar)
      // This is a simple parser - you might want to use a more robust geocoding service
      const parts = addressString.split(',').map(p => p.trim());
      
      if (parts.length >= 3) {
        // Assume format: "Street, City, State ZIP"
        const street = parts[0];
        const city = parts[1] || '';
        const stateZip = parts[2] || '';
        
        // Try to extract state and ZIP
        const stateZipMatch = stateZip.match(/([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?/);
        const state = stateZipMatch ? stateZipMatch[1] : '';
        const postalCode = stateZipMatch && stateZipMatch[2] ? stateZipMatch[2] : stateZip;
        
        return {
          line1: street,
          city: city,
          state: state,
          postal_code: postalCode,
          country: 'US', // Default to US, adjust if needed
        };
      }
      
      // If parsing fails, return undefined - Stripe Tax will use customer's default address
      return undefined;
    };

    // Get or create Stripe Customer for saved payment methods
    let stripeCustomerId: string | undefined;
    if (customerId) {
      try {
        const userDoc = await getDoc(doc(db, "users", customerId));
        const userData = userDoc.data();
        
        if (userData?.stripeCustomerId) {
          stripeCustomerId = userData.stripeCustomerId;
          
          // Update customer address if provided (for tax calculation)
          if (customerAddress) {
            const address = parseAddress(customerAddress);
            if (address) {
              try {
                await stripe.customers.update(stripeCustomerId, {
                  address: address,
                });
              } catch (error) {
                console.error("Error updating customer address:", error);
                // Continue - address update is not critical
              }
            }
          }
        } else {
          // Create Stripe Customer with address if available
          const address = customerAddress ? parseAddress(customerAddress) : undefined;
          
          const customer = await stripe.customers.create({
            email: userData?.email,
            name: userData?.name,
            address: address,
            metadata: {
              firebaseUserId: customerId,
            },
          });
          stripeCustomerId = customer.id;
          
          // Save to Firestore
          await setDoc(doc(db, "users", customerId), {
            stripeCustomerId: customer.id,
          }, { merge: true });
        }
      } catch (error) {
        console.error("Error creating/getting Stripe customer:", error);
        // Continue without customer if there's an error
      }
    }

    // Fetch provider's Stripe account id from Firestore
    let destination: string | undefined;
    if (providerId) {
      try {
        const providerDoc = await getDoc(doc(db, "providers", providerId));
        const providerData = providerDoc.data();
        const stripeAccountId = providerData?.stripeAccountId;
        
        // Skip demo/fake accounts - payments go to marketplace account instead
        const isDemoAccount = providerData?.isDemo === true || 
                              (stripeAccountId && stripeAccountId.startsWith('acct_demo'));
        
        if (isDemoAccount) {
          console.warn(`Provider ${providerId} is a demo account or has invalid Stripe account. Payment will go to marketplace account.`);
          destination = undefined;
        } else if (stripeAccountId) {
          destination = stripeAccountId;
        } else {
          console.warn(`Provider ${providerId} does not have a Stripe account connected. Payment will go to marketplace account.`);
        }
      } catch (error) {
        console.error("Error fetching provider Stripe account:", error);
        // Continue without destination - payment goes to marketplace account
        // This allows the booking to proceed even if provider account lookup fails
      }
    }

    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount,
      currency: "usd",
      customer: stripeCustomerId, // Add customer for saved payment methods
      metadata: {
        bookingId: bookingId || "",
        providerId: providerId || "",
      },
      // Save payment method for future use
      setup_future_usage: 'off_session',
      // Enable automatic payment methods
      automatic_payment_methods: {
        enabled: true,
      },
      // Enable Stripe Tax for automatic tax calculation
      automatic_tax: {
        enabled: true,
      },
    };
    
    // Add shipping address if customer address is provided (helps with tax calculation)
    if (customerAddress) {
      const address = parseAddress(customerAddress);
      if (address) {
        paymentIntentData.shipping = {
          address: address,
          name: stripeCustomerId ? undefined : 'Customer', // Will use customer name if customer exists
        };
      }
    }

    // Add transfer_data directly on PaymentIntent (not payment_intent_data)
    // This transfers funds to the connected account (provider)
    // If destination is undefined, payment goes to marketplace account
    if (destination) {
      // Calculate 10% marketplace commission fee
      const applicationFeeAmount = Math.round(amount * 0.10);
      // For destination charges, calculate transfer amount (amount - fee)
      // Platform keeps the fee, provider gets the transfer amount
      const transferAmount = amount - applicationFeeAmount;
      
      paymentIntentData.transfer_data = {
        destination: destination,
        amount: transferAmount, // Transfer amount after 10% commission fee
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
