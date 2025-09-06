import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";

/**
 * TwoStepOnboarding.jsx
 * - Step 1: pick identities (multi)
 * - Step 2: pick categories/subcategories/level-3
 *   * Only categories are mandatory (≥1)
 *   * Level-3 shows ONLY if its parent subcategory is OPEN (chevron) OR SELECTED
 *   * Hides dropdown icons when there is no deeper level available
 */
export default function TwoStepOnboarding() {
  const nav = useNavigate();
  const userAuth = useAuth();

  // flow
  const [step, setStep] = useState(1);
  const progress = step === 1 ? 50 : 100;

  // data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [identities, setIdentities] = useState([]); // [{id?,name,categories:[...]}]

  // selections
  const [identityIds, setIdentityIds] = useState([]);
  const [categoryIds, setCategoryIds] = useState([]);
  const [subcategoryIds, setSubcategoryIds] = useState([]);
  const [subsubCategoryIds, setSubsubCategoryIds] = useState([]);

  // UI expand/collapse
  const [openCats, setOpenCats] = useState(() => new Set()); // Set<categoryId>
  const [openSubs, setOpenSubs] = useState(() => new Set()); // Set<subcategoryId>

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await client.get("/public/identities");
        setIdentities(Array.isArray(data?.identities) ? data.identities : []);
      } catch (e) {
        console.error(e);
        setError("Failed to load onboarding data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!userAuth.user && !userAuth?.loading) {
      nav("/login");
    }
  }, [userAuth.user, userAuth?.loading, nav]);

  const getIdentityKey = (iden) => iden.id || `name:${iden.name}`;

  // owners (for pruning on identity change)
  const catToIdentityKeys = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      const ik = getIdentityKey(iden);
      for (const c of iden.categories || []) {
        if (!c?.id) continue;
        m[c.id] = m[c.id] || new Set();
        m[c.id].add(ik);
      }
    }
    return m;
  }, [identities]);

  const subToIdentityKeys = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      const ik = getIdentityKey(iden);
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          if (!s?.id) continue;
          m[s.id] = m[s.id] || new Set();
          m[s.id].add(ik);
        }
      }
    }
    return m;
  }, [identities]);

  const subsubToIdentityKeys = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      const ik = getIdentityKey(iden);
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          for (const x of s.subsubs || []) {
            if (!x?.id) continue;
            m[x.id] = m[x.id] || new Set();
            m[x.id].add(ik);
          }
        }
      }
    }
    return m;
  }, [identities]);

  // relationships
  const subToCat = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          if (s?.id) m[s.id] = c.id;
        }
      }
    }
    return m;
  }, [identities]);

  const subsubToSub = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          for (const x of s.subsubs || []) {
            if (x?.id) m[x.id] = s.id;
          }
        }
      }
    }
    return m;
  }, [identities]);

  const catToAllSubIds = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      for (const c of iden.categories || []) {
        if (!c?.id) continue;
        const subs = (c.subcategories || []).map((s) => s.id).filter(Boolean);
        m[c.id] = Array.from(new Set([...(m[c.id] || []), ...subs]));
      }
    }
    return m;
  }, [identities]);

  const subToAllSubsubIds = useMemo(() => {
    const m = {};
    for (const iden of identities) {
      for (const c of iden.categories || []) {
        for (const s of c.subcategories || []) {
          if (!s?.id) continue;
          const subsubs = (s.subsubs || []).map((x) => x.id).filter(Boolean);
          m[s.id] = Array.from(new Set([...(m[s.id] || []), ...subsubs]));
        }
      }
    }
    return m;
  }, [identities]);

  // identity toggle + prune
  function toggleIdentity(identityKey) {
    setIdentityIds((prev) => {
      const picked = prev.includes(identityKey)
        ? prev.filter((x) => x !== identityKey)
        : [...prev, identityKey];

      const stillCovered = (ownersMap, id) => {
        const owners = ownersMap[id];
        if (!owners) return false;
        return picked.some((ik) => owners.has(ik));
      };

      setSubsubCategoryIds((prevX) => prevX.filter((xid) => stillCovered(subsubToIdentityKeys, xid)));
      setSubcategoryIds((prevSubs) => prevSubs.filter((sid) => stillCovered(subToIdentityKeys, sid)));
      setCategoryIds((prevCats) => prevCats.filter((cid) => stillCovered(catToIdentityKeys, cid)));

      // close cats no longer visible
      setOpenCats((prevOpen) => {
        const next = new Set([...prevOpen]);
        for (const cid of [...prevOpen]) {
          const owners = catToIdentityKeys[cid];
          if (!owners || !picked.some((ik) => owners.has(ik))) next.delete(cid);
        }
        return next;
      });

      // close subs no longer visible
      setOpenSubs((prevOpen) => {
        const next = new Set([...prevOpen]);
        for (const sid of [...prevOpen]) {
          const owners = subToIdentityKeys[sid];
          if (!owners || !picked.some((ik) => owners.has(ik))) next.delete(sid);
        }
        return next;
      });

      return picked;
    });
  }

  // category/sub/subsub toggles
  function toggleCategory(catId) {
    if (!catId) return;
    const has = categoryIds.includes(catId);
    if (has) {
      const subIds = catToAllSubIds[catId] || [];
      const xIds = subIds.flatMap((sid) => subToAllSubsubIds[sid] || []);
      setCategoryIds((prev) => prev.filter((x) => x !== catId));
      setSubcategoryIds((prev) => prev.filter((sid) => !subIds.includes(sid)));
      setSubsubCategoryIds((prev) => prev.filter((x) => !xIds.includes(x)));
      setOpenCats((prev) => {
        const next = new Set(prev);
        next.delete(catId);
        return next;
      });
      // also close all subs under this cat
      setOpenSubs((prev) => {
        const next = new Set(prev);
        for (const sid of subIds) next.delete(sid);
        return next;
      });
    } else {
      setCategoryIds((prev) => [...prev, catId]);
      setOpenCats((prev) => new Set(prev).add(catId)); // open the category; sub-sub lists remain closed
    }
  }

  function toggleSubcategory(subId) {
    if (!subId) return;
    const parentCatId = subToCat[subId];
    const has = subcategoryIds.includes(subId);
    if (has) {
      // remove sub + its subsubs; do not auto-unselect parent category
      const xIds = subToAllSubsubIds[subId] || [];
      setSubcategoryIds((prev) => prev.filter((x) => x !== subId));
      setSubsubCategoryIds((prev) => prev.filter((x) => !xIds.includes(x)));
      // close this sub's panel
      setOpenSubs((prev) => {
        const next = new Set(prev);
        next.delete(subId);
        return next;
      });
    } else {
      // add sub → ensure parent cat selected & open
      if (parentCatId && !categoryIds.includes(parentCatId)) {
        setCategoryIds((prev) => [...prev, parentCatId]);
      }
      if (parentCatId) {
        setOpenCats((prev) => new Set(prev).add(parentCatId));
      }
      setSubcategoryIds((prev) => [...prev, subId]);
      // NOTE: do NOT auto-open subsubs when selecting a sub; user can open with chevron
    }
  }

  function toggleSubsub(xId) {
    if (!xId) return;
    const parentSubId = subsubToSub[xId];
    const parentCatId = parentSubId ? subToCat[parentSubId] : null;
    const has = subsubCategoryIds.includes(xId);
    if (has) {
      setSubsubCategoryIds((prev) => prev.filter((x) => x !== xId));
    } else {
      // ensure parents selected
      if (parentSubId && !subcategoryIds.includes(parentSubId)) {
        setSubcategoryIds((prev) => [...prev, parentSubId]);
      }
      if (parentCatId && !categoryIds.includes(parentCatId)) {
        setCategoryIds((prev) => [...prev, parentCatId]);
      }
      // ensure cat open; sub open is optional (user may just select via chips)
      if (parentCatId) {
        setOpenCats((prev) => new Set(prev).add(parentCatId));
      }
      setSubsubCategoryIds((prev) => [...prev, xId]);
    }
  }

  // open/close handlers
  const handleDetailsToggle = (catId) => (e) => {
    const isOpen = e.currentTarget.open;
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (isOpen) next.add(catId);
      else next.delete(catId);
      return next;
    });
  };

  const toggleSubOpen = (subId) => {
    setOpenSubs((prev) => {
      const next = new Set(prev);
      if (next.has(subId)) next.delete(subId);
      else next.add(subId);
      return next;
    });
  };

  // helpers (hide dropdowns when there is no next level)
  const hasSubs = (cat) => Array.isArray(cat?.subcategories) && cat.subcategories.length > 0;
  const hasSubsubs = (sc) => Array.isArray(sc?.subsubs) && sc.subsubs.length > 0;

  // guards
  const canContinueStep1 = identityIds.length >= 1;
  const canFinish = categoryIds.length >= 1; // subcategories optional

  const selectedIdentities = useMemo(() => {
    const keys = new Set(identityIds);
    return identities.filter((iden) => keys.has(getIdentityKey(iden)));
  }, [identities, identityIds]);

  const Loading = () => (
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

  const Header = ({ icon, title, subtitle }) => (
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

  if (loading || !userAuth.user) return <Loading />;

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
      {/* STEP 1 */}
      {step === 1 && (
        <>
          <Header
            icon={"👥"}
            title="We need some information"
            subtitle="Help us connect you with the right opportunities."
          />

          <main className="max-w-3xl mx-auto mt-6">
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <p className="text-gray-500 mb-5">Choose the identities that best represent you.</p>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {identities.map((iden, i) => {
                  const key = getIdentityKey(iden);
                  const active = identityIds.includes(key);
                  return (
                    <button
                      key={`${i}-${iden.name}`}
                      onClick={() => toggleIdentity(key)}
                      className={`rounded-xl flex items-center justify-between border px-4 py-3 text-left hover:shadow-soft ${
                        active ? "border-brand-700 ring-2 ring-brand-500" : "border-gray-200"
                      }`}
                    >
                      <div>
                        <div className="font-medium">{iden.name}</div>
                        <div className="text-xs text-gray-500">
                          {(iden.categories || []).length} categories
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4 pointer-events-none"
                        checked={identityIds.includes(key)}
                        readOnly
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
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
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <>
          <Header
            icon={"🧩"}
            title="Choose Where You Belong"
            subtitle="Select the categories that best match your expertise and passion"
          />
          <main className="max-w-4xl mx-auto mt-6">
            <div className="bg-white rounded-2xl shadow-soft p-6">
              {selectedIdentities.length === 0 ? (
                <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">
                  Select at least one identity in Step 1 to see categories here.
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-4">Choose at least one to finish.</p>

                  <div className="space-y-4">
                    {selectedIdentities.map((iden, iIdx) => (
                      <div key={`iden-${iIdx}`} className="rounded-xl border">
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-t-xl">
                          <div className="font-semibold">{iden.name}</div>
                          <span className="text-xs text-gray-500">
                            {(iden.categories || []).length} categories
                          </span>
                        </div>

                        <div className="px-4 py-4 space-y-3">
                          {(iden.categories || []).map((cat, cIdx) => {
                            const _hasSubs = hasSubs(cat);

                            // If the category has NO subcategories, render a simple row (no dropdown icon)
                            if (!_hasSubs) {
                              return (
                                <div key={`cat-${iIdx}-${cIdx}`} className="border rounded-lg">
                                  <div className="flex items-center justify-between px-4 py-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4"
                                        checked={!!cat.id && categoryIds.includes(cat.id)}
                                        onChange={() => cat.id && toggleCategory(cat.id)}
                                        disabled={!cat.id}
                                        title={cat.id ? "" : "Category not found in DB"}
                                      />
                                      <span className="font-medium">{cat.name}</span>
                                    </label>
                                    {/* no chevron here because there is no next level */}
                                  </div>
                                </div>
                              );
                            }

                            // Category WITH subcategories → use details/summary and show chevron
                            return (
                              <details
                                key={`cat-${iIdx}-${cIdx}`}
                                className="group border rounded-lg"
                                open={!!cat.id && openCats.has(cat.id)}
                                onToggle={cat.id ? handleDetailsToggle(cat.id) : undefined}
                              >
                                <summary
                                  className={`flex items-center justify-between px-4 py-3 select-none ${
                                    _hasSubs ? "cursor-pointer" : "cursor-default"
                                  }`}
                                >
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

                                  {/* Show dropdown icon ONLY if there are subcategories */}
                                  {_hasSubs && (
                                    <span className="text-gray-400 group-open:rotate-180 transition">▾</span>
                                  )}
                                </summary>

                                <div className="px-4 pb-4 space-y-3">
                                  {(cat.subcategories || []).map((sc, sIdx) => {
                                    const _hasSubsubs = hasSubsubs(sc);
                                    const isOpen = !!sc.id && openSubs.has(sc.id);
                                    const isSelected = !!sc.id && subcategoryIds.includes(sc.id);

                                    return (
                                      <div key={`sub-${iIdx}-${cIdx}-${sIdx}`} className="border rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                          <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              className="h-4 w-4 text-brand-600"
                                              checked={isSelected}
                                              onChange={() => sc.id && toggleSubcategory(sc.id)}
                                              disabled={!sc.id}
                                              title={sc.id ? "" : "Subcategory not found in DB"}
                                            />
                                            <span className="font-medium">{sc.name}</span>
                                          </label>

                                          {/* Show chevron ONLY if there are level-3 items */}
                                          {_hasSubsubs && (
                                            <button
                                              type="button"
                                              onClick={() => sc.id && toggleSubOpen(sc.id)}
                                              className="text-gray-500 hover:text-gray-700"
                                              aria-label="Toggle level 3"
                                            >
                                              <span
                                                className={`inline-block transition-transform ${
                                                  isOpen ? "rotate-180" : ""
                                                }`}
                                              >
                                                ▾
                                              </span>
                                            </button>
                                          )}
                                        </div>

                                        {Array.isArray(sc.subsubs) &&
                                          sc.subsubs.length > 0 &&
                                          (isOpen || isSelected) && (
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
                                    );
                                  })}
                                </div>
                              </details>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(1)} className="rounded-xl border px-4 py-3">
                Previous
              </button>
              <button
                onClick={async () => {
                  if (!canFinish) return;
                  try {
                    await client.post("/onboarding/oneshot", {
                      identityIds,
                      categoryIds,
                      subcategoryIds,
                      subsubCategoryIds,
                    });
                    window.location.href = "/";
                  } catch (e) {
                    console.error(e);
                    alert("Failed to save. Please try again.");
                  }
                }}
                disabled={!canFinish}
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
