import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

export default function PostTypeSelector({ isOpen, onClose, onTypeSelect, postTypes }) {
  const [showAll, setShowAll] = useState(false);
  
  if (!isOpen) return null;

  // Show only first 4 items initially, or all if showAll is true
  const displayedTypes = showAll ? postTypes : postTypes?.slice(0, 4);
  const hasMore = postTypes?.length > 4;
  const itemCount = displayedTypes?.length + (hasMore && !showAll ? 1 : 0);
  
  // Calculate grid columns based on item count for centering
  const getGridClasses = () => {
    if (itemCount <= 2) return 'grid-cols-2 max-w-md mx-auto';
    if (itemCount === 3) return 'grid-cols-3 max-w-2xl mx-auto';
    return 'grid-cols-2 sm:grid-cols-4';
  };

  return (
    <div className="fixed z-[99] inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white z-[99] w-full max-w-2xl mx-4 h-[80vh] rounded-2xl shadow-xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="bg-brand-500 p-4 flex justify-between items-center flex-shrink-0">
          <div className="text-white font-medium">Create Your Post</div>
          <button
            onClick={onClose}
            className="text-white hover:text-brand-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col">
          {/* Description Text - At the top */}
          <div className="text-center mb-8 mt-5">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              What would you like to share?
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Select an option below to get started.
            </p>
          </div>

          {/* Spacer to push buttons to bottom */}
          <div className="flex-1"></div>

          {/* Post Type Options - Centered based on count */}
          <div className={`grid ${getGridClasses()} gap-4`}>
            {displayedTypes?.map((postType, index) => (
              <button
                key={index}
                onClick={() => onTypeSelect(postType)}
                className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-all duration-200 text-center group hover:shadow-md"
              >
                {postType.Icon && (
                  <div className="p-3 rounded-lg bg-brand-100 group-hover:bg-brand-200 transition-colors">
                    <postType.Icon className="w-6 h-6 text-brand-600 group-hover:text-brand-700" />
                  </div>
                )}
                <span className="font-medium text-gray-900 text-sm leading-tight">
                  {postType.label}
                </span>
              </button>
            ))}
            
            {/* More Button - Only show if there are more items */}
            {hasMore && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-all duration-200 text-center group hover:shadow-md"
              >
                <div className="p-3 rounded-lg bg-gray-100 group-hover:bg-brand-200 transition-colors">
                  <ChevronDown className="w-6 h-6 text-gray-600 group-hover:text-brand-700" />
                </div>
                <span className="font-medium text-gray-900 text-sm leading-tight">
                  More
                </span>
              </button>
            )}

            {/* Show Less Button - When all items are shown */}
            {hasMore && showAll && (
              <button
                onClick={() => setShowAll(false)}
                className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-all duration-200 text-center group hover:shadow-md"
              >
                <div className="p-3 rounded-lg bg-gray-100 group-hover:bg-brand-200 transition-colors">
                  <ChevronUp className="w-6 h-6 text-gray-600 group-hover:text-brand-700" />
                </div>
                <span className="font-medium text-gray-900 text-sm leading-tight">
                  Show Less
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}