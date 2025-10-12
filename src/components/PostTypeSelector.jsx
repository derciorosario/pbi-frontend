import React from 'react';
import { X } from 'lucide-react';

export default function PostTypeSelector({ isOpen, onClose, onTypeSelect, postTypes }) {
  if (!isOpen) return null;

  return (
    <div className="fixed z-[99] inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white z-[99] w-full max-w-md mx-4 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-brand-500 p-4 flex justify-between items-center">
          <div className="text-white font-medium">Choose Post Type</div>
          <button
            onClick={onClose}
            className="text-white hover:text-brand-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="space-y-2">
            {postTypes?.map((postType, index) => (
              <button
                key={index}
                onClick={() => onTypeSelect(postType)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-brand-200 hover:bg-gray-50 transition-colors text-left"
              >
                {postType.Icon && <postType.Icon className="w-5 h-5 text-brand-600" />}
                <span className="font-medium text-gray-900">{postType.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}