"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, setDoc, collection, onSnapshot, addDoc, deleteDoc, query, where, orderBy, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { db, storage, auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import AutocompleteInput from '@/components/AutocompleteInput';
import { VEHICLE_MAKES, VEHICLE_MODELS, VEHICLE_COLORS, getVehicleYears, fetchAllMakes, fetchModelsForMake } from '@/lib/vehicleData';

type Tab = 'overview' | 'bookings' | 'settings';

export default function CustomerProfile() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);

  // User profile data
  const [userData, setUserData] = useState<any>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });

  // Existing data
  const [addresses, setAddresses] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Modals
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form states
  const [newAddress, setNewAddress] = useState('');
  const [newCard, setNewCard] = useState('');
  const [newVehicle, setNewVehicle] = useState({ name: '', plate: '', make: '', model: '', year: '', color: '' });
  const [availableMakes, setAvailableMakes] = useState<string[]>(VEHICLE_MAKES);
  const [filteredModels, setFilteredModels] = useState<string[]>([]);
  const [availableYears] = useState<string[]>(getVehicleYears());
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Booking history
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingTab, setBookingTab] = useState<'upcoming' | 'past'>('upcoming');

  // Settings
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
  });

  // === LOAD USER DATA ===
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const data = userDoc.data();
        setUserData(data || {});
        setAddresses(data?.addresses || []);
        setProfilePic(user.photoURL || data?.photoURL || null);
        setEditForm({
          name: data?.name || user.displayName || '',
          email: data?.email || user.email || '',
          phone: data?.phone || '',
        });
        setSettings(data?.settings || { emailNotifications: true, smsNotifications: false });
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();

    // Payment Methods
    const unsub1 = onSnapshot(collection(db, "users", user.uid, "paymentMethods"), (snap) => {
      setPaymentMethods(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Vehicles
    const unsub2 = onSnapshot(collection(db, "users", user.uid, "vehicles"), (snap) => {
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Bookings
    const q = query(
      collection(db, 'bookings'),
      where('customerId', '==', user.uid),
      orderBy('date', 'desc')
    );
    const unsub3 = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [user]);

  // === PROFILE PICTURE UPLOAD ===
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    uploadProfilePicture(file);
  };

  const uploadProfilePicture = async (file: File) => {
    if (!user) return;

    try {
      setUploadProgress(0);
      const storageRef = ref(storage, `profile-pictures/${user.uid}`);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update user auth profile
      await updateProfile(user, { photoURL: downloadURL });

      // Update Firestore
      await setDoc(doc(db, "users", user.uid), { photoURL: downloadURL }, { merge: true });

      setProfilePic(downloadURL);
      setShowUploadModal(false);
      setUploadProgress(100);

      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture');
    }
  };

  const removeProfilePicture = async () => {
    if (!user || !profilePic) return;

    try {
      // Delete from storage
      const storageRef = ref(storage, `profile-pictures/${user.uid}`);
      await deleteObject(storageRef);

      // Update auth profile
      await updateProfile(user, { photoURL: null });

      // Update Firestore
      await setDoc(doc(db, "users", user.uid), { photoURL: null }, { merge: true });

      setProfilePic(null);
      alert('Profile picture removed');
    } catch (error: any) {
      // Ignore error if file doesn't exist
      if (error.code !== 'storage/object-not-found') {
        console.error('Error removing profile picture:', error);
        alert('Failed to remove profile picture');
      } else {
        // File doesn't exist, just update Firestore
        await updateProfile(user, { photoURL: null });
        await setDoc(doc(db, "users", user.uid), { photoURL: null }, { merge: true });
        setProfilePic(null);
      }
    }
  };

  // === SAVE PROFILE INFO ===
  const saveProfileInfo = async () => {
    if (!user) return;

    try {
      await setDoc(doc(db, "users", user.uid), {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
      }, { merge: true });

      setUserData({ ...userData, ...editForm });
      setShowEditProfileModal(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    }
  };

  // === SAVE SETTINGS ===
  const saveSettings = async () => {
    if (!user) return;

    try {
      await setDoc(doc(db, "users", user.uid), {
        settings: settings,
      }, { merge: true });
      alert('Settings saved!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  // === SAVE ADDRESS ===
  const saveAddress = async () => {
    if (!newAddress.trim() || !user) return;
    try {
      const updated = [...addresses, newAddress.trim()];
      await setDoc(doc(db, "users", user.uid), { addresses: updated }, { merge: true });
      setAddresses(updated);
      setNewAddress('');
      setShowAddressModal(false);
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address');
    }
  };

  // === SAVE CARD ===
  const saveCard = async () => {
    if (!newCard.trim() || newCard.length < 16 || !user) return;
    try {
      await addDoc(collection(db, "users", user.uid, "paymentMethods"), {
        last4: newCard.slice(-4),
        brand: "visa",
        exp: "12/27",
        default: paymentMethods.length === 0,
        createdAt: new Date()
      });
      setNewCard('');
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Error saving card:', error);
      alert('Failed to save card');
    }
  };

  // === REMOVE ADDRESS ===
  const removeAddress = async (index: number) => {
    if (!user) return;
    try {
      const updated = addresses.filter((_, i) => i !== index);
      await setDoc(doc(db, "users", user.uid), { addresses: updated }, { merge: true });
      setAddresses(updated);
    } catch (error) {
      console.error('Error removing address:', error);
      alert('Failed to remove address');
    }
  };

  // === REMOVE CARD ===
  const removeCard = async (cardId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "paymentMethods", cardId));
    } catch (error) {
      console.error('Error removing card:', error);
      alert('Failed to remove card');
    }
  };

  // === SAVE VEHICLE ===
  const saveVehicle = async () => {
    if (!newVehicle.name.trim() || !newVehicle.plate.trim() || !user) {
      alert('Please fill in vehicle name and plate');
      return;
    }
    try {
      await addDoc(collection(db, "users", user.uid, "vehicles"), {
        name: newVehicle.name.trim(),
        plate: newVehicle.plate.trim(),
        make: newVehicle.make.trim() || '',
        model: newVehicle.model.trim() || '',
        year: newVehicle.year.trim() || '',
        color: newVehicle.color || '',
        createdAt: new Date(),
      });
      setNewVehicle({ name: '', plate: '', make: '', model: '', year: '', color: '' });
      setFilteredModels([]);
      setShowVehicleModal(false);
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Failed to save vehicle');
    }
  };

  // === REMOVE VEHICLE ===
  const removeVehicle = async (vehicleId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "vehicles", vehicleId));
    } catch (error) {
      console.error('Error removing vehicle:', error);
      alert('Failed to remove vehicle');
    }
  };

  // === CANCEL BOOKING ===
  const cancelBooking = async (bookingId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: "cancelled",
      });
      alert('Booking cancelled');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    }
  };

  // === LOAD MAKES ===
  useEffect(() => {
    if (showVehicleModal) {
      fetchAllMakes().then(makes => {
        if (makes.length > 0) setAvailableMakes(makes);
      });
    }
  }, [showVehicleModal]);

  // === LOAD MODELS ===
  useEffect(() => {
    if (newVehicle.make && showVehicleModal) {
      const loadModels = async () => {
        const models = await fetchModelsForMake(newVehicle.make, newVehicle.year);
        setFilteredModels(models.length > 0 ? models : (VEHICLE_MODELS[newVehicle.make] || []));
      };
      loadModels();
    } else {
      setFilteredModels([]);
      if (!newVehicle.make) {
        setNewVehicle(prev => ({ ...prev, model: '' }));
      }
    }
  }, [newVehicle.make, newVehicle.year, showVehicleModal]);

  // === GOOGLE PLACES AUTOCOMPLETE ===
  useEffect(() => {
    if (!showAddressModal) return;

    let autocompleteInstance: any = null;

    const initAutocomplete = () => {
      // Wait for input to be available
      const checkInput = (attempts = 0) => {
        if (!addressInputRef.current && attempts < 20) {
          setTimeout(() => checkInput(attempts + 1), 100);
          return;
        }
        
        if (!addressInputRef.current) {
          console.error('Address input ref not available after waiting');
          return;
        }

        try {
          if (!(window as any).google?.maps?.places?.Autocomplete) {
            console.error('Google Places API not loaded');
            return;
          }

          // Clean up existing instance if any
          if (autocompleteInstance) {
            try {
              (window as any).google?.maps?.event?.clearInstanceListeners?.(autocompleteInstance);
            } catch (e) {
              // Ignore cleanup errors
            }
            autocompleteInstance = null;
          }

          autocompleteInstance = new (window as any).google.maps.places.Autocomplete(
            addressInputRef.current,
            {
              types: ["address"],
              componentRestrictions: { country: ["us"] },
              fields: ["formatted_address", "geometry", "address_components"],
            }
          );

          autocompleteInstance.addListener("place_changed", () => {
            const place = autocompleteInstance.getPlace();
            if (place?.formatted_address) {
              setNewAddress(place.formatted_address);
            }
          });

        } catch (error) {
          console.error('Error initializing autocomplete:', error);
        }
      };

      checkInput();
    };

    const loadGooglePlaces = () => {
      // Check if Google Maps is already loaded
      if ((window as any).google?.maps?.places?.Autocomplete) {
        setTimeout(initAutocomplete, 200);
        return;
      }

      // Check if script is already in the DOM
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Script exists, wait for it to load
        if ((window as any).google?.maps?.places?.Autocomplete) {
          setTimeout(initAutocomplete, 200);
        } else {
          existingScript.addEventListener("load", () => {
            setTimeout(initAutocomplete, 200);
          }, { once: true });
          
          // Also check periodically in case it's already loaded
          const checkInterval = setInterval(() => {
            if ((window as any).google?.maps?.places?.Autocomplete) {
              clearInterval(checkInterval);
              setTimeout(initAutocomplete, 200);
            }
          }, 100);
          
          // Cleanup after 5 seconds
          setTimeout(() => clearInterval(checkInterval), 5000);
        }
        return;
      }

      // Load the script
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not found');
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
      };
      script.onload = () => {
        setTimeout(initAutocomplete, 200);
      };
      document.head.appendChild(script);
    };

    const timer = setTimeout(loadGooglePlaces, 200);

    return () => {
      clearTimeout(timer);
      if (autocompleteInstance) {
        try {
          (window as any).google?.maps?.event?.clearInstanceListeners?.(autocompleteInstance);
        } catch (e) {
          // Ignore cleanup errors
        }
        autocompleteInstance = null;
      }
    };
  }, [showAddressModal]);

  // Filter bookings
  const upcomingBookings = bookings.filter(b => {
    if (['completed', 'cancelled', 'rejected'].includes(b.status)) return false;
    try {
      // Handle date string (YYYY-MM-DD format) or Date object
      const bookingDate = b.date instanceof Date ? b.date : new Date(b.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate >= today;
    } catch {
      // If date parsing fails, show as upcoming if status is pending/confirmed
      return ['pending', 'confirmed'].includes(b.status);
    }
  });

  const pastBookings = bookings.filter(b => {
    if (['completed', 'cancelled', 'rejected'].includes(b.status)) return true;
    try {
      const bookingDate = b.date instanceof Date ? b.date : new Date(b.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate < today;
    } catch {
      return false;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-900 via-black to-blue-900 border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-300"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-blue-300">
                  <span className="text-3xl font-bold text-white">
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <button
                onClick={() => setShowUploadModal(true)}
                className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 shadow-lg"
                title="Change photo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-1">
                {editForm.name || user.displayName || 'My Profile'}
              </h1>
              <p className="text-white/80 mb-2">{editForm.email || user.email}</p>
              {editForm.phone && <p className="text-white/80 mb-4">{editForm.phone}</p>}
              <button
                onClick={() => {
                  setEditForm({
                    name: userData?.name || user.displayName || '',
                    email: userData?.email || user.email || '',
                    phone: userData?.phone || '',
                  });
                  setShowEditProfileModal(true);
                }}
                className="text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-1 border-b border-gray-200 mt-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'overview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'bookings'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'settings'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Addresses */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Saved Addresses
                </h2>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm font-medium"
                >
                  + Add
                </button>
              </div>
              {addresses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No addresses saved</p>
                  <p className="text-sm mt-1">Add an address to make booking faster</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr, i) => (
                    <div key={i} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition">
                      <span className="text-sm">{addr}</span>
                      <button
                        onClick={() => removeAddress(i)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 hover:bg-red-50 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicles */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-4-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                  My Vehicles
                </h2>
                <button
                  onClick={() => setShowVehicleModal(true)}
                  className="gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm font-medium"
                >
                  + Add Vehicle
                </button>
              </div>
              {vehicles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No vehicles saved</p>
                  <p className="text-sm mt-1">Add your vehicles to speed up booking</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition">
                      <div>
                        <div className="font-semibold text-blue-900">{vehicle.name}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {vehicle.make && vehicle.model && `${vehicle.make} ${vehicle.model}`}
                          {vehicle.year && ` • ${vehicle.year}`}
                          {vehicle.color && ` • ${vehicle.color}`}
                          {vehicle.plate && ` • Plate: ${vehicle.plate}`}
                        </div>
                      </div>
                      <button
                        onClick={() => removeVehicle(vehicle.id)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 hover:bg-red-50 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Payment Methods
                </h2>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm font-medium"
                >
                  + Add Card
                </button>
              </div>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No cards saved</p>
                  <p className="text-sm mt-1">Add a payment method for faster checkout</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentMethods.map((card) => (
                    <div key={card.id} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded shadow-sm"></div>
                        <div>
                          <span className="text-sm font-medium block">•••• {card.last4}</span>
                          {card.default && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mt-1 inline-block">Default</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => removeCard(card.id)}
                        className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 hover:bg-red-50 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Booking Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setBookingTab('upcoming')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${bookingTab === 'upcoming'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Upcoming ({upcomingBookings.length})
              </button>
              <button
                onClick={() => setBookingTab('past')}
                className={`px-4 py-2 font-medium text-sm transition-colors ${bookingTab === 'past'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                Past ({pastBookings.length})
              </button>
            </div>

            {/* Bookings List */}
            <div className="space-y-4">
              {(bookingTab === 'upcoming' ? upcomingBookings : pastBookings).map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{booking.service}</h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(booking.status)}`}>
                          {booking.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>📅 {formatDate(booking.date)} at {booking.time}</p>
                        <p>📍 {booking.address || 'No address provided'}</p>
                        <p>👤 Provider: {booking.providerSnapshot?.name || booking.providerId}</p>
                        {booking.vehicle && (
                          <p>🚗 {booking.vehicle.name} {booking.vehicle.plate && `(${booking.vehicle.plate})`}</p>
                        )}
                      </div>
                      {Array.isArray(booking.addOns) && booking.addOns.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {booking.addOns.map((addon: string, i: number) => (
                            <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              {addon}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-6">
                      <div className="font-bold text-blue-600 text-xl mb-2">${booking.price?.toFixed(2) || '0.00'}</div>
                      {bookingTab === 'upcoming' && booking.status !== 'cancelled' && (
                        <button
                          onClick={() => cancelBooking(booking.id)}
                          className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1 hover:bg-red-50 rounded"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(bookingTab === 'upcoming' ? upcomingBookings : pastBookings).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg mb-2">No {bookingTab === 'upcoming' ? 'upcoming' : 'past'} bookings</p>
                  {bookingTab === 'upcoming' && (
                    <button
                      onClick={() => router.push('/profile')}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Browse detailers →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Preferences
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <label className="font-medium text-gray-900">Email Notifications</label>
                    <p className="text-sm text-gray-600">Receive updates about your bookings via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <label className="font-medium text-gray-900">SMS Notifications</label>
                    <p className="text-sm text-gray-600">Receive text message updates about your bookings</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <button
                onClick={saveSettings}
                className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                Save Preferences
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Account
              </h2>

              <div className="space-y-3">
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Edit Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveProfileInfo}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Picture Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Change Profile Picture</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="space-y-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition"
              >
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600">Click to upload</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
              </button>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}
              {profilePic && (
                <button
                  onClick={removeProfilePicture}
                  className="w-full text-red-600 hover:text-red-700 font-medium py-2"
                >
                  Remove Current Picture
                </button>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Address</h3>
            <input
              ref={addressInputRef}
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Start typing address (Google autocomplete enabled)..."
              className="w-full p-3 border rounded-lg mb-4 focus:border-blue-500 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && saveAddress()}
              autoComplete="off"
              id="address-autocomplete-input"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAddressModal(false); setNewAddress(''); }}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveAddress}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Card</h3>
            <input
              type="text"
              value={newCard}
              onChange={(e) => setNewCard(e.target.value.replace(/\D/g, '').slice(0, 16))}
              placeholder="4242 4242 4242 4242"
              className="w-full p-3 border rounded-lg mb-4 font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowPaymentModal(false); setNewCard(''); }}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveCard}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Save Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Add Vehicle</h3>
            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={newVehicle.name}
                onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                placeholder="Vehicle Name (e.g., My Tesla)"
                className="w-full p-3 border rounded-lg"
              />
              <input
                type="text"
                value={newVehicle.plate}
                onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value.toUpperCase() })}
                placeholder="License Plate"
                className="w-full p-3 border rounded-lg"
              />
              <div className="grid grid-cols-2 gap-2">
                <AutocompleteInput
                  value={newVehicle.make}
                  onChange={(v) => setNewVehicle({ ...newVehicle, make: v, model: '' })}
                  options={availableMakes}
                  placeholder="Make"
                />
                <AutocompleteInput
                  value={newVehicle.model}
                  onChange={(v) => setNewVehicle({ ...newVehicle, model: v })}
                  options={filteredModels}
                  placeholder="Model"
                  disabled={!newVehicle.make}
                />
              </div>
              <AutocompleteInput
                value={newVehicle.year}
                onChange={(v) => setNewVehicle({ ...newVehicle, year: v })}
                options={availableYears}
                placeholder="Year"
              />
              <select
                value={newVehicle.color}
                onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                className="w-full p-3 border rounded-lg"
              >
                <option value="">Select Color (Optional)</option>
                {VEHICLE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowVehicleModal(false);
                  setNewVehicle({ name: '', plate: '', make: '', model: '', year: '', color: '' });
                  setFilteredModels([]);
                }}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveVehicle}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
