import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client"; // <-- axios with auth header
import COUNTRIES from "../constants/countries";
import Header from "../components/Header";

/* --- Icons trimmed for brevity --- */
const I = {
  briefcase: () => (<svg className="h-5 w-5 text-[#8A358A]" viewBox="0 0 24 24" fill="currentColor"><path d="M10 3h4a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v3H3V8a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm4 3V5h-4v1h4Z"/><path d="M3 11h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7Zm8 2H5v2h6v-2Z"/></svg>),
  doc: () => (<svg className="h-5 w-5 text-[#8A358A]" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v6h6" className="opacity-70"/></svg>),
  pin: () => (<svg className="h-5 w-5 text-[#8A358A]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg>),
  send: () => (<svg className="h-5 w-5 text-[#8A358A]" viewBox="0 0 24 24" fill="currentColor"><path d="m2 21 21-9L2 3v7l15 2-15 2v7z"/></svg>),
  back: () => (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15 19 8 12l7-7"/></svg>),
  chevron: () => (<svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="m6 9 6 6 6-6"/></svg>),
  calendar: () => (<svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h2v3H7zm8 0h2v3h-2z"/><path d="M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Zm0 5v9h14v-9H5Z"/></svg>),
};

const Label = ({ children, required }) => (
  <label className="text-[12px] font-medium text-gray-700">
    {children} {required && <span className="text-pink-600">*</span>}
  </label>
);

const Input = (props) => (
  <input
    {...props}
    className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 ${props.className || ""}`}
  />
);

const Select = ({ children, ...rest }) => (
  <div className="relative">
    <select
      {...rest}
      className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-purple-200"
    >
      {children}
    </select>
    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
      <I.chevron />
    </span>
  </div>
);

const Textarea = (props) => (
  <textarea
    rows={props.rows || 4}
    {...props}
    className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 ${props.className || ""}`}
  />
);

const CURRENCY_OPTIONS = [
  "USD","EUR","GBP","NGN","GHS","ZAR","KES","UGX","TZS","XOF","XAF","MAD","DZD","TND","EGP","ETB",
  "NAD","BWP","MZN","ZMW","RWF","BIF","SOS","SDG","CDF"
];

export default function CreateJobOpportunity() {
  const navigate = useNavigate();

  const [cats, setCats] = useState([]); // [{id,name,subcategories:[{id,name}]}]
  const [form, setForm] = useState({
    title: "", companyName: "", department: "", experienceLevel: "",
    jobType: "", workMode: "", description: "", requiredSkills: "",
    country: "", city: "",
    minSalary: "", maxSalary: "", currency: "USD", benefits: "",
    applicationDeadline: "", positions: 1, applicationInstructions: "", contactEmail: "",
    categoryId: "", subcategoryId: "",
  });

  // load categories tree from API
  useEffect(() => {
    (async () => {
      const { data } = await client.get("/categories/tree");
      setCats(data.categories || []);
    })();
  }, []);

  const subsOfSelected = useMemo(() => {
    const cat = cats.find(c => c.id === form.categoryId);
    return cat?.subcategories || [];
  }, [cats, form.categoryId]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => {
      const next = { ...f, [name]: value };
      // if category changed, clear subcategory
      if (name === "categoryId") next.subcategoryId = "";
      return next;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      positions: Number(form.positions || 1),
      requiredSkills: form.requiredSkills, // can be "csv" or ["a","b"] (backend normalizes)
      minSalary: form.minSalary === "" ? null : Number(form.minSalary),
      maxSalary: form.maxSalary === "" ? null : Number(form.maxSalary),
      subcategoryId: form.subcategoryId || null,
    };

    await client.post("/jobs", payload);
    navigate("/jobs"); // or show a toast then navigate
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-gray-900">
      {/* Header kept minimal for this page */}
      <Header page={'jobs'}/>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-5 cursor-pointer">
          <a onClick={() => navigate('/jobs')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
            <I.back /> Back to Jobs
          </a>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold">Create Job Opportunity</h1>
        <p className="mt-1 text-sm text-gray-600">Post a new job opening to connect with talented professionals across Africa</p>

        <form onSubmit={onSubmit} className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm p-5 md:p-6">
          {/* ===== Basic Information ===== */}
          <div className="flex items-center gap-2"><I.briefcase /><h3 className="font-semibold">Basic Information</h3></div>
          <div className="mt-3 grid md:grid-cols-2 gap-4">
            <div><Label required>Job Title</Label><Input name="title" value={form.title} onChange={onChange} placeholder="e.g. Senior Software Engineer" required/></div>
            <div><Label required>Company Name</Label><Input name="companyName" value={form.companyName} onChange={onChange} placeholder="Your company name" required/></div>
            <div><Label>Department</Label><Input name="department" value={form.department} onChange={onChange} placeholder="e.g. Engineering, Marketing"/></div>
            <div>
              <Label>Experience Level</Label>
              <Select name="experienceLevel" value={form.experienceLevel} onChange={onChange}>
                <option value="">Select experience level</option>
                <option>Junior</option><option>Mid-level</option><option>Senior</option><option>Lead</option>
              </Select>
            </div>
          </div>

          <hr className="my-5 border-gray-200" />

          {/* ===== Job Details ===== */}
          <div className="flex items-center gap-2"><I.doc /><h3 className="font-semibold">Job Details</h3></div>
          <div className="mt-3 grid md:grid-cols-3 gap-4">
            <div>
              <Label required>Job Type</Label>
              <Select name="jobType" value={form.jobType} onChange={onChange} required>
                <option value="">Select job type</option>
                <option>Full-time</option><option>Part-time</option><option>Contract</option>
                <option>Internship</option><option>Temporary</option>
              </Select>
            </div>
            <div>
              <Label required>Work Mode</Label>
              <Select name="workMode" value={form.workMode} onChange={onChange} required>
                <option value="">Select work mode</option>
                <option>On-site</option><option>Remote</option><option>Hybrid</option>
              </Select>
            </div>

            {/* Industry (Category) */}
            <div>
              <Label required>Industry</Label>
              <Select name="categoryId" value={form.categoryId} onChange={onChange} required>
                <option value="">Select industry</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>

            {/* Optional Subcategory */}
            <div className="md:col-span-3">
              <Label>Subcategory (optional)</Label>
              <Select name="subcategoryId" value={form.subcategoryId} onChange={onChange} disabled={!form.categoryId}>
                <option value="">Select subcategory</option>
                {subsOfSelected.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
              </Select>
            </div>

            <div className="md:col-span-3">
              <Label required>Job Description</Label>
              <Textarea name="description" value={form.description} onChange={onChange} rows={4} placeholder="Describe the role, responsibilities, and what you're looking for…" required/>
            </div>
            <div className="md:col-span-3">
              <Label>Required Skills & Qualifications</Label>
              <Textarea name="requiredSkills" value={form.requiredSkills} onChange={onChange} rows={3} placeholder="Comma separated: React, Node.js, Leadership"/>
            </div>
          </div>

          <hr className="my-5 border-gray-200" />

          {/* ===== Location & Compensation ===== */}
          <div className="flex items-center gap-2"><I.pin /><h3 className="font-semibold">Location & Compensation</h3></div>
          <div className="mt-3 grid md:grid-cols-2 gap-4">
             <div>
              <Label required>Country</Label>
              <Select required name="country" value={form.country} onChange={onChange}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div><Label>City</Label><Input name="city" value={form.city} onChange={onChange} placeholder="e.g. Lagos, Cape Town"/></div>
          </div>

          {/* Salary: min / max numeric + currency */}
          <div className="mt-3 grid md:grid-cols-3 gap-4">
            <div><Label>Min Salary</Label><Input name="minSalary" type="number" min="0" step="1" value={form.minSalary} onChange={onChange} placeholder="e.g. 2000"/></div>
            <div><Label>Max Salary</Label><Input name="maxSalary" type="number" min="0" step="1" value={form.maxSalary} onChange={onChange} placeholder="e.g. 4000"/></div>
            <div>
              <Label>Currency</Label>
              <Select name="currency" value={form.currency} onChange={onChange}>
                {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="md:col-span-3"><Label>Benefits</Label><Input name="benefits" value={form.benefits} onChange={onChange} placeholder="Health insurance, remote work…"/></div>
          </div>

          <hr className="my-5 border-gray-200" />

          {/* ===== Application Details ===== */}
          <div className="flex items-center gap-2"><I.send /><h3 className="font-semibold">Application Details</h3></div>
          <div className="mt-3 grid md:grid-cols-2 gap-4">
            <div>
              <Label>Application Deadline</Label>
              <div className="relative">
                <Input name="applicationDeadline" type="date" value={form.applicationDeadline} onChange={onChange}/>
                <span className="absolute right-3 top-1/2 -translate-y-1/2"><I.calendar /></span>
              </div>
            </div>
            <div><Label>Number of Positions</Label><Input name="positions" type="number" min="1" value={form.positions} onChange={onChange}/></div>
          </div>

          <div className="mt-3"><Label>Application Instructions</Label><Textarea name="applicationInstructions" value={form.applicationInstructions} onChange={onChange} rows={3} placeholder="Provide specific instructions for applicants…"/></div>
          <div className="mt-3"><Label>Contact Email</Label><Input name="contactEmail" type="email" value={form.contactEmail} onChange={onChange} placeholder="hr@company.com"/></div>

          <div className="flex justify-end gap-3 mt-8">
            <button type="button" className="px-4 py-2 rounded-xl border border-brand-700 text-brand-700 bg-white"
                    onClick={() => setForm(f => ({ ...f, status: "draft" }))}>
              Save Draft
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-brand-700 text-white">Save</button>
          </div>
        </form>
      </main>
    </div>
  );
}
