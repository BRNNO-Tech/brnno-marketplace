"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, doc, getDoc, setDoc, onSnapshot, updateDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { getAvailableSlots } from "@/lib/firestore";
import PaymentForm from "./PaymentForm";

interface Service {
	category: string;
	name: string;
	slug: string;
	description: string;
	estimatedDuration: string;
	avgPriceRange: { min: number; max: number };
	price?: number;
}

interface BookingModalProps {
	provider: {
		id: string;
		name?: string;
		displayName?: string;
		businessName?: string;
		services?: Service[]; // New structured services
		servicesOffered?: string[] | string; // Legacy field
		priceBasic?: number;
		priceFull?: number;
		priceCeramic?: number;
		pricePetHair?: number;
		price?: number;
		rating?: number;
		reviewCount?: number;
		[key: string]: any;
	};
	onClose: () => void;
}

export default function BookingModal({ provider, onClose }: BookingModalProps) {
	const { user } = useAuth();
	const router = useRouter();
	const [step, setStep] = useState(1);
	const [selectedService, setSelectedService] = useState<string>("Full Detail");
	const [selectedDate, setSelectedDate] = useState<string>("");
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [addOns, setAddOns] = useState<Record<string, boolean>>({ Ceramic: false, PetHair: false });
	const [availableSlots, setAvailableSlots] = useState<string[]>(["10:00", "13:00", "16:00"]);

	const [addresses, setAddresses] = useState<string[]>([]);
	const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
	const [vehicles, setVehicles] = useState<any[]>([]);
	const [selectedAddress, setSelectedAddress] = useState<string>('');
	const [selectedVehicle, setSelectedVehicle] = useState<string>('');
	const [bookingId, setBookingId] = useState<string | null>(null);
	const [isCreatingBooking, setIsCreatingBooking] = useState(false);
	const [fetchedServices, setFetchedServices] = useState<Service[]>([]);
	const [loadingServices, setLoadingServices] = useState(true);
	const [newAddressInput, setNewAddressInput] = useState<string>('');
	const [showNewAddressInput, setShowNewAddressInput] = useState(false);
	const addressInputRef = useRef<HTMLInputElement | null>(null);

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
						return {
							id: doc.id,
							category: data.category || 'other',
							name: data.name || data.title || 'Unnamed Service',
							slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-') || `service-${doc.id}`,
							description: data.description || '',
							estimatedDuration: data.estimatedDuration || data.duration || '1 hour',
							avgPriceRange: data.avgPriceRange || { min: data.price || 0, max: data.price || 0 },
							price: data.price || data.avgPriceRange?.min || 0,
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

	// Build service prices map - prioritize new structure, fallback to legacy
	const servicePrices: Record<string, number> = {};
	if (structuredServices.length > 0) {
		structuredServices.forEach(service => {
			servicePrices[service.name] = service.price || service.avgPriceRange?.min || 0;
		});
	} else {
		// Legacy pricing
		servicePrices["Basic Wash"] = provider.priceBasic || 79;
		servicePrices["Full Detail"] = provider.priceFull || provider.price || 149;
		servicePrices["Ceramic Coating"] = provider.priceCeramic || 399;
		servicePrices["Pet Hair Removal"] = provider.pricePetHair || 59;
	}

	// Get available services for display - NO HARDCODED FALLBACK
	const availableServices = structuredServices.length > 0
		? structuredServices
		: legacyServices.length > 0
			? legacyServices
			: []; // Empty array instead of hardcoded services

	const basePrice = servicePrices[selectedService] || 149;
	const addonPrice = (addOns.Ceramic ? (servicePrices["Ceramic Coating"] || 399) : 0) + (addOns.PetHair ? (servicePrices["Pet Hair Removal"] || 59) : 0);
	// TEST MODE: Override to $1 for testing real transactions
	const total = process.env.NEXT_PUBLIC_TEST_MODE === 'true' ? 1 : (basePrice + addonPrice);

	// Verify user is authenticated before showing booking modal
	useEffect(() => {
		if (!user) {
			onClose();
			router.push('/auth/login');
		}
	}, [user, router, onClose]);

	// Initialize Google Places Autocomplete for address input
	useEffect(() => {
		if (!showNewAddressInput || !addressInputRef.current) return;

		let autocompleteInstance: any = null;

		const initAutocomplete = () => {
			const checkInput = () => {
				if (!addressInputRef.current) {
					setTimeout(checkInput, 50);
					return;
				}

				try {
					if (!(window as any).google?.maps?.places?.Autocomplete) {
						// Try loading Google Maps script if not loaded
						const script = document.createElement('script');
						script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
						script.async = true;
						script.defer = true;
						script.onload = () => {
							setTimeout(initAutocomplete, 100);
						};
						document.head.appendChild(script);
						return;
					}

					if (autocompleteInstance) {
						autocompleteInstance = null;
					}

					autocompleteInstance = new (window as any).google.maps.places.Autocomplete(
						addressInputRef.current,
						{
							types: ["address"],
							componentRestrictions: { country: ["us"] },
						}
					);

					autocompleteInstance.addListener("place_changed", () => {
						const place = autocompleteInstance.getPlace();
						if (place?.formatted_address) {
							setNewAddressInput(place.formatted_address);
							setSelectedAddress(place.formatted_address);
						}
					});
				} catch (error) {
					console.error('Error initializing autocomplete:', error);
				}
			};

			checkInput();
		};

		const loadGooglePlaces = () => {
			if ((window as any).google?.maps?.places?.Autocomplete) {
				setTimeout(initAutocomplete, 100);
				return;
			}

			// Load Google Maps script if not already loaded
			if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
				const script = document.createElement('script');
				script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
				script.async = true;
				script.defer = true;
				script.onload = () => {
					setTimeout(initAutocomplete, 100);
				};
				document.head.appendChild(script);
			} else {
				// Script exists, wait for it to load
				const checkGoogle = setInterval(() => {
					if ((window as any).google?.maps?.places?.Autocomplete) {
						clearInterval(checkGoogle);
						setTimeout(initAutocomplete, 100);
					}
				}, 100);
				return () => clearInterval(checkGoogle);
			}
		};

		loadGooglePlaces();

		return () => {
			if (autocompleteInstance) {
				autocompleteInstance = null;
			}
		};
	}, [showNewAddressInput]);

	useEffect(() => {
		if (!user) return;

		getDoc(doc(db, "users", user.uid)).then(doc => {
			setAddresses(doc.data()?.addresses || []);
		});

		// Payment methods are now handled by Stripe Elements in PaymentForm
		// We can remove this listener if not needed for future saved cards feature
		const unsub1 = onSnapshot(collection(db, "users", user.uid, "paymentMethods"), (snap) => {
			const cards = snap.docs.map(d => ({ id: d.id, ...d.data() }));
			setPaymentMethods(cards);
		});

		const unsub2 = onSnapshot(collection(db, "users", user.uid, "vehicles"), (snap) => {
			const vehs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
			setVehicles(vehs);
			if (vehs.length > 0 && !selectedVehicle) {
				setSelectedVehicle(vehs[0].id);
			}
		});

		return () => {
			unsub1();
			unsub2();
		};
	}, [user]);

	useEffect(() => {
		const load = async () => {
			if (!selectedDate || !provider?.id) return;
			try {
				const slots = await getAvailableSlots(provider.id, selectedDate);
				setAvailableSlots(slots.length ? slots : ["10:00", "13:00", "16:00"]);
				if (slots.length && !slots.includes(selectedTime || "")) setSelectedTime(null);
			} catch {
				setAvailableSlots(["10:00", "13:00", "16:00"]);
			}
		};
		load();
	}, [selectedDate, provider?.id]);

	const handleStep1Continue = () => {
		if (!selectedDate || !selectedTime || !selectedVehicle || !selectedAddress) {
			alert("Please select date, time, vehicle, and address");
			return;
		}
		setStep(2);
	};

	const handleStep2Continue = async () => {
		if (!selectedAddress || !selectedVehicle || !user) {
			alert("Please select an address and vehicle");
			return;
		}

		setIsCreatingBooking(true);
		try {
			// Create booking first (before payment)
			const userDoc = await getDoc(doc(db, "users", user.uid));
			const customer = userDoc.exists() ? userDoc.data() : {};
			const customerContact = {
				id: user.uid,
				name: (customer as any)?.name || user.displayName || "",
				email: (customer as any)?.email || user.email || "",
				phone: (customer as any)?.phone || "",
			};

			const vehicleData = vehicles.find(v => v.id === selectedVehicle);
			const bookingRef = await addDoc(collection(db, "bookings"), {
				customerId: user.uid,
				providerId: provider.id,
				service: selectedService,
				price: total,
				addOns: [
					...(addOns.Ceramic ? ["Ceramic Coating"] : []),
					...(addOns.PetHair ? ["Pet Hair Removal"] : []),
				],
				time: selectedTime,
				date: selectedDate,
				address: selectedAddress,
				vehicleId: selectedVehicle,
				vehicle: vehicleData ? {
					id: vehicleData.id,
					name: vehicleData.name,
					plate: vehicleData.plate,
					make: vehicleData.make || '',
					model: vehicleData.model || '',
					year: vehicleData.year || '',
					color: vehicleData.color || '',
				} : null,
				status: "pending",
				calendarChecked: false,
				createdAt: new Date(),
				customerContact,
				providerSnapshot: { id: provider.id, name: provider.businessName || provider.name || "" },
			});

			await setDoc(doc(db, "providers", provider.id, "jobs", bookingRef.id), {
				bookingId: bookingRef.id,
				customer: customerContact,
				service: selectedService,
				addOns: [
					...(addOns.Ceramic ? ["Ceramic Coating"] : []),
					...(addOns.PetHair ? ["Pet Hair Removal"] : []),
				],
				date: selectedDate,
				time: selectedTime,
				address: selectedAddress,
				vehicleId: selectedVehicle,
				vehicle: vehicleData ? {
					id: vehicleData.id,
					name: vehicleData.name,
					plate: vehicleData.plate,
					make: vehicleData.make || '',
					model: vehicleData.model || '',
					year: vehicleData.year || '',
					color: vehicleData.color || '',
				} : null,
				price: total,
				status: "pending",
				calendarChecked: false,
				createdAt: new Date(),
			});

			setBookingId(bookingRef.id);
			setStep(3);
		} catch (error) {
			console.error("Error creating booking:", error);
			alert("Failed to create booking. Please try again.");
		} finally {
			setIsCreatingBooking(false);
		}
	};

	const handlePaymentSuccess = async (paymentIntentId: string) => {
		if (!bookingId) return;

		try {
			// Update booking status to confirmed
			await updateDoc(doc(db, "bookings", bookingId), {
				status: "confirmed",
				paymentIntentId,
				paidAt: new Date(),
			});

			// Update provider job status
			await updateDoc(doc(db, "providers", provider.id, "jobs", bookingId), {
				status: "confirmed",
				paymentIntentId,
			});

			alert("Payment successful! Your booking is confirmed.");
			onClose();
		} catch (error) {
			console.error("Error updating booking status:", error);
			alert("Payment succeeded but failed to update booking. Please contact support.");
		}
	};

	const providerName = provider.businessName || provider.name || provider.displayName || "Detailer";
	const providerRating = provider.rating || 4.8;
	const providerReviews = provider.reviewCount || 0;

	// Helper function for mobile-friendly date selector
	const getNextAvailableDates = () => {
		const dates = [];
		const today = new Date();
		for (let i = 0; i < 14; i++) {
			const date = new Date(today);
			date.setDate(today.getDate() + i);
			dates.push(date);
		}
		return dates;
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start md:items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
			<div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
				{/* Provider Header */}
				<div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-2xl relative">
					<button
						onClick={onClose}
						className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
						aria-label="Close"
					>
						✕
					</button>
					<div className="flex items-center gap-4">
						<div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl shadow-lg">
							{providerName[0].toUpperCase()}
						</div>
						<div className="flex-1">
							<h2 className="font-bold text-xl mb-1">{providerName}</h2>
							<div className="flex items-center gap-2">
								<span className="text-yellow-300">★★★★★</span>
								<span className="text-sm opacity-90">{providerRating.toFixed(1)} ({providerReviews} reviews)</span>
							</div>
						</div>
					</div>
				</div>

				{/* Progress Indicator */}
				<div className="p-6 border-b bg-gray-50">
					<div className="flex items-center justify-between">
						{['Service & Details', 'Review', 'Payment'].map((label, i) => (
							<div key={label} className="flex-1 flex items-center">
								<div className={`flex items-center ${i + 1 < step ? 'text-blue-600' : i + 1 === step ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
									<div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${i + 1 < step
										? 'bg-blue-600 text-white'
										: i + 1 === step
											? 'bg-blue-600 text-white ring-4 ring-blue-200'
											: 'bg-gray-200'
										}`}>
										{i + 1 < step ? '✓' : i + 1}
									</div>
									<span className="ml-3 text-sm font-medium hidden sm:inline">{label}</span>
								</div>
								{i < 2 && (
									<div className={`flex-1 h-1 mx-2 transition ${i + 1 < step ? 'bg-blue-600' : 'bg-gray-200'
										}`} />
								)}
							</div>
						))}
					</div>
				</div>

				{/* Step 1: Service Selection */}
				{step === 1 && (
					<div className="p-6 space-y-6 animate-slide-in-right">
						<h3 className="text-2xl font-bold text-gray-900">Select Service</h3>

						{/* Service Cards */}
						<div>
							<label className="block font-semibold mb-3 text-gray-700">Choose Service</label>
							{loadingServices ? (
								<div className="text-center py-8 text-gray-500">Loading services...</div>
							) : availableServices.length === 0 ? (
								<div className="text-center py-8 text-gray-500">
									<p className="mb-2">No services available</p>
									<p className="text-sm text-gray-400">This provider hasn't set up their services yet.</p>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
									{structuredServices.length > 0 ? (
										// New structured services
										structuredServices.map((service) => (
											<button
												key={service.slug}
												onClick={() => setSelectedService(service.name)}
												className={`p-4 border-2 rounded-xl text-left transition-all ${selectedService === service.name
													? 'border-blue-600 bg-blue-50 shadow-md'
													: 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
													}`}
											>
												<div className="font-semibold text-gray-900 mb-1">{service.name}</div>
												{service.description && (
													<div className="text-xs text-gray-600 mb-2 line-clamp-2">{service.description}</div>
												)}
												<div className="flex items-center justify-between">
													<div className="text-blue-600 font-bold text-lg">${servicePrices[service.name] || service.avgPriceRange.min}</div>
													{service.estimatedDuration && (
														<div className="text-xs text-gray-500">{service.estimatedDuration}</div>
													)}
												</div>
											</button>
										))
									) : (
										// Legacy services
										availableServices.map((service) => (
											<button
												key={typeof service === 'string' ? service : service.name}
												onClick={() => setSelectedService(typeof service === 'string' ? service : service.name)}
												className={`p-4 border-2 rounded-xl text-left transition-all ${selectedService === (typeof service === 'string' ? service : service.name)
													? 'border-blue-600 bg-blue-50 shadow-md'
													: 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
													}`}
											>
												<div className="font-semibold text-gray-900 mb-1">{typeof service === 'string' ? service : service.name}</div>
												<div className="text-blue-600 font-bold text-lg">${servicePrices[typeof service === 'string' ? service : service.name] || 0}</div>
											</button>
										))
									)}
								</div>
							)}
						</div>

						{/* Vehicle Selection */}
						<div>
							<label className="block font-semibold mb-3 text-gray-700">Vehicle</label>
							{vehicles.length === 0 ? (
								<div className="p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-center">
									<p className="text-gray-500 mb-3">No vehicles saved</p>
									<button
										onClick={() => {
											onClose();
											router.push('/customer/profile');
										}}
										className="text-blue-600 hover:underline font-semibold"
									>
										+ Add vehicle in profile
									</button>
								</div>
							) : (
								<div className="space-y-3">
									{vehicles.map((v) => (
										<button
											key={v.id}
											onClick={() => setSelectedVehicle(v.id)}
											className={`w-full p-4 border-2 rounded-xl text-left transition-all ${selectedVehicle === v.id
												? 'border-blue-600 bg-blue-50 shadow-md'
												: 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
												}`}
										>
											<div className="flex items-start gap-4">
												<div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${selectedVehicle === v.id ? 'bg-blue-600 text-white' : 'border-2 border-gray-300'
													}`}>
													{selectedVehicle === v.id && <span className="text-xs font-bold">✓</span>}
												</div>
												<div className="flex-1">
													<div className="font-semibold text-gray-900 mb-1">{v.name}</div>
													<div className="text-sm text-gray-600">
														{v.make && v.model && `${v.make} ${v.model}`}
														{v.year && ` • ${v.year}`}
														{v.color && ` • ${v.color}`}
													</div>
													{v.plate && (
														<div className="text-xs text-gray-500 mt-1">Plate: {v.plate}</div>
													)}
												</div>
											</div>
										</button>
									))}
								</div>
							)}
						</div>

						{/* Address Selection */}
						<div>
							<label className="block font-semibold mb-3 text-gray-700">Service Address</label>
							{!showNewAddressInput ? (
								<>
									{addresses.length > 0 && (
										<div className="space-y-3 mb-3">
											{addresses.map((addr, i) => (
												<button
													key={i}
													onClick={() => setSelectedAddress(addr)}
													className={`w-full p-4 border-2 rounded-xl text-left transition-all ${selectedAddress === addr
														? 'border-blue-600 bg-blue-50 shadow-md'
														: 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
														}`}
												>
													<div className="flex items-start gap-4">
														<div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${selectedAddress === addr ? 'bg-blue-600 text-white' : 'border-2 border-gray-300'
															}`}>
															{selectedAddress === addr && <span className="text-xs font-bold">✓</span>}
														</div>
														<div className="flex-1">
															<div className="font-medium text-gray-900">{addr}</div>
														</div>
													</div>
												</button>
											))}
										</div>
									)}
									<button
										onClick={() => {
											setShowNewAddressInput(true);
											setSelectedAddress('');
										}}
										className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-left hover:border-blue-400 hover:bg-blue-50 transition"
									>
										<div className="flex items-center gap-2 text-blue-600 font-medium">
											<span>+</span>
											<span>{addresses.length > 0 ? 'Use a different address' : 'Enter service address'}</span>
										</div>
									</button>
								</>
							) : (
								<div className="space-y-3">
									<input
										ref={addressInputRef}
										type="text"
										value={newAddressInput}
										onChange={(e) => {
											setNewAddressInput(e.target.value);
											setSelectedAddress(e.target.value);
										}}
										placeholder="Enter address (Google autocomplete enabled)"
										className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none"
									/>
									<button
										onClick={() => {
											setShowNewAddressInput(false);
											setNewAddressInput('');
											if (addresses.length > 0) {
												setSelectedAddress(addresses[0]);
											}
										}}
										className="text-sm text-gray-600 hover:text-gray-800 underline"
									>
										Cancel - Use saved address
									</button>
								</div>
							)}
						</div>

						{/* Mobile-Friendly Date Selector */}
						<div>
							<label className="block font-semibold mb-3 text-gray-700">Select Date</label>
							{/* Calendar Grid */}
							<div className="grid grid-cols-7 gap-2 mb-3">
								{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
									<div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
										{day}
									</div>
								))}
							</div>
							<div className="grid grid-cols-7 gap-2 max-h-[280px] overflow-y-auto pb-2">
								{getNextAvailableDates().map((date, idx) => {
									const dateStr = date.toISOString().split('T')[0];
									const dayNum = date.getDate();
									const isToday = idx === 0;
									const isSelected = selectedDate === dateStr;

									return (
										<button
											key={dateStr}
											onClick={() => {
												setSelectedDate(dateStr);
												setSelectedTime(null);
											}}
											className={`p-3 sm:p-4 rounded-xl font-bold text-sm sm:text-base transition-all touch-manipulation ${isSelected
												? 'bg-blue-600 text-white shadow-lg scale-110'
												: isToday
													? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
													: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
												}`}
										>
											{dayNum}
											{isToday && <div className="text-[8px] mt-0.5">Today</div>}
										</button>
									);
								})}
							</div>
							{selectedDate && (
								<p className="mt-3 text-center text-sm text-gray-600 font-medium">
									📅 {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
								</p>
							)}
							{/* Fallback native date input for accessibility */}
							<input
								type="date"
								min={new Date().toISOString().split('T')[0]}
								value={selectedDate}
								onChange={(e) => {
									setSelectedDate(e.target.value);
									setSelectedTime(null);
								}}
								className="sr-only"
								aria-label="Select date"
							/>
						</div>

						{/* Time Selection */}
						{selectedDate && (
							<div>
								<label className="block font-semibold mb-3 text-gray-700">Available Times</label>
								<div className="grid grid-cols-3 gap-3">
									{availableSlots.map((time) => (
										<button
											key={time}
											onClick={() => setSelectedTime(time)}
											className={`p-4 border-2 rounded-xl font-semibold transition-all ${selectedTime === time
												? 'border-blue-600 bg-blue-600 text-white shadow-md scale-105'
												: 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
												}`}
										>
											{time}
										</button>
									))}
								</div>
							</div>
						)}

						{/* Add-ons */}
						<div>
							<label className="block font-semibold mb-3 text-gray-700">Add-ons (Optional)</label>
							<div className="grid grid-cols-2 gap-3">
								<button
									onClick={() => setAddOns({ ...addOns, Ceramic: !addOns.Ceramic })}
									className={`p-4 border-2 rounded-xl text-left transition-all ${addOns.Ceramic ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
										}`}
								>
									<div className="flex items-center justify-between mb-2">
										<span className="font-semibold text-gray-900">Ceramic Coating</span>
										<div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${addOns.Ceramic ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
											}`}>
											{addOns.Ceramic && <span className="text-white text-xs">✓</span>}
										</div>
									</div>
									<div className="text-sm text-gray-600">Premium protection</div>
									<div className="text-blue-600 font-bold mt-1">+${servicePrices["Ceramic Coating"] || 399}</div>
								</button>
								<button
									onClick={() => setAddOns({ ...addOns, PetHair: !addOns.PetHair })}
									className={`p-4 border-2 rounded-xl text-left transition-all ${addOns.PetHair ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
										}`}
								>
									<div className="flex items-center justify-between mb-2">
										<span className="font-semibold text-gray-900">Pet Hair Removal</span>
										<div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${addOns.PetHair ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
											}`}>
											{addOns.PetHair && <span className="text-white text-xs">✓</span>}
										</div>
									</div>
									<div className="text-sm text-gray-600">Deep clean</div>
									<div className="text-blue-600 font-bold mt-1">+${servicePrices["Pet Hair Removal"] || 59}</div>
								</button>
							</div>
						</div>

						{/* Price Summary */}
						<div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-5 border-2 border-blue-200">
							<div className="space-y-2">
								<div className="flex justify-between text-sm text-gray-700">
									<span>{selectedService}</span>
									<span className="font-semibold">${basePrice}</span>
								</div>
								{addOns.Ceramic && (
									<div className="flex justify-between text-sm text-gray-700">
										<span>Ceramic Coating</span>
										<span className="font-semibold">+${servicePrices["Ceramic Coating"]}</span>
									</div>
								)}
								{addOns.PetHair && (
									<div className="flex justify-between text-sm text-gray-700">
										<span>Pet Hair Removal</span>
										<span className="font-semibold">+${servicePrices["Pet Hair Removal"]}</span>
									</div>
								)}
								<div className="border-t border-blue-300 pt-3 mt-3">
									<div className="flex justify-between items-center">
										<span className="font-bold text-lg text-gray-900">Total</span>
										<span className="text-blue-600 font-bold text-2xl">${total}</span>
									</div>
								</div>
							</div>
						</div>

						{/* Continue Button */}
						<button
							onClick={handleStep1Continue}
							disabled={!selectedTime || !selectedDate || !selectedVehicle || !selectedAddress || vehicles.length === 0}
							className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
						>
							Continue to Payment
						</button>
					</div>
				)}

				{/* Step 2: Review & Confirm (Address already selected in Step 1) */}
				{step === 2 && (
					<div className="p-6 space-y-6 animate-slide-in-right">
						<h3 className="text-2xl font-bold text-gray-900">Review Booking</h3>

						{/* Booking Summary */}
						<div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
							<h4 className="font-semibold mb-3 text-gray-900">Booking Details</h4>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-gray-600">Service:</span>
									<span className="font-medium">{selectedService}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Date:</span>
									<span className="font-medium">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Time:</span>
									<span className="font-medium">{selectedTime}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Address:</span>
									<span className="font-medium text-right max-w-[60%]">{selectedAddress}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Vehicle:</span>
									<span className="font-medium">{vehicles.find(v => v.id === selectedVehicle)?.name || 'N/A'}</span>
								</div>
								<div className="border-t border-gray-300 pt-3 mt-3">
									<div className="flex justify-between font-bold text-lg">
										<span>Total:</span>
										<span className="text-blue-600">${total}</span>
									</div>
								</div>
							</div>
						</div>

						<div className="flex gap-3 pt-4">
							<button
								onClick={() => setStep(1)}
								className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
							>
								← Back
							</button>
							<button
								onClick={handleStep2Continue}
								disabled={!selectedAddress || isCreatingBooking}
								className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
							>
								{isCreatingBooking ? (
									<span className="flex items-center justify-center gap-2">
										<span className="animate-spin">⏳</span> Creating Booking...
									</span>
								) : 'Continue to Payment'}
							</button>
						</div>
					</div>
				)}

				{/* Step 3: Payment */}
				{step === 3 && (
					<div className="p-6 space-y-6 animate-slide-in-right">
						<h3 className="text-2xl font-bold text-gray-900">Payment</h3>

						{/* Booking Summary */}
						<div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
							<h4 className="font-semibold mb-3 text-gray-900">Booking Summary</h4>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-gray-600">Service:</span>
									<span className="font-medium">{selectedService}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Date:</span>
									<span className="font-medium">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Time:</span>
									<span className="font-medium">{selectedTime}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Address:</span>
									<span className="font-medium text-right max-w-[60%]">{selectedAddress}</span>
								</div>
								<div className="border-t border-gray-300 pt-3 mt-3">
									<div className="flex justify-between font-bold text-lg">
										<span>Total:</span>
										<span className="text-blue-600">${total}</span>
									</div>
								</div>
							</div>
						</div>

						{/* Stripe Payment Form - payment methods will scroll horizontally */}
						<div className="stripe-payment-wrapper">
							<PaymentForm
								amount={total}
								bookingId={bookingId || undefined}
								providerId={provider.id}
								customerId={user?.uid}
								customerEmail={user?.email || undefined}
								customerName={user?.displayName || undefined}
								customerAddress={selectedAddress || undefined}
								onSuccess={handlePaymentSuccess}
								onError={(error) => {
									console.error("Payment error:", error);
								}}
							/>
						</div>

						<button
							onClick={() => setStep(2)}
							className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
						>
							← Back
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
