import React from "react";
import { useLocation, Link } from "react-router-dom";

export default function ResetEmailSent() {
  const { state } = useLocation();
  const email = state?.email;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10
      bg-[conic-gradient(at_10%_-10%,#FDF2FF_0%,#FFF7ED_30%,#FFFFFF_60%)] sm:px-6 md:px-8">
      <div className="w-full max-w-xl rounded-3xl bg-white/90 shadow-2xl ring-1 ring-black/5 backdrop-blur p-6 sm:p-8 md:p-10 text-center">
        <div className="mx-auto mb-5 sm:mb-6 grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-600">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m22 4-12 12-3-3" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Reset Email Sent!</h1>
        <p className="mt-3 text-base sm:text-lg text-slate-600">
          We sent a password reset link to {email ? <b>{email}</b> : "your email"}.
        </p>
        <p className="mt-2 text-sm sm:text-base text-slate-500">If you don’t see it, check your spam folder.</p>

        <div className="mt-8">
          <Link to="/login" className="text-brand-700 hover:underline">Back to Sign in</Link>
        </div>
      </div>
    </div>
  );
}
