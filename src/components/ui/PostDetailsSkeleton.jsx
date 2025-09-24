// src/components/ui/PostDetailsSkeleton.jsx
import React from "react";

const PostDetailsSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Job Image Skeleton */}
      <div className="relative mb-6">
        <div className="w-full h-64 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg" />
      </div>

      {/* Job Header Skeleton */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-8 bg-gray-300 rounded mb-2 w-3/4" />
          <div className="h-6 bg-gray-200 rounded mb-3 w-1/2" />
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="w-4 h-4 bg-gray-200 rounded ml-2" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        </div>
        <div className="h-8 bg-gray-300 rounded w-24" />
      </div>

      {/* Job Type Chips Skeleton */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="h-6 bg-gray-200 rounded-full w-16" />
        <div className="h-6 bg-gray-200 rounded-full w-20" />
        <div className="h-6 bg-gray-200 rounded-full w-18" />
      </div>

      {/* Posted By Section Skeleton */}
      <div className="mt-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-gray-300 rounded" />
          <div className="h-4 bg-gray-300 rounded w-20" />
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded mb-1 w-32" />
            <div className="h-3 bg-gray-200 rounded w-20" />
          </div>
        </div>
      </div>

      {/* Description Section Skeleton */}
      <div className="mt-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-gray-300 rounded" />
          <div className="h-4 bg-gray-300 rounded w-24" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>

      {/* Job Details Section Skeleton */}
      <div className="mt-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 bg-gray-300 rounded" />
          <div className="h-4 bg-gray-300 rounded w-20" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col">
            <div className="h-3 bg-gray-200 rounded mb-1 w-16" />
            <div className="h-4 bg-gray-300 rounded w-20" />
          </div>
          <div className="flex flex-col">
            <div className="h-3 bg-gray-200 rounded mb-1 w-12" />
            <div className="h-4 bg-gray-300 rounded w-16" />
          </div>
          <div className="flex flex-col">
            <div className="h-3 bg-gray-200 rounded mb-1 w-24" />
            <div className="h-4 bg-gray-300 rounded w-28" />
          </div>
        </div>
      </div>

      {/* Required Skills Section Skeleton */}
      <div className="mt-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 bg-gray-300 rounded" />
          <div className="h-4 bg-gray-300 rounded w-24" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-200 rounded-full w-20" />
          <div className="h-6 bg-gray-200 rounded-full w-18" />
          <div className="h-6 bg-gray-200 rounded-full w-14" />
        </div>
      </div>

      {/* Benefits Section Skeleton */}
      <div className="mt-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-gray-300 rounded" />
          <div className="h-4 bg-gray-300 rounded w-16" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
      </div>

      {/* Categories Section Skeleton */}
      <div className="mt-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 bg-gray-300 rounded" />
          <div className="h-4 bg-gray-300 rounded w-20" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-200 rounded-full w-20" />
        </div>
      </div>

      {/* Target Audience Section Skeleton */}
      <div className="mt-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 bg-gray-300 rounded" />
          <div className="h-4 bg-gray-300 rounded w-28" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-18" />
          <div className="h-6 bg-gray-200 rounded-full w-24" />
          <div className="h-6 bg-gray-200 rounded-full w-16" />
        </div>
      </div>

      {/* How to Apply Section Skeleton */}
      <div className="mt-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-gray-300 rounded" />
          <div className="h-4 bg-gray-300 rounded w-24" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-4/5" />
        </div>
      </div>

      {/* Actions Section Skeleton */}
      <div className="flex gap-3 mt-6">
        <div className="flex-1 h-10 bg-gray-300 rounded-lg" />
        <div className="flex-1 h-10 bg-gray-300 rounded-lg" />
        <div className="flex-1 h-10 bg-gray-300 rounded-lg" />
      </div>
    </div>
  );
};

export default PostDetailsSkeleton;