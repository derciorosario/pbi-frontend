import React from 'react';

const UserGrowthChart = ({ data, loading = false, title = "User Growth" }) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="h-40 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="font-semibold mb-4">{title}</div>
        <div className="h-40 flex items-center justify-center text-gray-500">
          No growth data available
        </div>
      </div>
    );
  }

  // Calculate dimensions
  const maxUsers = Math.max(...data.map(d => d.users));
  const chartHeight = 160;
  const chartWidth = 400;
  const padding = 20;

  // Create points for the line
  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1)) * (chartWidth - 2 * padding);
    const y = chartHeight - padding - (point.users / maxUsers) * (chartHeight - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="font-semibold mb-4">{title}</div>
      <div className="relative">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-40">
          {/* Grid lines */}
          <line
            x1={padding}
            y1={chartHeight - padding}
            x2={chartWidth - padding}
            y2={chartHeight - padding}
            className="stroke-gray-200"
            strokeWidth="1"
          />

          {/* Growth line */}
          <polyline
            points={points}
            className="fill-none stroke-brand-500"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((point, index) => {
            const x = padding + (index / (data.length - 1)) * (chartWidth - 2 * padding);
            const y = chartHeight - padding - (point.users / maxUsers) * (chartHeight - 2 * padding);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                className="fill-brand-500 stroke-white"
                strokeWidth="2"
              />
            );
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-8">
          <span>{maxUsers}</span>
          <span>{Math.round(maxUsers / 2)}</span>
          <span>0</span>
        </div>

        {/* X-axis labels (show first, middle, last dates) */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{data[0]?.date}</span>
          <span>{data[Math.floor(data.length / 2)]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-bold text-brand-600">{data[data.length - 1]?.users || 0}</div>
          <div className="text-xs text-gray-500">Latest</div>
        </div>
        <div>
          <div className="text-lg font-bold text-green-600">
            {Math.max(...data.map(d => d.users))}
          </div>
          <div className="text-xs text-gray-500">Peak</div>
        </div>
        <div>
          <div className="text-lg font-bold text-blue-600">
            {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.users, 0) / data.length * 10) / 10 : 0}
          </div>
          <div className="text-xs text-gray-500">Daily Avg</div>
        </div>
      </div>
    </div>
  );
};

export default UserGrowthChart;