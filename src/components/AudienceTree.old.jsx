import React, { useEffect, useState } from "react";

// Icons for the component
const Icons = {
  caret: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 10l5 5 5-5z" />
    </svg>
  ),
  caretUp: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 14l5-5 5 5z" />
    </svg>
  ),
};

function AudienceTree({ tree, selected, onChange, shown = [], from }) {
  const [open, setOpen] = useState({}); // collapse state by key id

  // ---------- helpers ----------
  const stop = (e) => e.stopPropagation();
  const S = (v) => (v instanceof Set ? v : new Set(v || []));
  const isChecked = (type, id) => S(selected?.[type]).has(id);

  const clearAll = () => {
    onChange({
      identityIds: new Set(),
      categoryIds: new Set(),
      subcategoryIds: new Set(),
      subsubCategoryIds: new Set(),
    });
  };

  const setChecked = (type, id, value) => {
    const next = {
      identityIds: new Set(S(selected.identityIds)),
      categoryIds: new Set(S(selected.categoryIds)),
      subcategoryIds: new Set(S(selected.subcategoryIds)),
      subsubCategoryIds: new Set(S(selected.subsubCategoryIds)),
    };
    const bucket = next[type];
    if (value) bucket.add(id);
    else bucket.delete(id);
    onChange(next);
  };

  // Toggle: open only this CATEGORY within the same identity (close siblings & their open subcats)
  const onToggleCategory = (identity, cat) => {
    const identityId = identity.id || identity.name;
    const idKey = `id-${identityId}`;
    const cKey = `cat-${cat.id}`;

    setOpen((prev) => {
      const willOpen = !prev[cKey];
      const next = { ...prev };

      // keep identity open
      next[idKey] = true;

      // close all categories and subcategories under this identity
      (identity.categories || []).forEach((c) => {
        delete next[`cat-${c.id}`];
        (c.subcategories || []).forEach((sc) => {
          delete next[`sc-${sc.id}`];
        });
      });

      if (willOpen) next[cKey] = true;
      return next;
    });
  };

  // Toggle: open only this SUBCATEGORY within the same category (close sibling subcats)
  const onToggleSubcategory = (cat, sc) => {
    const scKey = `sc-${sc.id}`;
    setOpen((prev) => {
      const willOpen = !prev[scKey];
      const next = { ...prev };

      (cat.subcategories || []).forEach((s) => {
        delete next[`sc-${s.id}`];
      });

      if (willOpen) next[scKey] = true;
      return next;
    });
  };

  // ---------- counts (exclude the node itself) ----------
  // subcategory: count only selected sub-subs (children)
  const countSubcategorySelected = (sc) => {
    let count = 0;
    (sc.subsubs || []).forEach((ss) => {
      if (isChecked("subsubCategoryIds", ss.id)) count += 1;
    });
    return count;
  };

  // category: count selected subcategories + selected sub-subs (children & grandchildren)
  const countCategorySelected = (cat) => {
    let count = 0;
    (cat.subcategories || []).forEach((sc) => {
      if (isChecked("subcategoryIds", sc.id)) count += 1; // include selected subcategory
      count += countSubcategorySelected(sc); // plus its selected sub-subs
    });
    return count;
  };

  // identity: count selected categories + subcategories + sub-subs (all descendants)
  const countIdentitySelected = (identity) => {
    let count = 0;
    (identity.categories || []).forEach((cat) => {
      if (isChecked("categoryIds", cat.id)) count += 1; // include selected category
      (cat.subcategories || []).forEach((sc) => {
        if (isChecked("subcategoryIds", sc.id)) count += 1; // include selected subcategory
        count += countSubcategorySelected(sc); // plus selected sub-subs
      });
    });
    return count;
  };

  const CountPill = ({ count }) =>
    count > 0 ? (
      <span className="ml-2 inline-flex items-center rounded-full border border-gray-300 px-1.5 py-0.5 text-[10px] leading-none text-gray-600">
        {count}
      </span>
    ) : null;

  // ---------- initial opening & preselect (shown / from=people) ----------
  useEffect(() => {
    if (!shown?.length) return;

    const shownSet = new Set(shown.map((s) => String(s).trim().toLowerCase()));
    const match = tree.find((identity) =>
      shownSet.has(String(identity.name).trim().toLowerCase())
    );
    if (!match) return;

    const identityId = match.id ?? match.name;
    const idKey = `id-${identityId}`;

    // open only this identity
    setOpen({ [idKey]: true });

    // prepare fresh selection
    const next = {
      identityIds: new Set(),
      categoryIds: new Set(),
      subcategoryIds: new Set(),
      subsubCategoryIds: new Set(),
    };

    // if invoked from "people", auto-check just the identity
    if (String(from ?? "").toLowerCase() === "people") {
      next.identityIds.add(identityId);
    }

    onChange(next);
  }, [shown, tree, from]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- render ----------
  return (
    <div className="rounded-xl border border-gray-200">
      {!shown?.length && (
        <div className="flex justify-end p-2 border-b bg-white">
          <button
            type="button"
            onClick={clearAll}
            className="text-xs px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      )}

      {tree.map((identity) => {
        const identityId = identity.id || identity.name;
        const idKey = `id-${identityId}`;
        const openId = !!open[idKey];
        const hasCategories = (identity.categories || []).length > 0;
        const idCount = countIdentitySelected(identity);

        return (
          <div
            key={idKey}
            className={`border-b last:border-b-0 ${
              shown.length && !shown.includes(identity.name) ? "hidden" : ""
            }`}
          >
            <div
              role={hasCategories ? "button" : undefined}
              tabIndex={hasCategories ? 0 : -1}
              onClick={hasCategories ? () => setOpen((o) => ({ ...o, [idKey]: !o[idKey] })) : undefined}
              className={`w-full flex items-center justify-between px-3 py-2 ${
                hasCategories ? "hover:bg-gray-50 cursor-pointer" : ""
              }`}
            >
              <div className="flex items-center gap-2 flex-1 w-full">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-600"
                  checked={isChecked("identityIds", identityId)}
                  onChange={(e) => setChecked("identityIds", identityId, e.target.checked)}
                  onClick={stop}
                />
                <span className="font-medium w-full flex flex-1 items-center">
                  {identity.name}
                  <CountPill count={idCount} />
                </span>
              </div>
              {hasCategories && (
                <span className="text-gray-500">
                  {openId ? <Icons.caretUp /> : <Icons.caret />}
                </span>
              )}
            </div>

            {openId && hasCategories && (
              <div className="bg-gray-50/60 px-4 py-3 space-y-3">
                {(identity.categories || []).map((cat) => {
                  const cKey = `cat-${cat.id}`;
                  const openCat = !!open[cKey];
                  const hasSubs = (cat.subcategories || []).length > 0;
                  const catCount = countCategorySelected(cat);

                  return (
                    <div key={cKey} className="rounded-lg border border-gray-200">
                      <div
                        className={`flex items-center justify-between px-3 py-2 bg-white ${
                          hasSubs ? "cursor-pointer" : ""
                        }`}
                        onClick={hasSubs ? () => onToggleCategory(identity, cat) : undefined}
                      >
                        <label className="flex items-center gap-2 w-full flex-1" onClick={stop}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-brand-600"
                            checked={isChecked("categoryIds", cat.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              const checked = e.target.checked;
                              const next = {
                                identityIds: new Set(S(selected.identityIds)),
                                categoryIds: new Set(S(selected.categoryIds)),
                                subcategoryIds: new Set(S(selected.subcategoryIds)),
                                subsubCategoryIds: new Set(S(selected.subsubCategoryIds)),
                              };

                              if (checked) {
                                next.identityIds.add(identityId);
                                next.categoryIds.add(cat.id);
                              } else {
                                next.categoryIds.delete(cat.id);
                                (cat.subcategories || []).forEach((sc) => {
                                  next.subcategoryIds.delete(sc.id);
                                  (sc.subsubs || []).forEach((ss) =>
                                    next.subsubCategoryIds.delete(ss.id)
                                  );
                                });
                              }
                              onChange(next);
                            }}
                          />
                          <span className="text-sm font-medium w-full flex items-center">
                            {cat.name}
                            <CountPill count={catCount} />
                          </span>
                        </label>

                        {hasSubs && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleCategory(identity, cat);
                            }}
                            className="text-gray-500 hover:text-gray-700"
                            aria-label={openCat ? "Collapse" : "Expand"}
                          >
                            {openCat ? <Icons.caretUp /> : <Icons.caret />}
                          </button>
                        )}
                      </div>

                      {openCat && hasSubs && (
                        <div className="px-3 py-2 space-y-2 bg-blue-50">
                          {(cat.subcategories || []).map((sc) => {
                            const scKey = `sc-${sc.id}`;
                            const openSc = !!open[scKey];
                            const hasSubsubs = (sc.subsubs || []).length > 0;
                            const scCount = countSubcategorySelected(sc);

                            return (
                              <div key={scKey} className="border rounded-md overflow-hidden">
                                <div
                                  className={`flex items-center justify-between px-3 py-2 bg-white ${
                                    hasSubsubs ? "cursor-pointer" : ""
                                  }`}
                                  onClick={hasSubsubs ? () => onToggleSubcategory(cat, sc) : undefined}
                                >
                                  <label className="flex items-center gap-2" onClick={stop}>
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 accent-brand-600"
                                      checked={isChecked("subcategoryIds", sc.id)}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        const next = {
                                          identityIds: new Set(S(selected.identityIds)),
                                          categoryIds: new Set(S(selected.categoryIds)),
                                          subcategoryIds: new Set(S(selected.subcategoryIds)),
                                          subsubCategoryIds: new Set(S(selected.subsubCategoryIds)),
                                        };

                                        if (checked) {
                                          next.identityIds.add(identityId);
                                          next.categoryIds.add(cat.id);
                                          next.subcategoryIds.add(sc.id);
                                        } else {
                                          next.subcategoryIds.delete(sc.id);
                                          (sc.subsubs || []).forEach((ss) =>
                                            next.subsubCategoryIds.delete(ss.id)
                                          );
                                        }
                                        onChange(next);
                                      }}
                                    />
                                    <span className="text-sm flex items-center">
                                      {sc.name}
                                      <CountPill count={scCount} />
                                    </span>
                                  </label>

                                  {hasSubsubs && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleSubcategory(cat, sc);
                                      }}
                                      className="text-gray-500 hover:text-gray-700"
                                      aria-label={openSc ? "Collapse" : "Expand"}
                                    >
                                      {openSc ? <Icons.caretUp /> : <Icons.caret />}
                                    </button>
                                  )}
                                </div>

                                {openSc && hasSubsubs && (
                                  <div className="px-3 py-2 bg-emerald-50 grid gap-2">
                                    {sc.subsubs.map((ss) => (
                                      <label key={ss.id} className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          className="h-4 w-4 accent-brand-600"
                                          checked={isChecked("subsubCategoryIds", ss.id)}
                                          onChange={(e) => {
                                            const checked = e.target.checked;
                                            const next = {
                                              identityIds: new Set(S(selected.identityIds)),
                                              categoryIds: new Set(S(selected.categoryIds)),
                                              subcategoryIds: new Set(S(selected.subcategoryIds)),
                                              subsubCategoryIds: new Set(S(selected.subsubCategoryIds)),
                                            };
                                            if (checked) {
                                              next.identityIds.add(identityId);
                                              next.categoryIds.add(cat.id);
                                              next.subcategoryIds.add(sc.id);
                                              next.subsubCategoryIds.add(ss.id);
                                            } else {
                                              next.subsubCategoryIds.delete(ss.id);
                                            }
                                            onChange(next);
                                          }}
                                        />
                                        <span className="text-xs">{ss.name}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AudienceTree;
