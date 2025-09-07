import React, { useMemo } from "react";
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
  setRole,
  setGoalId,
  categories = [],
  countries = [],
  goals = [],
  goalId,
  role,
}) {
  const currentCategory = categories.find((c) => String(c.id) === String(categoryId));
  const visibleSubs = currentCategory?.subcategories || [];

  const roles = [
    "Entrepreneur","Seller","Buyer","Job Seeker","Professional","Partnership",
    "Investor","Event Organizer","Government Official","Traveler","NGO",
    "Support Role","Freelancer","Student"
  ];

  // whether there's anything to reset
  const hasActive = useMemo(
    () =>
      Boolean(
        (query && query.trim()) ||
          country ||
          city ||
          categoryId ||
          subcategoryId ||
          role ||
          goalId
      ),
    [query, country, city, categoryId, subcategoryId, role, goalId]
  );

  const handleReset = () => {
    setQuery("");
    setCountry(undefined);
    setCity(undefined);
    setCategoryId(undefined);
    setSubcategoryId(undefined);
    setRole?.(undefined);
    setGoalId?.(undefined);
  };

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">Filters</h3>

        <button
          type="button"
          onClick={handleReset}
          disabled={!hasActive}
          className={`inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition
            ${hasActive
              ? "border-gray-200 text-gray-700 hover:bg-gray-50"
              : "border-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          aria-disabled={!hasActive}
          title="Reset all filters"
        >
          Reset
        </button>
      </div>

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

      <div className="mt-3 hidden">
        <label className="text-xs text-gray-500">Goal</label>
        <select
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          value={goalId || ""}
          onChange={(e) => setGoalId(e.target.value || undefined)}
        >
          <option value="">All goals</option>
          {goals.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 hidden">
        <label className="text-xs text-gray-500">Role</label>
        <select
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          value={role || ""}
          onChange={(e) => setRole(e.target.value || undefined)}
        >
          <option value="">All roles</option>
          {roles.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
