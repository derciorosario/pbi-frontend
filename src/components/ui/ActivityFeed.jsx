import React from 'react';
import { Link } from 'react-router-dom';

const ActivityFeed = ({ activities, loading = false, title = "Recent Activity" }) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center py-3 animate-pulse">
                <div className="h-4 w-4 bg-gray-200 rounded mr-3"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="font-semibold mb-4">{title}</div>
      <div className="max-h-96 overflow-y-auto">
        <ul className="divide-y divide-gray-100">
          {activities && activities.length > 0 ? (
            activities.map((activity, i) => {
              const content = (
                <li key={activity.id || i} className={`py-3 flex items-center ${activity.url && 1===0 ? 'hover:bg-gray-50 cursor-pointer transition-colors' : ''}`}>
                  <span className="mr-3 text-lg">{activity.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{activity.title}</div>
                    <div className="text-xs text-gray-500">{activity.description}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Just now'}
                  </div>
                </li>
              );

              return activity.url && 1===0 ? (
                <Link key={activity.id || i} to={`${window.location.origin}/${activity.data.targetType}/${activity?.data.reportId}`}>
                  {content}
                </Link>
              ) : (
                content
              );
            })
          ) : (
            <li className="py-8 text-center text-gray-500">
              No recent activity
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ActivityFeed;