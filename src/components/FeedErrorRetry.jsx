import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const FeedErrorRetry = ({ onRetry, message = "Failed to load feed. Please try again.", buttonText = "Try Again" }) => {
  return (
    <div className="min-h-[160px] flex items-center justify-center">
      <div className="text-center p-6 bg-white rounded-xl border border-gray-200 max-w-md w-full">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default FeedErrorRetry;