// scripts/createDemoProvider.ts
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createDemoProvider() {
  const demoProviderId = "demo-detailer-123"; // Fixed ID for the demo provider
  
  // Authenticate anonymously first
  console.log("Authenticating...");
  await signInAnonymously(auth);
  console.log("✅ Authenticated successfully");
  
  const demoProvider = {
    businessName: "Elite Auto Detailing",
    bio: "Professional mobile detailing services with 10+ years of experience. We specialize in ceramic coatings, paint correction, and premium interior detailing. Serving the greater metro area with eco-friendly products and attention to detail.",
    phone: "+1 (555) 123-4567",
    address: "123 Main Street, San Francisco, CA 94102",
    lat: 37.7749,
    lng: -122.4194,
    servicesOffered: ["Basic Wash", "Full Detail", "Ceramic Coating", "Pet Hair Removal"],
    priceBasic: 79,
    priceFull: 149,
    priceCeramic: 399,
    pricePetHair: 59,
    verified: true, // Set to true for demo to show verification badge
    licenseNumber: "DL-2024-12345",
    insuranceProvider: "State Farm",
    ein: "12-3456789",
    rating: 4.8, // Realistic rating for demo
    reviewCount: 42, // Show reviews exist
    stripeAccountId: "acct_demo_123", // Demo Stripe account
    stripeConnected: true, // Show Stripe is connected
    availability: {
      monday: { start: "09:00", end: "17:00", enabled: true },
      tuesday: { start: "09:00", end: "17:00", enabled: true },
      wednesday: { start: "09:00", end: "17:00", enabled: true },
      thursday: { start: "09:00", end: "17:00", enabled: true },
      friday: { start: "09:00", end: "17:00", enabled: true },
      saturday: { start: "09:00", end: "14:00", enabled: true },
      sunday: { start: "00:00", end: "00:00", enabled: false },
    },
    gallery: [],
    createdAt: new Date().toISOString(),
    isDemo: true, // Flag to identify this as a demo provider
  };

  try {
    console.log("Creating demo provider...");
    await setDoc(doc(db, "providers", demoProviderId), demoProvider);
    console.log("✅ Demo provider created successfully!");
    console.log("Provider ID:", demoProviderId);
    console.log("Business Name:", demoProvider.businessName);
    return demoProviderId;
  } catch (error) {
    console.error("❌ Error creating demo provider:", error);
    throw error;
  }
}

// Run the script
createDemoProvider()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });

