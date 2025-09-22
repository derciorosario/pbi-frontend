import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from '../lib/toast';
import client from '../api/client';

export default function AuthorizeRepresentative() {
  const { companyId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Authorization token is missing');
      setLoading(false);
      return;
    }

    // Authorize the representative
    authorizeRepresentative();
  }, [token, companyId]);

  async function authorizeRepresentative() {
    try {
      setLoading(true);

      const response = await client.put('/company/representative/authorize', {
        token: token
      });

      if (response.data.success) {
        toast.success('Successfully authorized as company representative!');
        // Redirect to profile after a short delay
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      }
    } catch (error) {
      console.error('Authorization error:', error);

      if (error.response?.data?.message) {
        const backendMessage = error.response.data.message;

        if (backendMessage.includes('Invalid or expired')) {
          setError('This authorization link has expired or is invalid. Please request a new authorization.');
        } else if (backendMessage.includes('not authorized')) {
          setError('You are not authorized to accept this invitation.');
        } else if (backendMessage.includes('Already authorized')) {
          setError('You are already authorized as a representative for this company.');
          // Redirect to profile after showing message
          setTimeout(() => {
            navigate('/profile');
          }, 3000);
        } else {
          setError(`Authorization failed: ${backendMessage}`);
        }
      } else {
        setError('Authorization failed. Please try again or request a new authorization link.');
      }
    } finally {
      setLoading(false);
    }
  }

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
                       backdrop-blur p-6 sm:p-8 md:p-10 text-center"
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
              Authorizing…
            </h1>

            {/* Message */}
            <p className="mt-3 text-center text-base sm:text-lg text-slate-600">
              Please wait while we process your authorization.
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
                       backdrop-blur p-6 sm:p-8 md:p-10"
          >
            {/* Status Icon */}
            <div className="mx-auto mb-5 sm:mb-6 grid h-14 w-14 place-items-center rounded-full bg-red-100 text-red-600">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>

            {/* Heading */}
            <h1 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-900">
              Authorization Failed
            </h1>

            {/* Message */}
            <p className="mt-3 text-center text-base sm:text-lg text-slate-600">
              {error}
            </p>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3
                           text-sm font-medium text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
              >
                Go to Profile
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-700 to-brand-500
                           px-5 py-3 text-sm font-semibold text-white shadow-soft hover:opacity-95 w-full sm:w-auto"
              >
                Try Again
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
                     backdrop-blur p-6 sm:p-8 md:p-10 text-center"
        >
          {/* Status Icon */}
          <div className="mx-auto mb-5 sm:mb-6 grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-brand-600">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m22 4-12 12-3-3" />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-900">
            Authorized!
          </h1>

          {/* Message */}
          <p className="mt-3 text-center text-base sm:text-lg text-slate-600">
            You have been successfully authorized as a company representative.
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-700 to-brand-500
                         px-5 py-3 text-sm font-semibold text-white shadow-soft hover:opacity-95 w-full sm:w-auto"
            >
              Go to Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}