'use client';

import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProviderDashboard() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      // Replace this role check with your real provider-role logic
      const isProvider = (user as unknown as { role?: string })?.role === "provider";
      if (!user || !isProvider) router.push("/auth/login");
    });
    return unsub;
  }, [router]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Provider Dashboard</h1>
      <div className="mt-6 space-y-4">
        <a href="/provider/services" className="block p-4 bg-blue-100 rounded">Edit Services & Pricing</a>
        <a href="/provider/calendar" className="block p-4 bg-green-100 rounded">Set Availability</a>
        <a href="/provider/gallery" className="block p-4 bg-purple-100 rounded">Upload Gallery</a>
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h3 className="font-bold mb-4">Set Your Hours</h3>
        <div className="grid grid-cols-7 gap-2 text-center text-sm">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day}>
              <p className="font-medium">{day}</p>
              <select className="mt-1 p-1 border rounded w-full text-xs">
                <option>9AM - 5PM</option>
                <option>8AM - 6PM</option>
                <option>Closed</option>
              </select>
            </div>
          ))}
        </div>
        <button className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg">Save Schedule</button>
      </div>
    </div>
  );
}

