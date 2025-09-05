// src/pages/Login.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Input from "../../components/Input.jsx";
import TabSwitch from "../../components/TabSwitch.jsx";
import LeftPanel from "../../components/LeftPanel.jsx";
import client from "../../api/client.js";
import { toast } from "../../lib/toast";
import GoogleCustomBtn from "../../components/GoogleBtn.jsx";

const emailOK = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").toLowerCase());

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token") || localStorage.getItem("auth_token");
    setHasToken(Boolean(t));
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  function validate() {
    const next = { email: "", password: "" };
    if (!form.email) next.email = "Email is required.";
    else if (!emailOK(form.email)) next.email = "Please enter a valid email.";
    if (!form.password) next.password = "Password is required.";
    setErrors(next);
    return !next.email && !next.password;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setLoading(true);
    try {
      const promise = client.post("/auth/login", {
        email: form.email,
        password: form.password
      });

      const res = await toast.promise(
        promise,
        {
          loading: "Signing you in…",
          success: "Welcome back! 🎉",
          error: (err) => err?.response?.data?.message || "Login failed. Check your credentials."
        },
        { id: "login" }
      );

      const token = res?.data?.token;
      if (token) {
        // store under both keys for compatibility with other parts of the app
        localStorage.setItem("auth_token", token);
        localStorage.setItem("token", token);
        setHasToken(true);
      }
      //navigate("/dashboard");
      window.location.href="/"
    } catch {
      /* toast shown by toast.promise */
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
     
       {/* Home button at top-left */}
     

      <div className="hidden md:block">
        <LeftPanel />
      </div>

      {/* Right */}
      <div className="flex items-center justify-center p-6 md:p-10">
        
        <div className="w-full max-w-md">
          
        

          {/* Dynamic header based on token presence */}
          {hasToken ? (
            <>
              <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome Back</h2>
              <p className="mt-1 text-gray-500">Sign in to continue your professional journey</p>
            </>
          ) : (
            <>
              <h2 className="mt-6 text-3xl font-bold text-gray-900">Pan-African BI</h2>
              <p className="mt-1 text-gray-600">
                Discover, connect, and collaborate across Africa.
              </p>
              <p className="mt-1 text-gray-500">Log in to start connecting.</p>
            </>
          )}

          <TabSwitch />

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Input
              name="email"
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={onChange}
              error={errors.email}
              rightIcon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 6h16v12H4z"/><path d="m22 6-10 7L2 6"/>
                </svg>
              }
            />

            {/* PASSWORD with show/hide */}
            <Input
              name="password"
              label="Password"
              type={showPwd ? "text" : "password"}
              placeholder="Enter your password"
              value={form.password}
              onChange={onChange}
              error={errors.password}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  {showPwd ? (
                    // eye-off
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 3l18 18"/>
                      <path d="M10.6 10.6A2 2 0 0 0 12 14a2 2 0 0 0 1.4-.6M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9.3 3.1 11 7-0.5 1.3-1.2 2.5-2.2 3.6M6.7 6.7C4.7 7.8 3.1 9.3 2 12c1.1 2.7 3.1 4.6 5.5 5.8A11.9 11.9 0 0 0 12 19c.7 0 1.4-.1 2-.2"/>
                    </svg>
                  ) : (
                    // eye
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              }
            />

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  name="remember"
                  type="checkbox"
                  checked={form.remember}
                  onChange={onChange}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot" className="text-brand-500 hover:underline">Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 py-3 font-semibold text-white shadow-soft hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"/>
                </svg>
              )}
              {loading ? "Signing In..." : "Sign In"}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs uppercase tracking-wider text-gray-400">
                  or continue with
                </span>
              </div>
            </div>

            {/* Google custom button with required style */}
            <GoogleCustomBtn page="signin" />
          </form>
        </div>
      </div>
    </div>
  );
}
