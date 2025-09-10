import React, { useState } from "react";
import { useEffect } from "react";

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

/**
 * AudienceTree Component
 * Hierarchical selection tree for identities -> categories -> subcategories -> subsubs
 *
 * @param {Object} props
 * @param {Array} props.tree - The hierarchical data structure
 * @param {Object} props.selected - Object with Sets for each selection type
 * @param {Function} props.onChange - Callback when selections change
 */
function AudienceTree({ tree, selected, onChange, shown=[] }) {
  const [open, setOpen] = useState({}); // collapse state by key id



  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const isChecked = (type, id) => selected[type].has(id);

  const setChecked = (type, id, value) => {
    const next = {
      identityIds: new Set(selected.identityIds),
      categoryIds: new Set(selected.categoryIds),
      subcategoryIds: new Set(selected.subcategoryIds),
      subsubCategoryIds: new Set(selected.subsubCategoryIds),
    };
    const bucket = next[type];
    if (value) bucket.add(id);
    else bucket.delete(id);
    onChange(next);
  };

  // When you check a category, auto-check its identity; when uncheck, also uncheck children
  const onCategoryCheck = (identityId, category) => (e) => {
    const checked = e.target.checked;
    const next = {
      identityIds: new Set(selected.identityIds),
      categoryIds: new Set(selected.categoryIds),
      subcategoryIds: new Set(selected.subcategoryIds),
      subsubCategoryIds: new Set(selected.subsubCategoryIds),
    };

    if (checked) {
      next.identityIds.add(identityId);
      next.categoryIds.add(category.id);
    } else {
      next.categoryIds.delete(category.id);
      // remove all subchildren of this category
      (category.subcategories || []).forEach((sc) => {
        next.subcategoryIds.delete(sc.id);
        (sc.subsubs || []).forEach((ss) => next.subsubCategoryIds.delete(ss.id));
      });
      // identity can remain if other categories under it are selected
    }
    onChange(next);
  };

  const onSubcategoryCheck = (identityId, categoryId, subcat) => (e) => {
    const checked = e.target.checked;
    const next = {
      identityIds: new Set(selected.identityIds),
      categoryIds: new Set(selected.categoryIds),
      subcategoryIds: new Set(selected.subcategoryIds),
      subsubCategoryIds: new Set(selected.subsubCategoryIds),
    };

    if (checked) {
      next.identityIds.add(identityId);
      next.categoryIds.add(categoryId);
      next.subcategoryIds.add(subcat.id);
    } else {
      next.subcategoryIds.delete(subcat.id);
      (subcat.subsubs || []).forEach((ss) => next.subsubCategoryIds.delete(ss.id));
    }
    onChange(next);
  };

  const onSubsubCheck = (identityId, categoryId, subcategoryId, ss) => (e) => {
    const checked = e.target.checked;
    const next = {
      identityIds: new Set(selected.identityIds),
      categoryIds: new Set(selected.categoryIds),
      subcategoryIds: new Set(selected.subcategoryIds),
      subsubCategoryIds: new Set(selected.subsubCategoryIds),
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

  // Prevent row toggle when clicking on inputs/labels inside the row
  const stop = (e) => e.stopPropagation();


  const clearAll = () => {
    onChange({
      identityIds: new Set(),
      categoryIds: new Set(),
      subcategoryIds: new Set(),
      subsubCategoryIds: new Set(),
    });
   
 };

 /*useEffect(() => {
  if (!shown?.length) return;

  for (const identity of tree) {
    if (shown.includes(identity.name)) {
      const iKey = `id-${(identity.id || identity.name)}`;
      const firstCat = (identity.categories || [])[0];
      const next = { [iKey]: true };

      if (firstCat) {
        const cKey = `cat-${firstCat.id}`;
        next[cKey] = !!firstCat.subcategories?.length;
      }

      setOpen(next); // clears everything else, opens just these
      break;
    }
  }
}, [shown, tree])*/



useEffect(() => {
  if (!shown?.length) return;

  const match = tree.find((identity) => shown.includes(identity.name));
  if (!match) return;

  const idKey = `id-${(match.id || match.name)}`;
  setOpen({ [idKey]: true }); // open identity only; clears others (cats/subcats stay closed)
  clearAll()
}, [shown, tree])

  return (
    <div className="rounded-xl border border-gray-200">
      <div className="flex justify-end p-2 border-b bg-white">
        <button
          type="button"
          onClick={clearAll}
          className="text-xs px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      {tree.map((identity) => {
        const identityId = identity.id || identity.name; // fallback stable key
        const idKey = `id-${identityId}`;
        const openId = !!open[idKey];
        const hasCategories = (identity.categories || []).length > 0;

        return (
          <div key={idKey} className={`border-b last:border-b-0 ${shown.length && !shown.includes(identity.name) ? 'hidden':''}`}> 
            <div
              role={hasCategories ? "button" : undefined}
              tabIndex={hasCategories ? 0 : -1}
              onClick={hasCategories ? () => toggle(idKey) : undefined}
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
                <span className="font-medium w-full flex flex-1">{identity.name}</span>
              </div>
              {hasCategories && (
                <span className="text-gray-500">{openId ? <Icons.caretUp /> : <Icons.caret />}</span>
              )}
            </div>

            {openId && hasCategories && (
              <div className="bg-gray-50/60 px-4 py-3 space-y-3">
                {(identity.categories || []).map((cat) => {
                  const cKey = `cat-${cat.id}`;
                  const openCat = !!open[cKey];
                  const hasSubs = (cat.subcategories || []).length > 0;

                  return (
                    <div key={cKey} className="rounded-lg border border-gray-200">
                      <div
                        className={`flex items-center justify-between px-3 py-2 bg-white ${
                          hasSubs ? "cursor-pointer" : ""
                        }`}
                        onClick={hasSubs ? () => toggle(cKey) : undefined}
                      >
                        <label className="flex items-center gap-2 w-full flex-1" onClick={stop}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-brand-600"
                            checked={isChecked("categoryIds", cat.id)}
                            onChange={onCategoryCheck(identityId, cat)}
                          />
                          <span className="text-sm font-medium w-full">{cat.name}</span>
                        </label>
                        {hasSubs && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(cKey);
                            }}
                            className="text-gray-500 hover:text-gray-700"
                            aria-label={openCat ? "Collapse" : "Expand"}
                          >
                            {openCat ? <Icons.caretUp /> : <Icons.caret />}
                          </button>
                        )}
                      </div>

                      {openCat && hasSubs && (
                        // SUBCATEGORY AREA — light blue background
                        <div className="px-3 py-2 space-y-2 bg-blue-50">
                          {(cat.subcategories || []).map((sc) => {
                            const scKey = `sc-${sc.id}`;
                            const openSc = !!open[scKey];
                            const hasSubsubs = (sc.subsubs || []).length > 0;

                            return (
                              <div key={scKey} className="border rounded-md overflow-hidden">
                                <div
                                  className={`flex items-center justify-between px-3 py-2 bg-white ${
                                    hasSubsubs ? "cursor-pointer" : ""
                                  }`}
                                  onClick={hasSubsubs ? () => toggle(scKey) : undefined}
                                >
                                  <label className="flex items-center gap-2" onClick={stop}>
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 accent-brand-600"
                                      checked={isChecked("subcategoryIds", sc.id)}
                                      onChange={onSubcategoryCheck(identityId, cat.id, sc)}
                                    />
                                    <span className="text-sm">{sc.name}</span>
                                  </label>

                                  {hasSubsubs && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggle(scKey);
                                      }}
                                      className="text-gray-500 hover:text-gray-700"
                                      aria-label={openSc ? "Collapse" : "Expand"}
                                    >
                                      {openSc ? <Icons.caretUp /> : <Icons.caret />}
                                    </button>
                                  )}
                                </div>

                                {openSc && hasSubsubs && (
                                  // SUB-SUBCATEGORY GRID — soft green background
                                  <div className="px-3 py-2 bg-emerald-50 grid gap-2">
                                    {sc.subsubs.map((ss) => (
                                      <label key={ss.id} className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          className="h-4 w-4 accent-brand-600"
                                          checked={isChecked("subsubCategoryIds", ss.id)}
                                          onChange={onSubsubCheck(identityId, cat.id, sc.id, ss)}
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
