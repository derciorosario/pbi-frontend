import React from 'react';
import I from '../lib/icons';

function MobileFiltersButton({ onClick }) {
  return (
    <div className="md:hidden mb-4">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm"
      >
        <I.filter /> Filters
      </button>
    </div>
  );
}

export default MobileFiltersButton;