import React from 'react';
import styles from '../lib/styles.jsx';
import I from '../lib/icons.jsx';

function FiltersCard() {
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
          <option>Nairobi</option>
        </select>
      </div>

      <div className="mt-3">
        <label className="text-xs text-gray-500">Industry</label>
        <select className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
          <option>Select industry</option>
          <option>Fintech</option>
          <option>Agriculture</option>
          <option>Education</option>
          <option>Healthcare</option>
        </select>
      </div>

      <div className="mt-3">
        <label className="text-xs text-gray-500">Experience</label>
        <select className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
          <option>Select experience</option>
          <option>0–2 yrs</option>
          <option>3–5 yrs</option>
          <option>6–10 yrs</option>
          <option>10+ yrs</option>
        </select>
      </div>

      <button className={`mt-4 ${styles.primaryWide}`}>Apply Filters</button>
    </div>
  );
}

export default FiltersCard;