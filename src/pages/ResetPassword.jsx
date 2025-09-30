import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "../lib/toast";
import client from "../api/client";
import Input from "../components/Input";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  const [showPwd1, setShowPwd1] = useState(false); // <-- NEW
  const [showPwd2, setShowPwd2] = useState(false); // <-- NEW

  function validate() {
    const n = { password: "", confirm: "" };
    if (!password) n.password = "Password is required.";
    else if (password.length < 6) n.password = "Use at least 6 characters.";
    else if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&_\-])[A-Za-z\d@$!%*?&_\-]+$/.test(password)) {
      n.password = "Create a strong password with a mix of letters, numbers and symbols.";
    }
    if (!confirm) n.confirm = "Please confirm your password.";
    else if (password !== confirm) n.confirm = "Passwords do not match.";
    setErr(n);
    return !n.password && !n.confirm;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) { toast.error("Please fix the highlighted fields."); return; }
    setLoading(true);
    try {
      const p = client.post(`/auth/reset-password`, { token, password });
      await toast.promise(
        p,
        { loading: "Updating password…", success: "Password updated. You can sign in now.", error: "Reset failed." },
        { id: "reset" }
      );
      navigate("/reset-success");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10
      bg-gradient-to-br from-brand-50 via-white to-brand-50 sm:px-6 md:px-8">
      <div className="w-full max-w-md rounded-3xl bg-white/90 shadow-2xl ring-1 ring-black/5 backdrop-blur p-6 sm:p-8 md:p-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center">Create a new password</h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
         
          <div>

             <Input
            label="New password"
            type={showPwd1 ? "text" : "password"}
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a strong password"
            error={err.password}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPwd1((s) => !s)}
                aria-label={showPwd1 ? "Hide password" : "Show password"}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                {showPwd1 ? (
                  /* eye-off */
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 3l18 18"/>
                    <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9.3 3.1 11 7-0.5 1.3-1.2 2.5-2.2 3.6M6.7 6.7C4.7 7.8 3.1 9.3 2 12c1.1 2.7 3.1 4.6 5.5 5.8A11.9 11.9 0 0 0 12 19c.7 0 1.4-.1 2-.2"/>
                  </svg>
                ) : (
                  /* eye */
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            }
          />

           {!err.password &&  <p className="text-xs text-gray-500 my-2">Create a strong password with a mix of letters, numbers and symbols.</p>}

          </div>

          <Input
            label="Confirm password"
            type={showPwd2 ? "text" : "password"}
            name="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your password"
            error={err.confirm}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPwd2((s) => !s)}
                aria-label={showPwd2 ? "Hide password" : "Show password"}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                {showPwd2 ? (
                  /* eye-off */
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 3l18 18"/>
                    <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9.3 3.1 11 7-0.5 1.3-1.2 2.5-2.2 3.6M6.7 6.7C4.7 7.8 3.1 9.3 2 12c1.1 2.7 3.1 4.6 5.5 5.8A11.9 11.9 0 0 0 12 19c.7 0 1.4-.1 2-.2"/>
                  </svg>
                ) : (
                  /* eye */
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            }
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
            {loading ? "Saving…" : "Reset password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-brand-700 hover:underline">Back to Sign in</Link>
        </div>
      </div>
    </div>
  );
}
