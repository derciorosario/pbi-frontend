// src/admin/AdminUsers.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "../lib/toast";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserSuspension,
  downloadUsersData
} from "../api/admin";

const Badge = ({ children, tone = "green" }) => {
  const map = {
    brand: "bg-brand-50 text-brand-700",
    green: "bg-green-100 text-green-700",
    rose: "bg-rose-100 text-rose-700",
    gray: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${map[tone] || map.gray}`}>
      {children}
    </span>
  );
};

const Stat = ({ title, value, delta, tone = "emerald" }) => {
  const toneMap = {
    emerald: "text-emerald-600",
    rose: "text-rose-600",
    brand: "text-brand-700",
    gray: "text-gray-600",
  };
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
      setPagination(data.pagination);
      
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
      await downloadUsersData({
        format,
        filters: {
          search: filters.search,
          accountType: filters.accountType === 'all' ? '' : filters.accountType,
          isVerified: filters.isVerified === '' ? undefined : filters.isVerified === 'true'
        }
      });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">User Management</h1>
        <p className="text-sm text-gray-500">Manage and monitor platform users</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat title="Total Users" value={stats.total.toString()} tone="brand" />
        <Stat title="Active Users" value={stats.active.toString()} />
        <Stat title="Suspended" value={stats.suspended.toString()} tone="rose" />
        <Stat title="New Today" value={stats.newToday.toString()} />
      </div>

      {/* Filters + actions */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search name or email"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        <select 
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={filters.accountType}
          onChange={(e) => handleFilterChange('accountType', e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="individual">Individual</option>
          <option value="company">Company</option>
          <option value="admin">Admin</option>
        </select>
        <select 
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={filters.isVerified}
          onChange={(e) => handleFilterChange('isVerified', e.target.value)}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Suspended</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white"
          >
            Export Excel
          </button>
          <button
            onClick={() => handleExport('json')}
            className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Account Type</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Joined</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-3 text-center">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-3 text-center">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                      user.accountType === 'admin' ? 'bg-purple-100 text-purple-800' : 
                      user.accountType === 'company' ? 'bg-blue-100 text-blue-800' : 
                      'bg-brand-50 text-brand-700'
                    }`}>
                      {user.accountType}
                    </span>
                  </td>
                  <td className="px-4 py-3">{user.city ? `${user.city}, ${user.country}` : user.country || 'N/A'}</td>
                  <td className="px-4 py-3">
                    {user.isVerified ? <Badge tone="brand">Active</Badge> : <Badge tone="rose">Suspended</Badge>}
                  </td>
                  <td className="px-4 py-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-gray-500">
                      <button 
                        title="Edit" 
                        onClick={() => handleEditUser(user.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ✏️
                      </button>
                      <button 
                        title={user.isVerified ? "Suspend" : "Activate"} 
                        onClick={() => handleToggleSuspension(user.id, user.isVerified)}
                        className={user.isVerified ? "text-orange-600 hover:text-orange-800" : "text-green-600 hover:text-green-800"}
                      >
                        {user.isVerified ? "⏸️" : "▶️"}
                      </button>
                      <button 
                        title="Delete" 
                        onClick={() => handleDeleteClick(user)}
                        className="text-rose-600 hover:text-rose-800"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-600">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                <label className="block text-sm font-medium mb-1">Account Type</label>
                <select
                  name="accountType"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.accountType}
                  onChange={handleChange}
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                  <option value="admin">Admin</option>
                </select>
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
              <div>
                <label className="block text-sm font-medium mb-1">Experience Level</label>
                <input
                  type="text"
                  name="profile.experienceLevel"
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.profile.experienceLevel}
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
