// src/pages/onboarding/Industry.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import useOnboarding from "../../hooks/useOnboarding";
import { CATEGORY_ICONS, getIcon } from "../../assets/onboardingIcons";

export default function Industry() {
  const nav = useNavigate();
  const { saveCategories, refresh, state } = useOnboarding();

  const [cats, setCats] = useState([]);
  const [categoryIds, setCategoryIds] = useState([]);
  const [subcategoryIds, setSubcategoryIds] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await client.get("/public/categories");
      setCats(data || []);
    })();
  }, []);

  const subToCat = useMemo(() => {
    const m = {};
    for (const c of cats)
      for (const s of c.subcategories || []) m[s.id] = c.id;
    return m;
  }, [cats]);

  function toggleSubcategory(subId) {
    const parentCatId = subToCat[subId];

    setSubcategoryIds((subSel) => {
      const had = subSel.includes(subId);
      const nextSubs = had
        ? subSel.filter((id) => id !== subId)
        : [...subSel, subId];

      if (!had && parentCatId && !categoryIds.includes(parentCatId)) {
        setCategoryIds((catSel) =>
          catSel.includes(parentCatId) ? catSel : [...catSel, parentCatId]
        );
      }

      if (had && parentCatId) {
        const siblings = (
          cats.find((c) => c.id === parentCatId)?.subcategories || []
        ).map((s) => s.id);
        const anySiblingSelected = nextSubs.some((sid) =>
          siblings.includes(sid)
        );
        if (!anySiblingSelected) {
          setCategoryIds((catSel) => catSel.filter((id) => id !== parentCatId));
        }
      }

      return nextSubs;
    });
  }

  const canContinue = categoryIds.length >= 1 && subcategoryIds.length >= 2;

  async function onContinue() {
    if (!canContinue) return;
    await saveCategories(categoryIds, subcategoryIds);
    await refresh();
    nav("/onboarding/goals");
  }

  const selectedCountByCat = useMemo(() => {
    const counts = {};
    for (const cat of cats) {
      const ids = (cat.subcategories || []).map((s) => s.id);
      counts[cat.id] = subcategoryIds.filter((id) => ids.includes(id)).length;
    }
    return counts;
  }, [cats, subcategoryIds]);

  /* ---------------- LOADER ---------------- */
  if (cats.length === 0) {
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

  /* ---------------- MAIN PAGE ---------------- */
  return (
    <div className="min-h-screen p-6 bg-brand-50/40">
      {/* Header */}
      <header className="max-w-3xl mx-auto text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
          🧩
        </div>
        <h1 className="mt-4 text-3xl font-bold">We need some information</h1>
        <p className="text-gray-500">
          Select the categories that best describe your field.
        </p>
        <div className="mt-4 h-2 bg-gray-200 rounded">
          <div
            className="h-2 rounded bg-brand-700"
            style={{ width: `${Math.max(state?.progress ?? 66, 66)}%` }}
          />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto mt-6">
        <div className="bg-white rounded-2xl shadow-soft p-2 sm:p-6">
          <h2 className="text-xl font-semibold mb-2">Your Industry</h2>

          {/* Aviso no topo */}
          <p className="text-sm text-gray-500 mb-4">
            * Select at least <b>1 industry</b> and <b>2 subcategories</b>.
          </p>

          <div className="space-y-3">
            {cats.map((cat) => (
              <details key={cat.id} className="group border rounded-xl">
                <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={categoryIds.includes(cat.id)}
                      readOnly
                      className="hidden"
                    />
                    <span className="text-brand-700">
                      {getIcon(CATEGORY_ICONS, cat.name)}
                    </span>
                    <span className="font-medium">{cat.name}</span>
                    {selectedCountByCat[cat.id] > 0 && (
                      <span className="ml-1 inline-flex items-center rounded-full bg-brand-50 text-brand-700 text-xs px-2 py-0.5">
                        {selectedCountByCat[cat.id]}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 group-open:rotate-180 transition">
                    ▾
                  </span>
                </summary>

                <div className="px-4 pb-4 grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {cat.subcategories.map((sc) => (
                    <label
                      key={sc.id}
                      className="flex items-center gap-3 border rounded-lg px-3 py-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={subcategoryIds.includes(sc.id)}
                        onChange={() => toggleSubcategory(sc.id)}
                        className="h-4 w-4 text-brand-600"
                      />
                      <span>{sc.name}</span>
                    </label>
                  ))}
                </div>
              </details>
            ))}
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
            onClick={onContinue}
            disabled={!canContinue}
            className="rounded-xl bg-brand-700 text-white px-6 py-3 font-semibold disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </main>
    </div>
  );
}
