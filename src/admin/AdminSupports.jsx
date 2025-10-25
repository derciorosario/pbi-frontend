import React, { useEffect, useState } from "react";
import { toast } from "../lib/toast";
import {
  getAllSupports,
  getSupportById,
  updateSupportStatus,
  deleteSupport,
  downloadSupportsDataAsExcel
} from "../api/admin";
import { Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, Clock, AlertCircle, XCircle, X } from "lucide-react";

const SUPPORT_REASONS = {
  technical: "Technical Error / System Failure",
  account: "Login / Access Problem",
  data: "Incorrect or Outdated Data",
  general: "Improvement Suggestion",
  other: "Other"
};

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-green-100 text-green-800" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  high: { label: "High", color: "bg-red-100 text-red-800" }
};

const STATUS_CONFIG = {
  new: { label: "New", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  responded: { label: "Responded", color: "bg-green-100 text-green-800", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-800", icon: XCircle }
};

export default function AdminSupports() {
  const [supports, setSupports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupport, setSelectedSupport] = useState(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    supportReason: "",
    sortBy: "createdAt",
    sortOrder: "DESC"
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false
  });
  const [updating, setUpdating] = useState(false);

  // Load supports data
  const loadSupports = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...filters,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      const response = await getAllSupports(params);
      const data = response.data || response;

      if (page === 1) {
        setSupports(data.supports || []);
      } else {
        setSupports(prev => [...prev, ...(data.supports || [])]);
      }

      setPagination(prev => ({
        ...prev,
        page,
        total: data.total || 0,
        hasMore: (page * pagination.limit) < (data.total || 0)
      }));

    } catch (error) {
      console.error("Error loading supports:", error);
      toast.error("Failed to load supports");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadSupports(1);
  }, [filters]);

  // Handle search input change
  const handleSearchChange = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle status update
  const handleStatusUpdate = async (supportId, newStatus, notes = "") => {
    try {
      setUpdating(true);
      await updateSupportStatus(supportId, newStatus, notes);

      // Update local state
      setSupports(prev => prev.map(support =>
        support.id === supportId
          ? { ...support, status: newStatus, respondedAt: newStatus === 'responded' ? new Date() : support.respondedAt }
          : support
      ));

      toast.success("Support status updated successfully");
      setShowSupportModal(false);
    } catch (error) {
      console.error("Error updating support status:", error);
      toast.error("Failed to update support status");
    } finally {
      setUpdating(false);
    }
  };

  // Handle support deletion
  const handleDeleteSupport = async (supportId) => {
    if (!confirm("Are you sure you want to delete this support request?")) return;

    try {
      await deleteSupport(supportId);
      setSupports(prev => prev.filter(support => support.id !== supportId));
      toast.success("Support request deleted successfully");
    } catch (error) {
      console.error("Error deleting support:", error);
      toast.error("Failed to delete support request");
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      await downloadSupportsDataAsExcel(supports);
      toast.success("Supports exported successfully");
    } catch (error) {
      console.error("Error exporting supports:", error);
      toast.error("Failed to export supports");
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Support Management</h1>
          <p className="text-sm text-gray-500">Manage support requests and inquiries</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download size={16} />
          Export Excel
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="responded">Responded</option>
            <option value="closed">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          {/* Reason Filter */}
          <select
            value={filters.supportReason}
            onChange={(e) => handleFilterChange('supportReason', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="">All Reasons</option>
            <option value="technical">Technical Error / System Failure</option>
            <option value="account">Login / Access Problem</option>
            <option value="data">Incorrect or Outdated Data</option>
            <option value="general">Improvement Suggestion</option>
            <option value="other">Other</option>
          </select>

          {/* Sort */}
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="createdAt-DESC">Newest First</option>
            <option value="createdAt-ASC">Oldest First</option>
            <option value="fullName-ASC">Name A-Z</option>
            <option value="fullName-DESC">Name Z-A</option>
            <option value="priority-ASC">Priority A-Z</option>
            <option value="status-ASC">Status A-Z</option>
          </select>
        </div>
      </div>

      {/* Supports Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Support
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attachment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {supports.map((support) => {
                const StatusIcon = STATUS_CONFIG[support.status]?.icon;
                return (
                  <tr key={support.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {support.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {support.email}
                        </div>
                        {support.phone && (
                          <div className="text-sm text-gray-500">
                            {support.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {SUPPORT_REASONS[support.supportReason] || support.supportReason}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_CONFIG[support.priority]?.color}`}>
                        {PRIORITY_CONFIG[support.priority]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[support.status]?.color}`}>
                        {StatusIcon && <StatusIcon size={12} />}
                        {STATUS_CONFIG[support.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(support.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {support.attachment ? (
                        <a
                          href={support.attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                          title="Download Attachment"
                        >
                          <Download size={12} />
                          {support.attachmentName || 'Download'}
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">No attachment</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedSupport(support);
                            setShowSupportModal(true);
                          }}
                          className="text-brand-600 hover:text-brand-900"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(support.id, support.status === 'new' ? 'in_progress' : 'responded')}
                          className="text-green-600 hover:text-green-900"
                          title="Mark as Responded"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteSupport(support.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {supports.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No support requests found</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading supports...</p>
          </div>
        )}
      </div>

      {/* Support Details Modal */}
      {showSupportModal && selectedSupport && (
        <div style={{marginTop:0}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Support Details</h3>
                <button
                  onClick={() => setShowSupportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedSupport.fullName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">
                      <a href={`mailto:${selectedSupport.email}`} className="text-brand-600 hover:underline">
                        {selectedSupport.email}
                      </a>
                    </p>
                  </div>
                  {selectedSupport.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedSupport.phone}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reason</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {SUPPORT_REASONS[selectedSupport.supportReason] || selectedSupport.supportReason}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <p className="mt-1 text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_CONFIG[selectedSupport.priority]?.color}`}>
                        {PRIORITY_CONFIG[selectedSupport.priority]?.label}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedSupport.message}</p>
                  </div>
                </div>

                {selectedSupport.attachment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Attachment</label>
                    <div className="mt-1">
                      <a
                        href={selectedSupport.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Download size={16} />
                        {selectedSupport.attachmentName || 'Download Attachment'}
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={selectedSupport.status}
                    onChange={(e) => handleStatusUpdate(selectedSupport.id, e.target.value)}
                    disabled={updating}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="responded">Responded</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      const subject = `Re: ${SUPPORT_REASONS[selectedSupport.supportReason]} - ${selectedSupport.fullName}`;
                      const body = `Hi ${selectedSupport.fullName},\n\nThank you for your support request. `;
                      window.open(`mailto:${selectedSupport.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                    }}
                    className="flex-1 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    Reply via Email
                  </button>
                  <button
                    onClick={() => setShowSupportModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}