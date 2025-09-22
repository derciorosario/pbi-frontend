import React, { useEffect, useState } from "react";
import { toast } from "../lib/toast";
import { RefreshCcw } from "lucide-react";

// Import dashboard components
import DashboardStatCard from "../components/ui/DashboardStatCard";
import ActivityFeed from "../components/ui/ActivityFeed";
import ContentDistributionChart from "../components/ui/ContentDistributionChart";
import UserGrowthChart from "../components/ui/UserGrowthChart";
import QuickActions from "../components/ui/QuickActions";

// Import API functions
import {
  getDashboardStats,
  getRecentActivity,
  getUserGrowthData
} from "../api/admin";

export default function AdminDashboard() {
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    users: { total: 0, active: 0, suspended: 0, newToday: 0, growth: { daily: 0, weekly: 0, monthly: 0 } },
    connections: { total: 0, pendingRequests: 0 },
    content: { total: 0, distribution: { jobs: 0, events: 0, services: 0, products: 0, tourism: 0, funding: 0, moments: 0, needs: 0 } },
    moderation: { reported: 0, underReview: 0, approved: 0, removed: 0, suspended: 0, today: { approved: 0, removed: 0 } },
    engagement: { likes: 0, comments: 0, reports: 0 },
    communication: { messages: 0, conversations: 0, meetingRequests: 0 },
    notifications: { total: 0 },
    organizations: { companies: 0, pendingJoinRequests: 0 },
    demographics: { identities: [], goals: [] }
  });
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load dashboard data
  const loadDashboardData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Load all dashboard data in parallel
      const [dashboardStats, activities, growthData] = await Promise.all([
        getDashboardStats(),
        getRecentActivity(10),
        getUserGrowthData(30)
      ]);

      setDashboardData(dashboardStats.data || dashboardStats);
      setRecentActivities(activities.data?.activities || activities.activities || []);
      setUserGrowthData(growthData.data?.growth || growthData.growth || []);

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle manual refresh
  const handleRefresh = () => {
    loadDashboardData(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">Monitor platform activity and manage content</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* User Statistics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Total Users"
          value={(dashboardData.users?.total || 0).toLocaleString()}
          delta={`+${dashboardData.users?.growth?.monthly || 0}% from last month`}
          icon="👥"
          tone="brand"
          loading={loading}
        />
        <DashboardStatCard
          title="Active Users"
          value={(dashboardData.users?.active || 0).toLocaleString()}
          delta={`+${dashboardData.users?.growth?.weekly || 0}% from last week`}
          icon="✅"
          tone="green"
          loading={loading}
        />
        <DashboardStatCard
          title="Suspended Users"
          value={(dashboardData.users?.suspended || 0).toLocaleString()}
          icon="🚫"
          tone="rose"
          loading={loading}
        />
        <DashboardStatCard
          title="Pending Reports"
          value={(dashboardData.moderation?.reported || 0).toLocaleString()}
          delta="Requires attention"
          icon="🚩"
          tone="rose"
          loading={loading}
        />
      </div>

      {/* Content Statistics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Total Content"
          value={(dashboardData.content?.total || 0).toLocaleString()}
          icon="📄"
          tone="blue"
          loading={loading}
        />
        <DashboardStatCard
          title="Jobs Posted"
          value={(dashboardData.content.distribution?.jobs || 0).toLocaleString()}
          icon="💼"
          tone="blue"
          loading={loading}
        />
        <DashboardStatCard
          title="Events Created"
          value={(dashboardData.content.distribution?.events || 0).toLocaleString()}
          icon="📅"
          tone="green"
          loading={loading}
        />
        <DashboardStatCard
          title="Services Offered"
          value={(dashboardData.content.distribution?.services || 0).toLocaleString()}
          icon="🛠️"
          tone="purple"
          loading={loading}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <UserGrowthChart
          data={userGrowthData}
          loading={loading}
          title="User Growth (30 Days)"
        />
        <ContentDistributionChart
          data={dashboardData.content.distribution}
          loading={loading}
          title="Content Distribution"
        />
      </div>

      {/* Recent Activity */}
      <ActivityFeed
        activities={recentActivities}
        loading={loading}
        title="Recent Activity"
      />

      {/* Moderation Statistics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Under Review"
          value={(dashboardData.moderation?.underReview || 0).toLocaleString()}
          icon="⏳"
          tone="amber"
          loading={loading}
        />
        <DashboardStatCard
          title="Approved Today"
          value={(dashboardData.moderation?.today?.approved || 0).toLocaleString()}
          icon="✅"
          tone="green"
          loading={loading}
        />
        <DashboardStatCard
          title="Removed Today"
          value={(dashboardData.moderation?.today?.removed || 0).toLocaleString()}
          icon="🗑️"
          tone="rose"
          loading={loading}
        />
        <DashboardStatCard
          title="Total Moderated"
          value={((dashboardData.moderation?.approved || 0) + (dashboardData.moderation?.removed || 0)).toLocaleString()}
          icon="⚖️"
          tone="gray"
          loading={loading}
        />
      </div>

      {/* Additional Statistics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardStatCard
          title="Total Connections"
          value={(dashboardData.connections?.total || 0).toLocaleString()}
          icon="🤝"
          tone="blue"
          loading={loading}
        />
        <DashboardStatCard
          title="Pending Requests"
          value={(dashboardData.connections?.pendingRequests || 0).toLocaleString()}
          icon="⏳"
          tone="amber"
          loading={loading}
        />
        <DashboardStatCard
          title="Total Likes"
          value={(dashboardData.engagement?.likes || 0).toLocaleString()}
          icon="❤️"
          tone="pink"
          loading={loading}
        />
        <DashboardStatCard
          title="Total Comments"
          value={(dashboardData.engagement?.comments || 0).toLocaleString()}
          icon="💬"
          tone="blue"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions loading={loading} />
    </div>
  );
}
