import React from 'react';

const ContentDistributionChart = ({ data, loading = false, title = "Content Distribution" }) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
        <div className="flex items-center gap-6">
          <div className="w-36 h-36 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 w-3 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate percentages and prepare data
  const total = Object.values(data || {}).reduce((sum, value) => sum + (value || 0), 0);

  const chartData = [
    { label: 'Jobs', value: data?.jobs || 0, color: '#3B82F6', bgColor: 'bg-blue-500', percentage: total > 0 ? ((data?.jobs || 0) / total * 100).toFixed(1) : 0 },
    { label: 'Events', value: data?.events || 0, color: '#10B981', bgColor: 'bg-green-500', percentage: total > 0 ? ((data?.events || 0) / total * 100).toFixed(1) : 0 },
    { label: 'Services', value: data?.services || 0, color: '#8B5CF6', bgColor: 'bg-purple-500', percentage: total > 0 ? ((data?.services || 0) / total * 100).toFixed(1) : 0 },
    { label: 'Products', value: data?.products || 0, color: '#F97316', bgColor: 'bg-orange-500', percentage: total > 0 ? ((data?.products || 0) / total * 100).toFixed(1) : 0 },
    { label: 'Tourism', value: data?.tourism || 0, color: '#EC4899', bgColor: 'bg-pink-500', percentage: total > 0 ? ((data?.tourism || 0) / total * 100).toFixed(1) : 0 },
    { label: 'Funding', value: data?.funding || 0, color: '#6366F1', bgColor: 'bg-indigo-500', percentage: total > 0 ? ((data?.funding || 0) / total * 100).toFixed(1) : 0 },
    { label: 'Moments', value: data?.moments || 0, color: '#14B8A6', bgColor: 'bg-teal-500', percentage: total > 0 ? ((data?.moments || 0) / total * 100).toFixed(1) : 0 },
    { label: 'Needs', value: data?.needs || 0, color: '#EF4444', bgColor: 'bg-red-500', percentage: total > 0 ? ((data?.needs || 0) / total * 100).toFixed(1) : 0 },
  ].filter(item => item.value > 0); // Only show items with values

  // Simple pie chart using SVG
  const renderPieChart = () => {
    if (total === 0) {
      return (
        <div className="w-36 h-36 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
          No Data
        </div>
      );
    }

    let cumulativePercentage = 0;
    const slices = chartData.map((item, index) => {
      const startAngle = (cumulativePercentage / 100) * 360;
      cumulativePercentage += parseFloat(item.percentage);
      const endAngle = (cumulativePercentage / 100) * 360;

      // Convert angles to SVG arc parameters
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;

      const x1 = 16 + 16 * Math.cos(startAngleRad);
      const y1 = 16 + 16 * Math.sin(startAngleRad);
      const x2 = 16 + 16 * Math.cos(endAngleRad);
      const y2 = 16 + 16 * Math.sin(endAngleRad);

      const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

      const pathData = `M 16 16 L ${x1} ${y1} A 16 16 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      return (
        <path
          key={index}
          d={pathData}
          fill={item.color}
          stroke="white"
          strokeWidth="0.5"
        />
      );
    });

    return (
      <svg viewBox="0 0 32 32" className="w-36 h-36">
        {slices}
      </svg>
    );
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="font-semibold mb-4">{title}</div>
      <div className="flex items-center gap-6">
        {renderPieChart()}
        <ul className="text-sm space-y-1 flex-1">
          {chartData.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className={`inline-block h-3 w-3 rounded-sm ${item.bgColor}`}></span>
              <span className="flex-1">{item.label}</span>
              <span className="text-gray-500 text-xs">
                {item.value} ({item.percentage}%)
              </span>
            </li>
          ))}
          {chartData.length === 0 && (
            <li className="text-gray-500 text-sm">No content data available</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ContentDistributionChart;