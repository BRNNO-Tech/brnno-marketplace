'use client';

import { GoogleMap, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { useState, useEffect, useRef } from 'react';

const containerStyle = {
  width: '100%',
  height: '320px',
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

// Static libraries array - must be outside component to prevent reloading
const GOOGLE_MAP_LIBRARIES: ('marker' | 'places' | 'geometry' | 'drawing')[] = ['marker'];

interface Provider {
  id: string;
  businessName: string;
  address: string;
  priceFull: number;
  lat: number;
  lng: number;
}

interface Props {
  providers: Provider[];
  center: { lat: number; lng: number };
  onSearch: (query: string) => void;
}

export default function BrnnoMap({ providers, center, onSearch }: Props) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: GOOGLE_MAP_LIBRARIES, // Use static reference
  });
  const [selected, setSelected] = useState<Provider | null>(null);
  const [search, setSearch] = useState('');
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search) {
      onSearch(search);
      setSearch('');
    }
  };

  // Update map center when center prop changes
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    
    const map = mapRef.current;
    const newCenter = new google.maps.LatLng(center.lat, center.lng);
    
    // Pan to new center smoothly
    map.panTo(newCenter);
  }, [isLoaded, center]);

  // Create AdvancedMarkerElements when map is loaded or providers change
  // NOTE: Do NOT include 'center' in dependencies - markers should only recreate when providers change
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const map = mapRef.current;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current.clear();

    // Create new markers using AdvancedMarkerElement (with fallback to regular Marker)
    providers.forEach((provider) => {
      if (!provider.lat || !provider.lng) {
        return; // Skip providers without location
      }
      
      try {
        // Try AdvancedMarkerElement first (newer API, requires mapId)
        if (typeof window !== 'undefined' && (window as any).google?.maps?.marker?.AdvancedMarkerElement) {
          const marker = new (window as any).google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat: provider.lat, lng: provider.lng },
            title: provider.businessName,
          });

          // Add click listener
          marker.addListener('click', () => {
            setSelected(provider);
          });

          markersRef.current.set(provider.id, marker);
        } else {
          // Fallback to regular Marker if AdvancedMarkerElement not available
          const marker = new google.maps.Marker({
            map,
            position: { lat: provider.lat, lng: provider.lng },
            title: provider.businessName,
            animation: google.maps.Animation.DROP,
          });

          // Add click listener
          marker.addListener('click', () => {
            setSelected(provider);
          });

          markersRef.current.set(provider.id, marker as any);
        }
      } catch (error) {
        console.error(`Error creating marker for provider ${provider.id}:`, error);
      }
    });

    // Cleanup on unmount or when providers change
    return () => {
      markersRef.current.forEach(marker => {
        marker.map = null;
      });
      markersRef.current.clear();
    };
  }, [isLoaded, providers]); // REMOVED 'center' - markers only recreate when providers change

  // Separate useEffect for bounds calculation (can depend on center without affecting markers)
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    
    const map = mapRef.current;
    
    // Fit bounds to show all filtered providers within range (only if providers exist)
    if (providers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      
      // Include user location in bounds (but don't create a marker for it)
      bounds.extend(new google.maps.LatLng(center.lat, center.lng));
      
      // Add all provider locations
      providers.forEach((provider) => {
        if (provider.lat && provider.lng) {
          bounds.extend(new google.maps.LatLng(provider.lat, provider.lng));
        }
      });
      
      // Calculate the bounds size to prevent zooming out too far
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latDiff = Math.abs(ne.lat() - sw.lat());
      const lngDiff = Math.abs(ne.lng() - sw.lng());
      
      // Only use fitBounds if the area is reasonable (not too large)
      // If bounds are too large (> 10 degrees), just center on user location
      if (latDiff < 10 && lngDiff < 10) {
        map.fitBounds(bounds);
        
        // Prevent zooming out too far - set minimum zoom
        const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          if (map) {
            const currentZoom = map.getZoom();
            if (currentZoom && currentZoom < 10) {
              map.setZoom(10); // Minimum zoom level
            } else if (currentZoom && currentZoom > 15) {
              map.setZoom(15); // Maximum zoom level
            }
          }
        });
      } else {
        // If bounds are too large, just center on user location with reasonable zoom
        map.setCenter(new google.maps.LatLng(center.lat, center.lng));
        map.setZoom(11);
      }
    } else {
      // If no providers, just center on user location
      map.setCenter(new google.maps.LatLng(center.lat, center.lng));
      map.setZoom(11);
    }
  }, [isLoaded, providers, center]); // This can depend on center for bounds calculation

  if (!isLoaded) {
    return (
      <div style={containerStyle} className="flex items-center justify-center bg-gray-100">
        Loading map...
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 right-4 z-10">
        <input
          type="text"
          placeholder="Search city, zip..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={handleSearch}
          className="w-full p-3 pl-10 bg-white rounded-full shadow-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ backdropFilter: 'blur(8px)' }}
        />
        <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={11}
        options={{ 
          streetViewControl: false, 
          mapTypeControl: false, 
          fullscreenControl: false, 
          zoomControl: true,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
        }}
        onLoad={(map) => {
          mapRef.current = map;
        }}
      >
        {selected && (
          <InfoWindow position={{ lat: selected.lat, lng: selected.lng }} onCloseClick={() => setSelected(null)}>
            <div className="p-3 max-w-xs">
              <h3 className="font-bold text-lg">{selected.businessName}</h3>
              <p className="text-sm text-gray-600">{selected.address}</p>
              <div className="flex items-center gap-1 my-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < 4 ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                ))}
                <span className="ml-1 text-xs">4.9</span>
              </div>
              <p className="font-bold text-blue-600">${selected.priceFull} Full Detail</p>
              <button className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Book Now
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}


