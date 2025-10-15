import React from 'react';

const CompanySkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Skeleton Card 1 */}
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="flex items-start gap-4">
            {/* Logo skeleton */}
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
            
            <div className="flex-1">
              {/* Title skeleton */}
              <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
              
              {/* Description skeleton */}
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              
              {/* Button skeleton */}
              <div className="h-10 bg-gray-200 rounded w-24 mt-4"></div>
            </div>
            
            {/* Location skeleton */}
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>

        {/* Skeleton Card 2 */}
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="flex items-start gap-4">
            {/* Logo skeleton */}
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
            
            <div className="flex-1">
              {/* Title skeleton */}
              <div className="h-6 bg-gray-200 rounded w-40 mb-3"></div>
              
              {/* Description skeleton - multiple lines */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
              
              {/* Button skeleton */}
              <div className="h-10 bg-gray-200 rounded w-24 mt-4"></div>
            </div>
            
            {/* Location skeleton */}
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>

        {/* Skeleton Card 3 */}
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="flex items-start gap-4">
            {/* Logo skeleton */}
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
            
            <div className="flex-1">
              {/* Title skeleton */}
              <div className="h-6 bg-gray-200 rounded w-36 mb-3"></div>
              
              {/* Description skeleton */}
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              
              {/* Button skeleton */}
              <div className="h-10 bg-gray-200 rounded w-24 mt-4"></div>
            </div>
            
            {/* Location skeleton */}
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySkeletonLoader;