// src/pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/Input.jsx";
import TabSwitch from "../../components/TabSwitch.jsx";
import LeftPanel from "../../components/LeftPanel.jsx";
import SearchableSelect from "../../components/SearchableSelect.jsx";
import { toast } from "../../lib/toast";
import client from "../../api/client.js";
import COUNTRIES from "../../constants/countries.js";
import CITIES from "../../constants/cities.json";
import GoogleCustomBtn from "../../components/GoogleBtn.jsx";
import Logo from '../../assets/logo.png'
import WhiteLogo from '../../assets/logo-white.png'


const emailOK = (v) =>
   /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(String(v || "").toLowerCase());

// City options for SearchableSelect (limit to reasonable number)
const allCityOptions = CITIES.slice(0, 10000).map(city => ({
  value: city.city,
  label: `${city.city}${city.country ? `, ${city.country}` : ''}`,
  country: city.country
}));

// Get filtered cities for a specific country
const getCitiesForCountry = (country) => {
  if (!country) return [];
  return allCityOptions.filter((c) => c.country?.toLowerCase() === country.toLowerCase());
};

// Component for managing country-city pairs
const CountryCitySelector = ({ value, onChange, error }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCountry, setNewCountry] = useState("");
  const [newCity, setNewCity] = useState("");

  const handleAddCountryCity = () => {
    if (newCountry && newCity) {
      const newPair = { country: newCountry, city: newCity };
      onChange([...value, newPair]);
      setNewCountry("");
      setNewCity("");
      setShowAddForm(false);
    }
  };

  const handleRemoveCountryCity = (index) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleCityChange = (index, city) => {
    const updated = value.map((item, i) =>
      i === index ? { ...item, city } : item
    );
    onChange(updated);
  };

 
  

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Other Countries of Operations (Branches) <span className="text-gray-400 font-normal">(Optional)</span>
      </label>

      {/* Display selected country-city pairs */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex-1">
                <div className="font-medium text-sm">{item.country}</div>
                <div className="text-xs text-gray-500">City: {item.city}</div>
              </div>
              <SearchableSelect
                options={getCitiesForCountry(item.country)}
                value={item.city}
                onChange={(city) => handleCityChange(index, city)}
                placeholder="Select city"
                className="w-48"
              />
              <button
                type="button"
                onClick={() => handleRemoveCountryCity(index)}
                className="p-1 text-red-500 hover:text-red-700"
                title="Remove"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new country-city pair */}
      {showAddForm ? (
        <div className="p-3 border border-gray-200 rounded-lg bg-blue-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <SearchableSelect
              options={COUNTRIES}
              value={newCountry}
              onChange={setNewCountry}
              placeholder="Select country"
            />
            <SearchableSelect
              options={newCountry ? getCitiesForCountry(newCountry) : []}
              value={newCity}
              onChange={setNewCity}
              placeholder="Select city"
              disabled={!newCountry}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddCountryCity}
              disabled={!newCountry || !newCity}
              className="px-3 py-1 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewCountry("");
                setNewCity("");
              }}
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Country & City
        </button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-xs text-gray-500">
        Select countries where your company has branches or operations (optional)
      </p>
    </div>
  );
};

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
    tos: false,
    // Individual fields
    avatarUrl: null,
    avatarPreview: null,
    birthDate: "",
    gender: "",
    nationality: "",
    // Company fields
    otherCountries: [], // Now stores [{country: string, city: string}]
    webpage: ""
  });

  const [errors, setErrors] = useState({
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

  // NEW: show/hide toggles
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // clear that field's error while typing
  };

 
   const onFileChange = async (name, file) => {
  if (file) {
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        [name]: "File size must be less than 5MB"
      }));
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        [name]: "Please select a valid image file (JPG, PNG, GIF)"
      }));
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    setForm((f) => ({
      ...f,
      avatarFile: file, // Store the file object instead of base64
      avatarPreview: previewUrl
    }));
    
    setErrors((prev) => ({ ...prev, avatarUrl: "" }));
  } else {
    setForm((f) => ({
      ...f,
      avatarFile: null,
      avatarPreview: null
    }));
  }
};
  // Labels change with account type, but variable names DO NOT change
  const labelName = acct === "company" ? "Organization name" : "Name";
  const labelEmail = acct === "company" ? "Organization email" : "Email Address";
  const labelPhone = acct === "company" ? "Organization phone" : "Phone Number";

  function validate() {
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

    if (!form.name) {
      next.name = `${labelName} is required.`;
    } else if (form.name.trim().length < 2) {
      next.name = `${labelName} must be at least 2 characters long.`;
   } else if (!/^[\p{L}0-9\s\-'\.]+$/u.test(signupForm.name.trim())) {
      next.name = `${labelName} can only contain letters (including accents), numbers, spaces, hyphens, apostrophes, and periods.`;
    }
    if (!form.email) next.email = `${labelEmail} is required.`;
    else if (!emailOK(form.email)) next.email = "Please enter a valid email.";
    if (!form.phone) next.phone = `${labelPhone} is required.`;
    else {
      const phoneDigits = String(form.phone).replace(/\D/g, "");
      if (phoneDigits.length < 6) {
        next.phone = "Please enter a valid phone number.";
      } else if (phoneDigits.length > 15) {
        next.phone = "Phone number is too long.";
      } else if (!/^\+?[\d\s\-\(\)]+$/.test(form.phone)) {
        next.phone = "Please enter a valid phone number format.";
      }
    }

    if (!form.country) next.country = "Country is required.";

    if (!form.password) {
      next.password = "Password is required.";
    } else if (form.password.length < 8) {
      next.password = "Password must be at least 8 characters long.";
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/.test(form.password)) {
      next.password = "Create a strong password with a mix of letters, numbers and symbols.";
    }
    if (!form.confirmPassword) next.confirmPassword = "Please confirm password.";
    else if (form.password !== form.confirmPassword)
      next.confirmPassword = "Passwords do not match.";


    if (!form.tos) next.tos = "You must agree to the Terms and Privacy Policy.";


    // Individual-specific validation
    if (acct === "individual") {
      if (!form.birthDate) {
        next.birthDate = "Birth date is required.";
      } else {
        const birthDate = new Date(form.birthDate);
        const today = new Date();
        const minAge = 18; // Minimum age requirement
        const maxAge = 120; // Maximum reasonable age

        if (birthDate > today) {
          next.birthDate = "Birth date cannot be in the future.";
        } else {
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < minAge) {
            next.birthDate = `You must be at least ${minAge} years old to sign up.`;
          } else if (age > maxAge) {
            next.birthDate = "Please enter a valid birth date.";
          }
        }
      }

      if (!form.gender) next.gender = "Gender is required.";
      if (!form.nationality) next.nationality = "Nationality is required.";
    }

    // Company-specific validation
    if (acct === "company") {
      // Company website is optional, but if provided, must be valid URL
      if (form.webpage) {
        const domainPattern = /^(https?:\/\/)?([\w-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;
        if (!domainPattern.test(form.webpage.trim())) {
          next.webpage = "Please enter a valid website address (e.g. google.com)";
        }
      }
      // Other countries is optional - no validation needed
    }

    setErrors(next);
    return Object.values(next).every((v) => !v);
  }


     const uploadFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await client.post('/profile/uploadLogo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.url; // Return the uploaded file URL
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  };


  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }


    setLoading(true);
    try {

       let avatarUrl = null;
          
          // Upload avatar file first if exists
          if (form.avatarFile) {
            try {
              avatarUrl = await uploadFile(form.avatarFile);
            } catch (uploadError) {
              toast.error("Failed to upload profile picture. Please try again.");
              setLoading(false);
              return;
            }
        }


      // Build payload with correct field names that match backend expectations
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        countryOfResidence: form.country, // Backend expects countryOfResidence
        password: form.password,
        accountType: acct, // "individual" | "company"
        // Individual fields
        avatarUrl: avatarUrl, 
        birthDate: form.birthDate,
        gender: form.gender,
        nationality: form.nationality,
        // Company fields
        otherCountries: form.otherCountries, // Now contains [{country, city}] pairs
        webpage: form.webpage
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
      <div className="hidden md:block sticky top-0 h-[100vh]">
        <LeftPanel />
      </div>

       <div className="flex items-center justify-center p-6 md:p-10 overflow-y-auto">
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
          <div className="font-semibold text-gray-900">54Links</div>
          <div className="text-[11px] text-gray-500 -mt-1">
            Business Initiative
          </div>
        </div>
      </div>


          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-x-2">Join <span className="text-brand-500 font-semibold">54Links</span></h2>
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
              Organization
            </button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name (dynamic label, same variable name) */}
            <div className="md:col-span-2">
              <Input
                label={labelName}
                name="name"
                placeholder={acct === "company" ? "54Links Ltd." : "John Doe"}
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
                onWheel={e => e.currentTarget.blur()}
                placeholder={acct === "company" ? "Phone" : "Phone"}
                value={form.phone}
                onChange={(e) => {
                  const { name, value: newValue } = e.target;
                  // Allow only one "+" and it should be at the beginning, no spaces allowed
                  const cleaned = newValue.replace(/[^+\d\-\(\)]/g, '');
                  const plusCount = (cleaned.match(/\+/g) || []).length;
                  if (plusCount > 1) {
                    // If more than one +, remove all + and add one at the beginning
                    const withoutPlus = cleaned.replace(/\+/g, '');
                    setForm((f) => ({ ...f, [name]: '+' + withoutPlus }));
                  } else {
                    setForm((f) => ({ ...f, [name]: cleaned }));
                  }
                  setErrors((prev) => ({ ...prev, [name]: "" })); // clear that field's error while typing
                }}
                error={errors.phone}
              />
            </div>

            {/* Country */}
            <div className="md:col-span-2">
              <SearchableSelect
                label="Country"
                options={COUNTRIES}
                value={form.country}
                onChange={(value) => {
                  setForm(prev => ({ ...prev, country: value }));
                  setErrors(prev => ({ ...prev, country: "" }));
                }}
                placeholder="Select your country"
                error={errors.country}
              />
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
                        {form.avatarPreview ? (
                          <img
                            src={form.avatarPreview}
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
                      {form.avatarPreview && (
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
                       
                        {form.avatarUrl ? "Change Picture" : "Upload Picture"}
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        {form.avatarPreview ? "Image selected" : "JPG, PNG up to 5MB"}
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
                    value={form.birthDate}
                    onChange={onChange}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-brand-500 focus:ring-2 bg-white ${
                      errors.birthDate ? "border-red-400 focus:ring-red-400" : "border-gray-200"
                    }`}
                  />
                  {errors.birthDate && <p className="text-xs text-red-600">{errors.birthDate}</p>}
                </div>

                {/* Gender */}
                <div className="md:col-span-1 space-y-1">
                  <label className="text-sm font-medium text-gray-700">Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={onChange}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-brand-500 focus:ring-2 bg-white ${
                      errors.gender ? "border-red-400 focus:ring-red-400" : "border-gray-200"
                    }`}
                  >
                    <option value="" disabled>Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  {errors.gender && <p className="text-xs text-red-600">{errors.gender}</p>}
                </div>

                {/* Nationality */}
                <div className="md:col-span-2">
                  <SearchableSelect
                    label="Nationality"
                    options={COUNTRIES}
                    value={form.nationality}
                    onChange={(value) => {
                      setForm(prev => ({ ...prev, nationality: value }));
                      setErrors(prev => ({ ...prev, nationality: "" }));
                    }}
                    placeholder="Select your nationality"
                    error={errors.nationality}
                  />
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
                        {form.avatarPreview ? (
                          <img
                            src={form.avatarPreview}
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
                      {form.avatarPreview && (
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
                       
                        {form.avatarUrl ? "Change Logo" : "Upload Logo"}
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        {form.avatarPreview ? "Logo selected" : "JPG, PNG up to 5MB"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Other Countries of Operations with Cities */}
                <div className="md:col-span-2">
                  <CountryCitySelector
                    value={form.otherCountries}
                    onChange={(values) => {
                      setForm(prev => ({ ...prev, otherCountries: values }));
                      setErrors(prev => ({ ...prev, otherCountries: "" }));
                    }}
                    error={errors.otherCountries}
                  />
                </div>

                {/* Webpage */}
                <div className="md:col-span-2 space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Company Website <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    name="webpage"
                    placeholder="https://www.yourcompany.com"
                    value={form.webpage}
                    onChange={onChange}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ring-brand-500 focus:ring-2 bg-white ${
                      errors.webpage ? "border-red-400 focus:ring-red-400" : "border-gray-200"
                    }`}
                  />
                  {errors.webpage && <p className="text-xs text-red-600">{errors.webpage}</p>}
                </div>
              </> 
            )}

            {/* Passwords with show/hide */}
           <div>
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
           {form.password && (/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/.test(form.password)) ? (
                      <div className="flex items-center gap-2 mt-2 text-green-600">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <p className="text-xs">Password validated</p>
                      </div>
                    ) : !errors.password ? (
                      <p className="text-xs text-gray-500 my-2">Create a strong password with a mix of letters, numbers and symbols.</p>
                    ) : null}
           </div>
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
                <a href="/terms" target="_blank"
                   rel="noopener noreferrer"  className="text-brand-600 underline">Terms of Service</a> and{" "}
                <a href="/privacy" target="_blank"
                   rel="noopener noreferrer"   className="text-brand-600 underline">Privacy Policy</a>
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
