"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function History() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'bookings'),
      where('customerId', '==', user.uid),
      orderBy('date', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  if (!user) return <div className="p-8"><Link href="/auth/login">Log in</Link></div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Your Bookings</h1>
      <div className="space-y-4">
        {bookings.map((b) => (
          <div key={b.id} className="p-4 bg-white rounded-xl border">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{b.service}</div>
                <div className="text-sm text-gray-600">
                  {b.date} at {b.time} • {b.address || 'No address provided'}
                </div>
                <div className="text-sm text-gray-600">Provider: {b.providerSnapshot?.name || b.providerId}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-600">${'{'}b.price{'}'}</div>
                <div className="text-xs uppercase tracking-wide">{b.status}</div>
              </div>
            </div>
            {Array.isArray(b.addOns) && b.addOns.length > 0 && (
              <div className="mt-2 text-xs text-gray-700">Add-ons: {b.addOns.join(', ')}</div>
            )}
          </div>
        ))}
        {bookings.length === 0 && <div className="text-gray-500">No bookings yet.</div>}
      </div>
    </div>
  );
}

