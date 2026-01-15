'use client';

import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DetailerCard from "@/components/DetailerCard";
import BrnnoMap from "@/components/GoogleMap";

// --- HELPERS ---
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [filters, setFilters] = useState({ service: "", rating: 0, price: 1000, distance: 25 });

  // Quiz Context from URL
  const context = {
    address: searchParams.get('address'),
    vehicle: `${searchParams.get('year') || ''} ${searchParams.get('make') || ''} ${searchParams.get('model') || ''}`.trim()
  };

  // 1. Initial Location Logic: Quiz Address -> Browser GPS -> Default
  useEffect(() => {
    if (context.address) {
      handleGeocode(context.address);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Using default location")
      );
    }
  }, [context.address]);

  const handleGeocode = async (addr: string) => {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`);
      const data = await res.json();
      if (data.status === 'OK') setMapCenter(data.results[0].geometry.location);
    } catch (e) { console.error("Geocode error", e); }
  };

  // 2. Unified Firestore Listener
  useEffect(() => {
    let q = query(collection(db, "providers"));
    if (filters.rating > 0) q = query(q, where("rating", ">=", filters.rating));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() as any }))
        .map(p => ({
          ...p,
          distance: (p.lat && p.lng) ? calculateDistance(mapCenter.lat, mapCenter.lng, p.lat, p.lng) : null
        }))
        .filter(p => {
          const matchesService = !filters.service || (p.servicesOffered?.includes(filters.service));
          const matchesPrice = (p.priceBasic || p.price || 0) <= filters.price;
          const matchesDist = !p.distance || p.distance <= filters.distance;
          return matchesService && matchesPrice && matchesDist;
        });

      setProviders(list.sort((a, b) => (a.distance || 999) - (b.distance || 999)));
      setLoading(false);
    });
    return unsub;
  }, [filters, mapCenter]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading detailers...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dynamic Header */}
      <div className="bg-gradient-to-br from-blue-900 to-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Detailers near {context.address || "you"}</h1>
          {context.vehicle && <p className="mt-2 text-blue-200">Personalized for your {context.vehicle}</p>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-3 gap-8">
        {/* Left: Map and Results */}
        <div className="lg:col-span-2 space-y-6">
          <BrnnoMap providers={providers} center={mapCenter} onSearch={handleGeocode} />
          <div className="grid md:grid-cols-2 gap-4">
            {providers.map(p => <DetailerCard key={p.id} provider={p} />)}
          </div>
        </div>

        {/* Right: Sticky Sidebar Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border h-fit sticky top-6 text-slate-900">
          <h3 className="font-bold mb-4">Refine Search</h3>
          <div className="space-y-4">
             <select onChange={(e) => setFilters({...filters, service: e.target.value})} className="w-full p-2 border rounded">
                <option value="">All Services</option>
                <option>Full Detail</option>
                <option>Basic Wash</option>
             </select>
             <label className="block text-sm">Max Price: ${filters.price}</label>
             <input type="range" min="50" max="500" value={filters.price} onChange={(e) => setFilters({...filters, price: +e.target.value})} className="w-full" />
             <label className="block text-sm">Distance: {filters.distance} miles</label>
             <input type="range" min="5" max="100" value={filters.distance} onChange={(e) => setFilters({...filters, distance: +e.target.value})} className="w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuizResults() {
  return <Suspense fallback={null}><ResultsContent /></Suspense>;
}