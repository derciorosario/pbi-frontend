import React from "react";
import styles from "../lib/styles.jsx";
import I from "../lib/icons.jsx";

export default function FiltersCard({
  query,
  setQuery,
  country,
  setCountry,
  city,
  setCity,
  categoryId,
  setCategoryId,
  subcategoryId,
  setSubcategoryId,
  categories = [],
  countries = [],
  onApply,
}) {
  const currentCategory = categories.find((c) => String(c.id) === String(categoryId));
  const visibleSubs = currentCategory?.subcategories || [];

  console.log({query})

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <h3 className="font-semibold flex items-center gap-2">Filters</h3>

      <div className="mt-3">
        <label className="text-xs text-gray-500">Search</label>
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
          <I.search />
          <input
            className="w-full text-sm outline-none"
            placeholder="Title, keywords, company..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="text-xs text-gray-500">Country</label>
        <select
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          value={country || ""}
          onChange={(e) => setCountry(e.target.value || undefined)}
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <label className="text-xs text-gray-500">City</label>
        <input
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          placeholder="City"
          value={city || ""}
          onChange={(e) => setCity(e.target.value || undefined)}
        />
      </div>

      <div className="mt-3">
        <label className="text-xs text-gray-500">Category</label>
        <select
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          value={categoryId || ""}
          onChange={(e) => {
            const val = e.target.value || "";
            setCategoryId(val || undefined);
            setSubcategoryId(undefined);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3">
        <label className="text-xs text-gray-500">Subcategory</label>
        <select
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          value={subcategoryId || ""}
          onChange={(e) => setSubcategoryId(e.target.value || undefined)}
          disabled={!categoryId}
        >
          <option value="">All subcategories</option>
          {visibleSubs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/**<button className={`mt-4 ${styles.primaryWide}`} onClick={onApply}>
        Apply Filters
      </button> */}
    </div>
  );
}
