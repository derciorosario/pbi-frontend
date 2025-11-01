import React from "react";
import { Search } from "lucide-react";

const MobileSearchBar = ({ query, setQuery, placeholder = "Search...", onFilterClick }) => {
  return (
    <div className="flex items-center gap-2 lg:hidden">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
        />
      </div>

      {/* Filter Button */}
      {onFilterClick && (
        <button
          onClick={onFilterClick}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 text-gray-700 font-medium"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-sm">Filters</span>
        </button>
      )}
    </div>
  );
};

export default MobileSearchBar;