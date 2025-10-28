import React, { useEffect, useState } from "react";
import { toast } from "../lib/toast";
import {
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
  downloadContactsDataAsExcel,
  markContactAsRead,
  markAllContactsAsRead
} from "../api/admin";
import { Search, Filter, Download, Eye, Edit, Trash2, CheckCircle, Clock, AlertCircle, XCircle, X, Mail } from "lucide-react";

const CONTACT_REASONS = {
  complaint: "Complaint / Feedback",
  partnership: "Partnership / Collaboration",
  information: "Request Information",
  other: "Other"
};

const STATUS_CONFIG = {
  new: { label: "New", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  responded: { label: "Responded", color: "bg-green-100 text-green-800", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-800", icon: XCircle }
};

export default function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    contactReason: "",
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

  // Load contacts data
  const loadContacts = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...filters,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      const response = await getAllContacts(params);
      const data = response.data || response;

      if (page === 1) {
        setContacts(data.contacts || []);
      } else {
        setContacts(prev => [...prev, ...(data.contacts || [])]);
      }

      setPagination(prev => ({
        ...prev,
        page,
        total: data.total || 0,
        hasMore: (page * pagination.limit) < (data.total || 0)
      }));

    } catch (error) {
      console.error("Error loading contacts:", error);
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadContacts(1);
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
  const handleStatusUpdate = async (contactId, newStatus, notes = "") => {
    try {
      setUpdating(true);
      await updateContactStatus(contactId, newStatus, notes);

      // Update local state
      setContacts(prev => prev.map(contact =>
        contact.id === contactId
          ? { ...contact, status: newStatus, respondedAt: newStatus === 'responded' ? new Date() : contact.respondedAt }
          : contact
      ));

      toast.success("Contact status updated successfully");
      setShowContactModal(false);
    } catch (error) {
      console.error("Error updating contact status:", error);
      toast.error("Failed to update contact status");
    } finally {
      setUpdating(false);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = async (contactId) => {
    try {
      await markContactAsRead(contactId);

      // Update local state
      setContacts(prev => prev.map(contact =>
        contact.id === contactId
          ? { ...contact, readAt: new Date() }
          : contact
      ));

      // Refresh unread count in sidebar
      if (window.refreshUnreadContactsCount) {
        window.refreshUnreadContactsCount();
      }

      toast.success("Contact marked as read");
    } catch (error) {
      console.error("Error marking contact as read:", error);
      toast.error("Failed to mark contact as read");
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllContactsAsRead();

      // Update local state
      setContacts(prev => prev.map(contact => ({ ...contact, readAt: new Date() })));

      // Refresh unread count in sidebar
      if (window.refreshUnreadContactsCount) {
        window.refreshUnreadContactsCount();
      }

      toast.success("All contacts marked as read");
    } catch (error) {
      console.error("Error marking all contacts as read:", error);
      toast.error("Failed to mark all contacts as read");
    }
  };

  // Handle contact deletion
  const handleDeleteContact = async (contactId) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      await deleteContact(contactId);
      setContacts(prev => prev.filter(contact => contact.id !== contactId));
      toast.success("Contact deleted successfully");
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      await downloadContactsDataAsExcel(contacts);
      toast.success("Contacts exported successfully");
    } catch (error) {
      console.error("Error exporting contacts:", error);
      toast.error("Failed to export contacts");
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
          <h1 className="text-xl md:text-2xl font-bold">Contact Management</h1>
          <p className="text-sm text-gray-500">Manage contact form submissions and inquiries</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Mail size={16} />
            Mark All as Read
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={16} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          {/* Reason Filter */}
          <select
            value={filters.contactReason}
            onChange={(e) => handleFilterChange('contactReason', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="">All Reasons</option>
            <option value="complaint">Complaint / Feedback</option>
            <option value="partnership">Partnership / Collaboration</option>
            <option value="information">Request Information</option>
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
            <option value="status-ASC">Status A-Z</option>
          </select>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
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
              {contacts.map((contact) => {
                const StatusIcon = STATUS_CONFIG[contact.status]?.icon;
                const isUnread = !contact.readAt;
                return (
                  <tr key={contact.id} className={`hover:bg-gray-50 ${isUnread ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isUnread && (
                          <button
                            onClick={() => handleMarkAsRead(contact.id)}
                            className="text-blue-600 hover:text-blue-900 mr-2"
                            title="Mark as Read"
                          >
                           <svg className="fill-blue-600 hover:fill-blue-900" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="24px"><path d="M480-480Zm280-160q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q28 0 55.5 4t54.5 12q-11 17-18 36.5T562-788q-20-6-40.5-9t-41.5-3q-134 0-227 93t-93 227q0 134 93 227t227 93q134 0 227-93t93-227q0-21-3-41.5t-9-40.5q20-3 39.5-10t36.5-18q8 27 12 54.5t4 55.5q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-57-216 273-273q-20-7-37.5-17.5T625-611L424-410 310-522l-56 56 169 170Z"/></svg>
                
                          </button>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contact.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contact.email}
                          </div>
                          {contact.phone && (
                            <div className="text-sm text-gray-500">
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {CONTACT_REASONS[contact.contactReason] || contact.contactReason}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[contact.status]?.color}`}>
                        {StatusIcon && <StatusIcon size={12} />}
                        {STATUS_CONFIG[contact.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(contact.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {contact.attachment ? (
                        <a
                          href={contact.attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                          title="Download Attachment"
                        >
                          <Download size={12} />
                          {contact.attachmentName || 'Download'}
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">No attachment</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedContact(contact);
                            setShowContactModal(true);
                          }}
                          className="text-brand-600 hover:text-brand-900"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(contact.id, contact.status === 'new' ? 'in_progress' : 'responded')}
                          className="text-green-600 hover:text-green-900"
                          title="Mark as Responded"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
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

        {contacts.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No contacts found</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading contacts...</p>
          </div>
        )}
      </div>

      {/* Contact Details Modal */}
      {showContactModal && selectedContact && (
        <div style={{marginTop:0}} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Contact Details</h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContact.fullName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">
                      <a href={`mailto:${selectedContact.email}`} className="text-brand-600 hover:underline">
                        {selectedContact.email}
                      </a>
                    </p>
                  </div>
                  {selectedContact.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedContact.phone}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reason</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {CONTACT_REASONS[selectedContact.contactReason] || selectedContact.contactReason}
                    </p>
                  </div>
                </div>

                {selectedContact.companyName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContact.companyName}</p>
                  </div>
                )}

                {selectedContact.website && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <p className="mt-1 text-sm text-gray-900">
                      <a href={selectedContact.website} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                        {selectedContact.website}
                      </a>
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedContact.message}</p>
                  </div>
                </div>

                {selectedContact.attachment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Attachment</label>
                    <div className="mt-1">
                      <a
                        href={selectedContact.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Download size={16} />
                        {selectedContact.attachmentName || 'Download Attachment'}
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={selectedContact.status}
                    onChange={(e) => handleStatusUpdate(selectedContact.id, e.target.value)}
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
                      const subject = `Re: ${CONTACT_REASONS[selectedContact.contactReason]} - ${selectedContact.fullName}`;
                      const body = `Hi ${selectedContact.fullName},\n\nThank you for your inquiry. `;
                      window.open(`mailto:${selectedContact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                    }}
                    className="flex-1 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    Reply via Email
                  </button>
                  <button
                    onClick={() => setShowContactModal(false)}
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