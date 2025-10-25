import React, { useState, useRef } from "react";
import { X } from "lucide-react";
import Input from "./Input.jsx";
import SearchableSelect from "./SearchableSelect.jsx";
import { toast } from "../lib/toast";
import { useAuth } from "../contexts/AuthContext";
import { uploadClient } from "../api/client";

const SUPPORT_REASONS = [
  { value: "technical", label: "Technical Error / System Failure" },
  { value: "account", label: "Login / Access Problem" },
  { value: "data", label: "Incorrect or Outdated Data" },
  { value: "general", label: "Improvement Suggestion" },
  { value: "other", label: "Other" }
];

export default function SupportDialog({ isOpen, onClose }) {
  const containerRef = useRef(null);
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || profile?.name || "",
    email: user?.email || profile?.email || "",
    phone: user?.phone || profile?.phone || "",
    supportReason: "",
    priority: "medium",
    message: "",
    attachment: null,
    attachmentPreview: null
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (file) => {
    if (file) {
      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          attachment: "File size must be less than 10MB"
        }));
        return;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          attachment: "Please select a valid file (Images, PDF, Word documents, or text files)"
        }));
        return;
      }

      // Convert to base64 for preview (for images)
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result;
          setFormData(prev => ({
            ...prev,
            attachment: base64,
            attachmentPreview: base64
          }));
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files, just store the file
        setFormData(prev => ({
          ...prev,
          attachment: file,
          attachmentPreview: null
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        attachment: null,
        attachmentPreview: null
      }));
    }
    setErrors(prev => ({ ...prev, attachment: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!user) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = "Full name is required.";
      } else if (formData.fullName.trim().length < 2) {
        newErrors.fullName = "Full name must be at least 2 characters long.";
      }

      const emailOK = (v) =>
        /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(String(v || "").toLowerCase());

      if (!formData.email.trim()) {
        newErrors.email = "Email is required.";
      } else if (!emailOK(formData.email.toLowerCase())) {
        newErrors.email = "Please enter a valid email address.";
      }
    }

    // Phone validation - only if provided and not empty
    if (formData.phone && formData.phone.trim()) {
      const phoneDigits = formData.phone.replace(/\D/g, "");
      if (phoneDigits.length < 6) {
        newErrors.phone = "Phone number must be at least 6 digits.";
      } else if (phoneDigits.length > 15) {
        newErrors.phone = "Phone number is too long (max 15 digits).";
      } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
        newErrors.phone = "Please enter a valid phone number format.";
      }
    }

    if (!formData.supportReason) {
      newErrors.supportReason = "Please select a reason for support.";
    }

    if (!formData.priority) {
      newErrors.priority = "Please select a priority level.";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required.";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters long.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    try {
      console.log("Submitting support request...");
      // Build form data for file upload
      const submitData = new FormData();
      submitData.append('fullName', formData.fullName);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone || '');
      submitData.append('supportReason', formData.supportReason);
      submitData.append('priority', formData.priority);
      submitData.append('message', formData.message);

      // Handle file attachment
      if (formData.attachment) {
        if (typeof formData.attachment === 'string') {
          // Base64 image data - convert to blob
          const response = await fetch(formData.attachment);
          const blob = await response.blob();
          submitData.append('attachment', blob, 'attachment');
        } else {
          // File object
          submitData.append('attachment', formData.attachment);
        }
      }

      const promise = uploadClient.post("/support", submitData);
      console.log("API call made to /support");

      await toast.promise(
        promise,
        {
          loading: "Sending your support request…",
          success: "Support request sent successfully! We'll get back to you soon.",
          error: (err) => {
            console.error("Support submission error:", err);
            return err?.response?.data?.message || "Failed to send support request. Please try again.";
          }
        },
        { id: "support" }
      );

      // Reset form and close dialog
      setFormData({
        fullName: user?.name || profile?.name || "",
        email: user?.email || profile?.email || "",
        phone: user?.phone || profile?.phone || "",
        supportReason: "",
        priority: "medium",
        message: "",
        attachment: null,
        attachmentPreview: null
      });
      onClose();
    } catch (error) {
      console.error("Support submission error:", error);
      // toast already handled
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div ref={containerRef} className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl p-6 md:p-8 max-h-[85vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Support</h2>
          <p className="mt-1 text-gray-600">
            Need help? Our support team is here to assist you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          {user ? (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-50 grid place-items-center overflow-hidden flex-shrink-0">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-semibold text-brand-600 text-sm">
                      {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : "U"}
                    </span>
                  )}
                </div>
                <div className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50 text-gray-900">
                  {formData.fullName}
                </div>
              </div>
            </div>
          ) : (
            <Input
              label="Full Name *"
              name="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleInputChange}
              error={errors.fullName}
            />
          )}

          {/* Email and Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user ? (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <div className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50 text-gray-900">
                  {formData.email}
                </div>
              </div>
            ) : (
              <Input
                label="Email Address *"
                name="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
              />
            )}
            {user?.phone ? (
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-gray-50 text-gray-900">
                  {formData.phone}
                </div>
              </div>
            ) : (
              <Input
                label="Phone Number"
                name="phone"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => {
                  const { name, value: newValue } = e.target;
                  const cleaned = newValue.replace(/[^+\d\s\-\(\)]/g, '');
                  const plusCount = (cleaned.match(/\+/g) || []).length;
                  if (plusCount > 1) {
                    const withoutPlus = cleaned.replace(/\+/g, '');
                    setFormData(prev => ({ ...prev, [name]: '+' + withoutPlus }));
                  } else {
                    setFormData(prev => ({ ...prev, [name]: cleaned }));
                  }
                  setErrors(prev => ({ ...prev, [name]: "" }));
                }}
                error={errors.phone}
              />
            )}
          </div>

          {/* Support Reason */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Reason for Support *
            </label>
            <select
              name="supportReason"
              value={formData.supportReason}
              onChange={handleInputChange}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-brand-500 focus:ring-2 bg-white ${
                errors.supportReason ? "border-red-400 focus:ring-red-400" : "border-gray-200"
              }`}
            >
              <option value="" disabled>Select a reason</option>
              {SUPPORT_REASONS.map(reason => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
            {errors.supportReason && <p className="text-xs text-red-600">{errors.supportReason}</p>}
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Request Priority *
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="priority"
                  value="low"
                  checked={formData.priority === "low"}
                  onChange={handleInputChange}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700">Low – Does not prevent platform use</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="priority"
                  value="medium"
                  checked={formData.priority === "medium"}
                  onChange={handleInputChange}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700">Medium – Partially impacts use</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="priority"
                  value="high"
                  checked={formData.priority === "high"}
                  onChange={handleInputChange}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700">High – Completely prevents use</span>
              </label>
            </div>
            {errors.priority && <p className="text-xs text-red-600">{errors.priority}</p>}
          </div>

          {/* Message */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Message *
            </label>
            <textarea
              name="message"
              rows={5}
              placeholder="Please describe your issue in detail..."
              value={formData.message}
              onChange={handleInputChange}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-brand-500 focus:ring-2 bg-white resize-none ${
                errors.message ? "border-red-400 focus:ring-red-400" : "border-gray-200"
              }`}
            />
            {errors.message && <p className="text-xs text-red-600">{errors.message}</p>}
          </div>

          {/* File Attachment */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Attachment (Optional)
            </label>
            <div className="flex items-center gap-6">
              {/* File Preview */}
              <div className="relative">
                <div className="w-20 h-20 rounded-lg border-2 border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {formData.attachmentPreview ? (
                    <img
                      src={formData.attachmentPreview}
                      alt="Attachment preview"
                      className="w-full h-full object-cover"
                    />
                  ) : formData.attachment ? (
                    <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                    </svg>
                  )}
                </div>
                {formData.attachment && (
                  <button
                    type="button"
                    onClick={() => handleFileChange(null)}
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
                  name="attachment"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    handleFileChange(file);
                  }}
                  className="hidden"
                  id="support-attachment"
                />
                <label
                  htmlFor="support-attachment"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 border border-brand-200 rounded-lg cursor-pointer hover:bg-brand-100 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {formData.attachment ? "Change File" : "Upload File"}
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.attachment ? `${formData.attachment.name || 'File selected'}` : "Images, PDF, Word docs, or text files up to 10MB"}
                </p>
                {errors.attachment && <p className="text-xs text-red-600 mt-1">{errors.attachment}</p>}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white shadow-soft hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"/>
              </svg>
            )}
            {loading ? "Sending Request..." : "Send Request"}
          </button>
        </form>
      </div>
    </div>
  );
}