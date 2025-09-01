// src/pages/onboarding/Goals.jsx
import React, { useEffect, useState } from "react";
import useOnboarding from "../../hooks/useOnboarding";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { GOAL_ICONS, getIcon } from "../../assets/onboardingIcons";

export default function Goals() {
  const nav = useNavigate();
  const { saveGoals, refresh } = useOnboarding();
  const [goals, setGoals] = useState([]); // [{id,name}]
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await client.get("/public/goals");
      setGoals(data || []);
    })();
  }, []);

  function toggle(id) {
    setSelected((arr) =>
      arr.includes(id) ? arr.filter(x => x !== id)
      : (arr.length < 3 ? [...arr, id] : arr) // cap 3
    );
  }

  async function onSave() {
    if (selected.length === 0) return;
    await saveGoals(selected);
    await refresh();
    nav("/dashboard");
  }

  return (
    <div className="min-h-screen p-6 bg-brand-50/40">
      <header className="max-w-3xl mx-auto text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">🎯</div>
        <h1 className="mt-4 text-3xl font-bold">We need some information</h1>
        <p className="text-gray-500">Tell us what you’re looking for.</p>
        <div className="mt-4 h-2 bg-gray-200 rounded">
          <div className="h-2 rounded bg-brand-700" style={{ width: "100%" }} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto mt-6">
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h2 className="text-xl font-semibold mb-4">What Are You Looking For?</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {goals.map(g => (
              <button
                key={g.id}
                onClick={() => toggle(g.id)}
                className={`rounded-xl border px-4 py-3 text-left hover:shadow-soft ${
                  selected.includes(g.id) ? "border-brand-700 ring-2 ring-brand-500" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-brand-700">{getIcon(GOAL_ICONS, g.name)}</span>
                  <div className="font-medium">{g.name}</div>
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">Select up to 3.</p>
        </div>

        <div className="mt-6 flex justify-between">
          <button onClick={() => nav(-1)} className="rounded-xl border px-4 py-3">Previous</button>
          <button onClick={onSave} disabled={selected.length === 0}
            className="rounded-xl bg-brand-700 text-white px-6 py-3 font-semibold disabled:opacity-50">
            Save & Join
          </button>
        </div>
      </main>
    </div>
  );
}
