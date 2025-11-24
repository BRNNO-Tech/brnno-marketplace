'use client';

import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import Link from "next/link";
import DetailerCard from "@/components/DetailerCard";
import BrnnoMap from "@/components/GoogleMap";

// Calculate distance between two coordinates in miles (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function Marketplace() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<any[]>([]);
  const [filters, setFilters] = useState({ service: "", rating: 0, price: 1000, distance: 25 });
  // Default to Seattle, but will be updated by geolocation
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [locationError, setLocationError] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh key

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
        await setDoc(testProviderRef, testProvider);
        alert('Test provider created! Refresh the page to see it.');
      }
    } catch (error: any) {
      console.error('Firestore connection test failed:', error);
      alert(`Firestore test failed: ${error.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  // Get user's current location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMapCenter(newCenter);
        setLocationError(null);
      },
      (error) => {
        console.error("Error getting location:", error);
        // Show specific error messages
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location access denied. Please enable location permissions to find nearby detailers.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError("Location unavailable. Using default location.");
        } else {
          setLocationError("Unable to get your location. Using default location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // Increased timeout
        maximumAge: 300000, // Accept cached location up to 5 minutes old
      }
    );
  }, []); // Run once on mount

  const geocodeAddress = async (address: string) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      
      if (!res.ok) {
        console.error(`Geocoding API error: ${res.status} ${res.statusText}`);
        setLocationError(`Failed to find location: ${res.status === 404 ? 'Address not found' : 'API error'}`);
        return;
      }
      
      const data = await res.json();
      
      if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
        const loc = data.results[0].geometry.location;
        setMapCenter({ lat: loc.lat, lng: loc.lng });
        setLocationError(null);
      } else if (data.status === 'ZERO_RESULTS') {
        setLocationError('No results found for that address. Please try a different search.');
      } else {
        console.error('Geocoding API returned:', data.status);
        setLocationError(`Geocoding error: ${data.status || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      setLocationError('Failed to search location. Please try again.');
    }
  };

  // Force refresh function - forces re-subscription to get fresh data
  const forceRefresh = async () => {
    setRefreshKey(prev => prev + 1);
    // Also try to get fresh data directly from server (bypass cache)
    try {
      const { getDocsFromServer, query: queryFn } = await import('firebase/firestore');
      const providersRef = collection(db, "providers");
      // Force server fetch by using getDocsFromServer (bypasses cache)
      const snapshot = await getDocsFromServer(queryFn(providersRef));
      const freshList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Apply the same filtering logic as the main query
      let filteredList = freshList;
      // Apply filters (same logic as in useEffect)
      if (filters.service) {
        filteredList = filteredList.filter((p: any) => {
          const servicesOffered = Array.isArray(p.servicesOffered) ? p.servicesOffered : [];
          const structuredServices = Array.isArray(p.services) ? p.services : [];
          const serviceNames = structuredServices.map((s: any) => s.name || s);
          return servicesOffered.includes(filters.service) || 
                 serviceNames.includes(filters.service) ||
                 serviceNames.some((name: string) => name.toLowerCase().includes(filters.service.toLowerCase()));
        });
      }
      if (filters.price < 1000) {
        filteredList = filteredList.filter((p: any) => {
          const priceFull = p.priceFull || 
                           (p.services?.find((s: any) => s.name === "Full Detail")?.price) ||
                           (p.price) ||
                           9999;
          return priceFull <= filters.price;
        });
      }
      setProviders(filteredList);
    } catch (error) {
      console.error('Force refresh failed:', error);
    }
  };

  useEffect(() => {
    // Allow viewing providers without login (customer-only app)
    let q = query(collection(db, "providers"));

    // Only filter by rating if specified (Firestore query)
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
        
        // Filter by price (client-side to handle both legacy and new pricing structures)
        if (filters.price < 1000) {
          list = list.filter((p: any) => {
            // Check both legacy and new pricing structures
            const priceFull = p.priceFull || 
                             (p.services?.find((s: any) => s.name === "Full Detail")?.price) ||
                             (p.price) ||
                             9999;
            return priceFull <= filters.price;
          });
        }
        
        // Validate mapCenter coordinates
        const isValidCenter = mapCenter.lat && mapCenter.lng && 
                             !isNaN(mapCenter.lat) && !isNaN(mapCenter.lng) &&
                             mapCenter.lat >= -90 && mapCenter.lat <= 90 &&
                             mapCenter.lng >= -180 && mapCenter.lng <= 180;
        
        // Calculate distance for all providers (for sorting and display)
        list = list.map((p: any) => {
          if (p.lat && p.lng && isValidCenter) {
            p.distance = calculateDistance(
              mapCenter.lat, 
              mapCenter.lng, 
              p.lat, 
              p.lng
            );
          }
          return p;
        });
        
        // Filter by distance from user location (only if center is valid)
        if (isValidCenter && filters.distance > 0) {
          const filteredList = list.filter((p: any) => {
            // Include providers without location data (they'll show at the end)
            if (!p.lat || !p.lng) {
              return true; // Include providers without location
            }
            return p.distance <= filters.distance;
          });
          
          // If no providers found within distance, show all providers (user might be far away)
          if (filteredList.length > 0 || list.length === 0) {
            list = filteredList;
          }
        }
        
        // Sort by distance (closest first), providers without distance go to end
        list.sort((a: any, b: any) => {
          if (!a.distance && !b.distance) return 0;
          if (!a.distance) return 1;
          if (!b.distance) return -1;
          return a.distance - b.distance;
        });
        
        setProviders(list);
      }, (error) => {
        console.error('Error fetching providers from Firestore:', error);
        setProviders([]);
      });
    return unsub;
  }, [filters, mapCenter, refreshKey]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-blue-900 to-black text-white p-8">
        <h1 className="text-4xl font-bold">Find Your Detailer</h1>
        <p className="mt-2">Vetted pros • Real reviews • Instant booking</p>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Optional: Show location error message */}
        {locationError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg mb-4 text-sm">
            {locationError}
          </div>
        )}

        {/* Search moved inside map */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4 items-center">
            <select
              onChange={(e) => setFilters({ ...filters, service: e.target.value })}
              className="p-3 border rounded-lg"
            >
              <option value="">All Services</option>
              <option>Full Detail</option>
              <option>Basic Wash</option>
            </select>
            <select
              onChange={(e) => setFilters({ ...filters, rating: +e.target.value })}
              className="p-3 border rounded-lg"
            >
              <option value={0}>Any Rating</option>
              <option value={4}>4+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
            </select>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="50"
                max="1000"
                value={filters.price}
                onChange={(e) => setFilters({ ...filters, price: +e.target.value })}
                className="accent-blue-600"
              />
              <span>Max ${filters.price}</span>
            </div>
            <div className="flex items-center gap-3">
              <select
                onChange={(e) => setFilters({ ...filters, distance: +e.target.value })}
                className="p-3 border rounded-lg flex-1"
                value={filters.distance}
              >
                <option value={5}>5 miles</option>
                <option value={10}>10 miles</option>
                <option value={25}>25 miles</option>
                <option value={50}>50 miles</option>
                <option value={100}>100 miles</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <BrnnoMap providers={providers.filter((p: any) => p.lat && p.lng)} center={mapCenter} onSearch={geocodeAddress} />
        </div>

        {providers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No detailers found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your filters or increasing the distance range.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              <p>Current filters:</p>
              <ul className="mt-2 space-y-1">
                <li>Distance: {filters.distance} miles</li>
                {filters.service && <li>Service: {filters.service}</li>}
                {filters.rating > 0 && <li>Rating: {filters.rating}+ stars</li>}
                {filters.price < 1000 && <li>Max price: ${filters.price}</li>}
              </ul>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={forceRefresh}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                title="Force refresh from server to get latest data"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Data
              </button>
              <button
                onClick={testFirestoreConnection}
                disabled={testingConnection}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {testingConnection ? 'Testing...' : '🧪 Test Firestore Connection'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              This will test the connection and create a test provider if none exist
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <DetailerCard key={p.id} provider={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

