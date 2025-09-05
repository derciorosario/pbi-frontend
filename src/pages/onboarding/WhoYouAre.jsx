import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import useOnboarding from "../../hooks/useOnboarding";

export default function WhoYouAre() {
  const nav = useNavigate();
  const { refresh, state, saveIdentities } = useOnboarding();

  const [loading, setLoading] = useState(true);
  const [identities, setIdentities] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        // You already have a meta endpoint that returns identities with categories.
        const { data } = await client.get("/feed/meta");
        const ids = (data.identities || []).map((i) => ({ id: i.id, name: i.name, group: i.group, sort: i.sort }));
        setIdentities(ids);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function toggle(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onContinue() {
    if (selected.length === 0) return;
    await saveIdentities(selected);
    await refresh();
    nav("/onboarding/industry");
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-brand-700">
        <div className="flex items-center gap-2">
          <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
          </svg>
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-brand-50/40">
      <header className="max-w-3xl mx-auto text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">👥</div>
        <h1 className="mt-4 text-3xl font-bold">Choose your identities</h1>
        <p className="text-gray-500">You can select more than one if it represents you.</p>
        <div className="mt-4 h-2 bg-gray-200 rounded">
          <div className="h-2 rounded bg-brand-700" style={{ width: `${Math.max(state.progress, 33)}%` }} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto mt-6">
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {identities.map((opt) => (
              <button
                key={opt.id}
                onClick={() => toggle(opt.id)}
                className={`rounded-xl border px-4 py-3 text-left hover:shadow-soft ${
                  selected.includes(opt.id) ? "border-brand-700 ring-2 ring-brand-500" : "border-gray-200"
                }`}
              >
                <div className="font-medium">{opt.name}</div>
                <div className="text-xs text-gray-500">Select to include</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onContinue}
            disabled={selected.length === 0}
            className="rounded-xl bg-brand-700 text-white px-6 py-3 font-semibold disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </main>
    </div>
  );
}
