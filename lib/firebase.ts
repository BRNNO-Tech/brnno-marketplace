import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "process.env.NEXT_PUBLIC_FIREBASE_API_KEY || """,
  authDomain: "brnno-1b216.firebaseapp.com",
  projectId: "brnno-1b216",
  storageBucket: "brnno-1b216.firebasestorage.app",
  messagingSenderId: "378878794367",
  appId: "1:378878794367:web:a540dcf46e9db931d57d4a",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Explicitly set persistence to keep users logged in
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch(console.error);
}
// Use default database - if provider app uses a different database, specify it here
// Example: getFirestore(app, 'custom-database-name')
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

