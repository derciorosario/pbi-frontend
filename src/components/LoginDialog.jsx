import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "./Input.jsx";
import client from "../api/client.js";
import { toast } from "../lib/toast";
import GoogleCustomBtn from "./GoogleBtn.jsx";
import { X } from "lucide-react";
import COUNTRIES from "../constants/countries.js";

const emailOK = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").toLowerCase());

export default function LoginDialog({ isOpen, onClose, initialTab = "signup" }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab); // Use the initialTab prop
  const [loginForm, setLoginForm] = useState({ email: "", password: "", remember: false });
  const [loginErrors, setLoginErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  
  // Signup form state
  const [acct, setAcct] = useState("individual");
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
    tos: false
  });
  const [signupErrors, setSignupErrors] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
    tos: ""
  });
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token") || localStorage.getItem("auth_token");
    setHasToken(Boolean(t));
  }, []);

  const onLoginChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setLoginErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const onSignupChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSignupForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setSignupErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Labels change with account type, but variable names DO NOT change
  const labelName = acct === "company" ? "Company name" : "Name";
  const labelEmail = acct === "company" ? "Company email" : "Email Address";
  const labelPhone = acct === "company" ? "Company phone" : "Phone Number";

  function validateLogin() {
    const next = { email: "", password: "" };
    if (!loginForm.email) next.email = "Email is required.";
    else if (!emailOK(loginForm.email)) next.email = "Please enter a valid email.";
    if (!loginForm.password) next.password = "Password is required.";
    setLoginErrors(next);
    return !next.email && !next.password;
  }

  function validateSignup() {
    const next = {
      name: "",
      email: "",
      phone: "",
      country: "",
      password: "",
      confirmPassword: "",
      tos: ""
    };

    if (!signupForm.name) next.name = `${labelName} is required.`;
    if (!signupForm.email) next.email = `${labelEmail} is required.`;
    else if (!emailOK(signupForm.email)) next.email = "Please enter a valid email.";
    if (!signupForm.phone) next.phone = `${labelPhone} is required.`;
    else if (String(signupForm.phone).replace(/\D/g, "").length < 6)
      next.phone = "Please enter a valid phone number.";
    if (!signupForm.country) next.country = "Country is required.";
    if (!signupForm.password) next.password = "Password is required.";
    else if (signupForm.password.length < 6)
      next.password = "Use at least 6 characters.";
    if (!signupForm.confirmPassword) next.confirmPassword = "Please confirm password.";
    else if (signupForm.password !== signupForm.confirmPassword)
      next.confirmPassword = "Passwords do not match.";
    if (!signupForm.tos) next.tos = "You must agree to the Terms and Privacy Policy.";

    setSignupErrors(next);
    return Object.values(next).every((v) => !v);
  }

  async function onLoginSubmit(e) {
    e.preventDefault();
    if (!validateLogin()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setLoading(true);
    try {
      const promise = client.post("/auth/login", {
        email: loginForm.email,
        password: loginForm.password
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
        onClose(); // Close the dialog after successful login
        window.location.href="/"; // Refresh the page
      }
    } catch {
      /* toast shown by toast.promise */
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  async function onSignupSubmit(e) {
    e.preventDefault();
    if (!validateSignup()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    try {
      // Build payload with same variable names; include account type
      const payload = {
        name: signupForm.name,
        email: signupForm.email,
        phone: signupForm.phone,
        country: signupForm.country,
        password: signupForm.password,
        account_type: acct // "individual" | "company"
      };

      const promise = client.post("/auth/signup", payload);

      const res = await toast.promise(
        promise,
        {
          loading: "Creating your account…",
          success: "Account created! 🎉",
          error: (err) => err?.response?.data?.message || "Sign up failed."
        },
        { id: "signup" }
      );

      // After signup, go to "Email Sent" page
      const email = res?.data?.email || payload.email;
      onClose(); // Close the dialog after successful signup
      navigate("/verify-email-sent", { state: { email } });
    } catch {
      // toast already handled
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`relative w-full ${activeTab!="signup" ? 'max-w-md':'max-w-lg'} bg-white rounded-xl shadow-xl p-6 md:p-8 max-h-[90vh] overflow-y-auto`}>
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        
        {/* Dynamic header based on token presence */}
        {hasToken ? (
          <>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="mt-1 text-gray-500">Sign in to continue your professional journey</p>
          </>
        ) : (
          <>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">54Links</h2>
            <p className="mt-1 text-gray-600">
              Discover, connect, and collaborate across Africa.
            </p>
            <p className="mt-1 text-gray-500">{activeTab === "login" ? "Log in to start connecting." : "Join the global networking community"}</p>
          </>
        )}

        {/* Custom Tab Switch */}
        <div className="mt-6 grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-sm">
          <button
            onClick={() => setActiveTab("login")}
            className={`text-center rounded-lg py-2 font-medium transition ${activeTab === "login" ? "bg-white shadow-soft text-brand-700" : "text-gray-600 hover:text-gray-900"}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`text-center rounded-lg py-2 font-medium transition ${activeTab === "signup" ? "bg-white shadow-soft text-brand-700" : "text-gray-600 hover:text-gray-900"}`}
          >
            Sign Up
          </button>
        </div>

        {activeTab === "login" ? (
          <form onSubmit={onLoginSubmit} className="mt-6 space-y-4">
            <Input
              name="email"
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={loginForm.email}
              onChange={onLoginChange}
              error={loginErrors.email}
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
              value={loginForm.password}
              onChange={onLoginChange}
              error={loginErrors.password}
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
                  checked={loginForm.remember}
                  onChange={onLoginChange}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-gray-600">Remember me</span>
              </label>
              <button 
                type="button"
                onClick={() => navigate("/forgot")}
                className="text-brand-500 hover:underline"
              >
                Forgot password?
              </button>
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
            
            {/* Sign up link */}
            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">Don't have an account?</span>{" "}
              <button
                type="button"
                onClick={() => setActiveTab("signup")}
                className="text-brand-500 hover:underline font-medium"
              >
                Sign up
              </button>
            </div>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={onSignupSubmit} className="mt-6">
            {/* Account type */}
            <div className="flex gap-3 mb-4">
              <button
                type="button"
                onClick={() => setAcct("individual")}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                  acct === "individual"
                    ? "border-brand-500 text-brand-700 bg-brand-50"
                    : "border-gray-200 text-gray-700"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5ZM3 22a9 9 0 1 1 18 0Z" />
                </svg>
                Individual
              </button>
              <button
                type="button"
                onClick={() => setAcct("company")}
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm ${
                  acct === "company"
                    ? "border-brand-500 text-brand-700 bg-brand-50"
                    : "border-gray-200 text-gray-700"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 21V3h8v6h10v12H3Z" />
                </svg>
                Company
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name (dynamic label, same variable name) */}
              <div className="md:col-span-2">
                <Input
                  label={labelName}
                  name="name"
                  placeholder={acct === "company" ? "Panafrican BI Ltd." : "John Doe"}
                  value={signupForm.name}
                  onChange={onSignupChange}
                  error={signupErrors.name}
                />
              </div>

              {/* Email (dynamic label, same variable name) */}
              <div className="md:col-span-1">
                <Input
                  label={labelEmail}
                  name="email"
                  type="email"
                  placeholder={acct === "company" ? "contact@yourcompany.com" : "john@example.com"}
                  value={signupForm.email}
                  onChange={onSignupChange}
                  error={signupErrors.email}
                />
              </div>

              {/* Phone (dynamic label, same variable name) */}
              <div className="md:col-span-1">
                <Input
                  label={labelPhone}
                  name="phone"
                  placeholder={acct === "company" ? "Phone" : "Phone"}
                  value={signupForm.phone}
                  onChange={onSignupChange}
                  error={signupErrors.phone}
                />
              </div>

              {/* Country */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium text-gray-700">Country</label>
                <select
                  name="country"
                  value={signupForm.country}
                  onChange={onSignupChange}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-brand-500 focus:ring-2 bg-white ${
                    signupErrors.country ? "border-red-400 focus:ring-red-400" : "border-gray-200"
                  }`}
                >
                  <option value="" disabled>Select your country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {signupErrors.country && <p className="text-xs text-red-600">{signupErrors.country}</p>}
              </div>

              {/* Passwords with show/hide */}
              <Input
                label="Password"
                name="password"
                type={showPwd1 ? "text" : "password"}
                placeholder="Create a strong password"
                value={signupForm.password}
                onChange={onSignupChange}
                error={signupErrors.password}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPwd1((s) => !s)}
                    aria-label={showPwd1 ? "Hide password" : "Show password"}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    {showPwd1 ? (
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
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type={showPwd2 ? "text" : "password"}
                placeholder="Confirm your password"
                value={signupForm.confirmPassword}
                onChange={onSignupChange}
                error={signupErrors.confirmPassword}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPwd2((s) => !s)}
                    aria-label={showPwd2 ? "Hide password" : "Show password"}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    {showPwd2 ? (
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

              {/* TOS */}
              <div className="md:col-span-2 flex items-start gap-3 text-sm">
                <input
                  name="tos"
                  type="checkbox"
                  checked={signupForm.tos}
                  onChange={onSignupChange}
                  className={`mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 ${
                    signupErrors.tos ? "ring-2 ring-red-400" : ""
                  }`}
                />
                <p className="text-gray-600">
                  I agree to the{" "}
                  <a href="/terms" className="text-brand-600 underline">Terms of Service</a> and{" "}
                  <a href="/privacy" className="text-brand-600 underline">Privacy Policy</a>
                </p>
              </div>
              {signupErrors.tos && (
                <div className="md:col-span-2 -mt-2">
                  <p className="text-xs text-red-600">{signupErrors.tos}</p>
                </div>
              )}

              {/* Submit */}
              <div className="md:col-span-2 space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-brand-700 to-brand-500 py-3 font-semibold text-white shadow-soft hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && (
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                    </svg>
                  )}
                  {loading ? "Creating Account…" : "Create Account"}
                </button>

                {/* Optional Google button */}
                <GoogleCustomBtn page="signup" /> 
              </div>
              
              {/* Login link */}
              <div className="md:col-span-2 text-center text-sm mt-4">
                <span className="text-gray-600">Already have an account?</span>{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="text-brand-500 hover:underline font-medium"
                >
                  Sign in
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}