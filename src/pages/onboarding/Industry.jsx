import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import useOnboarding from "../../hooks/useOnboarding";

export default function Industry() {
  const nav = useNavigate();
  const { saveCategories, refresh, state } = useOnboarding();

  const [catsTree, setCatsTree] = useState([]);
  const [categoryIds, setCategoryIds] = useState([]);
  const [subcategoryIds, setSubcategoryIds] = useState([]);
  const [subsubCategoryIds, setSubsubCategoryIds] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        // Use your meta endpoint and merge identity categories + loose categories
        const { data } = await client.get("/feed/meta");
        const fromIdentities = (data.identities || []).flatMap((i) => i.categories || []);
        const loose = data.categoriesWithoutIdentity || [];
        const all = [...fromIdentities, ...loose].map((c) => ({
          id: c.id,
          name: c.name,
          subcategories: (c.subcategories || []).map((s) => ({
            id: s.id,
            name: s.name,
            subsubs: (s.subsubs || []).map((x) => ({ id: x.id, name: x.name })),
          })),
        }));
        setCatsTree(all);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const subToCat = useMemo(() => {
    const m = {};
    for (const c of catsTree) for (const s of c.subcategories || []) m[s.id] = c.id;
    return m;
  }, [catsTree]);

  const subsubToSub = useMemo(() => {
    const m = {};
    for (const c of catsTree) for (const s of c.subcategories || []) for (const x of s.subsubs || []) m[x.id] = s.id;
    return m;
  }, [catsTree]);

  function toggleSubcategory(subId) {
    const parentCatId = subToCat[subId];

    setSubcategoryIds((prev) => {
      const has = prev.includes(subId);
      const next = has ? prev.filter((id) => id !== subId) : [...prev, subId];

      // Ensure category selection consistency
      if (!has && parentCatId && !categoryIds.includes(parentCatId)) {
        setCategoryIds((cats) => (cats.includes(parentCatId) ? cats : [...cats, parentCatId]));
      }
      if (has && parentCatId) {
        const siblings = (catsTree.find((c) => c.id === parentCatId)?.subcategories || []).map((s) => s.id);
        const anySiblingSelected = next.some((sid) => siblings.includes(sid));
        if (!anySiblingSelected) {
          setCategoryIds((cats) => cats.filter((id) => id !== parentCatId));
        }
      }

      // Remove level-3 that belong to this sub
      setSubsubCategoryIds((curr) => curr.filter((xid) => subsubToSub[xid] !== subId));
      return next;
    });
  }

  function toggleSubsub(xId) {
    const parentSubId = subsubToSub[xId];
    const parentCatId = subToCat[parentSubId];

    setSubsubCategoryIds((prev) => {
      const has = prev.includes(xId);
      const next = has ? prev.filter((id) => id !== xId) : [...prev, xId];

      // ensure parent sub selected
      if (!has && parentSubId && !subcategoryIds.includes(parentSubId)) {
        setSubcategoryIds((subs) => (subs.includes(parentSubId) ? subs : [...subs, parentSubId]));
      }
      // ensure parent cat selected
      if (!has && parentCatId && !categoryIds.includes(parentCatId)) {
        setCategoryIds((cats) => (cats.includes(parentCatId) ? cats : [...cats, parentCatId]));
      }
      return next;
    });
  }

  const canContinue = categoryIds.length >= 1 && subcategoryIds.length >= 2;

  async function onContinue() {
    if (!canContinue) return;
    await saveCategories(categoryIds, subcategoryIds, subsubCategoryIds);
    await refresh();
    nav("/onboarding/goals");
  }

  if (catsTree.length === 0) {
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
        <div className="mx-auto h-12 w-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">🧩</div>
        <h1 className="mt-4 text-3xl font-bold">Your Industry</h1>
        <p className="text-gray-500">Select the categories that best describe your field.</p>
        <div className="mt-4 h-2 bg-gray-200 rounded">
          <div className="h-2 rounded bg-brand-700" style={{ width: `${Math.max(state?.progress ?? 66, 66)}%` }} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto mt-6">
        <div className="bg-white rounded-2xl shadow-soft p-2 sm:p-6">
          <p className="text-sm text-gray-500 mb-4">
            * Select at least <b>1 category</b> and <b>2 subcategories</b>. Level-3 is optional.
          </p>

          <div className="space-y-3">
            {catsTree.map((cat) => (
              <details key={cat.id} className="group border rounded-xl">
                <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={categoryIds.includes(cat.id)} readOnly className="hidden" />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <span className="text-gray-400 group-open:rotate-180 transition">▾</span>
                </summary>

                <div className="px-4 pb-4 space-y-3">
                  {cat.subcategories.map((sc) => (
                    <div key={sc.id} className="border rounded-lg p-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subcategoryIds.includes(sc.id)}
                          onChange={() => toggleSubcategory(sc.id)}
                          className="h-4 w-4 text-brand-600"
                        />
                        <span className="font-medium">{sc.name}</span>
                      </label>

                      {sc.subsubs?.length > 0 && subcategoryIds.includes(sc.id) && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {sc.subsubs.map((x) => (
                            <label key={x.id} className="inline-flex items-center gap-2 px-2 py-1 border rounded-full text-sm">
                              <input
                                type="checkbox"
                                checked={subsubCategoryIds.includes(x.id)}
                                onChange={() => toggleSubsub(x.id)}
                              />
                              <span>{x.name}</span>
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

        <div className="mt-6 flex justify-between">
          <button onClick={() => nav(-1)} className="rounded-xl border px-4 py-3">Previous</button>
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
