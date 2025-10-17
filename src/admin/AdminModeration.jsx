import React, { useEffect, useState } from "react";
import { getContentForModeration, updateModerationStatus, getModerationStats } from "../api/admin";
import { toast } from "../lib/toast";
import { RefreshCcw, ChevronDown, ChevronUp, Eye, EyeOff, MessageSquare, Heart, Flag, MoreHorizontal } from "lucide-react";

/* --- small helpers --- */
const Stat = ({ icon, title, value, tone = "gray", sub, loading = false }) => {
  const toneMap = {
    gray: "bg-gray-50 text-gray-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    brand: "bg-brand-50 text-brand-700",
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-20 mb-1 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-12 mb-1 animate-pulse"></div>
            <div className="h-2 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

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
    <span>👁️ {views} likes</span>
    <span>💬 {comments} comments</span>
  </div>
);

export default function AdminModeration() {
   const [contentType, setContentType] = useState("all");
   const [moderationStatus, setModerationStatus] = useState("all");
   const [postType, setPostType] = useState("All");
   const [loading, setLoading] = useState(false);
   const [items, setItems] = useState([]);
   const [expandedItems, setExpandedItems] = useState(new Set());
   const [expandedSections, setExpandedSections] = useState({});
  const [stats, setStats] = useState({
    reported: 0,
    underReview: 0,
    approved: 0,
    removed: 0,
    suspended: 0,
    today: { approved: 0, removed: 0 }
  });
  const [statsLoading, setStatsLoading] = useState(true);
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
      setStatsLoading(true);
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
    } finally {
      setStatsLoading(false);
    }
  };

  // Update moderation status
  const handleUpdateStatus = async (id, newStatus,contentType) => {
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

  // Toggle item expansion
  const toggleItemExpansion = (itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Toggle section expansion
  const toggleSectionExpansion = (itemId, section) => {
    setExpandedSections(prev => ({
      ...prev,
      [`${itemId}-${section}`]: !prev[`${itemId}-${section}`]
    }));
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
        <Stat icon={<span>🚩</span>} title="Pending Reports" value={stats.reported} tone="rose" loading={statsLoading && stats.reported === 0} />
        <Stat icon={<span>🟡</span>} title="Under Review" value={stats.underReview} tone="amber" loading={statsLoading && stats.underReview === 0} />
        <Stat icon={<span>✅</span>} title="Approved Today" value={stats.today.approved} tone="green" loading={statsLoading && stats.today.approved === 0} />
        <Stat icon={<span>⛔</span>} title="Removed Today" value={stats.today.removed} tone="brand" loading={statsLoading && stats.today.removed === 0} />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Content Queue</div>
          <div className="flex items-center gap-2">
            <select
              value={contentType}
              onChange={(e) => {
                setContentType(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All Post Types</option>
              <option value="job">Jobs</option>
              <option value="event">Events</option>
              <option value="product">Products</option>
              <option value="service">Services</option>
              <option value="tourism">Tourism</option>
              <option value="funding">Opportunities</option>
              <option value="moment">Experience</option>
              <option value="need">Need / Offer</option>

            </select>
            <select
              value={moderationStatus}
              onChange={(e) => {
                setModerationStatus(e.target.value)
                setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="reported">Reported</option>
              <option value="under_review">Under Review</option>
              <option value="removed">Removed</option>
              <option value="suspended">Suspended</option>
            </select>

            {/**  <select
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
            </select> */}
            <button
              onClick={fetchContent}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white bg-brand-500 hover:bg-brand-600"
            >
               <RefreshCcw size={12}/>
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
            filtered.map((item) => {
              const isExpanded = expandedItems.has(item.id);
              const hasReports = item.reports && item.reports.length > 0;
              const hasComments = item.comments && item.comments.length > 0;
              const hasLikes = item.likes && item.likes.length > 0;

              return (
                <div key={item.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <img
                          src={item.postedBy?.avatarUrl || "https://i.pravatar.cc/80"}
                          className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                          alt=""
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-medium">{item.postedBy?.name || "User"}</div>
                            <Badge color={
                              item.moderation_status === "reported" ? "rose" :
                              item.moderation_status === "under_review" ? "amber" :
                              item.moderation_status === "approved" ? "green" :
                              item.moderation_status === "removed" ? "rose" :
                              item.moderation_status === "suspended" ? "rose" : "gray"
                            }>
                              {item.moderation_status === "reported" ? "Reported" :
                               item.moderation_status === "under_review" ? "Under Review" :
                               item.moderation_status === "approved" ? "Approved" :
                               item.moderation_status === "removed" ? "Removed" :
                               item.moderation_status === "suspended" ? "Suspended" : "Unknown"}
                            </Badge>
                            <Badge color="brand">{item.contentType}</Badge>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-1">
                            {new Date(item.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 ml-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(`${window.location.origin}/${item.contentType}/${item.id}`, '_blank')}
                            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors flex-1 sm:flex-none"
                            title="View item on public page"
                          >
                            <Eye size={14} />
                            <span className="hidden sm:inline">View</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, "approved",item.contentType)}
                            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex-1 sm:flex-none"
                            title="Approve content"
                          >
                            <span className="hidden sm:inline">✓</span>
                            <span className="sm:hidden">✓</span>
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, "under_review",item.contentType)}
                            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-1 sm:flex-none"
                            title="Mark for review"
                          >
                            <span className="hidden sm:inline">⏳</span>
                            <span className="sm:hidden">⏳</span>
                            Review
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateStatus(item.id, "removed",item.contentType)}
                            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex-1 sm:flex-none"
                            title="Remove content"
                          >
                            <span className="hidden sm:inline">✕</span>
                            <span className="sm:hidden">✕</span>
                            Remove
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, "suspended",item.contentType)}
                            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex-1 sm:flex-none"
                            title="Suspend content"
                          >
                            <span className="hidden sm:inline">⚠️</span>
                            <span className="sm:hidden">⚠️</span>
                            Suspend
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <div dangerouslySetInnerHTML={{
                    __html: item.description || "No description provided."
                     }} className={`text-gray-700 ${!isExpanded ? 'line-clamp-3' : ''}`}/>
                     
                    {!isExpanded && item.description && item.description.length > 200 && (
                      <button
                        onClick={() => toggleItemExpansion(item.id)}
                        className="text-brand-600 hover:text-brand-700 text-sm font-medium mt-2"
                      >
                        Show more
                      </button>
                    )}
                    {isExpanded && item.description && item.description.length > 200 && (
                      <button
                        onClick={() => toggleItemExpansion(item.id)}
                        className="text-brand-600 hover:text-brand-700 text-sm font-medium mt-2"
                      >
                        Show less
                      </button>
                    )}
                  </div>

                  {/* Stats and expandable sections */}
                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Flag size={16} />
                        <span>{item.stats?.reports || 0} reports</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart size={16} />
                        <span>{item.stats?.likes || 0} likes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare size={16} />
                        <span>{item.stats?.comments || 0} comments</span>
                      </div>
                    </div>

                    {/* Expandable sections */}
                    <div className="space-y-2">
                      {hasReports && (
                        <div className="border border-red-200 rounded-lg">
                          <button
                            onClick={() => toggleSectionExpansion(item.id, 'reports')}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-red-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Flag size={16} className="text-red-600" />
                              <span className="font-medium text-red-700">Reports ({item.reports.length})</span>
                            </div>
                            {expandedSections[`${item.id}-reports`] ?
                              <ChevronUp size={16} className="text-red-600" /> :
                              <ChevronDown size={16} className="text-red-600" />
                            }
                          </button>
                          {expandedSections[`${item.id}-reports`] && (
                            <div className="px-3 pb-3 space-y-2">
                              {item.reports.map(report => (
                                <div key={report.id} className="bg-red-50 p-3 rounded-md">
                                  <div className="flex items-center gap-2 mb-2">
                                    <img
                                      src={report.reporter?.avatarUrl || "https://i.pravatar.cc/32"}
                                      className="h-6 w-6 rounded-full"
                                      alt=""
                                    />
                                    <span className="font-medium text-sm">{report.reporter?.name || "User"}</span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(report.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-700">{report.description}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {hasComments && (
                        <div className="border border-blue-200 rounded-lg">
                          <button
                            onClick={() => toggleSectionExpansion(item.id, 'comments')}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <MessageSquare size={16} className="text-blue-600" />
                              <span className="font-medium text-blue-700">Comments ({item.comments.length})</span>
                            </div>
                            {expandedSections[`${item.id}-comments`] ?
                              <ChevronUp size={16} className="text-blue-600" /> :
                              <ChevronDown size={16} className="text-blue-600" />
                            }
                          </button>
                          {expandedSections[`${item.id}-comments`] && (
                            <div className="px-3 pb-3 space-y-2">
                              {item.comments.map(comment => (
                                <div key={comment.id} className="bg-blue-50 p-3 rounded-md">
                                  <div className="flex items-center gap-2 mb-2">
                                    <img
                                      src={comment.user?.avatarUrl || "https://i.pravatar.cc/32"}
                                      className="h-6 w-6 rounded-full"
                                      alt=""
                                    />
                                    <span className="font-medium text-sm">{comment.user?.name || "User"}</span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(comment.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-700">{comment.content || "No content"}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {hasLikes && (
                        <div className="border border-pink-200 rounded-lg">
                          <button
                            onClick={() => toggleSectionExpansion(item.id, 'likes')}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-pink-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Heart size={16} className="text-pink-600" />
                              <span className="font-medium text-pink-700">Likes ({item.likes.length})</span>
                            </div>
                            {expandedSections[`${item.id}-likes`] ?
                              <ChevronUp size={16} className="text-pink-600" /> :
                              <ChevronDown size={16} className="text-pink-600" />
                            }
                          </button>
                          {expandedSections[`${item.id}-likes`] && (
                            <div className="px-3 pb-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {item.likes.map(like => (
                                  <div key={like.id} className="bg-pink-50 p-2 rounded-md flex items-center gap-2">
                                    <img
                                      src={like.user?.avatarUrl || "https://i.pravatar.cc/24"}
                                      className="h-5 w-5 rounded-full"
                                      alt=""
                                    />
                                    <div className="min-w-0">
                                      <div className="font-medium text-xs truncate">{like.user?.name || "User"}</div>
                                      <div className="text-[10px] text-gray-500">
                                        {new Date(like.createdAt).toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
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
