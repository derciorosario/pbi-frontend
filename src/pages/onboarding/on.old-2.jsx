import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";

/**
 * TwoStepOnboarding.jsx
 * - Step 1: Select identities (multi) + categories/subcategories/subsubs (min 1 category)
 * - Step 2: Select goals (min 3)
 * - Single POST on finish: /onboarding/oneshot
 *
 * Requires backend:
 *  GET /public/identities  -> { identities: [...], goals: [{id,name}, ...] }
 *  POST /onboarding/oneshot -> { identityIds, categoryIds, subcategoryIds, subsubCategoryIds, goalIds }
 */

export default function TwoStepOnboarding() {
  const nav = useNavigate();

  // ----- UI/Flow -----
  const [step, setStep] = useState(1); // 1 or 2
  const progress = step === 1 ? 50 : 100;

  // ----- Data -----
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [identities, setIdentities] = useState([]);
  const [goals, setGoals] = useState([]);

  // ----- Selections -----
  const [identityIds, setIdentityIds] = useState([]);
  const [categoryIds, setCategoryIds] = useState([]);
  const [subcategoryIds, setSubcategoryIds] = useState([]);
  const [subsubCategoryIds, setSubsubCategoryIds] = useState([]);
  const [goalIds, setGoalIds] = useState([]);

  // ----- Load mapping (identities + categories + subcats + subsubs + goals) -----
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await client.get("/public/identities");
        const ids = Array.isArray(data?.identities) ? data.identities : [];
        const gs = Array.isArray(data?.goals) ? data.goals : [];
        setIdentities(ids);
        setGoals(gs);
      } catch (e) {
        console.error(e);
        setError("Failed to load onboarding data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ----- Lookup maps to enforce parent selection -----
  // Build global maps across all identities so category/sub/subsub are unique by their canonical IDs
  const subToCat = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      for (const cat of iden.categories || []) {
        for (const sc of cat.subcategories || []) {
          if (sc?.id) m[sc.id] = cat.id;
        }
      }
    }
    return m;
  }, [identities]);

  const subsubToSub = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      for (const cat of iden.categories || []) {
        for (const sc of cat.subcategories || []) {
          for (const ss of sc.subsubs || []) {
            if (ss?.id) m[ss.id] = sc.id;
          }
        }
      }
    }
    return m;
  }, [identities]);

  const catToAllSubIds = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      for (const cat of iden.categories || []) {
        if (!cat?.id) continue;
        const subs = (cat.subcategories || []).map((s) => s.id).filter(Boolean);
        m[cat.id] = Array.from(new Set([...(m[cat.id] || []), ...subs]));
      }
    }
    return m;
  }, [identities]);

  const subToAllSubsubIds = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      for (const cat of iden.categories || []) {
        for (const sc of cat.subcategories || []) {
          if (!sc?.id) continue;
          const subsubs = (sc.subsubs || []).map((x) => x.id).filter(Boolean);
          m[sc.id] = Array.from(new Set([...(m[sc.id] || []), ...subsubs]));
        }
      }
    }
    return m;
  }, [identities]);

  // ----- Toggle helpers -----
  const toggleIdFromArray = (arr, setArr) => (id) =>
    setArr(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const toggleIdentity = toggleIdFromArray(identityIds, setIdentityIds);

  function toggleCategory(catId) {
    if (!catId) return;
    const has = categoryIds.includes(catId);
    if (has) {
      // Deselect category → also remove its subcategories and subsubs
      const subIds = catToAllSubIds[catId] || [];
      const subsubIds = subIds.flatMap((sid) => subToAllSubsubIds[sid] || []);
      setCategoryIds((prev) => prev.filter((x) => x !== catId));
      setSubcategoryIds((prev) => prev.filter((sid) => !subIds.includes(sid)));
      setSubsubCategoryIds((prev) => prev.filter((xid) => !subsubIds.includes(xid)));
    } else {
      setCategoryIds((prev) => [...prev, catId]);
    }
  }

  function toggleSubcategory(subId) {
    if (!subId) return;
    const parentCatId = subToCat[subId];
    const has = subcategoryIds.includes(subId);

    if (has) {
      // Deselect subcategory → remove its subsubs; if no siblings remain, we can also deselect the category
      const children = subToAllSubsubIds[subId] || [];
      setSubcategoryIds((prev) => prev.filter((x) => x !== subId));
      setSubsubCategoryIds((prev) => prev.filter((x) => !children.includes(x)));

      if (parentCatId) {
        // if no other subs of same category remain selected, also deselect category
        const siblings = (catToAllSubIds[parentCatId] || []).filter((x) => x !== subId);
        const anySiblingSelected = siblings.some((sid) => subcategoryIds.includes(sid));
        if (!anySiblingSelected) {
          setCategoryIds((prev) => prev.filter((c) => c !== parentCatId));
        }
      }
    } else {
      // Select subcategory → ensure parent category is selected
      if (parentCatId && !categoryIds.includes(parentCatId)) {
        setCategoryIds((prev) => [...prev, parentCatId]);
      }
      setSubcategoryIds((prev) => [...prev, subId]);
    }
  }

  function toggleSubsub(subsubId) {
    if (!subsubId) return;
    const parentSubId = subsubToSub[subsubId];
    const parentCatId = parentSubId ? subToCat[parentSubId] : null;
    const has = subsubCategoryIds.includes(subsubId);

    if (has) {
      setSubsubCategoryIds((prev) => prev.filter((x) => x !== subsubId));
    } else {
      // Select level-3 → ensure parent sub/category selected
      if (parentSubId && !subcategoryIds.includes(parentSubId)) {
        setSubcategoryIds((prev) => [...prev, parentSubId]);
      }
      if (parentCatId && !categoryIds.includes(parentCatId)) {
        setCategoryIds((prev) => [...prev, parentCatId]);
      }
      setSubsubCategoryIds((prev) => [...prev, subsubId]);
    }
  }

  // ----- Goals selection (min 3) -----
  function toggleGoal(goalId) {
    setGoalIds((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  }

  // ----- Next / Save -----
  const canContinueStep1 =
    identityIds.length >= 1 && categoryIds.length >= 1; // at least one identity and one category
  const canSave = goalIds.length >= 3; // at least 3 goals

  async function onFinish() {
    if (!canSave) return;
    try {
      await client.post("/onboarding/oneshot", {
        identityIds,
        categoryIds,
        subcategoryIds,
        subsubCategoryIds,
        goalIds,
      });
      // go wherever you want after finishing
      nav("/dashboard");
    } catch (e) {
      console.error(e);
      alert("Failed to save. Please try again.");
    }
  }

  // ----- Render helpers -----
  function Loading() {
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

  function Header({ icon, title, subtitle }) {
    return (
      <header className="max-w-3xl mx-auto text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
          {icon}
        </div>
        <h1 className="mt-4 text-3xl font-bold">{title}</h1>
        <p className="text-gray-500">{subtitle}</p>
        <div className="mt-4 h-2 bg-gray-200 rounded">
          <div className="h-2 rounded bg-brand-700" style={{ width: `${progress}%` }} />
        </div>
      </header>
    );
  }

  // ----- UI -----
  if (loading) return <Loading />;
  if (error) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="rounded-xl border bg-white p-6">
          <div className="text-red-600 font-semibold mb-2">Error</div>
          <div className="text-sm text-gray-700">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-brand-50/40">
      {step === 1 ? (
        <>
          <Header
            icon={"👥"}
            title="Choose your identities & fields"
            subtitle="You can select more than one identity. Expand categories to select subcategories and level 3."
          />

          <main className="max-w-4xl mx-auto mt-6">
            <div className="bg-white rounded-2xl shadow-soft p-6">
              {/* Identities row */}
              <h2 className="text-xl font-semibold mb-2">Who You Are</h2>
              <p className="text-sm text-gray-500 mb-3">Select all identities that represent you.</p>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {identities.map((iden, iIdx) => {
                  // identities are UI-only groupings; we still allow selecting them
                  const isSel = identityIds.includes(iden.id); // id may not exist (identities optional), fallback to hash-of-name if you persisted identities
                  const idVal = iden.id || `name:${iden.name}`;
                  const active = identityIds.includes(idVal);
                  return (
                    <button
                      key={`${iIdx}-${iden.name}`}
                      onClick={() => toggleIdentity(idVal)}
                      className={`rounded-xl border px-4 py-3 text-left hover:shadow-soft ${
                        active ? "border-brand-700 ring-2 ring-brand-500" : "border-gray-200"
                      }`}
                    >
                      <div className="font-medium">{iden.name}</div>
                      <div className="text-xs text-gray-500">Select to include</div>
                    </button>
                  );
                })}
              </div>

              {/* Categories within each identity */}
              <h3 className="text-sm text-gray-500 mb-2">
                * Select at least <b>1 category</b>. Selecting a subcategory/level-3 will auto-select parents.
              </h3>

              <div className="space-y-4">
                {identities.map((iden, iIdx) => (
                  <div key={`iden-${iIdx}`} className="rounded-xl border">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-t-xl">
                      <div className="font-semibold">{iden.name}</div>
                      <span className="text-xs text-gray-500">{(iden.categories || []).length} categories</span>
                    </div>

                    <div className="px-4 py-4 space-y-3">
                      {(iden.categories || []).map((cat, cIdx) => (
                        <details key={`cat-${iIdx}-${cIdx}`} className="group border rounded-lg">
                          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={!!cat.id && categoryIds.includes(cat.id)}
                                onChange={() => cat.id && toggleCategory(cat.id)}
                                disabled={!cat.id}
                                title={cat.id ? "" : "Category not found in DB"}
                              />
                              <span className="font-medium">{cat.name}</span>
                            </div>
                            <span className="text-gray-400 group-open:rotate-180 transition">▾</span>
                          </summary>

                          <div className="px-4 pb-4 space-y-3">
                            {(cat.subcategories || []).map((sc, sIdx) => (
                              <div key={`sub-${iIdx}-${cIdx}-${sIdx}`} className="border rounded-lg p-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 text-brand-600"
                                    checked={!!sc.id && subcategoryIds.includes(sc.id)}
                                    onChange={() => sc.id && toggleSubcategory(sc.id)}
                                    disabled={!sc.id}
                                    title={sc.id ? "" : "Subcategory not found in DB"}
                                  />
                                  <span className="font-medium">{sc.name}</span>
                                </label>

                                {Array.isArray(sc.subsubs) && sc.subsubs.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {sc.subsubs.map((ss, ssIdx) => (
                                      <label
                                        key={`ss-${iIdx}-${cIdx}-${sIdx}-${ssIdx}`}
                                        className="inline-flex items-center gap-2 px-2 py-1 border rounded-full text-sm"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={!!ss.id && subsubCategoryIds.includes(ss.id)}
                                          onChange={() => ss.id && toggleSubsub(ss.id)}
                                          disabled={!ss.id}
                                          title={ss.id ? "" : "Level-3 not found in DB"}
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
            </div>

            {/* Footer */}
            <div className="mt-6 max-w-4xl mx-auto flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!canContinueStep1}
                className="rounded-xl bg-brand-700 text-white px-6 py-3 font-semibold disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </main>
        </>
      ) : (
        <>
          <Header
            icon={"🎯"}
            title="What are you looking for?"
            subtitle="Select at least 3 goals."
          />

          <main className="max-w-3xl mx-auto mt-6">
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h2 className="text-xl font-semibold mb-2">Your Goals</h2>
              <p className="text-sm text-gray-500 mb-4">Pick at least 3.</p>

              {goals.length === 0 ? (
                <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">Loading goals…</div>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {goals.map((g) => {
                    const isSelected = goalIds.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        onClick={() => toggleGoal(g.id)}
                        className={`rounded-xl border px-4 py-3 text-left hover:shadow-soft transition ${
                          isSelected ? "border-brand-700 ring-2 ring-brand-500" : "border-gray-200"
                        }`}
                        title={g.name}
                      >
                        <div className="font-medium">{g.name}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="rounded-xl border px-4 py-3"
              >
                Previous
              </button>
              <button
                onClick={onFinish}
                disabled={!canSave}
                className="rounded-xl bg-brand-700 text-white px-6 py-3 font-semibold disabled:opacity-50"
              >
                Save & Finish
              </button>
            </div>
          </main>
        </>
      )}
    </div>
  );
}
