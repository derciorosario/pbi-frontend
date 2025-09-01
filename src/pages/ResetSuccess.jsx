import React from "react";
import { Link } from "react-router-dom";

export default function ResetSuccess() {
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

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Password reset successfully</h1>
        <p className="mt-3 text-base sm:text-lg text-slate-600">
          Your password has been updated. You can now sign in with your new password.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-700 to-brand-500
                       px-6 py-3 text-sm font-semibold text-white shadow-soft hover:opacity-95"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
