'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function NavBar() {
  const { user, role } = useAuth();
  const router = useRouter();

  // Only show navbar when user is logged in
  if (!user) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm p-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-blue-600">Brnno</Link>
        <div className="flex gap-6 items-center">
          <Link href="/profile" className="text-gray-700 hover:text-blue-600 font-medium">Find Detailers</Link>
          {/* Show profile link for customers, or if role is not set (default to customer) */}
          {(role === 'customer' || !role) && (
            <Link href="/customer/profile" className="text-gray-700 hover:text-blue-600 font-medium">My Profile</Link>
          )}
          {role === 'provider' && (
            <Link href="/provider/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">Dashboard</Link>
          )}
          <button
            onClick={async () => {
              try {
                await auth.signOut();
              } finally {
                router.push('/auth/login');
              }
            }}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}


