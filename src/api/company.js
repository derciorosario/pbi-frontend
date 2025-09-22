import api from './client';

// Company representative routes
export const inviteRepresentative = (data) =>
  api.post('/company/representative/invite', data);

export const authorizeRepresentative = (data) =>
  api.put('/company/representative/authorize', data);

export const getCompanyRepresentatives = () =>
  api.get('/company/representatives');

export const revokeRepresentative = (representativeId) =>
  api.delete(`/company/representative/${representativeId}`);

// Company staff routes
export const inviteStaff = (data) =>
  api.post('/company/staff/invite', data);

export const confirmStaffInvitation = (data) =>
  api.put('/company/staff/confirm', data);

export const getCompanyStaff = () =>
  api.get('/company/staff');

export const removeStaff = (staffId) =>
  api.delete(`/company/staff/${staffId}`);

// Company invitation routes
export const getCompanyInvitations = (params = {}) =>
  api.get('/company/invitations', { params });

export const cancelInvitation = (invitationId) =>
  api.put(`/company/invitations/${invitationId}/cancel`);

export const resendInvitation = (invitationId) =>
  api.put(`/company/invitations/${invitationId}/resend`);

// Get invitation details (for confirmation pages)
export const getInvitationDetails = (token) =>
  api.get(`/company/invitation/${token}`);

// User search for invitations
export const searchUsers = (query) =>
  api.get('/users/search', { params: { q: query, accountType: 'individual' } });