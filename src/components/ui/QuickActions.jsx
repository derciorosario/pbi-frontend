import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Shield, FileText, BarChart3, Settings } from 'lucide-react';

const QuickActions = ({ loading = false }) => {
  const actions = [
    {
      title: 'User Management',
      description: 'Manage users, view profiles, handle suspensions',
      icon: <Users size={20} />,
      link: '/admin/users',
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100'
    },
    {
      title: 'Content Moderation',
      description: 'Review reported content, manage approvals',
      icon: <Shield size={20} />,
      link: '/admin/content-moderation',
      color: 'bg-red-50 text-red-600 hover:bg-red-100'
    },
    
  ];

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="font-semibold mb-4">Quick Actions</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <Link
            key={index}
            to={action.link}
            className={`p-4 border border-gray-200 rounded-lg transition-colors ${action.color}`}
          >
            <div className="flex items-center gap-3 mb-2">
              {action.icon}
              <h3 className="font-medium text-sm">{action.title}</h3>
            </div>
            <p className="text-xs text-gray-600 mb-3">{action.description}</p>
            <div className="text-xs font-medium">Go to {action.title} →</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;