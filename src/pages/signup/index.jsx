// src/pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/Input.jsx";
import TabSwitch from "../../components/TabSwitch.jsx";
import LeftPanel from "../../components/LeftPanel.jsx";
import { toast } from "../../lib/toast";
import client from "../../api/client.js";
import COUNTRIES from "../../constants/countries.js";
import GoogleCustomBtn from "../../components/GoogleBtn.jsx";

const emailOK = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").toLowerCase());

export default function Signup() {
  const [acct, setAcct] = useState("individual");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
    tos: false
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
    tos: ""
  });

  // NEW: show/hide toggles
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // clear that field's error while typing
  };

  // Labels change with account type, but variable names DO NOT change
  const labelName = acct === "company" ? "Company name" : "Name";
  const labelEmail = acct === "company" ? "Company email" : "Email Address";
  const labelPhone = acct === "company" ? "Company phone" : "Phone Number";

  function validate() {
    const next = {
      name: "",
      email: "",
      phone: "",
      country: "",
      password: "",
      confirmPassword: "",
      tos: ""
    };

    if (!form.name) next.name = `${labelName} is required.`;
    if (!form.email) next.email = `${labelEmail} is required.`;
    else if (!emailOK(form.email)) next.email = "Please enter a valid email.";
    if (!form.phone) next.phone = `${labelPhone} is required.`;
    else if (String(form.phone).replace(/\D/g, "").length < 6)
      next.phone = "Please enter a valid phone number.";
    if (!form.country) next.country = "Country is required.";
    if (!form.password) next.password = "Password is required.";
    else if (form.password.length < 6)
      next.password = "Use at least 6 characters.";
    if (!form.confirmPassword) next.confirmPassword = "Please confirm password.";
    else if (form.password !== form.confirmPassword)
      next.confirmPassword = "Passwords do not match.";
    if (!form.tos) next.tos = "You must agree to the Terms and Privacy Policy.";

    setErrors(next);
    return Object.values(next).every((v) => !v);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    try {
      // Build payload with same variable names; include account type
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        country: form.country,
        password: form.password,
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
      navigate("/verify-email-sent", { state: { email } });
    } catch {
      // toast already handled
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left panel */}
      <div className="hidden md:block">
        <LeftPanel />
      </div>

      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-2xl">


           <div
        className="md:hidden  mb-7 top-6 left-6 flex items-center gap-2 cursor-pointer z-10"
        onClick={() => navigate("/")}
      >
        <div
          className="h-9 w-9 rounded-xl grid place-items-center text-white font-bold"
          style={{ background: "linear-gradient(135deg,#8A358A,#9333EA)" }}
        >
          P
        </div>
        <div className="leading-tight">
          <div className="font-semibold text-gray-900">54LINKS</div>
          <div className="text-[11px] text-gray-500 -mt-1">
            Business Initiative
          </div>
        </div>
      </div>


          <h2 className="text-3xl font-bold text-gray-900">Join 54LINKS</h2>
          <p className="mt-1 text-gray-500">Join the global networking community</p>

          <div className="max-w-xs">
            <TabSwitch />
          </div>

          {/* Account type */}
          <div className="mt-6 flex gap-3">
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

          {/* Form */}
          <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name (dynamic label, same variable name) */}
            <div className="md:col-span-2">
              <Input
                label={labelName}
                name="name"
                placeholder={acct === "company" ? "Panafrican BI Ltd." : "John Doe"}
                value={form.name}
                onChange={onChange}
                error={errors.name}
              />
            </div>

            {/* Email (dynamic label, same variable name) */}
            <div className="md:col-span-1">
              <Input
                label={labelEmail}
                name="email"
                type="email"
                placeholder={acct === "company" ? "contact@yourcompany.com" : "john@example.com"}
                value={form.email}
                onChange={onChange}
                error={errors.email}
              />
            </div>

            {/* Phone (dynamic label, same variable name) */}
            <div className="md:col-span-1">
              <Input
                label={labelPhone}
                name="phone"
                placeholder={acct === "company" ? "Phone" : "Phone"}
                value={form.phone}
                onChange={onChange}
                error={errors.phone}
              />
            </div>

            {/* Country */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-sm font-medium text-gray-700">Country</label>
              <select
                name="country"
                value={form.country}
                onChange={onChange}
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-brand-500 focus:ring-2 bg-white ${
                  errors.country ? "border-red-400 focus:ring-red-400" : "border-gray-200"
                }`}
              >
                <option value="" disabled>Select your country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.country && <p className="text-xs text-red-600">{errors.country}</p>}
            </div>

            {/* Passwords with show/hide */}
            <Input
              label="Password"
              name="password"
              type={showPwd1 ? "text" : "password"}
              placeholder="Create a strong password"
              value={form.password}
              onChange={onChange}
              error={errors.password}
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
              value={form.confirmPassword}
              onChange={onChange}
              error={errors.confirmPassword}
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
                checked={form.tos}
                onChange={onChange}
                className={`mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 ${
                  errors.tos ? "ring-2 ring-red-400" : ""
                }`}
              />
              <p className="text-gray-600">
                I agree to the{" "}
                <a href="/terms" className="text-brand-600 underline">Terms of Service</a> and{" "}
                <a href="/privacy" className="text-brand-600 underline">Privacy Policy</a>
              </p>
            </div>
            {errors.tos && (
              <div className="md:col-span-2 -mt-2">
                <p className="text-xs text-red-600">{errors.tos}</p>
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
          </form>
        </div>
      </div>
    </div>
  );
}
