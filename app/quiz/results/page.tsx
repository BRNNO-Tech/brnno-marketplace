'use client';

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DetailerCard from "@/components/DetailerCard";

function QuizResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ service: "", rating: 0, price: 1000 });
  const [testingConnection, setTestingConnection] = useState(false);

  // params logic
  const address = searchParams.get('address');
  const year = searchParams.get('year');
  const make = searchParams.get('make');
  const model = searchParams.get('model');

  // Test function to verify Firestore connection
  const testFirestoreConnection = async () => {
    setTestingConnection(true);
    try {
      const { collection, getDocs, doc, setDoc } = await import('firebase/firestore');
      const providersRef = collection(db, "providers");
      const snapshot = await getDocs(providersRef);
      
      if (snapshot.size === 0) {
        const testProvider = {
          businessName: "Test Auto Detailing",
          bio: "This is a test provider created to verify Firestore connection",
          phone: "+1 (555) 000-0000",
          address: "123 Test Street, Test City, CA 94102",
          lat: 37.7749,
          lng: -122.4194,
          servicesOffered: ["Basic Wash", "Full Detail"],
          priceBasic: 79,
          priceFull: 149,
          verified: false,
          rating: 4.5,
          reviewCount: 10,
          createdAt: new Date().toISOString(),
        };
        
        const testProviderRef = doc(db, "providers", "test-provider-" + Date.now());
        await setDoc(testProviderRef, testProvider);
        alert('Test provider created! Refresh the page to see it.');
      } else {
        alert(`Found ${snapshot.size} provider(s)!`);
      }
    } catch (error: any) {
      console.error('Firestore connection test failed:', error);
      alert(`Firestore test failed: ${error.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  useEffect(() => {
    let q = query(collection(db, "providers"));

    if (filters.rating > 0) {
      q = query(q, where("rating", ">=", filters.rating));
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Filter by service
        if (filters.service) {
          list = list.filter((p: any) => {
            const servicesOffered = Array.isArray(p.servicesOffered) ? p.servicesOffered : [];
            const structuredServices = Array.isArray(p.services) ? p.services : [];
            const serviceNames = structuredServices.map((s: any) => s.name || s);
            
            return servicesOffered.includes(filters.service) || 
                   serviceNames.includes(filters.service) ||
                   serviceNames.some((name: string) => name.toLowerCase().includes(filters.service.toLowerCase()));
          });
        }

        // Filter by price
        if (filters.price < 1000) {
          list = list.filter((p: any) => {
            let minPrice = 9999;
            if (p.priceBasic) minPrice = Math.min(minPrice, p.priceBasic);
            if (p.priceFull) minPrice = Math.min(minPrice, p.priceFull);
            if (p.price) minPrice = Math.min(minPrice, p.price);
            
            if (Array.isArray(p.services)) {
              p.services.forEach((s: any) => {
                const servicePrice = s.price || s.avgPriceRange?.min;
                if (servicePrice) minPrice = Math.min(minPrice, servicePrice);
              });
            }
            return minPrice <= filters.price;
          });
        }

        setProviders(list);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching providers:", error);
        setLoading(false);
      });

    return unsub;
  }, [filters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-blue-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Finding detailers for your {make}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-blue-900">
      <div className="bg-gradient-to-br from-blue-900 to-black text-white p-8">
        <h1 className="text-4xl font-bold mb-2">We Found {providers.length} Detailer{providers.length !== 1 ? 's' : ''}</h1>
        <div className="flex flex-wrap gap-3 mt-2 opacity-90 items-center">
          <span className="bg-white/10 px-3 py-1 rounded-full text-sm">📍 {address || "Current Location"}</span>
          {make && (
            <span className="bg-white/10 px-3 py-1 rounded-full text-sm">🚗 {year} {make} {model}</span>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filters UI */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-md p-6 mb-6 border border-white/20">
          <div className="grid md:grid-cols-3 gap-4 items-center">
            <select
              onChange={(e) => setFilters({ ...filters, service: e.target.value })}
              value={filters.service}
              className="p-3 border border-white/30 rounded-lg bg-white/20 text-white backdrop-blur-sm"
            >
              <option value="" className="bg-gray-900">All Services</option>
              <option value="Basic Wash" className="bg-gray-900">Basic Wash</option>
              <option value="Full Detail" className="bg-gray-900">Full Detail</option>
              <option value="Ceramic Coating" className="bg-gray-900">Ceramic Coating</option>
              <option value="Pet Hair Removal" className="bg-gray-900">Pet Hair Removal</option>
            </select>
            <select
              onChange={(e) => setFilters({ ...filters, rating: +e.target.value })}
              value={filters.rating}
              className="p-3 border border-white/30 rounded-lg bg-white/20 text-white backdrop-blur-sm"
            >
              <option value={0} className="bg-gray-900">Any Rating</option>
              <option value={4} className="bg-gray-900">4+ Stars</option>
              <option value={4.5} className="bg-gray-900">4.5+ Stars</option>
            </select>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="50"
                max="1000"
                value={filters.price}
                onChange={(e) => setFilters({ ...filters, price: +e.target.value })}
                className="accent-blue-400 flex-1"
              />
              <span className="text-sm font-medium text-white">Max ${filters.price}</span>
            </div>
          </div>
        </div>

        {/* Results logic */}
        {providers.length === 0 ? (
          <div className="text-center py-12 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <p className="text-white mb-4 text-lg">No detailers found in this area yet.</p>
            <button
              onClick={testFirestoreConnection}
              disabled={testingConnection}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              {testingConnection ? 'Testing...' : '🧪 Test Firestore Connection'}
            </button>
          </div>
        ) : (
          <>
            <p className="text-white/80 mb-4">{providers.length} available</p>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {providers.map((p) => (
                <DetailerCard key={p.id} provider={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Full page export with Suspense for Next.js searchParams
export default function QuizResults() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <QuizResultsContent />
    </Suspense>
  );
}