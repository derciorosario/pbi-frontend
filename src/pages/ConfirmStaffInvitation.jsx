import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from '../lib/toast';
import { getInvitationDetails, confirmStaffInvitation } from '../api/company';

const ConfirmStaffInvitation = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setError('Invalid or missing invitation token');
      setLoading(false);
      return;
    }

    // Fetch invitation details
    const fetchInvitation = async () => {
      try {
        const response = await getInvitationDetails(token);
        setInvitation(response.data.invitation);
        setCompany(response.data.company);
        console.log(response.data.company)
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError('Invalid or expired invitation token');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [companyId]);

  const handleAccept = async () => {
    try {
      setLoading(true);
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      await confirmStaffInvitation({ token });
      toast.success('Staff invitation accepted successfully!');
      navigate('/profile');
    } catch (err) {
      console.error('Error accepting invitation:', err);
      toast.error('Failed to accept invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      await confirmStaffInvitation({ token, action: 'reject' });
      toast.success('Staff invitation declined');
      navigate('/profile');
    } catch (err) {
      console.error('Error rejecting invitation:', err);
      toast.error('Failed to decline invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-10
                   bg-gradient-to-br from-brand-50 via-white to-brand-50
                   sm:px-6 md:px-8"
      >
        <div className="w-full max-w-xl">
          <div
            className="rounded-3xl bg-white/90 shadow-2xl ring-1 ring-black/5
                       backdrop-blur p-6 sm:p-8 md:p-10"
          >
            {/* Status Icon */}
            <div className="mx-auto mb-5 sm:mb-6 grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-brand-600">
              <svg className="h-7 w-7 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                />
              </svg>
            </div>

            {/* Heading */}
            <h1 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-900">
              Loading Invitation…
            </h1>

            {/* Message */}
            <p className="mt-3 text-center text-base sm:text-lg text-slate-600">
              Hold on while we validate your invitation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-10
                   bg-gradient-to-br from-brand-50 via-white to-brand-50
                   sm:px-6 md:px-8"
      >
        <div className="w-full max-w-xl">
          <div
            className="rounded-3xl bg-white/90 shadow-2xl ring-1 ring-black/5
                       backdrop-blur p-6 sm:p-8"
          >
            {/* Status Icon */}
            <div className="mx-auto mb-5 sm:mb-6 grid h-14 w-14 place-items-center rounded-full bg-red-100 text-red-600">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>

            {/* Heading */}
            <h1 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-900">
              Invalid Invitation
            </h1>

            {/* Message */}
            <p className="mt-3 text-center text-base sm:text-lg text-slate-600">
              {error}
            </p>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3
                           text-sm font-medium text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
              >
                Return to Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation || !company) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-10
                   bg-gradient-to-br from-brand-50 via-white to-brand-50
                   sm:px-6 md:px-8"
      >
        <div className="w-full max-w-md">
          <div
            className="rounded-3xl bg-white/90 shadow-2xl ring-1 ring-black/5
                       backdrop-blur p-6 sm:p-8"
          >
            {/* Status Icon */}
            <div className="mx-auto mb-5 sm:mb-6 grid h-14 w-14 place-items-center rounded-full bg-gray-100 text-gray-600">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            {/* Heading */}
            <h1 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-900">
              Invitation Not Found
            </h1>

            {/* Message */}
            <p className="mt-3 text-center text-base sm:text-lg text-slate-600">
              This invitation may have expired or been cancelled.
            </p>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3
                           text-sm font-medium text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
              >
                Return to Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10
                 bg-gradient-to-br from-brand-50 via-white to-brand-50
                 sm:px-6 md:px-8"
    >
      <div className="w-full max-w-xl">
        <div
          className="rounded-3xl bg-white/90 shadow-2xl ring-1 ring-black/5
                     backdrop-blur p-6 sm:p-8"
        >
          {/* Status Icon */}
          <div className="mx-auto mb-5 sm:mb-6 grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-brand-600">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-900">
            Staff Invitation
          </h1>

          {/* Message */}
          <p className="mt-3 text-center text-base sm:text-lg text-slate-600">
            You've been invited to join a company team
          </p>

          {/* Company Details */}
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900 mb-2">Company</h3>
              <p className="text-lg font-medium text-brand-600">{company.name}</p>
              {company.description && (
                <p className="text-sm text-slate-600 mt-1">{company.description}</p>
              )}
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900 mb-2">Role</h3>
              <p className="text-lg font-medium text-slate-900 capitalize">
                {invitation.role?.replace('_', ' ') || 'Staff Member'}
              </p>
            </div>

            {invitation.message && (
              <div className="rounded-xl bg-brand-50 p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Personal Message</h3>
                <p className="text-slate-700 italic">"{invitation.message}"</p>
              </div>
            )}

            <div className="rounded-xl bg-amber-50 p-4">
              <h3 className="font-semibold text-slate-900 mb-2">Invitation Details</h3>
              <p className="text-sm text-slate-600">
                Sent: <span className="font-medium">
                  {new Date(invitation.createdAt).toLocaleDateString()}
                </span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleReject}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3
                         text-sm font-medium text-gray-700 hover:bg-gray-50 w-full sm:w-auto disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Decline'}
            </button>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-700 to-brand-500
                         px-5 py-3 text-sm font-semibold text-white shadow-soft hover:opacity-95 w-full sm:w-auto disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Accept Invitation'}
            </button>
          </div>

          {/* Return Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/profile')}
              className="text-slate-500 hover:text-slate-700 text-sm"
            >
              Return to Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmStaffInvitation;