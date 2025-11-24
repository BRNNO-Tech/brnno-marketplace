'use client';

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProviderOnboarding() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page - provider signup is now handled in the provider app
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Provider Signup Moved</h1>
        <p className="text-gray-600 mb-6">
          Provider signup is now handled through the provider app. 
          Please use the provider app to create your business profile.
        </p>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
        >
          Go to Homepage
        </button>
      </div>
    </div>
  );
}


