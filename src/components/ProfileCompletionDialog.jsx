import React, { useState } from "react";
import { X, EyeOff } from "lucide-react";
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
    let next = value;

    if (name === "professionalTitle" && value.length > 50) {
      next = value.slice(0, 50);
    }
    if (name === "about" && value.length > 300) {
      next = value.slice(0, 300);
    }

    setForm((prev) => ({ ...prev, [name]: next }));
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

        {/* Profile Visibility Notice */}
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <EyeOff size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Your profile is currently hidden
            </p>
            <p className="text-xs text-amber-700 mt-1">
              {isCompany
                ? "Your company profile will remain hidden from other users until you complete these basic details. You can update this information anytime in your profile settings."
                : "Your profile will remain hidden from other users until you complete these basic details. You can update this information anytime in your profile settings."
              }
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
         
         <div className="space-y-1">
           <div className="flex justify-between items-center">
             <label className="text-sm font-medium text-gray-700">
               {isCompany ? "Company Area or Focus" : "Job Title or Role"}
             </label>
             <span
               className={`text-xs ${
                 form.professionalTitle.length > 50 ? "text-red-600" : "text-gray-500"
               }`}
             >
               {form.professionalTitle.length}/50
             </span>
           </div>
           <Input
             name="professionalTitle"
             placeholder={
               isCompany
                 ? "e.g. Technology, Finance, Marketing, Logistics"
                 : "e.g. Software Engineer, Marketing Manager"
             }
             value={form.professionalTitle}
             onChange={onChange}
             error={errors.professionalTitle}
           />
         </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label htmlFor="about" className="text-sm font-medium text-gray-700">
                {isCompany ? "About Your Company" : "About You"}
              </label>
              <span
                className={`text-xs ${
                  form.about.length > 300 ? "text-red-600" : "text-gray-500"
                }`}
              >
                {form.about.length}/300
              </span>
            </div>
            <textarea
              id="about"
              name="about"
              placeholder={
                isCompany
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
            {loading ? "Saving..." : "Save details & make profile visible"}
          </button>

          <p className="text-xs text-gray-500 text-center">
            {isCompany
              ? "Complete these details to make your company profile visible to others."
              : "Complete these details to make your profile visible to others."
            }
          </p>
        </form>
      </div>
    </div>
  );
}