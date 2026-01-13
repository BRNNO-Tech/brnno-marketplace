'use client';

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Vehicle {
  year: string;
  make: string;
  model: string;
}

export default function BookingFunnel() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const QUIZ_PATH = "quiz/results"; // where next

  const [address, setAddress] = useState("");
  const [vehicle, setVehicle] = useState<Vehicle>({ year: "", make: "", model: "" });

  const years = useMemo(
    () => Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString()),
    []
  );

  const goToQuiz = () => {
    const params = new URLSearchParams();

    // optional
    if (address.trim()) params.set("address", address.trim());
    if (vehicle.year) params.set("year", vehicle.year);
    if (vehicle.make.trim()) params.set("make", vehicle.make.trim());
    if (vehicle.model.trim()) params.set("model", vehicle.model.trim());

    const qs = params.toString();
    router.push(qs ? `${QUIZ_PATH}?${qs}` : QUIZ_PATH);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-blue-900 flex items-center justify-center p-6 text-slate-900">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        {/* Progress */}
        <div className="flex justify-between text-sm text-gray-500 mb-4">
          <span>Step {step + 1} of 2</span>
          <div className="flex gap-1">
            {[0, 1].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i <= step ? "bg-blue-600" : "bg-gray-300"}`}
              />
            ))}
          </div>
        </div>

        {step === 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Where is the vehicle?</h2>
            <input
              type="text"
              placeholder="Enter address or zip code (optional)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition font-medium text-lg"
            />

            <button
              onClick={() => setStep(1)}
              className="w-full bg-blue-600 text-white p-4 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg"
            >
              Next: Vehicle Info
            </button>

            <button
              onClick={goToQuiz}
              className="w-full border-2 border-gray-200 p-4 rounded-lg font-bold hover:bg-gray-50 transition"
            >
              Skip Vehicle Info → Find Detailers
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Tell us about your car (optional)</h2>

            <select
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none bg-white"
              value={vehicle.year}
              onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })}
            >
              <option value="">Select Year (optional)</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Make (optional) e.g. Toyota"
              value={vehicle.make}
              onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })}
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition font-medium bg-white"
            />

            <input
              type="text"
              placeholder="Model (optional) e.g. Camry"
              value={vehicle.model}
              onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none transition font-medium bg-white"
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep(0)}
                className="w-1/3 p-4 border-2 border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={goToQuiz}
                className="w-2/3 bg-blue-600 text-white p-4 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg"
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