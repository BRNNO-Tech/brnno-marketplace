'use client';

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Vehicle {
  year: string;
  make: string;
  model: string;
}

export default function BookingFunnel() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [vehicle, setVehicle] = useState<Vehicle>({ year: "", make: "", model: "" });
  
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // CarAPI covers 1990 to today
  const years = useMemo(
    () => Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString()),
    []
  );

  // --- FETCH MAKES (CarAPI) ---
  useEffect(() => {
    if (!vehicle.year) {
      setMakes([]);
      return;
    }

    async function fetchMakes() {
      setLoading(true);
      try {
        // CarAPI free endpoint for makes by year
        const res = await fetch(`https://carapi.app/api/makes?year=${vehicle.year}`);
        const data = await res.json();
        
        if (data.data) {
          const makeList = data.data.map((m: any) => m.name).sort();
          setMakes(makeList);
        }
      } catch (err) {
        console.error("CarAPI Makes Error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMakes();
  }, [vehicle.year]);

  // --- FETCH MODELS (CarAPI) ---
  useEffect(() => {
    if (!vehicle.make || !vehicle.year) {
      setModels([]);
      return;
    }

    async function fetchModels() {
      setLoading(true);
      try {
        const res = await fetch(
          `https://carapi.app/api/models?year=${vehicle.year}&make=${encodeURIComponent(vehicle.make)}`
        );
        const data = await res.json();
        
        if (data.data) {
          const modelList = data.data.map((m: any) => m.name).sort();
          setModels(modelList);
        }
      } catch (err) {
        console.error("CarAPI Models Error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchModels();
  }, [vehicle.make, vehicle.year]);

  const handleFinalSubmit = () => {
    const params = new URLSearchParams({
      address,
      ...vehicle
    });
    router.push(`/quiz/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-blue-900 flex items-center justify-center p-6 text-slate-900">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        
        {/* Step 1: Address */}
        {step === 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Where is the vehicle?</h2>
            <input
              type="text"
              placeholder="Enter address or zip code"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-lg outline-none"
            />
            <button
              onClick={() => setStep(1)}
              className="w-full bg-blue-600 text-white p-4 rounded-lg font-bold"
            >
              Next: Vehicle Info
            </button>
          </div>
        )}

        {/* Step 2: Vehicle Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Your Vehicle</h2>
            
            <select 
              className="w-full p-4 border-2 border-gray-200 rounded-lg bg-white"
              value={vehicle.year}
              onChange={(e) => setVehicle({ year: e.target.value, make: "", model: "" })}
            >
              <option value="">Select Year</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select 
              disabled={!vehicle.year || loading}
              className="w-full p-4 border-2 border-gray-200 rounded-lg bg-white disabled:bg-gray-100"
              value={vehicle.make}
              onChange={(e) => setVehicle({ ...vehicle, make: e.target.value, model: "" })}
            >
              <option value="">{loading ? "Loading Makes..." : "Select Make"}</option>
              {makes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <select 
              disabled={!vehicle.make || loading}
              className="w-full p-4 border-2 border-gray-200 rounded-lg bg-white disabled:bg-gray-100"
              value={vehicle.model}
              onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
            >
              <option value="">{loading ? "Loading Models..." : "Select Model"}</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="w-1/3 p-4 border-2 rounded-lg">Back</button>
              <button
                disabled={!vehicle.model}
                onClick={handleFinalSubmit}
                className="w-2/3 bg-blue-600 text-white p-4 rounded-lg font-bold disabled:bg-gray-300"
              >
                Find Detailers
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}