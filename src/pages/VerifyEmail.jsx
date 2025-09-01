import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import { toast } from "../lib/toast";

const REDIRECT_DELAY_MS = 3200; // delay before redirecting after success

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // "verifying" | "success" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function run() {
      try {
        const p = client.get(`/auth/verify/${token}`);
        await toast.promise(
          p,
          {
            loading: "Verifying your email…",
            success: "Email verified!",
            error: "Verification failed."
          },
          { id: "verify" }
        );

        setStatus("success");
        setMessage("Your email has been verified.");
        setTimeout(() => navigate("/login"), REDIRECT_DELAY_MS);
      } catch (err) {
        setStatus("error");
        setMessage(
          "This verification link is no longer valid—it may have expired or already been used. " +
          "Please request a new link and try again. If you’ve already verified, you can sign in."
        );
      }
    }

    if (token) run();
  }, [token, navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10
                 bg-[conic-gradient(at_10%_-10%,#FDF2FF_0%,#FFF7ED_30%,#FFFFFF_60%)]
                 sm:px-6 md:px-8"
    >
      <div className="w-full max-w-xl">
        <div
          className="rounded-3xl bg-white/90 shadow-2xl ring-1 ring-black/5
                     backdrop-blur p-6 sm:p-8 md:p-10"
        >
          {/* Status Icon */}
          <div
            className={`mx-auto mb-5 sm:mb-6 grid h-14 w-14 place-items-center rounded-full
              ${
                status === "success"
                  ? "bg-green-100 text-green-600"
                  : status === "error"
                  ? "bg-red-100 text-red-600"
                  : "bg-purple-100 text-purple-600"
              }`}
          >
            {status === "verifying" && (
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
            )}
            {status === "success" && (
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="m22 4-12 12-3-3" />
              </svg>
            )}
            {status === "error" && (
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            )}
          </div>

          {/* Heading */}
          <h1 className="text-center text-2xl sm:text-3xl font-extrabold text-slate-900">
            {status === "success"
              ? "Verified!"
              : status === "error"
              ? "We couldn’t verify your email"
              : "Verifying…"}
          </h1>

          {/* Message */}
          <p className="mt-3 text-center text-base sm:text-lg text-slate-600">
            {message || (status === "verifying" ? "Hold on while we validate your token." : "")}
          </p>

          {/* Actions */}
          {status === "error" && (
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
                Create account
              </Link>
            </div>
          )}

          {status === "success" && (
            <p className="mt-6 text-center text-sm text-gray-500">
              Redirecting to your dashboard…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
