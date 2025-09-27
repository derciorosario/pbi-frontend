import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "./Input.jsx";
import client from "../api/client.js";
import { toast } from "../lib/toast";
import GoogleCustomBtn from "./GoogleBtn.jsx";
import { X } from "lucide-react";
import COUNTRIES from "../constants/countries.js";
import { useRef } from "react";

const emailOK = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").toLowerCase());

export default function LoginDialog({ isOpen, onClose, initialTab = "signup" }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [activeTab, setActiveTab] = useState(initialTab); // Use the initialTab prop
  const [loginForm, setLoginForm] = useState({ email: "", password: "", remember: false });
  const [loginErrors, setLoginErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [showAccountTypeModal, setShowAccountTypeModal] = useState(false);


  
  // Signup form state
  const [acct, setAcct] = useState("individual");
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
    tos: false,
    // Individual fields
    avatarUrl: null,
    avatarPreview: null,
    birthDate: "",
    gender: "",
    nationality: "",
    // Company fields
    otherCountries: [],
    webpage: ""
  });
  const [signupErrors, setSignupErrors] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
    tos: "",
    avatarUrl: "",
    birthDate: "",
    gender: "",
    nationality: "",
    otherCountries: "",
    webpage: ""
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

  const onFileChange = (name, file) => {
    if (file) {
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setSignupErrors((prev) => ({
          ...prev,
          [name]: "File size must be less than 5MB"
        }));
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setSignupErrors((prev) => ({
          ...prev,
          [name]: "Please select a valid image file (JPG, PNG, GIF)"
        }));
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setSignupForm((f) => ({
          ...f,
          avatarUrl: base64, // Store base64 data in avatarUrl
          avatarPreview: base64  // Store preview
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setSignupForm((f) => ({
        ...f,
        avatarUrl: null,
        avatarPreview: null
      }));
    }
    setSignupErrors((prev) => ({ ...prev, avatarUrl: "" }));
  };

  // Labels change with account type, but variable names DO NOT change
  const labelName = acct === "company" ? "Organization name" : "Name";
  const labelEmail = acct === "company" ? "Organization email" : "Email Address";
  const labelPhone = acct === "company" ? "Organization phone" : "Phone Number";

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
      tos: "",
      birthDate: "",
      gender: "",
      nationality: "",
      otherCountries: "",
      webpage: ""
    };

    if (!signupForm.name) {
      next.name = `${labelName} is required.`;
    } else if (signupForm.name.trim().length < 2) {
      next.name = `${labelName} must be at least 2 characters long.`;
    } else if (!/^[a-zA-Z\s\-'\.]+$/.test(signupForm.name.trim())) {
      next.name = `${labelName} can only contain letters, spaces, hyphens, apostrophes, and periods.`;
    }
    if (!signupForm.email) next.email = `${labelEmail} is required.`;
    else if (!emailOK(signupForm.email)) next.email = "Please enter a valid email.";
    if (!signupForm.phone) next.phone = `${labelPhone} is required.`;
    else {
      const phoneDigits = String(signupForm.phone).replace(/\D/g, "");
      if (phoneDigits.length < 6) {
        next.phone = "Please enter a valid phone number.";
      } else if (phoneDigits.length > 15) {
        next.phone = "Phone number is too long.";
      } else if (!/^\+?[\d\s\-\(\)]+$/.test(signupForm.phone)) {
        next.phone = "Please enter a valid phone number format.";
      }
    }
    if (!signupForm.country) next.country = "Country is required.";
    if (!signupForm.password) next.password = "Password is required.";
    else if (signupForm.password.length < 8) {
      next.password = "Password must be at least 8 characters long.";
    }
    if (!signupForm.confirmPassword) next.confirmPassword = "Please confirm password.";
    else if (signupForm.password !== signupForm.confirmPassword)
      next.confirmPassword = "Passwords do not match.";
    if (!signupForm.tos) next.tos = "You must agree to the Terms and Privacy Policy.";

    // Individual-specific validation
    if (acct === "individual") {
      if (!signupForm.birthDate) {
        next.birthDate = "Birth date is required.";
      } else {
        const birthDate = new Date(signupForm.birthDate);
        const today = new Date();
        const minAge = 13; // Minimum age requirement
        const maxAge = 120; // Maximum reasonable age

        if (birthDate > today) {
          next.birthDate = "Birth date cannot be in the future.";
        } else {
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < minAge) {
            next.birthDate = "You must be at least 13 years old.";
          } else if (age > maxAge) {
            next.birthDate = "Please enter a valid birth date.";
          }
        }
      }

      if (!signupForm.gender) next.gender = "Gender is required.";
      if (!signupForm.nationality) next.nationality = "Nationality is required.";
    }

    // Company-specific validation
    if (acct === "company") {
      // Company website is optional, but if provided, must be valid URL
        const domainPattern = /^(https?:\/\/)?([\w-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;
        if (!domainPattern.test(signupForm.webpage.trim())) {
          next.webpage = "Please enter a valid website address (e.g. google.com)";
        }
      // Other countries is optional - no validation needed
    }
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
      // Build payload with correct field names that match backend expectations
      const payload = {
        name: signupForm.name,
        email: signupForm.email,
        phone: signupForm.phone,
        countryOfResidence: signupForm.country, // Backend expects countryOfResidence
        password: signupForm.password,
        accountType: acct, // "individual" | "company"
        // Individual fields
        avatarUrl: signupForm.avatarUrl, // Send base64 data
        birthDate: signupForm.birthDate,
        gender: signupForm.gender,
        nationality: signupForm.nationality,
        // Company fields
        otherCountries: signupForm.otherCountries,
        webpage: signupForm.webpage
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
      <div  ref={containerRef} className={`relative w-full ${activeTab!="signup" ? 'max-w-md':'max-w-2xl'} bg-white rounded-xl translate-y-5 shadow-xl p-6 md:p-8 max-h-[85vh]  ${showAccountTypeModal ? 'overflow-hidden':'overflow-y-auto'}`}>
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
            <GoogleCustomBtn page="signin" showAccountTypeModalChange={(value)=>{
                     setShowAccountTypeModal(value)
                      if (value && containerRef.current) {
                         containerRef.current.scrollTo({ top: 0, behavior: "instant" });
                      }
                }} />
            
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
          <form onSubmit={onSignupSubmit} className={`mt-6`}>
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
                Organization
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name (dynamic label, same variable name) */}
              <div className="md:col-span-2">
                <Input
                  label={labelName}
                  name="name"
                  placeholder={acct === "company" ? "54Links Ltd." : "John Doe"}
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
                  type="tel"
                  onWheel={e => e.currentTarget.blur()}
                  placeholder={acct === "company" ? "Phone" : "Phone"}
                  value={signupForm.phone}
                  onChange={(e) => {
                    const { name, value: newValue } = e.target;
                    // Allow only one "+" and it should be at the beginning, no spaces allowed
                    const cleaned = newValue.replace(/[^+\d\-\(\)]/g, '');
                    const plusCount = (cleaned.match(/\+/g) || []).length;
                    if (plusCount > 1) {
                      // If more than one +, remove all + and add one at the beginning
                      const withoutPlus = cleaned.replace(/\+/g, '');
                      setSignupForm((f) => ({ ...f, [name]: '+' + withoutPlus }));
                    } else {
                      setSignupForm((f) => ({ ...f, [name]: cleaned }));
                    }
                    setSignupErrors((prev) => ({ ...prev, [name]: "" })); // clear that field's error while typing
                  }}
                  error={signupErrors.phone}
                />
              </div>

              {/* Country */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium text-gray-700">Country of residence</label>
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

              {/* Individual-specific fields */}
              {acct === "individual" && (
                <>
                  {/* Avatar (optional) */}
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-sm font-medium text-gray-700">Profile Picture (Optional)</label>
                    <div className="flex items-center gap-6">
                      {/* Image Preview */}
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full border-2 border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                          {signupForm.avatarPreview ? (
                            <img
                              src={signupForm.avatarPreview}
                              alt="Profile preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                              <circle cx="12" cy="7" r="4"/>
                            </svg>
                          )}
                        </div>
                        {signupForm.avatarPreview && (
                          <button
                            type="button"
                            onClick={() => onFileChange('avatar', null)}
                            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Upload Button */}
                      <div className="flex-1">
                        <input
                          type="file"
                          name="avatar"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            onFileChange('avatar', file);
                          }}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <label
                          htmlFor="avatar-upload"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 border border-brand-200 rounded-lg cursor-pointer hover:bg-brand-100 transition-colors"
                        >
                          
                          {signupForm.avatarUrl ? "Change Picture" : "Upload Picture"}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          {signupForm.avatarPreview ? "Image selected" : "JPG, PNG up to 5MB"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Birth Date */}
                  <div className="md:col-span-1 space-y-1">
                    <label className="text-sm font-medium text-gray-700">Birth Date</label>
                    <input
                      type="date"
                      name="birthDate"
                      value={signupForm.birthDate}
                      onChange={onSignupChange}
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-brand-500 focus:ring-2 bg-white ${
                        signupErrors.birthDate ? "border-red-400 focus:ring-red-400" : "border-gray-200"
                      }`}
                    />
                    {signupErrors.birthDate && <p className="text-xs text-red-600">{signupErrors.birthDate}</p>}
                  </div>

                  {/* Gender */}
                  <div className="md:col-span-1 space-y-1">
                    <label className="text-sm font-medium text-gray-700">Gender</label>
                    <select
                      name="gender"
                      value={signupForm.gender}
                      onChange={onSignupChange}
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-brand-500 focus:ring-2 bg-white ${
                        signupErrors.gender ? "border-red-400 focus:ring-red-400" : "border-gray-200"
                      }`}
                    >
                      <option value="" disabled>Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                    {signupErrors.gender && <p className="text-xs text-red-600">{signupErrors.gender}</p>}
                  </div>

                  {/* Nationality */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-sm font-medium text-gray-700">Nationality</label>
                    <select
                      name="nationality"
                      value={signupForm.nationality}
                      onChange={onSignupChange}
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-brand-500 focus:ring-2 bg-white ${
                        signupErrors.nationality ? "border-red-400 focus:ring-red-400" : "border-gray-200"
                      }`}
                    >
                      <option value="" disabled>Select your nationality</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    {signupErrors.nationality && <p className="text-xs text-red-600">{signupErrors.nationality}</p>}
                  </div>
                </>
              )}

              {/* Company-specific fields */}
              {acct === "company" && (
                <>
                  {/* Logo (optional) */}
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-sm font-medium text-gray-700">Company Logo (Optional)</label>
                    <div className="flex items-center gap-6">
                      {/* Logo Preview */}
                      <div className="relative">
                        <div className="w-20 h-20 rounded-lg border-2 border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                          {signupForm.avatarPreview ? (
                            <img
                              src={signupForm.avatarPreview}
                              alt="Logo preview"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                              <circle cx="9" cy="9" r="2"/>
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                            </svg>
                          )}
                        </div>
                        {signupForm.avatarPreview && (
                          <button
                            type="button"
                            onClick={() => onFileChange('avatar', null)}
                            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Upload Button */}
                      <div className="flex-1">
                        <input
                          type="file"
                          name="avatar"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            onFileChange('avatar', file);
                          }}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <label
                          htmlFor="avatar-upload"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 border border-brand-200 rounded-lg cursor-pointer hover:bg-brand-100 transition-colors"
                        >
                        
                          {signupForm.avatarUrl ? "Change Logo" : "Upload Logo"}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          {signupForm.avatarPreview ? "Logo selected" : "JPG, PNG up to 5MB"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Other Countries of Operations */}
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Other Countries of Operations (Branches) <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>

                    {/* Selected Countries Chips */}
                    {signupForm.otherCountries.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {signupForm.otherCountries.map((country) => (
                          <div
                            key={country}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-brand-100 text-brand-800 rounded-full text-sm"
                          >
                            <span>{country}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSignupForm(prev => ({
                                  ...prev,
                                  otherCountries: prev.otherCountries.filter(c => c !== country)
                                }));
                              }}
                              className="text-brand-600 hover:text-brand-800"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Country Selector */}
                    <div className="relative">
                      <select
                        value=""
                        onChange={(e) => {
                          const selectedCountry = e.target.value;
                          if (selectedCountry && !signupForm.otherCountries.includes(selectedCountry)) {
                            setSignupForm(prev => ({
                              ...prev,
                              otherCountries: [...prev.otherCountries, selectedCountry]
                            }));
                          }
                          e.target.value = ""; // Reset select
                        }}
                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-brand-500 focus:ring-2 bg-white ${
                          signupErrors.otherCountries ? "border-red-400 focus:ring-red-400" : "border-gray-200"
                        }`}
                      >
                        <option value="" disabled>Add a country...</option>
                        {COUNTRIES
                          .filter(country => !signupForm.otherCountries.includes(country))
                          .map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">
                      Select countries where your company has branches or operations (optional)
                    </p>
                    {signupErrors.otherCountries && <p className="text-xs text-red-600">{signupErrors.otherCountries}</p>}
                  </div>

                  {/* Webpage */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Company Website <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      name="webpage"
                      placeholder="https://www.yourcompany.com"
                      value={signupForm.webpage}
                      onChange={onSignupChange}
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-brand-500 focus:ring-2 bg-white ${
                        signupErrors.webpage ? "border-red-400 focus:ring-red-400" : "border-gray-200"
                      }`}
                    />
                    {signupErrors.webpage && <p className="text-xs text-red-600">{signupErrors.webpage}</p>}
                  </div>
                </>
              )}

              {/* Passwords with show/hide */}
              <Input
                label="Password"
                name="password"
                type={showPwd1 ? "text" : "password"}
                placeholder="At least 8 characters"
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
                  <a href="/terms" target="_blank"
                   rel="noopener noreferrer" className="text-brand-600 underline">Terms of Service</a> and{" "}
                  <a href="/privacy" target="_blank"
                    rel="noopener noreferrer" className="text-brand-600 underline">Privacy Policy</a>
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
                <GoogleCustomBtn page="signup" showAccountTypeModalChange={(value)=>{
                     setShowAccountTypeModal(value)
                      if (value && containerRef.current) {
                         containerRef.current.scrollTo({ top: 0, behavior: "instant" });
                      }
                }} /> 
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