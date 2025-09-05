import React, { useState } from "react";

// Icons for the component
const Icons = {
  caret: () => (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>),
  caretUp: () => (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>),
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
function AudienceTree({ tree, selected, onChange }) {
  const [open, setOpen] = useState({}); // collapse state by key id

  const toggle = (k) => setOpen(o => ({ ...o, [k]: !o[k] }));

  const isChecked = (type, id) => selected[type].has(id);
  const setChecked = (type, id, value) => {
    const next = {
      identityIds: new Set(selected.identityIds),
      categoryIds: new Set(selected.categoryIds),
      subcategoryIds: new Set(selected.subcategoryIds),
      subsubCategoryIds: new Set(selected.subsubCategoryIds),
    };
    const bucket = next[type];
    if (value) bucket.add(id); else bucket.delete(id);
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
      (category.subcategories || []).forEach(sc => {
        next.subcategoryIds.delete(sc.id);
        (sc.subsubs || []).forEach(ss => next.subsubCategoryIds.delete(ss.id));
      });
      // keep identity if other categories remain under it
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
      (subcat.subsubs || []).forEach(ss => next.subsubCategoryIds.delete(ss.id));
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

  return (
    <div className="rounded-xl border border-gray-200">
      {tree.map((identity) => {
        // NOTE: identity.id should exist on API; if not, you can synthesize a stable key from the name.
        const identityId = identity.id || identity.name; 
        const idKey = `id-${identityId}`;
        const openId = !!open[idKey];

        return (
          <div key={idKey} className="border-b last:border-b-0">
            <button
              type="button"
              onClick={() => toggle(idKey)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-600"
                  checked={isChecked("identityIds", identityId)}
                  onChange={e => setChecked("identityIds", identityId, e.target.checked)}
                />
                <span className="font-medium">{identity.name}</span>
              </div>
              <span className="text-gray-500">{openId ? <Icons.caretUp/> : <Icons.caret/>}</span>
            </button>

            {openId && (
              <div className="bg-gray-50/60 px-4 py-3 space-y-3">
                {(identity.categories || []).map((cat) => {
                  const cKey = `cat-${cat.id}`;
                  const openCat = !!open[cKey];
                  return (
                    <div key={cKey} className="rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between px-3 py-2 bg-white">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-brand-600"
                            checked={isChecked("categoryIds", cat.id)}
                            onChange={onCategoryCheck(identityId, cat)}
                          />
                          <span className="text-sm font-medium">{cat.name}</span>
                        </label>
                        <button type="button" onClick={() => toggle(cKey)} className="text-gray-500 hover:text-gray-700">
                          {openCat ? <Icons.caretUp/> : <Icons.caret/>}
                        </button>
                      </div>

                      {openCat && (
                        <div className="px-3 py-2 space-y-2 bg-gray-50">
                          {(cat.subcategories || []).map((sc) => {
                            const scKey = `sc-${sc.id}`;
                            const openSc = !!open[scKey];
                            return (
                              <div key={scKey} className="border rounded-md">
                                <div className="flex items-center justify-between px-3 py-2 bg-white">
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 accent-brand-600"
                                      checked={isChecked("subcategoryIds", sc.id)}
                                      onChange={onSubcategoryCheck(identityId, cat.id, sc)}
                                    />
                                    <span className="text-sm">{sc.name}</span>
                                  </label>
                                  <button type="button" onClick={() => toggle(scKey)} className="text-gray-500 hover:text-gray-700">
                                    {openSc ? <Icons.caretUp/> : <Icons.caret/>}
                                  </button>
                                </div>

                                {openSc && (sc.subsubs?.length > 0) && (
                                  <div className="px-3 py-2 bg-gray-50 grid sm:grid-cols-2 gap-2">
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