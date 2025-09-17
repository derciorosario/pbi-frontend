import React, { useState } from "react";
import { X } from "lucide-react";
import Input from "./Input.jsx";
import { updatePersonal } from "../api/profile";
import { toast } from "../lib/toast";
import { useAuth } from "../contexts/AuthContext";

export default function ProfileCompletionDialog({ isOpen, onClose }) {
  const { profile, refreshAuth, user } = useAuth();
  const isCompany = user?.accountType === 'company';
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    professionalTitle: profile?.professionalTitle || "",
    about: profile?.about || "",
  });
  const [errors, setErrors] = useState({
    professionalTitle: "",
    about: "",
  });

  if (!isOpen) return null;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {
      professionalTitle: !form.professionalTitle ? (isCompany ? "Please enter your company role or position" : "Please enter your job title or role") : "",
      about: !form.about ? (isCompany ? "Please tell us a bit about your company" : "Please tell us a bit about yourself") : "",
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await updatePersonal({
        professionalTitle: form.professionalTitle,
        about: form.about,
      });

      toast.success("Details saved!");
      await refreshAuth();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ zIndex: 999 }}
      className="fixed inset-0 flex items-center justify-center bg-black/50"
      aria-modal="true"
      role="dialog"
    >
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-6 md:p-8 max-h-[80vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
          type="button"
        >
          <X size={24} />
        </button>

        <h2 className="mt-2 text-[1.4rem] font-bold text-gray-900 mb-[0.5rem]">
          {isCompany ? "Help others get to know your company" : "Help others get to know you"}
        </h2>
        <p className="mt-1 text-gray-500">
          {isCompany
            ? "Add a company title and short description now. You can update the rest anytime."
            : "Add a title and short intro now. You can update the rest anytime."
          }
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            name="professionalTitle"
            label={isCompany ? "Company Role or Position" : "Job Title or Role"}
            placeholder={isCompany ? "e.g. CEO, Marketing Director, Operations Manager" : "e.g. Software Engineer, Marketing Manager"}
            value={form.professionalTitle}
            onChange={onChange}
            error={errors.professionalTitle}
          />

          <div className="space-y-1">
            <label htmlFor="about" className="text-sm font-medium text-gray-700">
              {isCompany ? "About Your Company" : "About You"}
            </label>
            <textarea
              id="about"
              name="about"
              placeholder={isCompany
                ? "Tell us about your company, what you do, and what you're looking for"
                : "Tell us about yourself, your experience, and what you're looking for"
              }
              value={form.about}
              onChange={onChange}
              rows={4}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-brand-500 focus:ring-2 ${
                errors.about ? "border-red-400 focus:ring-red-400" : "border-gray-200"
              }`}
            />
            {errors.about && <p className="text-xs text-red-600">{errors.about}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 py-3 font-semibold text-white shadow-soft hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
              </svg>
            )}
            {loading ? "Saving..." : "Save details"}
          </button>

          {/* Optional small hint below the button */}
          <p className="text-xs text-gray-500 text-center">
            {isCompany
              ? "Just enough for others to recognize your company's work."
              : "Just enough for others to recognize your work."
            }
          </p>
        </form>
      </div>
    </div>
  );
}






