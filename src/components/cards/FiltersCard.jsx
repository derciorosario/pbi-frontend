// src/components/cards/FiltersCard.jsx
import React from "react";
import { styles } from "../ui/UiStyles";
import I from "../ui/UiIcons";

export default function FiltersCard() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <h3 className="font-semibold flex items-center gap-2">Filters</h3>
      <div className="mt-3">
        <label className="text-xs text-gray-500">Search People</label>
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
          <I.search />
          <input className="w-full text-sm outline-none" placeholder="Name, title, skills..." />
        </div>
      </div>
      <div className="mt-3">
        <label className="text-xs text-gray-500">Location</label>
        <select className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
          <option>Select location</option>
          <option>Lagos</option>
          <option>Accra</option>
          <option>Luanda</option>
        </select>
      </div>
      <button className={`mt-4 ${styles.primaryWide}`}>Apply Filters</button>
    </div>
  );
}
