import React, { useEffect, useMemo, useState } from "react";
import client from "../../api/client";

export default function OneShotOnboarding() {
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState({ identities: [], goals: [] });

  // selections (by ID)
  const [categoryIds, setCategoryIds] = useState([]);
  const [subcategoryIds, setSubcategoryIds] = useState([]);
  const [subsubCategoryIds, setSubsubCategoryIds] = useState([]);
  const [goalIds, setGoalIds] = useState([]);


  console.log({userAccountType})

  useEffect(() => {
    (async () => {
      try {
        // gets identities + canonical IDs for categories/subcats/subsubs + goals WITH ids
        const { data } = await client.get("/public/identities");
        setCatalog(data || { identities: [], goals: [] });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const allGoals = useMemo(() => catalog.goals || [], [catalog]);

  const toggle = (setter, arr, id) => {
    setter(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  };

  async function onSave() {
    try {
      await client.post("/onboarding/oneshot", {
        // identityIds: []  // not in use right now, identities are only UI groups
        categoryIds,
        subcategoryIds,
        subsubCategoryIds,
        goalIds, // ✅ selected goal IDs
      });
      alert("Saved!");
    } catch (e) {
      console.error(e);
      alert("Failed to save.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-brand-700">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Complete your profile</h1>

      {/* Identities + categories mapping (same category may appear under multiple identities) */}
      <div className="space-y-6">
        {catalog.identities.map((iden, iIdx) => (
          <div key={iIdx} className="rounded-xl border bg-white p-4">
            <div className="flex items-center gap-3">
              {/* Identities are NOT persisted/selected now; they are only visual groups */}
              <h3 className="font-semibold">{iden.name}</h3>
              <span className="text-xs text-gray-500">(categories below)</span>
            </div>

            <div className="mt-3 space-y-3">
              {iden.categories.map((cat, cIdx) => (
                <details key={`${iIdx}-${cIdx}`} className="group border rounded-lg">
                  <summary className="px-3 py-2 cursor-pointer flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={!!cat.id && categoryIds.includes(cat.id)}
                        onChange={() => cat.id && toggle(setCategoryIds, categoryIds, cat.id)}
                        disabled={!cat.id}
                        title={cat.id ? "" : "Category not found in DB"}
                      />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <span className="text-gray-400 group-open:rotate-180 transition">▾</span>
                  </summary>

                  <div className="px-3 pb-3 grid md:grid-cols-2 gap-2">
                    {cat.subcategories.map((sc, sIdx) => (
                      <div key={`${iIdx}-${cIdx}-${sIdx}`} className="border rounded-md px-3 py-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={!!sc.id && subcategoryIds.includes(sc.id)}
                            onChange={() => sc.id && toggle(setSubcategoryIds, subcategoryIds, sc.id)}
                            disabled={!sc.id}
                            title={sc.id ? "" : "Subcategory not found in DB"}
                          />
                          <span>{sc.name}</span>
                        </label>

                        {Array.isArray(sc.subsubs) && sc.subsubs.length > 0 && (
                          <div className="ml-6 mt-2 space-y-1">
                            {sc.subsubs.map((ss, ssIdx) => (
                              <label key={`${iIdx}-${cIdx}-${sIdx}-${ssIdx}`} className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={!!ss.id && subsubCategoryIds.includes(ss.id)}
                                  onChange={() =>
                                    ss.id && toggle(setSubsubCategoryIds, subsubCategoryIds, ss.id)
                                  }
                                  disabled={!ss.id}
                                  title={ss.id ? "" : "Level 3 not found in DB"}
                                />
                                <span>{ss.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Goals (with IDs) */}
      <div className="mt-6 rounded-xl border bg-white p-4">
        <h3 className="font-semibold">Your Goals</h3>
        <p className="text-xs text-gray-500 mb-2">Pick as many as you want.</p>
        <div className="flex flex-wrap gap-2">
          {allGoals.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => toggle(setGoalIds, goalIds, g.id)}
              className={`rounded-full border px-3 py-1 text-sm ${
                goalIds.includes(g.id) ? "bg-[#8A358A] text-white border-transparent" : "bg-white"
              }`}
              title={g.name}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onSave}
          className="rounded-xl bg-[#8A358A] text-white px-6 py-3 font-semibold"
        >
          Save All
        </button>
      </div>
    </div>
  );
}
