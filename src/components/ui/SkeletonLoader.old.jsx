// src/components/CardSkeleton.jsx
import React from "react";

// Individual skeleton card component
const CardSkeleton = () => {
  return (
    <div className="group relative rounded-[15px] border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col animate-pulse">
      {/* Product image skeleton */}
      <div className="relative overflow-hidden">
        <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300" />
        
        {/* Featured badge skeleton */}
        <div className="absolute top-4 left-4">
          <div className="w-20 h-6 bg-gray-300 rounded-full" />
        </div>

        {/* Action buttons skeleton */}
        <div className="absolute top-4 right-4 flex gap-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full" />
          <div className="w-8 h-8 bg-gray-300 rounded-full" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title and description skeleton */}
        <div className="mb-3">
          <div className="h-6 bg-gray-300 rounded mb-2 w-3/4" />
          <div className="h-4 bg-gray-200 rounded mb-1 w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>

        {/* Price skeleton */}
        <div className="mb-3">
          <div className="h-8 bg-gray-300 rounded w-1/3" />
        </div>

        {/* Meta info skeleton */}
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gray-300 rounded-full" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
            <div className="h-5 bg-gray-200 rounded w-20" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="h-3 bg-gray-200 rounded w-12" />
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
        </div>

        {/* Tags skeleton */}
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-200 rounded-full w-12" />
        </div>

        {/* Action buttons skeleton */}
        <div className="flex items-center gap-2 mt-auto pt-2">
          <div className="h-10 w-10 bg-gray-300 rounded-xl flex-shrink-0" />
          <div className="flex-1 h-10 bg-gray-300 rounded-xl" />
          <div className="h-10 w-20 bg-gray-300 rounded-xl" />
        </div>
      </div>

      {/* Bottom gradient skeleton */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50" />
    </div>
  );
};

// Main skeleton loader component with column support
export default function CardSkeletonLoader({ 
  columns = 3, 
  count = 6,
  className = ""
}) {
  // Generate array of skeleton cards
  const skeletonCards = Array.from({ length: count }, (_, index) => (
    <CardSkeleton key={index} />
  ));

  // Generate grid classes based on column count
  const getGridClasses = () => {
    const gridClasses = {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
      6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
    };
    
    return gridClasses[columns] || gridClasses[3];
  };

  return (
    <div className={`grid ${getGridClasses()} gap-6 ${className}`}>
      {skeletonCards}
    </div>
  );
}

// Alternative compact skeleton version (optional)
export const CompactCardSkeleton = ({ columns = 3, count = 6 }) => {
  const skeletonCards = Array.from({ length: count }, (_, index) => (
    <div key={index} className="rounded-[15px] border border-gray-100 bg-white shadow-sm overflow-hidden animate-pulse">
      {/* Image */}
      <div className="w-full h-32 bg-gray-200" />
      
      {/* Content */}
      <div className="p-3">
        <div className="h-4 bg-gray-300 rounded mb-2 w-3/4" />
        <div className="h-6 bg-gray-300 rounded mb-2 w-1/2" />
        <div className="flex gap-2 mb-3">
          <div className="w-6 h-6 bg-gray-300 rounded-full" />
          <div className="h-3 bg-gray-200 rounded flex-1" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 bg-gray-300 rounded flex-1" />
          <div className="h-8 w-16 bg-gray-300 rounded" />
        </div>
      </div>
    </div>
  ));

  const getGridClasses = () => {
    const gridClasses = {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
      6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
    };
    
    return gridClasses[columns] || gridClasses[3];
  };

  return (
    <div className={`grid ${getGridClasses()} gap-4`}>
      {skeletonCards}
    </div>
  );
};