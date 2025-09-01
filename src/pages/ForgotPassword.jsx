import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "../lib/toast";
import client from "../api/client";
import Input from "../components/Input";

const emailOK = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").toLowerCase());

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!email) { setErr("Email is required."); return false; }
    if (!emailOK(email)) { setErr("Please enter a valid email."); return false; }
    setErr("");
    return true;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) { toast.error("Please fix the highlighted fields."); return; }
    setLoading(true);
    try {
      const p = client.post("/auth/forgot-password", { email });
      await toast.promise(
        p,
        { loading: "Sending reset link…", success: "Reset link sent! Check your inbox.", error: "Failed to send reset email." },
        { id: "forgot" }
      );
      navigate("/reset-email-sent", { state: { email } });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10
      bg-[conic-gradient(at_10%_-10%,#FDF2FF_0%,#FFF7ED_30%,#FFFFFF_60%)] sm:px-6 md:px-8">
      <div className="w-full max-w-md rounded-3xl bg-white/90 shadow-2xl ring-1 ring-black/5 backdrop-blur p-6 sm:p-8 md:p-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center">Forgot your password?</h1>
        <p className="mt-3 text-center text-slate-600">Enter your email and we’ll send you a reset link.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={err}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-brand-700 to-brand-500 py-3 font-semibold text-white shadow-soft hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"/>
              </svg>
            )}
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-brand-700 hover:underline">Back to Sign in</Link>
        </div>
      </div>
    </div>
  );
}
