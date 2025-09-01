// src/components/feed/FeedFiltersCard.jsx
import I from "../ui/UiIcons";

const industries = ["Technology","Finance","Education","Agriculture","Healthcare"];
const kinds = ["Jobs","Partnerships","Investment","Events"];

export default function FeedFiltersCard() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2">
        <I.filter />
        <h3 className="font-semibold">Filters</h3>
      </div>

      <div className="mt-4">
        <label className="text-xs text-gray-500">Search</label>
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
          <I.search />
          <input className="w-full text-sm outline-none" placeholder="Search skills, location, interest…" />
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs text-gray-500">Location</label>
        <select className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
          <option>Select a location</option>
          <option>Accra</option>
          <option>Luanda</option>
          <option>Lagos</option>
          <option>Nairobi</option>
        </select>
      </div>

      <div className="mt-4">
        <label className="text-xs text-gray-500">Industry</label>
        <select className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
          <option>Select an industry</option>
          {industries.map((i) => <option key={i}>{i}</option>)}
        </select>
      </div>

      <div className="mt-4">
        <label className="text-xs text-gray-500">Category</label>
        <select className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
          <option>Select a category</option>
          {kinds.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <button
        className="mt-5 w-full rounded-xl py-2.5 font-semibold text-white"
        style={{ background: "linear-gradient(135deg,#8A358A,#9333EA)" }}
      >
        Apply Filters
      </button>
    </div>
  );
}
