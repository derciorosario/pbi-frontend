import client from './client';

// Get list of organizations for selection
export const getOrganizations = async () => {
  const response = await client.get('/organization/organizations');
  return response.data;
};

// Submit organization join request
export const submitJoinRequest = async (organizationId, message = null) => {
  const response = await client.post('/organization/join-request', {
    organizationId,
    message
  });
  return response.data;
};

// Get join requests for organization (admin view)
export const getJoinRequests = async () => {
  const response = await client.get('/organization/join-requests');
  return response.data;
};

// Approve join request
export const approveJoinRequest = async (requestId) => {
  const response = await client.put(`/organization/join-requests/${requestId}/approve`);
  return response.data;
};

// Reject join request
export const rejectJoinRequest = async (requestId) => {
  const response = await client.put(`/organization/join-requests/${requestId}/reject`);
  return response.data;
};

// Cancel join request (by user)
export const cancelJoinRequest = async (requestId) => {
  const response = await client.put(`/organization/join-requests/${requestId}/cancel`);
  return response.data;
};

// Get user's organization membership status
export const getMembershipStatus = async () => {
  const response = await client.get('/organization/membership-status');
  return response.data;
};