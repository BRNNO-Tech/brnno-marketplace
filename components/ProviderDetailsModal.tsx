"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import BookingModal from "./BookingModal";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Service {
	category: string;
	name: string;
	slug: string;
	description: string;
	estimatedDuration: string;
	avgPriceRange: { min: number; max: number };
	price?: number;
}

interface ProviderDetailsModalProps {
	provider: {
		id: string;
		name?: string;
		displayName?: string;
		businessName?: string;
		bio?: string;
		rating?: number;
		reviewCount?: number;
		phone?: string;
		address?: string;
		services?: Service[];
		servicesOffered?: string[] | string;
		priceBasic?: number;
		priceFull?: number;
		priceCeramic?: number;
		pricePetHair?: number;
		price?: number;
		gallery?: string[];
		verified?: boolean;
		[key: string]: any;
	};
	onClose: () => void;
}

export default function ProviderDetailsModal({ provider, onClose }: ProviderDetailsModalProps) {
	const { user } = useAuth();
	const router = useRouter();
	const [showBooking, setShowBooking] = useState(false);
	const [fetchedServices, setFetchedServices] = useState<Service[]>([]);
	const [loadingServices, setLoadingServices] = useState(true);

	// Fetch services from subcollection if not in document
	useEffect(() => {
		const fetchServices = async () => {
			setLoadingServices(true);
			try {
				// First check if services are in the provider document
				const structuredServices: Service[] = Array.isArray(provider.services) ? provider.services : [];
				
				if (structuredServices.length > 0) {
					// Services are in document, use them
					setFetchedServices(structuredServices);
					setLoadingServices(false);
					return;
				}

				// Try fetching from subcollection
				const servicesRef = collection(db, "providers", provider.id, "services");
				const servicesSnap = await getDocs(servicesRef);
				
				if (!servicesSnap.empty) {
					const subcollectionServices = servicesSnap.docs.map(doc => {
						const data = doc.data();
						// Handle priceCents (convert to dollars) or use existing price
						const priceInDollars = data.priceCents ? data.priceCents / 100 : (data.price || 0);
						return {
							id: doc.id,
							category: data.category || 'other',
							name: data.name || data.title || 'Unnamed Service',
							slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-') || `service-${doc.id}`,
							description: data.description || '',
							estimatedDuration: data.estimatedDuration || data.duration || '1 hour',
							avgPriceRange: data.avgPriceRange || { min: priceInDollars, max: priceInDollars },
							price: priceInDollars,
						} as Service;
					});
					setFetchedServices(subcollectionServices);
				} else {
					setFetchedServices([]);
				}
			} catch (error) {
				console.error('Error fetching services:', error);
				setFetchedServices([]);
			} finally {
				setLoadingServices(false);
			}
		};

		if (provider?.id) {
			fetchServices();
		}
	}, [provider?.id]);

	// Support both new structured services and legacy servicesOffered
	const structuredServices: Service[] = fetchedServices.length > 0 
		? fetchedServices 
		: Array.isArray(provider.services) ? provider.services : [];
	
	const legacyServices = Array.isArray(provider.servicesOffered)
		? provider.servicesOffered
		: typeof provider.servicesOffered === "string"
			? provider.servicesOffered.split(",").map((s) => s.trim()).filter(Boolean)
			: [];

	// Build service prices - prioritize new structure, fallback to legacy
	const servicePrices: Record<string, number> = {};
	if (structuredServices.length > 0) {
		structuredServices.forEach((service) => {
			// Safely access price with multiple fallbacks
			const price = service.price 
				|| (service.avgPriceRange?.min) 
				|| (service.avgPriceRange?.max)
				|| 0;
			servicePrices[service.name] = price;
		});
	} else {
		// Legacy pricing
		servicePrices["Basic Wash"] = provider.priceBasic || 79;
		servicePrices["Full Detail"] = provider.priceFull || provider.price || 149;
		servicePrices["Ceramic Coating"] = provider.priceCeramic || 399;
		servicePrices["Pet Hair Removal"] = provider.pricePetHair || 59;
	}

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

	const handleBookNow = () => {
		if (!user) {
			sessionStorage.setItem('bookingProviderId', provider.id);
			router.push(`/auth/signup?returnTo=booking&providerId=${provider.id}`);
			return;
		}
		setShowBooking(true);
	};

	// Group services by category if using structured services
	const servicesByCategory = structuredServices.length > 0
		? structuredServices.reduce((acc, service) => {
				const category = service.category || 'other';
				if (!acc[category]) acc[category] = [];
				acc[category].push(service);
				return acc;
			}, {} as Record<string, Service[]>)
		: null;

	const categoryLabels: Record<string, string> = {
		interior: "Interior Services",
		exterior: "Exterior Services",
		"paint-protection": "Paint Protection",
		additional: "Additional Services",
		other: "Services",
	};

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
				onClick={onClose}
			>
				{/* Modal */}
				<div
					className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
					onClick={(e) => e.stopPropagation()}
				>
					{/* Header */}
					<div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 relative">
						<button
							onClick={onClose}
							className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
						<div className="flex items-start justify-between pr-8">
							<div className="flex-1">
								<div className="flex items-center gap-3 mb-2">
									<h2 className="text-3xl font-bold">{businessName}</h2>
									{provider.verified && (
										<span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
											Verified Pro
										</span>
									)}
								</div>
								<div className="flex items-center gap-4 text-white/90">
									{rating > 0 && (
										<div className="flex items-center gap-1">
											<span className="text-yellow-300 text-xl">★</span>
											<span className="font-semibold">{rating.toFixed(1)}</span>
											{reviewCount > 0 && (
												<span className="text-white/70">({reviewCount} reviews)</span>
											)}
										</div>
									)}
									{provider.address && (
										<div className="flex items-center gap-1 text-sm">
											<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
											</svg>
											<span>{provider.address}</span>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Scrollable Content */}
					<div className="overflow-y-auto flex-1 p-6">
						{/* Bio */}
						{provider.bio && (
							<div className="mb-6">
								<h3 className="text-xl font-semibold text-gray-900 mb-2">About</h3>
								<p className="text-gray-700 leading-relaxed">{provider.bio}</p>
							</div>
						)}

						{/* Services */}
						<div className="mb-6">
							<h3 className="text-xl font-semibold text-gray-900 mb-4">Services & Pricing</h3>
							{loadingServices ? (
								<div className="text-center py-8 text-gray-500">Loading services...</div>
							) : structuredServices.length === 0 && legacyServices.length === 0 ? (
								<p className="text-gray-500 italic">No services available at this time.</p>
							) : servicesByCategory ? (
								// New structured services grouped by category
								<div className="space-y-6">
									{Object.entries(servicesByCategory).map(([category, services]) => (
										<div key={category}>
											<h4 className="text-lg font-semibold text-gray-800 mb-3">
												{categoryLabels[category] || category}
											</h4>
											<div className="grid gap-3 md:grid-cols-2">
												{services.map((service) => (
													<div
														key={service.slug}
														className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition"
													>
														<div className="flex justify-between items-start mb-2">
															<h5 className="font-semibold text-gray-900">{service.name}</h5>
															<span className="text-blue-600 font-bold">
																${servicePrices[service.name] || service.avgPriceRange.min}
															</span>
														</div>
														{service.description && (
															<p className="text-sm text-gray-600 mb-2">{service.description}</p>
														)}
														{service.estimatedDuration && (
															<div className="flex items-center gap-1 text-xs text-gray-500">
																<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
																</svg>
																<span>{service.estimatedDuration}</span>
															</div>
														)}
													</div>
												))}
											</div>
										</div>
									))}
								</div>
							) : (
								// Legacy services
								<div className="grid gap-3 md:grid-cols-2">
									{legacyServices.map((service, index) => (
										<div
											key={index}
											className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition"
										>
											<div className="flex justify-between items-center">
												<span className="font-semibold text-gray-900">{service}</span>
												<span className="text-blue-600 font-bold">
													${servicePrices[service] || 0}
												</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Gallery */}
						{provider.gallery && provider.gallery.length > 0 && (
							<div className="mb-6">
								<h3 className="text-xl font-semibold text-gray-900 mb-4">Gallery</h3>
								<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
									{provider.gallery.slice(0, 6).map((image, index) => (
										<div
											key={index}
											className="aspect-square rounded-lg overflow-hidden bg-gray-200"
										>
											<img
												src={image}
												alt={`${businessName} gallery ${index + 1}`}
												className="w-full h-full object-cover"
											/>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Contact Info */}
						{(provider.phone || provider.address) && (
							<div className="border-t border-gray-200 pt-6">
								<h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h3>
								<div className="space-y-2 text-gray-700">
									{provider.phone && (
										<div className="flex items-center gap-2">
											<svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
											</svg>
											<span>{provider.phone}</span>
										</div>
									)}
									{provider.address && (
										<div className="flex items-start gap-2">
											<svg className="w-5 h-5 text-gray-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
											</svg>
											<span>{provider.address}</span>
										</div>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Footer with Book Now Button */}
					<div className="border-t border-gray-200 p-6 bg-gray-50">
						<button
							onClick={handleBookNow}
							className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
						>
							Book Now
						</button>
					</div>
				</div>
			</div>

			{/* Booking Modal */}
			{showBooking && (
				<BookingModal provider={provider} onClose={() => setShowBooking(false)} />
			)}
		</>
	);
}

