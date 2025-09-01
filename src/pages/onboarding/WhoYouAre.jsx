// src/pages/onboarding/WhoYouAre.jsx
import React, { useState } from "react";
import useOnboarding from "../../hooks/useOnboarding";
import { useNavigate } from "react-router-dom";
import { PROFILE_TYPE_ICONS, getIcon } from "../../assets/onboardingIcons";

const OPTIONS = [
  "Entrepreneur","Seller","Buyer","Job Seeker","Professional","Partnership",
  "Investor","Event Organizer","Government Official","Traveler","NGO",
  "Support Role","Freelancer","Student"
];

export default function WhoYouAre() {
  const nav = useNavigate();
  const { saveProfileType, refresh, state } = useOnboarding();
  const [selected, setSelected] = useState("");

  async function onContinue() {
    if (!selected) return;
    await saveProfileType(selected);
    await refresh();
    nav("/onboarding/industry");
  }

  return (
    <div className="min-h-screen p-6 bg-brand-50/40">
      <header className="max-w-3xl mx-auto text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
          <span className="text-lg">👤</span>
        </div>
        <h1 className="mt-4 text-3xl font-bold">We need some information</h1>
        <p className="text-gray-500">Help us connect you with the right opportunities.</p>
        <div className="mt-4 h-2 bg-gray-200 rounded">
          <div className="h-2 rounded bg-brand-700" style={{ width: `${Math.max(state.progress, 33)}%` }} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto mt-6">
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h2 className="text-xl font-semibold mb-4">Who You Are</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setSelected(opt)}
                className={`rounded-xl border px-4 py-3 text-left hover:shadow-soft
                 ${selected === opt ? "border-brand-700 ring-2 ring-brand-500" : "border-gray-200"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-brand-700">{getIcon(PROFILE_TYPE_ICONS, opt)}</span>
                  <div className="font-medium">{opt}</div>
                </div>
                <div className="text-xs text-gray-500">Select to continue</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onContinue} disabled={!selected}
            className="rounded-xl bg-brand-700 text-white px-6 py-3 font-semibold disabled:opacity-50">
            Continue
          </button>
        </div>
      </main>
    </div>
  );
}
