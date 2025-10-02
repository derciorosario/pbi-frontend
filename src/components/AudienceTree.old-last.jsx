import React, { useEffect, useState } from "react";

// Icons
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
  const [open, setOpen] = useState({}); // { 'id-..': bool, 'cat-..': bool, 'sc-..': bool }

  const selectAll = (select) => {
    const next = {
      identityIds: new Set(),
      categoryIds: new Set(),
      subcategoryIds: new Set(),
      subsubCategoryIds: new Set(),
    };

    if (select) {
      // Recursively add all items
      tree.forEach((identity) => {
        next.identityIds.add(identity.id);
        (identity.categories || []).forEach((cat) => {
          next.categoryIds.add(cat.id);
          (cat.subcategories || []).forEach((sc) => {
            next.subcategoryIds.add(sc.id);
            (sc.subsubs || []).forEach((ss) => {
              next.subsubCategoryIds.add(ss.id);
            });
          });
        });
      });
    }

    onChange(next);
  };

  // Check if everything is selected
  const isAllSelected = () => {
    if (!tree.length) return false;
    
    let totalItems = 0;
    let selectedItems = 0;

    tree.forEach((identity) => {
      totalItems++;
      if (S(selected.identityIds).has(identity.id)) selectedItems++;
      
      (identity.categories || []).forEach((cat) => {
        totalItems++;
        if (S(selected.categoryIds).has(cat.id)) selectedItems++;
        
        (cat.subcategories || []).forEach((sc) => {
          totalItems++;
          if (S(selected.subcategoryIds).has(sc.id)) selectedItems++;
          
          (sc.subsubs || []).forEach((ss) => {
            totalItems++;
            if (S(selected.subsubCategoryIds).has(ss.id)) selectedItems++;
          });
        });
      });
    });

    return totalItems > 0 && totalItems === selectedItems;
  };

  const isPartiallySelected = () => {
    if (!tree.length) return false;
    
    const totalSelected = 
      S(selected.identityIds).size +
      S(selected.categoryIds).size +
      S(selected.subcategoryIds).size +
      S(selected.subsubCategoryIds).size;
    
    return totalSelected > 0 && !isAllSelected();
  };

  // ----- Select All for Categories -----
  const selectAllCategories = (identityId, select) => {
    const next = {
      identityIds: new Set(S(selected.identityIds)),
      categoryIds: new Set(S(selected.categoryIds)),
      subcategoryIds: new Set(S(selected.subcategoryIds)),
      subsubCategoryIds: new Set(S(selected.subsubCategoryIds)),
    };

    const identity = tree.find(id => id.id === identityId);
    if (!identity) return;

    if (select) {
      next.identityIds.add(identityId);
      (identity.categories || []).forEach((cat) => {
        next.categoryIds.add(cat.id);
        (cat.subcategories || []).forEach((sc) => {
          next.subcategoryIds.add(sc.id);
          (sc.subsubs || []).forEach((ss) => {
            next.subsubCategoryIds.add(ss.id);
          });
        });
      });
    } else {
      (identity.categories || []).forEach((cat) => {
        next.categoryIds.delete(cat.id);
        (cat.subcategories || []).forEach((sc) => {
          next.subcategoryIds.delete(sc.id);
          (sc.subsubs || []).forEach((ss) => {
            next.subsubCategoryIds.delete(ss.id);
          });
        });
      });
    }

    onChange(next);
  };

  // ----- Select All for Subcategories -----
  const selectAllSubcategories = (identityId, categoryId, select) => {
    const next = {
      identityIds: new Set(S(selected.identityIds)),
      categoryIds: new Set(S(selected.categoryIds)),
      subcategoryIds: new Set(S(selected.subcategoryIds)),
      subsubCategoryIds: new Set(S(selected.subsubCategoryIds)),
    };

    const identity = tree.find(id => id.id === identityId);
    if (!identity) return;

    const category = identity.categories?.find(cat => cat.id === categoryId);
    if (!category) return;

    if (select) {
      next.identityIds.add(identityId);
      next.categoryIds.add(categoryId);
      (category.subcategories || []).forEach((sc) => {
        next.subcategoryIds.add(sc.id);
        (sc.subsubs || []).forEach((ss) => {
          next.subsubCategoryIds.add(ss.id);
        });
      });
    } else {
      (category.subcategories || []).forEach((sc) => {
        next.subcategoryIds.delete(sc.id);
        (sc.subsubs || []).forEach((ss) => {
          next.subsubCategoryIds.delete(ss.id);
        });
      });
    }

    onChange(next);
  };

  // ----- Select All for Subsubcategories -----
  const selectAllSubsubcategories = (identityId, categoryId, subcategoryId, select) => {
    const next = {
      identityIds: new Set(S(selected.identityIds)),
      categoryIds: new Set(S(selected.categoryIds)),
      subcategoryIds: new Set(S(selected.subcategoryIds)),
      subsubCategoryIds: new Set(S(selected.subsubCategoryIds)),
    };

    const identity = tree.find(id => id.id === identityId);
    if (!identity) return;

    const category = identity.categories?.find(cat => cat.id === categoryId);
    if (!category) return;

    const subcategory = category.subcategories?.find(sc => sc.id === subcategoryId);
    if (!subcategory) return;

    if (select) {
      next.identityIds.add(identityId);
      next.categoryIds.add(categoryId);
      next.subcategoryIds.add(subcategoryId);
      (subcategory.subsubs || []).forEach((ss) => {
        next.subsubCategoryIds.add(ss.id);
      });
    } else {
      (subcategory.subsubs || []).forEach((ss) => {
        next.subsubCategoryIds.delete(ss.id);
      });
    }

    onChange(next);
  };

  // ----- Check if all categories in identity are selected -----
  const areAllCategoriesSelected = (identityId) => {
    const identity = tree.find(id => id.id === identityId);
    if (!identity || !identity.categories?.length) return false;

    const selectedCatIds = S(selected.categoryIds);
    return identity.categories.every(cat => selectedCatIds.has(cat.id));
  };

  // ----- Check if all subcategories in category are selected -----
  const areAllSubcategoriesSelected = (identityId, categoryId) => {
    const identity = tree.find(id => id.id === identityId);
    if (!identity) return false;

    const category = identity.categories?.find(cat => cat.id === categoryId);
    if (!category || !category.subcategories?.length) return false;

    const selectedSubcatIds = S(selected.subcategoryIds);
    return category.subcategories.every(sc => selectedSubcatIds.has(sc.id));
  };

  // ----- Check if all subsubcategories in subcategory are selected -----
  const areAllSubsubcategoriesSelected = (identityId, categoryId, subcategoryId) => {
    const identity = tree.find(id => id.id === identityId);
    if (!identity) return false;

    const category = identity.categories?.find(cat => cat.id === categoryId);
    if (!category) return false;

    const subcategory = category.subcategories?.find(sc => sc.id === subcategoryId);
    if (!subcategory || !subcategory.subsubs?.length) return false;

    const selectedSubsubIds = S(selected.subsubCategoryIds);
    return subcategory.subsubs.every(ss => selectedSubsubIds.has(ss.id));
  };

  // ----- Check if partially selected for categories -----
  const areCategoriesPartiallySelected = (identityId) => {
    const identity = tree.find(id => id.id === identityId);
    if (!identity || !identity.categories?.length) return false;

    const selectedCatIds = S(selected.categoryIds);
    const selectedCount = identity.categories.filter(cat => selectedCatIds.has(cat.id)).length;
    
    return selectedCount > 0 && selectedCount < identity.categories.length;
  };

  // ----- Check if partially selected for subcategories -----
  const areSubcategoriesPartiallySelected = (identityId, categoryId) => {
    const identity = tree.find(id => id.id === identityId);
    if (!identity) return false;

    const category = identity.categories?.find(cat => cat.id === categoryId);
    if (!category || !category.subcategories?.length) return false;

    const selectedSubcatIds = S(selected.subcategoryIds);
    const selectedCount = category.subcategories.filter(sc => selectedSubcatIds.has(sc.id)).length;
    
    return selectedCount > 0 && selectedCount < category.subcategories.length;
  };

  // ----- Check if partially selected for subsubcategories -----
  const areSubsubcategoriesPartiallySelected = (identityId, categoryId, subcategoryId) => {
    const identity = tree.find(id => id.id === identityId);
    if (!identity) return false;

    const category = identity.categories?.find(cat => cat.id === categoryId);
    if (!category) return false;

    const subcategory = category.subcategories?.find(sc => sc.id === subcategoryId);
    if (!subcategory || !subcategory.subsubs?.length) return false;

    const selectedSubsubIds = S(selected.subsubCategoryIds);
    const selectedCount = subcategory.subsubs.filter(ss => selectedSubsubIds.has(ss.id)).length;
    
    return selectedCount > 0 && selectedCount < subcategory.subsubs.length;
  };

  // ----- utils -----
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

  // Exclusive open: category (closes siblings & their subcats)
  const onToggleCategory = (identity, cat) => {
    const identityId = identity.id;
    const idKey = `id-${identityId}`;
    const cKey = `cat-${cat.id}`;

    setOpen((prev) => {
      const willOpen = !prev[cKey];
      const next = { ...prev };

      // keep identity open
      next[idKey] = true;

      // close all categories + their subcats under this identity
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

  // Exclusive open: subcategory (closes sibling subcats)
  const onToggleSubcategory = (cat, sc) => {
    const scKey = `sc-${sc.id}`;
    setOpen((prev) => {
      const willOpen = !prev[scKey];
      const next = { ...prev };
      (cat.subcategories || []).forEach((s) => delete next[`sc-${s.id}`]);
      if (willOpen) next[scKey] = true;
      return next;
    });
  };

  // ----- selection handlers -----
  const onCategoryCheck = (identityId, cat) => (e) => {
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
        (sc.subsubs || []).forEach((ss) => next.subsubCategoryIds.delete(ss.id));
      });
    }
    onChange(next);
  };

  const onSubcategoryCheck = (identityId, categoryId, sc) => (e) => {
    const checked = e.target.checked;
    const next = {
      identityIds: new Set(S(selected.identityIds)),
      categoryIds: new Set(S(selected.categoryIds)),
      subcategoryIds: new Set(S(selected.subcategoryIds)),
      subsubCategoryIds: new Set(S(selected.subsubCategoryIds)),
    };

    if (checked) {
      next.identityIds.add(identityId);
      next.categoryIds.add(categoryId);
      next.subcategoryIds.add(sc.id);
    } else {
      next.subcategoryIds.delete(sc.id);
      (sc.subsubs || []).forEach((ss) => next.subsubCategoryIds.delete(ss.id));
    }
    onChange(next);
  };

  const onSubsubCheck = (identityId, categoryId, subcategoryId, ss) => (e) => {
    const checked = e.target.checked;
    const next = {
      identityIds: new Set(S(selected.identityIds)),
      categoryIds: new Set(S(selected.categoryIds)),
      subcategoryIds: new Set(S(selected.subcategoryIds)),
      subsubCategoryIds: new Set(S(selected.subsubCategoryIds)),
    };
    if (checked) {
      next.identityIds.add(identityId);
      next.categoryIds.add(categoryId);
      next.subcategoryIds.add(subcategoryId);
      next.subsubCategoryIds.add(ss.id);
    } else {
      next.subsubCategoryIds.delete(ss.id);
    }
    onChange(next);
  };

  // ----- counters (IMMEDIATE children only) -----
  const countIdentityImmediate = (identity) => {
    const catIds = S(selected.categoryIds);
    let count = 0;
    (identity.categories || []).forEach((c) => {
      if (catIds.has(c.id)) count += 1; // only categories directly under identity
    });
    return count;
  };

  const countCategoryImmediate = (cat) => {
    const scIds = S(selected.subcategoryIds);
    let count = 0;
    (cat.subcategories || []).forEach((sc) => {
      if (scIds.has(sc.id)) count += 1; // only subcategories directly under category
    });
    return count;
  };

  const countSubcategoryImmediate = (sc) => {
    const ssIds = S(selected.subsubCategoryIds);
    let count = 0;
    (sc.subsubs || []).forEach((ss) => {
      if (ssIds.has(ss.id)) count += 1; // only sub-subs directly under subcategory
    });
    return count;
  };

  const CountPill = ({ count }) =>
    count > 0 ? (
      <span className="ml-2 inline-flex items-center rounded-full border border-gray-200 bg-brand-50 px-1.5 py-0.5 text-[10px] leading-none text-brand-600">
        {count}
      </span>
    ) : null;

  // ----- initial open & optional preselect (from=people) -----
  useEffect(() => {
    if (!shown?.length) return;

    // If there are shown filters, open all identities
    const allOpen = {};
    tree.forEach((identity) => {
      const identityId = identity.id;
      const idKey = `id-${identityId}`;
      allOpen[idKey] = true;
    });

    console.log({allOpen})
    setOpen(allOpen);

    // fresh selection
    const next = {
      identityIds: new Set(),
      categoryIds: new Set(),
      subcategoryIds: new Set(),
      subsubCategoryIds: new Set(),
    };

    onChange(next);
  }, [shown, tree, from]); // eslint-disable-line react-hooks/exhaustive-deps

  // ----- render -----
  return (
    <div className="rounded-xl border border-gray-200">
      
       {!shown?.length && (
        <div className="flex justify-between items-center p-2 border-b bg-white">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brand-600"
              checked={isAllSelected()}
              ref={(input) => {
                if (input) {
                  input.indeterminate = isPartiallySelected();
                }
              }}
              onChange={(e) => selectAll(e.target.checked)}
            />
            <span className="text-sm text-gray-700 font-medium">
              {isAllSelected() ? 'Deselect All' : 'Select All'}
            </span>
          </label>
          
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
        const identityId = identity.id;
        const idKey = `id-${identityId}`;
        const openId = !!open[idKey];
        const hasCategories = (identity.categories || []).length > 0;
        const idCount = countIdentityImmediate(identity);

        return (
          <div
            key={idKey}
           
            className={`border-b last:border-b-0 ${
              shown.length && !shown.some(s => s.toLowerCase() === identity.name.toLowerCase() || identity.name.toLowerCase() === s.toLowerCase()) ? "hidden" : ""
            }`}

          >
            <div
              role={hasCategories ? "button" : undefined}
              tabIndex={hasCategories ? 0 : -1}
              onClick={
                hasCategories ? () => setOpen((o) => ({ ...o, [idKey]: !o[idKey] })) : undefined
              }
              className={`w-full flex items-center justify-between px-3 py-2 ${
                hasCategories ? "hover:bg-gray-50 cursor-pointer" : ""
              }`}
            >
                 <div className={`flex items-center ${openId ? 'bg-brand-50':''}  gap-2 flex-1 min-w-0 px-5 rounded-full py-1.5 border border-gray-200`}>
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-600 shrink-0"
                checked={isChecked("identityIds", identityId)}
                onChange={(e) => setChecked("identityIds", identityId, e.target.checked)}
                onClick={stop}
              />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span title={identity.name} className="font-medium text-brand-600 truncate min-w-0">
                  {identity.name}
                </span>
                <CountPill count={idCount} />
              </div>
              
              {hasCategories && (
                <span className="text-gray-500">{openId ? <Icons.caretUp /> : <Icons.caret />}</span>
              )}
            </div>
            
            </div>

            <div className={`${shown.length ? '':'px-4'}`}>
               {openId && hasCategories && (
              <div className="bg-slate-50/80 px-4 py-3 space-y-3">
                {/* Select All for Categories */}
                {identity.categories && identity.categories.length > 0 && (
                  <div className="flex justify-between items-center px-3 py-2 bg-slate-200 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-brand-600"
                        checked={areAllCategoriesSelected(identityId)}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate = areCategoriesPartiallySelected(identityId);
                          }
                        }}
                        onChange={(e) => selectAllCategories(identityId, e.target.checked)}
                      />
                      <span className="text-sm font-medium text-slate-800">
                        {areAllCategoriesSelected(identityId) ? 'Deselect All Categories' : 'Select All Categories'}
                      </span>
                    </label>
                  </div>
                )}

                {(identity.categories || []).map((cat) => {
                  const cKey = `cat-${cat.id}`;
                  const openCat = !!open[cKey];
                  const hasSubs = (cat.subcategories || []).length > 0;
                  const catCount = countCategoryImmediate(cat);

                  return (
                    <div key={cKey} className="rounded-lg border border-slate-200">
                      <div
                        className={`flex items-center justify-between px-3 py-2 bg-slate-100 ${
                          hasSubs ? "cursor-pointer hover:bg-slate-100/80" : ""
                        }`}
                        onClick={hasSubs ? () => onToggleCategory(identity, cat) : undefined}
                      >
                        <label className="flex items-center gap-2 w-full flex-1" onClick={stop}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-brand-600"
                            checked={isChecked("categoryIds", cat.id)}
                            onChange={onCategoryCheck(identityId, cat)}
                          />
                          <span className="text-sm font-medium text-slate-800 w-full flex items-center">
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
                            className="text-slate-600 hover:text-slate-800"
                            aria-label={openCat ? "Collapse" : "Expand"}
                          >
                            {openCat ? <Icons.caretUp /> : <Icons.caret />}
                          </button>
                        )}
                      </div>

                      {openCat && hasSubs && (
                        <div className="px-3 py-2 space-y-2 bg-sky-50 border-l-2 border-sky-200">
                          {/* Select All for Subcategories */}
                          {cat.subcategories && cat.subcategories.length > 0 && (
                            <div className="flex justify-between items-center px-3 py-2 bg-sky-100 rounded-md">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 accent-brand-600"
                                  checked={areAllSubcategoriesSelected(identityId, cat.id)}
                                  ref={(input) => {
                                    if (input) {
                                      input.indeterminate = areSubcategoriesPartiallySelected(identityId, cat.id);
                                    }
                                  }}
                                  onChange={(e) => selectAllSubcategories(identityId, cat.id, e.target.checked)}
                                />
                                <span className="text-sm font-medium text-sky-900">
                                  {areAllSubcategoriesSelected(identityId, cat.id) ? 'Deselect All Subcategories' : 'Select All Subcategories'}
                                </span>
                              </label>
                            </div>
                          )}

                          {(cat.subcategories || []).map((sc) => {
                            const scKey = `sc-${sc.id}`;
                            const openSc = !!open[scKey];
                            const hasSubsubs = (sc.subsubs || []).length > 0;
                            const scCount = countSubcategoryImmediate(sc);

                            return (
                              <div key={scKey} className="border border-slate-200 rounded-md overflow-hidden">
                                <div
                                  className={`flex items-center justify-between px-3 py-2 bg-brand-50 ${
                                    hasSubsubs ? "cursor-pointer" : ""
                                  }`}
                                  onClick={hasSubsubs ? () => onToggleSubcategory(cat, sc) : undefined}
                                >
                                  <label className="flex items-center gap-2" onClick={stop}>
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 accent-brand-600"
                                      checked={isChecked("subcategoryIds", sc.id)}
                                      onChange={onSubcategoryCheck(identityId, cat.id, sc)}
                                    />
                                    <span className="text-sm font-medium text-sky-900 flex items-center">
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
                                      className="text-sky-700 hover:text-sky-900"
                                      aria-label={openSc ? "Collapse" : "Expand"}
                                    >
                                      {openSc ? <Icons.caretUp /> : <Icons.caret />}
                                    </button>
                                  )}
                                </div>

                                {openSc && hasSubsubs && (
                                  <div className="px-3 py-2 bg-[#f0f9ff] border-l-2 border-sky-200 grid gap-2">
                                    {/* Select All for Subsubcategories */}
                                    {sc.subsubs && sc.subsubs.length > 0 && (
                                      <div className="flex justify-between items-center px-3 py-2 bg-indigo-100 rounded-sm">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            className="h-4 w-4 accent-brand-600"
                                            checked={areAllSubsubcategoriesSelected(identityId, cat.id, sc.id)}
                                            ref={(input) => {
                                              if (input) {
                                                input.indeterminate = areSubsubcategoriesPartiallySelected(identityId, cat.id, sc.id);
                                              }
                                            }}
                                            onChange={(e) => selectAllSubsubcategories(identityId, cat.id, sc.id, e.target.checked)}
                                          />
                                          <span className="text-xs font-medium text-indigo-900">
                                            {areAllSubsubcategoriesSelected(identityId, cat.id, sc.id) ? 'Deselect All Subsubcategories' : 'Select All Subsubcategories'}
                                          </span>
                                        </label>
                                      </div>
                                    )}

                                    {sc.subsubs.map((ss) => (
                                      <label key={ss.id} className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          className="h-4 w-4 accent-brand-600"
                                          checked={isChecked("subsubCategoryIds", ss.id)}
                                          onChange={onSubsubCheck(identityId, cat.id, sc.id, ss)}
                                        />
                                        <span className="text-xs text-indigo-950/90">{ss.name}</span>
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
          </div>
        );
      })}
    </div>
  );
}

export default AudienceTree;