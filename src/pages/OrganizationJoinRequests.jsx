import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from '../lib/toast';
import client from '../api/client';
import Header from '../components/Header';

const OrganizationJoinRequests = () => {
  const { id: requestId, token } = useParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [singleRequest, setSingleRequest] = useState(null);
  const [isTokenAccess, setIsTokenAccess] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load data on mount and when route params change
  useEffect(() => {
    const loadData = async () => {
      if (requestId && token && 0==1) {
        // Handle email link access
        setIsTokenAccess(true);
        await loadSingleRequest(requestId, token);
      } else {
        // Handle normal admin access
        setIsTokenAccess(false);
        if (!hasLoaded) {
          await loadJoinRequests();
          setHasLoaded(true);
        }
      }
    };

    loadData();
  }, [requestId, token, hasLoaded]);

  const loadJoinRequests = async () => {
    try {
      setLoading(true);
      const response = await client.get('/organization/join-requests');
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Failed to load join requests:', error);
      toast.error('Failed to load join requests');
    } finally {
      setLoading(false);
    }
  };

  const loadSingleRequest = async (id, requestToken) => {
    try {
      setLoading(true);
      // For token-based access, we need to validate the token on the backend
      // This would require a new endpoint or modification to existing one
      const response = await client.get(`/organization/join-requests/${id}?token=${requestToken}`);
      setSingleRequest(response.data.request);
    } catch (error) {
      console.error('Failed to load join request:', error);
      toast.error('Invalid or expired join request link');
      // Redirect to login or show error
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      setProcessingRequest(requestId);
      toast.loading('Approving join request...', { id: 'approve-request' });

      const response = await client.put(`/organization/join-requests/${requestId}/approve`);

      toast.success('Join request approved successfully!', { id: 'approve-request' });

      // Reload requests to show updated status
      loadJoinRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error('Failed to approve join request', { id: 'approve-request' });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setProcessingRequest(requestId);
      toast.loading('Rejecting join request...', { id: 'reject-request' });

      const response = await client.put(`/organization/join-requests/${requestId}/reject`);

      toast.success('Join request rejected', { id: 'reject-request' });

      // Reload requests to show updated status
      loadJoinRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Failed to reject join request', { id: 'reject-request' });
    } finally {
      setProcessingRequest(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejected</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Cancelled</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Render single request view for token access
  if (isTokenAccess) {
    return (
      <div>
        <Header />
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Join Request Details</h1>
              <p className="text-gray-600 mt-1">
                Review this join request from an email link
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading join request...</p>
              </div>
            ) : singleRequest ? (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {singleRequest.user.avatarUrl ? (
                        <img
                          src={singleRequest.user.avatarUrl}
                          alt={singleRequest.user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {singleRequest.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900">{singleRequest.user.name}</h3>
                        {getStatusBadge(singleRequest.status)}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">{singleRequest.user.email}</div>
                      {singleRequest.user.city && singleRequest.user.country && (
                        <div className="text-xs text-gray-500 mb-2">
                          📍 {singleRequest.user.city}, {singleRequest.user.country}
                        </div>
                      )}
                      {singleRequest.message && (
                        <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-2">
                          <strong>Message:</strong> "{singleRequest.message}"
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-2">
                        Requested {new Date(singleRequest.requestedAt).toLocaleDateString()} at{' '}
                        {new Date(singleRequest.requestedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {singleRequest.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(singleRequest.id)}
                        disabled={processingRequest === singleRequest.id}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {processingRequest === singleRequest.id ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                            </svg>
                            Approving...
                          </>
                        ) : (
                          'Approve'
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectRequest(singleRequest.id)}
                        disabled={processingRequest === singleRequest.id}
                        className="px-3 py-1 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
                      >
                        {processingRequest === singleRequest.id ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                            </svg>
                            Rejecting...
                          </>
                        ) : (
                          'Reject'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Request not found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This join request link may be invalid or expired.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render admin list view for normal access
  return (
    <div>
      <Header />
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Organization Join Requests</h1>
              <p className="text-gray-600 mt-1">
                Review and manage requests from users who want to join your organization
              </p>
            </div>
            <button
              onClick={loadJoinRequests}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading join requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No join requests</h3>
              <p className="mt-1 text-sm text-gray-500">
                When users request to join your organization, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {request.user.avatarUrl ? (
                          <img
                            src={request.user.avatarUrl}
                            alt={request.user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {request.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900">{request.user.name}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">{request.user.email}</div>
                        {request.user.city && request.user.country && (
                          <div className="text-xs text-gray-500 mb-2">
                            📍 {request.user.city}, {request.user.country}
                          </div>
                        )}
                        {request.message && (
                          <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-2">
                            <strong>Message:</strong> "{request.message}"
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-2">
                          Requested {new Date(request.createdAt).toLocaleDateString()} at{' '}
                          {new Date(request.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          disabled={processingRequest === request.id}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          {processingRequest === request.id ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-3 w-3 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                              </svg>
                              Approving...
                            </>
                          ) : (
                            'Approve'
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          disabled={processingRequest === request.id}
                          className="px-3 py-1 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
                        >
                          {processingRequest === request.id ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-3 w-3 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                              </svg>
                              Rejecting...
                            </>
                          ) : (
                            'Reject'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationJoinRequests;