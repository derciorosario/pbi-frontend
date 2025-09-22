// src/pages/AdminUsers.jsx
import React, { useEffect, useState } from "react";
import { toast } from "../lib/toast";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserSuspension,
  downloadUsersData
} from "../api/admin";
import Header from "../components/Header.jsx";

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
      await toggleUserSuspension(userId, !currentStatus);
      toast.success(currentStatus ? "User unsuspended successfully" : "User suspended successfully");
      fetchUsers(); // Refresh the list
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

  // Loading state
  if (loading && users.length === 0) {
    return (
      <div>
        <Header />
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <div className="min-h-screen grid place-items-center text-brand-700">
            <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"/>
            </svg>
            <span className="ml-2">Loading…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-soft p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
              <p className="text-gray-500">Manage platform users</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Export CSV
              </button>
              <button 
                onClick={() => handleExport('json')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-soft p-5 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <form onSubmit={handleSearch} className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Name or email"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account Type</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={filters.accountType}
                onChange={(e) => handleFilterChange('accountType', e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="individual">Individual</option>
                <option value="company">Company</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Verification Status</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={filters.isVerified}
                onChange={(e) => handleFilterChange('isVerified', e.target.value)}
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Not Verified</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sort By</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 border rounded-lg px-3 py-2"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="createdAt">Registration Date</option>
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                </select>
                <button
                  type="button"
                  className="px-3 py-2 border rounded-lg"
                  onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                >
                  {filters.sortOrder === 'ASC' ? '↑' : '↓'}
                </button>
              </div>
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-brand-700 text-white rounded-lg hover:bg-brand-800"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-soft p-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {user.avatarUrl ? (
                          <img className="h-10 w-10 rounded-full flex-shrink-0" src={user.avatarUrl} alt={user.name} />
                        ) : (
                          <div className="h-10 w-10 rounded-full flex-shrink-0 bg-gray-200 flex items-center justify-center text-gray-500">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.professionalTitle || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.accountType === 'admin' ? 'bg-purple-100 text-purple-800' : 
                        user.accountType === 'company' ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {user.accountType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.isVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditUser(user.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleSuspension(user.id, user.isVerified)}
                        className={`${user.isVerified ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                      >
                        {user.isVerified ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-4">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 ${pagination.page === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{users.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                  >
                    <span className="sr-only">Previous</span>
                    &lt;
                  </button>
                  {/* Page numbers */}
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
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          pagination.page === pageNum
                            ? 'bg-brand-700 text-white focus:z-20'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 ${pagination.page === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                  >
                    <span className="sr-only">Next</span>
                    &gt;
                  </button>
                </nav>
              </div>
            </div>
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