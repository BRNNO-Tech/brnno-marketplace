'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

const steps = [
  { 
    q: "What's most important to you in a detailer?", 
    opts: ["Best price", "Highest rated", "Fastest service", "Most experience", "Eco-friendly products"] 
  },
  { 
    q: "What's your main goal?", 
    opts: ["Regular detailing", "Special occasion prep", "Sell/trade-in prep", "Fix specific issues", "Full restoration"] 
  },
  { 
    q: "What's your budget range?", 
    opts: [
      "Under $100 (Basic Wash)",
      "$100-$200 (Full Detail)", 
      "$200-$400 (Premium Services)",
      "$400+ (Ceramic Coating & More)"
    ] 
  },
];

export default function Quiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ priority: "", goal: "", budget: "" });
  const router = useRouter();

  const next = (value: string) => {
    if (!value) return;

    const keys = ["priority", "goal", "budget"];
    const key = keys[step];
    const newAnswers = { ...answers, [key]: value };

    if (step < 2) {
      setAnswers(newAnswers);
      setStep(step + 1);
    } else {
      // Save to localStorage
      localStorage.setItem('quizAnswers', JSON.stringify(newAnswers));
      
      // Redirect to results with params
      const params = new URLSearchParams({
        priority: newAnswers.priority,
        goal: newAnswers.goal,
        budget: newAnswers.budget,
      });
      router.push(`/quiz/results?${params.toString()}`);
    }
  };

  const current = steps[step];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-blue-900 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-between text-sm text-gray-500 mb-4">
          <span>Step {step + 1} of 3</span>
          <span className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i <= step ? "bg-blue-600" : "bg-gray-300"}`} />
            ))}
          </span>
        </div>
        <h2 className="text-2xl font-bold mb-6">{current.q}</h2>

        <div className="space-y-3">
          {current.opts.map((opt) => (
            <button
              key={opt}
              onClick={() => next(opt)}
              className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition font-medium"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
