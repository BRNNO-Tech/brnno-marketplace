'use client';

import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CustomerSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const signup = async () => {
    if (!name || !email || !password) {
      setError("All fields required");
      return;
    }
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", res.user.uid), { name, email, role: "customer", createdAt: new Date().toISOString() });
      
      // Check if returning from booking flow
      const returnTo = searchParams.get('returnTo');
      const bookingProviderId = sessionStorage.getItem('bookingProviderId');
      
      if (returnTo === 'booking' && bookingProviderId) {
        // Redirect to results page - they can now book
        // Try to restore quiz params from localStorage
        const quizAnswers = localStorage.getItem('quizAnswers');
        if (quizAnswers) {
          try {
            const answers = JSON.parse(quizAnswers);
            const params = new URLSearchParams({
              priority: answers.priority || '',
              goal: answers.goal || '',
              budget: answers.budget || '',
            });
            router.push(`/profile?${params.toString()}`);
            return;
          } catch (e) {
            // If parsing fails, just go to profile
          }
        }
      }
      
      const params = searchParams.toString();
      router.push(`/customer/profile${params ? `?${params}` : ""}`);
    } catch (e: any) {
      setError(e.message?.includes("weak-password") ? "Password too weak (6+ chars)" : "Email already in use");
    } finally {
      setLoading(false);
    }
  };

  const googleSignup = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const res = await signInWithPopup(auth, provider);
      const user = res.user;
      await setDoc(doc(db, "users", user.uid), { name: user.displayName, email: user.email, role: "customer", photoURL: user.photoURL, createdAt: new Date().toISOString() }, { merge: true });
      
      // Check if returning from booking flow
      const returnTo = searchParams.get('returnTo');
      const bookingProviderId = sessionStorage.getItem('bookingProviderId');
      
      if (returnTo === 'booking' && bookingProviderId) {
        // Redirect to results page - they can now book
        const quizAnswers = localStorage.getItem('quizAnswers');
        if (quizAnswers) {
          try {
            const answers = JSON.parse(quizAnswers);
            const params = new URLSearchParams({
              priority: answers.priority || '',
              goal: answers.goal || '',
              budget: answers.budget || '',
            });
            router.push(`/profile?${params.toString()}`);
            return;
          } catch (e) {
            // If parsing fails, just go to profile
          }
        }
      }
      
      const params = searchParams.toString();
      router.push(`/customer/profile${params ? `?${params}` : ""}`);
    } catch (e) {
      setError("Google sign-in failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-black to-blue-900 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center">Join Brnno</h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <button onClick={googleSignup} className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition font-medium mb-6">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 6.75c1.63 0 3.06.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>
        <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-4 border-2 border-gray-200 rounded-lg mb-3 focus:border-blue-500 focus:outline-none" />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 border-2 border-gray-200 rounded-lg mb-3 focus:border-blue-500 focus:outline-none" />
        <input type="password" placeholder="Password (6+ chars)" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && signup()} className="w-full p-4 border-2 border-gray-200 rounded-lg mb-6 focus:border-blue-500 focus:outline-none" />
        <button onClick={signup} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400">{loading ? 'Creating...' : 'Create Account'}</button>
      </div>
    </div>
  );
}


