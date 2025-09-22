import React from 'react';

const DashboardStatCard = ({
  title,
  value,
  delta,
  icon,
  tone = "gray",
  sub,
  loading = false
}) => {
  const toneMap = {
    gray: "bg-gray-50 text-gray-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    brand: "bg-brand-50 text-brand-700",
    blue: "bg-blue-50 text-blue-600",
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
        </div>
        <div className="mt-1 h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-24 mt-1"></div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{title}</div>
        <div className={`h-8 w-8 grid place-items-center rounded-md ${toneMap[tone]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {delta && <div className={`text-xs mt-1 ${toneMap[tone] || toneMap.gray}`}>{delta}</div>}
      {sub && <div className="text-[11px] text-gray-400 mt-1">{sub}</div>}
    </div>
  );
};

export default DashboardStatCard;