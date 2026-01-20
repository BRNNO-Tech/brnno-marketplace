"use client";
import { useState } from "react";
import ProviderDetailsModal from "./ProviderDetailsModal";

interface DetailerCardProps {
  provider: {
    id: string;
    name?: string;
    displayName?: string;
    businessName?: string;
    rating?: number;
    reviewCount?: number;
    servicesOffered?: string;
    price?: number;
    verified?: boolean;
    address?: string;
    [key: string]: any;
  };
}

export default function DetailerCard({ provider }: DetailerCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Support both new structured services and legacy servicesOffered
  const structuredServices = Array.isArray((provider as any).services) ? (provider as any).services : [];
  const legacyServices = Array.isArray(provider.servicesOffered)
    ? provider.servicesOffered
    : typeof provider.servicesOffered === "string"
      ? provider.servicesOffered.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  
  const rating = typeof provider.rating === "number" ? provider.rating : Number(provider.rating) || 0;
  const reviewCount = provider.reviewCount || 0;
  
  // More flexible business name extraction - handle provider app's field names
  const businessName = provider.businessName || 
                       provider.name || 
                       provider.displayName || 
                       (provider as any).full_name ||  // Provider app uses this
                       (provider as any).companyName ||
                       (provider as any).business?.name ||
                       `Provider ${provider.id.slice(0, 8)}`; // Fallback to partial ID
  
  // Build service prices - prioritize new structure, fallback to legacy
  const servicePrices: Record<string, number> = {};
  if (structuredServices.length > 0) {
    structuredServices.forEach((service: any) => {
      servicePrices[service.name] = service.price || service.avgPriceRange?.min || 0;
    });
  } else {
    // Legacy pricing - check multiple possible field names
    const price = typeof provider.price === "number" ? provider.price : Number(provider.price) || undefined;
    servicePrices["Basic Wash"] = (provider as any).priceBasic || (provider as any).basicPrice || 79;
    servicePrices["Full Detail"] = (provider as any).priceFull || (provider as any).fullPrice || price || 149;
    servicePrices["Ceramic Coating"] = (provider as any).priceCeramic || (provider as any).ceramicPrice || 399;
    servicePrices["Pet Hair Removal"] = (provider as any).pricePetHair || (provider as any).petHairPrice || 59;
  }
  
  // Get starting price - try "Full Detail" first, then first available service
  const startingPrice = servicePrices["Full Detail"] || 
    (structuredServices.length > 0 ? (structuredServices[0] as any).price || (structuredServices[0] as any).avgPriceRange?.min : 149) ||
    (typeof provider.price === "number" ? provider.price : Number(provider.price)) || 149;

  // Count total services
  const serviceCount = structuredServices.length > 0 ? structuredServices.length : legacyServices.length;

  // More flexible address extraction - handle provider app's field names
  const address = provider.address || 
                  (provider as any).location?.address ||
                  (provider as any).business?.address ||
                  (provider as any).serviceAddress ||
                  '';

  return (
    <>
      <div 
        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100"
        onClick={() => setShowDetails(true)}
      >
        {/* Header Image */}
        <div className="h-40 bg-gradient-to-br from-blue-500 to-blue-600 relative">
          {(provider.verified || (provider as any).status === 'verified') && (
            <div className="absolute top-3 right-3 bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-md">
              ✓ Verified
            </div>
          )}
          {/* Show status badge if pending */}
          {(provider as any).status === 'pending' && (
            <div className="absolute top-3 right-3 bg-yellow-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-md">
              Pending
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Business Name & Rating */}
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-900 mb-1.5 line-clamp-1">
              {businessName}
            </h3>
            <div className="flex items-center gap-2">
              {rating > 0 && (
                <div className="flex items-center gap-0.5">
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
                </div>
              )}
              {reviewCount > 0 && (
                <span className="text-xs text-gray-500">({reviewCount})</span>
              )}
              {rating === 0 && reviewCount === 0 && (
                <span className="text-xs text-gray-400">No reviews yet</span>
              )}
            </div>
          </div>

          {/* Location (if available) */}
          {address && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-3">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="line-clamp-1">{address}</span>
            </div>
          )}

          {/* Service Count Badge */}
          {serviceCount > 0 && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {serviceCount} {serviceCount === 1 ? 'service' : 'services'}
              </span>
            </div>
          )}

          {/* Price & CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <p className="text-2xl font-bold text-blue-600">${startingPrice}</p>
              <p className="text-xs text-gray-500">Starting price</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(true);
              }}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
            >
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <ProviderDetailsModal 
          provider={provider} 
          onClose={() => setShowDetails(false)} 
        />
      )}
    </>
  );
}

