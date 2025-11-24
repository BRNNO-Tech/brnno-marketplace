const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

admin.initializeApp();

exports.createStripeAccountLink = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

  const { uid } = context.auth;
  const userDoc = await admin.firestore().collection('users').doc(uid).get();
  const userData = userDoc.data();
  const userRole = userData?.role;
  
  // Allow if user is a provider OR if they're in onboarding (no role set yet or role is undefined)
  // This allows users to connect Stripe during onboarding before role is set
  if (userRole && userRole !== 'provider') {
    throw new functions.https.HttpsError('permission-denied', 'Providers only');
  }

  let account;
  const providerDoc = await admin.firestore().collection('providers').doc(uid).get();
  const stripeAccountId = providerDoc.data()?.stripeAccountId;

  if (stripeAccountId) {
    account = await stripe.accounts.retrieve(stripeAccountId);
  } else {
    account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: userData?.email || context.auth.token.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        uid: uid, // Store uid for webhook processing
      },
    });
    await admin.firestore().collection('providers').doc(uid).set({ stripeAccountId: account.id }, { merge: true });
  }

  // Use environment-aware URLs (works for both localhost and production)
  const baseUrl = process.env.FUNCTIONS_EMULATOR 
    ? 'http://localhost:3000' 
    : (data?.returnUrl || 'https://brnno.com');
  
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${baseUrl}/provider/onboarding?success=refresh`,
    return_url: `${baseUrl}/provider/onboarding?success=complete`,
    type: 'account_onboarding',
  });

  return { url: accountLink.url };
});

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook signature verification failed.`);
  }

  if (event.type === 'account.updated') {
    const account = event.data.object;
    if (account.charges_enabled) {
      const uid = account.metadata && account.metadata.uid;
      if (uid) {
        await admin.firestore().collection('providers').doc(uid).set({ stripeConnected: true }, { merge: true });
      }
    }
  }

  res.json({ received: true });
});


