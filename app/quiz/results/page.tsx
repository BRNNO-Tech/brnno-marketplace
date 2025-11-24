'use client';

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DetailerCard from "@/components/DetailerCard";

export default function QuizResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ service: "", rating: 0, price: 1000 });
  const [testingConnection, setTestingConnection] = useState(false);

  // Test function to verify Firestore connection and create a test provider
  const testFirestoreConnection = async () => {
    setTestingConnection(true);
    try {
      const { collection, getDocs, doc, setDoc } = await import('firebase/firestore');
      
      const providersRef = collection(db, "providers");
      const snapshot = await getDocs(providersRef);
      
      if (snapshot.size === 0) {
        // Create a test provider
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
        try {
          await setDoc(testProviderRef, testProvider);
          alert('Test provider created! Refresh the page to see it.');
        } catch (createError: any) {
          console.error('Could not create provider:', createError.message);
          alert('Provider creation requires authentication. Check Firebase Console to verify if it was created.');
        }
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

  const priority = searchParams.get('priority');
  const goal = searchParams.get('goal');
  const budget = searchParams.get('budget');

  useEffect(() => {
    if (!priority || !goal || !budget) {
      router.push('/quiz');
      return;
    }

    // Start with ALL providers - don't filter by service initially
    let q = query(collection(db, "providers"));

    // Only filter by rating if specified
    if (filters.rating > 0) {
      q = query(q, where("rating", ">=", filters.rating));
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Filter by service if specified (check both servicesOffered array and structured services)
        if (filters.service) {
          list = list.filter((p: any) => {
            // Check legacy servicesOffered array
            const servicesOffered = Array.isArray(p.servicesOffered) ? p.servicesOffered : [];
            // Check new structured services
            const structuredServices = Array.isArray(p.services) ? p.services : [];
            const serviceNames = structuredServices.map((s: any) => s.name || s);
            
            return servicesOffered.includes(filters.service) || 
                   serviceNames.includes(filters.service) ||
                   serviceNames.some((name: string) => name.toLowerCase().includes(filters.service.toLowerCase()));
          });
        }

        // Filter by price based on budget
        if (filters.price < 1000) {
          list = list.filter((p: any) => {
            // Check both legacy and new pricing structures
            // Get the minimum price from all available services
            let minPrice = 9999;
            
            // Check legacy pricing
            if (p.priceBasic) minPrice = Math.min(minPrice, p.priceBasic);
            if (p.priceFull) minPrice = Math.min(minPrice, p.priceFull);
            if (p.price) minPrice = Math.min(minPrice, p.price);
            
            // Check structured services pricing
            if (Array.isArray(p.services)) {
              p.services.forEach((s: any) => {
                const servicePrice = s.price || s.avgPriceRange?.min;
                if (servicePrice) minPrice = Math.min(minPrice, servicePrice);
              });
            }
            
            // Include provider if they have ANY service within budget
            return minPrice <= filters.price;
          });
        }

        // Sort based on priority
        if (priority === "Highest rated") {
          list.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
        } else if (priority === "Best price") {
          list.sort((a: any, b: any) => {
            const priceA = a.priceFull || 
                          (a.services?.find((s: any) => s.name === "Full Detail")?.price) ||
                          (a.price) ||
                          9999;
            const priceB = b.priceFull || 
                          (b.services?.find((s: any) => s.name === "Full Detail")?.price) ||
                          (b.price) ||
                          9999;
            return priceA - priceB;
          });
        }

        setProviders(list);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching providers:", error);
        setLoading(false);
      });

    return unsub;
  }, [priority, goal, budget, filters, router]);

  // Set initial filters based on budget - but don't force service filter
  useEffect(() => {
    if (budget) {
      if (budget.includes("Under $100")) {
        setFilters({ service: "", rating: 0, price: 100 }); // Don't force service
      } else if (budget.includes("$100-$200")) {
        setFilters({ service: "", rating: 0, price: 200 });
      } else if (budget.includes("$200-$400")) {
        setFilters({ service: "", rating: 0, price: 400 });
      } else {
        setFilters({ service: "", rating: 0, price: 1000 });
      }
    }
  }, [budget]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Finding your perfect detailers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-blue-900">
      <div className="bg-gradient-to-br from-blue-900 to-black text-white p-8">
        <h1 className="text-4xl font-bold mb-2">We Found {providers.length} Detailer{providers.length !== 1 ? 's' : ''} For You</h1>
        <p className="mt-2 opacity-90">
          Based on your preferences: {priority} • {goal} • {budget}
        </p>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filters */}
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

        {/* Results */}
        {providers.length === 0 ? (
          <div className="text-center py-12 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <p className="text-white mb-4 text-lg">No detailers found matching your criteria.</p>
            <div className="flex flex-col gap-3 items-center">
              <button
                onClick={testFirestoreConnection}
                disabled={testingConnection}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {testingConnection ? 'Testing...' : '🧪 Test Firestore Connection'}
              </button>
              <div className="flex gap-4">
                <button
                  onClick={() => setFilters({ service: "", rating: 0, price: 1000 })}
                  className="text-blue-300 hover:text-blue-200 font-medium"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => router.push('/quiz')}
                  className="text-blue-300 hover:text-blue-200 font-medium"
                >
                  Try different preferences →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-white/80 mb-4">
              {providers.length} detailer{providers.length !== 1 ? 's' : ''} available
            </p>
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

