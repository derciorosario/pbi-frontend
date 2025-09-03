import React from 'react';
import I from '../lib/icons';
import FiltersCard from './FiltersCard';

function MobileFiltersBottomSheet({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="Close filters"
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-auto rounded-t-2xl bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="font-semibold flex items-center gap-2">
            <I.filter /> Filters
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-gray-200"
            aria-label="Close"
          >
            <I.close />
          </button>
        </div>
        <div className="pt-3">
          <FiltersCard />
        </div>
      </div>
    </div>
  );
}

export default MobileFiltersBottomSheet;