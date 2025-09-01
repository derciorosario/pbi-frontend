import React from "react";
import { useLocation, Link } from "react-router-dom";

export default function VerifyEmailSent() {
  const { state } = useLocation();
  const email = state?.email;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10
      bg-[conic-gradient(at_10%_-10%,#FDF2FF_0%,#FFF7ED_30%,#FFFFFF_60%)]
      sm:px-6 md:px-8">
      <div className="w-full max-w-xl">
        <div className="rounded-3xl bg-white/90 shadow-2xl ring-1 ring-black/5
            backdrop-blur p-6 sm:p-8 md:p-10">
          {/* Icon */}
          <div className="mx-auto mb-5 sm:mb-6 grid h-14 w-14 place-items-center
              rounded-full bg-green-100 text-green-600">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m22 4-12 12-3-3" />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-900">
            Email Sent!
          </h1>

          {/* Body */}
          <p className="mt-3 text-center text-base sm:text-lg text-slate-600">
            Please check {email ? <b>{email}</b> : "your email"} for the verification link.
          </p>
          <p className="mt-2 text-center text-sm sm:text-base text-slate-500">
            If you don’t see it, check your spam folder.
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3
                         text-sm font-medium text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
            >
              Back to Sign In
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-700 to-brand-500
                         px-5 py-3 text-sm font-semibold text-white shadow-soft hover:opacity-95 w-full sm:w-auto"
            >
              Create another account
            </Link>
          </div>
        </div>

        {/* Subtle footer hint */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Didn’t receive the email? Wait a minute and try resending from the app.
        </p>
      </div>
    </div>
  );
}
