import React, { useEffect, useState } from "react";
import { getContentForModeration, updateModerationStatus, getModerationStats } from "../api/admin";
import { toast } from "../lib/toast";

/* --- small helpers --- */
const Stat = ({ icon, title, value, tone = "gray", sub }) => {
  const toneMap = {
    gray: "bg-gray-50 text-gray-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    brand: "bg-brand-50 text-brand-700",
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 grid place-items-center rounded-lg ${toneMap[tone]}`}>{icon}</div>
        <div>
          <div className="text-xs text-gray-500">{title}</div>
          <div className="text-xl font-bold leading-tight">{value}</div>
          {sub && <div className="text-[11px] text-gray-400">{sub}</div>}
        </div>
      </div>
    </div>
  );
};

const Badge = ({ children, color = "gray" }) => {
  const styles = {
    gray: "bg-gray-100 text-gray-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
    rose: "bg-rose-100 text-rose-700",
    brand: "bg-brand-50 text-brand-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[color]}`}>
      {children}
    </span>
  );
};

const RowMeta = ({ reports, views, comments }) => (
  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
    <span>📣 {reports} reports</span>
    <span>👁️ {views} views</span>
    <span>💬 {comments} comments</span>
  </div>
);

export default function AdminModeration() {
  const [contentType, setContentType] = useState("job");
  const [moderationStatus, setModerationStatus] = useState("all");
  const [postType, setPostType] = useState("All");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    reported: 0,
    underReview: 0,
    approved: 0,
    removed: 0,
    suspended: 0,
    today: { approved: 0, removed: 0 }
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Fetch content for moderation
  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await getContentForModeration({
        page: pagination.page,
        limit: pagination.limit,
        contentType,
        moderationStatus,
        sortBy: "createdAt",
        sortOrder: "DESC"
      });
      
      if (response.data && response.data.content) {
        setItems(response.data.content);
        setPagination(response.data.pagination || {
          page: 1,
          limit: 10,
          total: response.data.content.length,
          totalPages: Math.ceil(response.data.content.length / 10)
        });
      } else {
        setItems([]);
        setPagination({
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        });
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error("Failed to fetch content for moderation");
    } finally {
      setLoading(false);
    }
  };

  // Fetch moderation stats
  const fetchStats = async () => {
    try {
      const response = await getModerationStats();
      if (response.data) {
        setStats({
          reported: response.data.reported || 0,
          underReview: response.data.underReview || 0,
          approved: response.data.approved || 0,
          removed: response.data.removed || 0,
          suspended: response.data.suspended || 0,
          today: {
            approved: response.data.today?.approved || 0,
            removed: response.data.today?.removed || 0
          }
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Update moderation status
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      try {
        await updateModerationStatus(id, contentType, newStatus);
        toast.success(`Content status updated to ${newStatus}`);
        fetchContent(); // Refresh content
        fetchStats(); // Refresh stats
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update content status. Please try again.");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update content status");
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Initial fetch
  useEffect(() => {
    fetchContent();
    fetchStats();
  }, []);

  // Fetch when filters or pagination change
  useEffect(() => {
    fetchContent();
  }, [contentType, moderationStatus, pagination.page, pagination.limit]);

  const filtered = items;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Content Moderation</h1>
        <p className="text-sm text-gray-500">Review and manage platform content</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<span>🚩</span>} title="Pending Reports" value={stats.reported} tone="rose" />
        <Stat icon={<span>🟡</span>} title="Under Review" value={stats.underReview} tone="amber" />
        <Stat icon={<span>✅</span>} title="Approved Today" value={stats.today.approved} tone="green" />
        <Stat icon={<span>⛔</span>} title="Removed Today" value={stats.today.removed} tone="brand" />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Content Queue</div>
          <div className="flex items-center gap-2">
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="job">Jobs</option>
              <option value="comment">Comments</option>
              <option value="profile">Profiles</option>
            </select>
            <select
              value={moderationStatus}
              onChange={(e) => setModerationStatus(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="reported">Reported</option>
              <option value="under_review">Under Review</option>
              <option value="removed">Removed</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="All">All Post Types</option>
              <option value="Job">Job</option>
              <option value="Event">Event</option>
              <option value="Product">Product</option>
              <option value="Service">Service</option>
              <option value="Tourism">Tourism</option>
              <option value="Funding">Funding</option>
            </select>
            <button
              onClick={fetchContent}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white bg-brand-500 hover:bg-brand-600"
            >
              <span>🧰</span> Filter
            </button>
          </div>
        </div>

        {/* Queue list */}
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
              <p className="mt-2 text-gray-500">Loading content...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No content found matching the selected filters.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <img
                      src={item.postedBy?.avatarUrl || "https://i.pravatar.cc/80"}
                      className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                      alt=""
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{item.postedBy?.name || "User"}</div>
                        {item.moderation_status === "reported" && <Badge color="rose">Reported</Badge>}
                        {item.moderation_status === "under_review" && <Badge color="amber">Under Review</Badge>}
                        {item.moderation_status === "approved" && <Badge color="green">Approved</Badge>}
                        {item.moderation_status === "removed" && <Badge color="rose">Removed</Badge>}
                        {item.moderation_status === "suspended" && <Badge color="rose">Suspended</Badge>}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                      <h3 className="mt-1 font-semibold">{item.title}</h3>
                      <p className="mt-2 text-[15px] text-gray-700">{item.description}</p>
                      <RowMeta
                        reports={item.stats?.reports || 0}
                        views={0}
                        comments={item.stats?.comments || 0}
                      />
                      
                      {/* Show reports if any */}
                      {item.reports && item.reports.length > 0 && (
                        <div className="mt-3 border-t border-gray-100 pt-3">
                          <div className="text-xs font-semibold text-gray-500 mb-2">Reports:</div>
                          <div className="space-y-2">
                            {item.reports.map(report => (
                              <div key={report.id} className="bg-red-50 p-2 rounded-md text-xs">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={report.reporter?.avatarUrl || "https://i.pravatar.cc/40"}
                                    className="h-5 w-5 rounded-full"
                                    alt=""
                                  />
                                  <span className="font-medium">{report.reporter?.name || "User"}</span>
                                  <span className="text-gray-500 text-[10px]">
                                    {new Date(report.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <div className="mt-1 text-gray-700">{report.description}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                  <button
                    onClick={() => handleUpdateStatus(item.id, "approved")}
                    className="rounded-lg bg-emerald-50 text-emerald-700 px-3 py-1.5 text-sm font-semibold"
                    title="Approve"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(item.id, "removed")}
                    className="rounded-lg bg-rose-50 text-rose-700 px-3 py-1.5 text-sm font-semibold"
                    title="Remove"
                  >
                    ✕ Remove
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(item.id, "under_review")}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm"
                    title="Review"
                  >
                    ∘ Review
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(item.id, "suspended")}
                    className="rounded-lg bg-amber-50 text-amber-700 px-3 py-1.5 text-sm font-semibold"
                    title="Suspend"
                  >
                    ! Suspend
                  </button>
                </div>
              </div>

              {/* optional: row actions footer */}
                <div className="mt-3 flex items-center justify-end">
                  <button className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
                    <span className="text-gray-400">👁️</span> View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {filtered.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to {
              Math.min(pagination.page * pagination.limit, pagination.total)
            } of {pagination.total} results
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className={`px-2.5 py-1.5 rounded-md border ${
                pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-2.5 py-1.5 rounded-md ${
                    pagination.page === pageNum ? 'bg-brand-500 text-white' : 'border'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page === pagination.totalPages}
              className={`px-2.5 py-1.5 rounded-md border ${
                pagination.page === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
