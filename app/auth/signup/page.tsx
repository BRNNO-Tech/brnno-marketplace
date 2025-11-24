'use client';

import { useRouter, useSearchParams } from "next/navigation";

export default function ChooseRole() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const navigateToCustomerSignup = () => {
    const returnTo = searchParams.get('returnTo');
    const providerId = searchParams.get('providerId');
    const params = new URLSearchParams();
    if (returnTo) params.set('returnTo', returnTo);
    if (providerId) params.set('providerId', providerId);
    router.push(`/auth/signup/customer${params.toString() ? `?${params.toString()}` : ''}`);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-blue-900 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-6">Join Brnno</h1>
        <p className="text-gray-600 mb-8">Sign up to book professional auto detailing services</p>
        <div className="space-y-4">
          <button
            onClick={navigateToCustomerSignup}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Sign Up as Customer
          </button>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          Providers: Please sign up through the provider app
        </p>
        <p className="mt-6 text-sm text-gray-600">
          Already have an account? <a href="/auth/login" className="text-blue-600 hover:underline">Log in</a>
        </p>
      </div>
    </div>
  );
}
