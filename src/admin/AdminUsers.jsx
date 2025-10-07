// src/admin/AdminUsers.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "../lib/toast";
import { ChevronDown, ChevronUp, Search, Download, Edit, UserCheck, UserX, Trash2, Eye, Filter } from "lucide-react";
import * as XLSX from 'xlsx';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserSuspension,
  downloadUsersData
} from "../api/admin";

const Badge = ({ children, color = "green" }) => {
  const map = {
    brand: "bg-brand-50 text-brand-700",
    green: "bg-green-100 text-green-700",
    rose: "bg-rose-100 text-rose-700",
    gray: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${map[color] || map.gray}`}>
      {children}
    </span>
  );
};

const Stat = ({ title, value, delta, tone = "emerald", loading = false }) => {
  const toneMap = {
    emerald: "text-emerald-600",
    rose: "text-rose-600",
    brand: "text-brand-700",
    gray: "text-gray-600",
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="h-4 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded w-12 mb-1 animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {delta ? <div className={`text-xs mt-1 ${toneMap[tone] || toneMap.gray}`}>{delta}</div> : null}
    </div>
  );
};

export default function AdminUsers() {
  // State for users list
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  // State for filters
  const [filters, setFilters] = useState({
    search: "",
    accountType: "all",
    isVerified: "",
    sortBy: "createdAt",
    sortOrder: "DESC"
  });

  // State for UI
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // State for selected user (for editing)
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    newToday: 0
  });

  // Load users on component mount and when filters/pagination change
  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, filters]);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await getAllUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        accountType: filters.accountType,
        isVerified: filters.isVerified,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      
      setUsers(data.users);
      if(data.pagination)  setPagination(data.pagination);
      
      // Update stats
      if (data.pagination && data.pagination.total) {
        setStats(prev => ({
          ...prev,
          total: data.pagination.total,
          active: data.users.filter(u => u.isVerified).length,
          suspended: data.users.filter(u => !u.isVerified).length,
          // This would need a separate API call for accurate data
          newToday: prev.newToday
        }));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle search input
  const handleSearch = (e) => {
    e.preventDefault();
    // The search will be triggered by the useEffect when filters change
  };

  // Toggle user expansion
  const toggleUserExpansion = (userId) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Open edit modal with user data
  const handleEditUser = async (userId) => {
    try {
      setEditLoading(true);
      const { data } = await getUserById(userId);
      setSelectedUser(data);
      setShowEditModal(true);
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to load user details");
    } finally {
      setEditLoading(false);
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Handle user deletion
  const handleDeleteConfirm = async () => {
    try {
      setEditLoading(true);
      await deleteUser(selectedUser.id);
      toast.success("User deleted successfully");
      setShowDeleteModal(false);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error?.response?.data?.message || "Failed to delete user");
    } finally {
      setEditLoading(false);
    }
  };

  // Handle user suspension toggle
  const handleToggleSuspension = async (userId, currentStatus) => {
    try {
      const response = await toggleUserSuspension(userId, !currentStatus);
      
      // Check if the response contains the updated isVerified status
      if (response.data && response.data.isVerified !== undefined) {
        // Update the user in the local state to avoid a full refetch
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId
              ? { ...user, isVerified: response.data.isVerified }
              : user
          )
        );
        
        toast.success(response.data.isVerified ? "User unsuspended successfully" : "User suspended successfully");
      } else {
        // If we don't get the updated status, do a full refetch
        fetchUsers();
        toast.success(currentStatus ? "User unsuspended successfully" : "User suspended successfully");
      }
    } catch (error) {
      console.error("Error toggling user suspension:", error);
      toast.error("Failed to update user status");
    }
  };

  // Handle export data
  const handleExport = async (format = 'csv') => {
    try {
      if (format === 'excel') {
        // Export Excel directly from frontend using current users data
        await downloadUsersDataAsExcel(users);
      } else {
        // Use backend for CSV and JSON exports
        await downloadUsersData({
          format,
          filters: {
            search: filters.search,
            accountType: filters.accountType === 'all' ? '' : filters.accountType,
            isVerified: filters.isVerified === '' ? undefined : filters.isVerified === 'true'
          }
        });
      }
      toast.success(`Users exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error("Error exporting users:", error);
      toast.error("Failed to export users");
    }
  };

  // Save edited user
  const handleSaveUser = async (userData) => {
    try {
      setEditLoading(true);
      await updateUser(selectedUser.id, userData);
      toast.success("User updated successfully");
      setShowEditModal(false);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error?.response?.data?.message || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  // Export users data to Excel
  const downloadUsersDataAsExcel = (users) => {
    // Prepare data for Excel
    const excelData = users.map(user => ({
      ID: user.id,
      Name: user.name,
      Email: user.email,
      Phone: user.phone || '',
      'Account Type': user.accountType,
      Status: user.isVerified ? 'Active' : 'Suspended',
      Country: user.country || '',
      'Country of Residence': user.countryOfResidence || '',
      City: user.city || '',
      Nationality: user.nationality || '',
      'Joined Date': new Date(user.createdAt).toLocaleDateString(),
      'Professional Title': user.profile?.professionalTitle || '',
      'Experience Level': user.profile?.experienceLevel || '',
      About: user.profile?.about || ''
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');

    // Generate filename with current date
    const filename = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Write and download file
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">User Management</h1>
        <p className="text-sm text-gray-500">Manage and monitor platform users</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat title="Total Users" value={stats.total.toString()} tone="brand" loading={loading && stats.total === 0} />
        <Stat title="Active Users" value={stats.active.toString()} loading={loading && stats.active === 0} />
        <Stat title="Suspended" value={stats.suspended.toString()} tone="rose" loading={loading && stats.suspended === 0} />
        <Stat title="New Today" value={stats.newToday.toString()} loading={loading && stats.newToday === 0} />
      </div>

      {/* Filters + actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search name or email"
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-sm"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Filter size={16} />
              Filters
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Download size={16} />
              CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <Download size={16} />
              Excel
            </button>
            <button
              onClick={() => handleExport('json')}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <Download size={16} />
              JSON
            </button>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                <select
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  value={filters.accountType}
                  onChange={(e) => handleFilterChange('accountType', e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  value={filters.isVerified}
                  onChange={(e) => handleFilterChange('isVerified', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="createdAt">Join Date</option>
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Cards */}
      <div className="space-y-4">
        {loading && users.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
            <p className="mt-2 text-gray-500">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <Search size={48} className="mx-auto" />
            </div>
            <p className="text-gray-500">No users found matching your criteria.</p>
          </div>
        ) : (
          users.map((user) => {
            const isExpanded = expandedUsers.has(user.id);

            return (
              <div key={user.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt=""
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-lg text-gray-900">{user.name}</h3>
                          <Badge color={
                            user.accountType == 'admin' ? 'gray' :
                            user.accountType == 'company' ? 'brand' :
                            'green'
                          }>
                            {user.accountType}
                          </Badge>
                          {user.isVerified ? (
                            <Badge color="green">Active</Badge>
                          ) : (
                            <Badge color="rose">Suspended</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-1">{user.email}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{user.city ? `${user.city}, ${user.country}` : user.country || 'Location not set'}</span>
                          <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleUserExpansion(user.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title={isExpanded ? "Show less" : "Show more"}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <Link
                        to={`/admin/user-profile/${user.id}`}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View profile"
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        onClick={() => handleEditUser(user.id)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit user"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleSuspension(user.id, user.isVerified)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.isVerified
                            ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                            : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                        }`}
                        title={user.isVerified ? "Suspend user" : "Activate user"}
                      >
                        {user.isVerified ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><span className="font-medium">Email:</span> {user.email}</p>
                            {user.phone && <p><span className="font-medium">Phone:</span> {user.phone}</p>}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Location Details</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            {user.country && <p><span className="font-medium">Country:</span> {user.country}</p>}
                            {user.countryOfResidence && <p><span className="font-medium">Country of Residence:</span> {user.countryOfResidence}</p>}
                            {user.city && <p><span className="font-medium">City:</span> {user.city}</p>}
                            {user.nationality && <p><span className="font-medium">Nationality:</span> {user.nationality}</p>}
                          </div>
                        </div>
                      </div>

                      {user.profile && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <h4 className="font-medium text-gray-900 mb-2">Profile Information</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            {user.profile.professionalTitle && (
                              <p><span className="font-medium">Professional Title:</span> {user.profile.professionalTitle}</p>
                            )}
                            {user.profile.experienceLevel && (
                              <p><span className="font-medium">Experience Level:</span> {user.profile.experienceLevel}</p>
                            )}
                            {user.profile.about && (
                              <div>
                                <span className="font-medium">About:</span>
                                <p className="mt-1 text-gray-700">{user.profile.about}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {users.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`px-2.5 py-1.5 rounded-md border ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      pagination.page === pageNum
                        ? 'bg-brand-500 text-white'
                        : 'border'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`px-2.5 py-1.5 rounded-md border ${pagination.page === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveUser}
          loading={editLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <DeleteConfirmationModal
          user={selectedUser}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          loading={editLoading}
        />
      )}
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({ user, onClose, onSave, loading }) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    accountType: user.accountType || "individual",
    isVerified: user.isVerified || false,
    country: user.country || "",
    countryOfResidence: user.countryOfResidence || "",
    city: user.city || "",
    nationality: user.nationality || "",
    profile: {
      professionalTitle: user.profile?.professionalTitle || "",
      experienceLevel: user.profile?.experienceLevel || "",
      about: user.profile?.about || ""
    }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (profile)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      // Handle top-level properties
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed  inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Edit User</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              &times;
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
             
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.country}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country of Residence</label>
                <input
                  type="text"
                  name="countryOfResidence"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.countryOfResidence}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nationality</label>
                <input
                  type="text"
                  name="nationality"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.nationality}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Professional Title</label>
                <input
                  type="text"
                  name="profile.professionalTitle"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.profile.professionalTitle}
                  onChange={handleChange}
                />
              </div>
             
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">About</label>
                <textarea
                  name="profile.about"
                  rows="3"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.profile.about}
                  onChange={handleChange}
                ></textarea>
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isVerified"
                    checked={formData.isVerified}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Verified Account</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <div className="flex justify-between w-full">
                <Link
                  to={`/admin/user-profile/${user.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Advanced Editing
                </Link>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border rounded-lg"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-700 text-white rounded-lg"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({ user, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Confirm Deletion</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              &times;
            </button>
          </div>
          
          <p className="mb-6">
            Are you sure you want to delete the user <strong>{user.name}</strong>? This action cannot be undone.
          </p>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
