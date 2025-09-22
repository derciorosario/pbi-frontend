import React, { useState, useEffect } from 'react';
import { toast } from '../lib/toast';
import client from '../api/client';

const OrganizationSelectionModal = ({
  isOpen,
  onClose,
  onSuccess,
  title = "Join Organization",
  description = "Select an organization you'd like to join and send a request."
}) => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMessageForm, setShowMessageForm] = useState(false);

  // Load organizations on modal open
  useEffect(() => {
    if (isOpen) {
      loadOrganizations();
    }
  }, [isOpen]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const response = await client.get('/organization/organizations');
      setOrganizations(response.data.organizations || []);
    } catch (error) {
      console.error('Failed to load organizations:', error);
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrganization = (org) => {
    setSelectedOrg(org);
    setShowMessageForm(true);
  };

  const handleBackToList = () => {
    setSelectedOrg(null);
    setMessage('');
    setShowMessageForm(false);
  };

  const handleSubmitRequest = async () => {
    if (!selectedOrg) {
      toast.error('Please select an organization');
      return;
    }

    try {
      setSubmitting(true);
      toast.loading('Sending join request...', { id: 'join-request' });

      const response = await client.post('/organization/join-request', {
        organizationId: selectedOrg.id,
        message: message.trim() || null
      });

      toast.success('Join request sent successfully!', { id: 'join-request' });

      if (onSuccess) {
        onSuccess(response.data.request);
      }

      // Reset form and close modal
      setSelectedOrg(null);
      setMessage('');
      setShowMessageForm(false);
      onClose();
    } catch (error) {
      console.error('Failed to submit join request:', error);

      if (error.response?.data?.message) {
        toast.error(error.response.data.message, { id: 'join-request' });
      } else {
        toast.error('Failed to send join request', { id: 'join-request' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {showMessageForm && (
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Back to organization list"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </button>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {showMessageForm ? 'Send Join Request' : title}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {showMessageForm
                  ? `Request to join ${selectedOrg?.name}`
                  : description
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showMessageForm ? (
            <>
              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              {/* Organizations List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading organizations...</p>
                  </div>
                ) : filteredOrganizations.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-5 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h-4m-2-5a2 2 0 011-2h2a2 2 0 012 2m-2 2v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h-4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No organizations found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm ? 'Try adjusting your search terms.' : 'No organizations are available at the moment.'}
                    </p>
                  </div>
                ) : (
                  filteredOrganizations.map((org) => (
                    <div
                      key={org.id}
                      onClick={() => handleSelectOrganization(org)}
                      className="border border-gray-200 rounded-lg p-4 cursor-pointer transition-all hover:border-gray-300 hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {org.avatarUrl ? (
                            <img
                              src={org.avatarUrl}
                              alt={org.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-gray-600 font-semibold text-lg">
                                {org.name.charAt(0).toUpperCase()}
                              </span>

                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">{org.name}</h3>
                          <span className="text-sm opacity-80">{org.email}</span>
                          <div className="text-sm text-gray-500">
                            {org.city && org.country && (
                              <span>{org.city}, {org.country}</span>
                            )}
                            {org.webpage && (
                              <span className="ml-2">
                                <a
                                  href={org.webpage}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand-600 hover:text-brand-800"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Website
                                </a>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Message Form */
            <div className="space-y-6">
              {/* Selected Organization */}
              <div className="border border-brand-200 rounded-lg p-4 bg-brand-50">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {selectedOrg.avatarUrl ? (
                      <img
                        src={selectedOrg.avatarUrl}
                        alt={selectedOrg.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-600 font-semibold text-lg">
                          {selectedOrg.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{selectedOrg.name}</h3>
                    <span className="text-sm opacity-80">{selectedOrg.email}</span>
                    <div className="text-sm text-gray-500">
                      {selectedOrg.city && selectedOrg.country && (
                        <span>{selectedOrg.city}, {selectedOrg.country}</span>
                      )}
                      {selectedOrg.webpage && (
                        <span className="ml-2">
                          <a
                            href={selectedOrg.webpage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-600 hover:text-brand-800"
                          >
                            Website
                          </a>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell the organization why you'd like to join..."
                  rows="4"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {message.length}/500 characters
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-xl">
          <div>
            {!showMessageForm && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {showMessageForm && (
              <button
                onClick={handleBackToList}
                disabled={submitting}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Back to Organizations
              </button>
            )}
            {showMessageForm && (
              <button
                onClick={handleSubmitRequest}
                disabled={submitting}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                    </svg>
                    Sending Request...
                  </>
                ) : (
                  'Send Join Request'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSelectionModal;