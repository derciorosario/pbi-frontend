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
      arr.includes(id)
        ? arr.filter((x) => x !== id)
        : arr.length < 3
        ? [...arr, id]
        : arr // máximo de 3
    );
  }

  async function onSave() {
    if (selected.length === 0) return;
    await saveGoals(selected);
    await refresh();
    nav("/dashboard");
  }

  /* ---------------- LOADER ---------------- */
  if (goals.length === 0) {
    return (
      <div className="min-h-screen grid place-items-center text-brand-700">
        <div className="flex items-center gap-2">
          <svg
            className="h-6 w-6 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              className="opacity-25"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
            />
          </svg>
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  /* ---------------- MAIN ---------------- */
  return (
    <div className="min-h-screen p-6 bg-brand-50/40">
      <header className="max-w-3xl mx-auto text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
          🎯
        </div>
        <h1 className="mt-4 text-3xl font-bold">We need some information</h1>
        <p className="text-gray-500">Tell us what you’re looking for.</p>
        <div className="mt-4 h-2 bg-gray-200 rounded">
          <div className="h-2 rounded bg-brand-700" style={{ width: "100%" }} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto mt-6">
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h2 className="text-xl font-semibold mb-2">
            What Are You Looking For?
          </h2>

          {/* Mensagem sempre visível no início */}
          <p className="text-sm text-gray-500 mb-4">* Select up to 3.</p>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {goals.map((g) => {
              const isSelected = selected.includes(g.id);
              const isDisabled =
                selected.length >= 3 && !isSelected; // se já escolheu 3, desativa os outros

              return (
                <button
                  key={g.id}
                  onClick={() => toggle(g.id)}
                  className={`rounded-xl border px-4 py-3 text-left hover:shadow-soft transition ${
                    isSelected
                      ? "border-brand-700 ring-2 ring-brand-500"
                      : "border-gray-200"
                  } ${isDisabled ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-brand-700">
                      {getIcon(GOAL_ICONS, g.name)}
                    </span>
                    <div className="font-medium">{g.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => nav(-1)}
            className="rounded-xl border px-4 py-3"
          >
            Previous
          </button>
          <button
            onClick={onSave}
            disabled={selected.length === 0}
            className="rounded-xl bg-brand-700 text-white px-6 py-3 font-semibold disabled:opacity-50"
          >
            Save & Join
          </button>
        </div>
      </main>
    </div>
  );
}
