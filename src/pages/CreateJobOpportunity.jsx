// src/pages/CreateJobOpportunity.jsx
import React from "react";

/* --- Ícones inline --- */
const I = {
  briefcase: () => (
    <svg className="h-5 w-5 text-[#8A358A]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 3h4a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v3H3V8a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm4 3V5h-4v1h4Z" />
      <path d="M3 11h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7Zm8 2H5v2h6v-2Z" />
    </svg>
  ),
  doc: () => (
    <svg className="h-5 w-5 text-[#8A358A]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <path d="M14 2v6h6" className="opacity-70" />
    </svg>
  ),
  pin: () => (
    <svg className="h-5 w-5 text-[#8A358A]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
    </svg>
  ),
  send: () => (
    <svg className="h-5 w-5 text-[#8A358A]" viewBox="0 0 24 24" fill="currentColor">
      <path d="m2 21 21-9L2 3v7l15 2-15 2v7z" />
    </svg>
  ),
  back: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15 19 8 12l7-7" />
    </svg>
  ),
  chevron: () => (
    <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  calendar: () => (
    <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 2h2v3H7zm8 0h2v3h-2z" />
      <path d="M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Zm0 5v9h14v-9H5Z" />
    </svg>
  ),
};

/* --- Pequenos componentes --- */
const Label = ({ children, required }) => (
  <label className="text-[12px] font-medium text-gray-700">
    {children} {required && <span className="text-pink-600">*</span>}
  </label>
);

const Input = (props) => (
  <input
    {...props}
    className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 ${props.className || ""
      }`}
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
    className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 ${props.className || ""
      }`}
  />
);

export default function CreateJobOpportunity() {
  return (
    <div className="min-h-screen bg-[#F6F7FB] text-gray-900">
      {/* Topbar simples (opcional: igual às outras páginas) */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-6xl h-14 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg grid place-items-center text-white font-bold"
              style={{ background: "linear-gradient(135deg,#8A358A,#9333EA)" }}
            >
              F
            </div>
            <div className="leading-none">
              <div className="text-sm font-semibold">PANAFRICAN</div>
              <div className="text-[10px] text-gray-500">Business Initiative</div>
            </div>
          </div>

          <nav className="ml-6 hidden md:flex items-center gap-3 text-xs">
            {["Feed", "People", "Jobs", "Events", "Business", "Tourism"].map((x) => (
              <a
                key={x}
                href="#"
                className={`px-2 py-1 rounded-full ${x === "Jobs" ? "text-white" : "text-gray-700"}`}
                style={x === "Jobs" ? { background: "linear-gradient(135deg,#8A358A,#9333EA)" } : {}}
              >
                {x}
              </a>
            ))}
          </nav>

          <div className="ml-auto">
            <div className="hidden md:flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm max-w-sm">
              <input className="w-full bg-transparent outline-none" placeholder="Search people, jobs, events..." />
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <div className="mb-5">
          <a href="#" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
            <I.back /> Back to Jobs
          </a>
        </div>

        {/* Título */}
        <h1 className="text-2xl md:text-3xl font-bold">Create Job Opportunity</h1>
        <p className="mt-1 text-sm text-gray-600">
          Post a new job opening to connect with talented professionals across Africa
        </p>

        {/* Card */}
        <section className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm p-5 md:p-6">
          {/* ===== Basic Information ===== */}
          <div className="flex items-center gap-2">
            <I.briefcase />
            <h3 className="font-semibold">Basic Information</h3>
          </div>

          <div className="mt-3 grid md:grid-cols-2 gap-4">
            <div>
              <Label required>Job Title</Label>
              <Input placeholder="e.g. Senior Software Engineer" />
            </div>
            <div>
              <Label required>Company Name</Label>
              <Input placeholder="Your company name" />
            </div>
            <div>
              <Label>Department</Label>
              <Input placeholder="e.g. Engineering, Marketing" />
            </div>
            <div>
              <Label>Experience Level</Label>
              <Select defaultValue="">
                <option value="" disabled>
                  Select experience level
                </option>
                <option>Junior</option>
                <option>Mid-level</option>
                <option>Senior</option>
                <option>Lead</option>
              </Select>
            </div>
          </div>

          <hr className="my-5 border-gray-200" />

          {/* ===== Job Details ===== */}
          <div className="flex items-center gap-2">
            <I.doc />
            <h3 className="font-semibold">Job Details</h3>
          </div>

          <div className="mt-3 grid md:grid-cols-3 gap-4">
            <div>
              <Label required>Job Type</Label>
              <Select defaultValue="">
                <option value="" disabled>
                  Select job type
                </option>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
                <option>Temporary</option>
              </Select>
            </div>
            <div>
              <Label required>Work Mode</Label>
              <Select defaultValue="">
                <option value="" disabled>
                  Select work mode
                </option>
                <option>On-site</option>
                <option>Remote</option>
                <option>Hybrid</option>
              </Select>
            </div>
            <div>
              <Label required>Industry</Label>
              <Select defaultValue="">
                <option value="" disabled>
                  Select industry
                </option>
                <option>Technology</option>
                <option>Finance</option>
                <option>Education</option>
                <option>Agriculture</option>
                <option>Healthcare</option>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label required>Job Description</Label>
              <Textarea
                rows={4}
                placeholder="Describe the role, responsibilities, and what you're looking for in a candidate..."
              />
            </div>
            <div className="md:col-span-3">
              <Label>Required Skills & Qualifications</Label>
              <Textarea
                rows={3}
                placeholder="List the required skills, qualifications, and experience..."
              />
            </div>
          </div>

          <hr className="my-5 border-gray-200" />

          {/* ===== Location & Compensation ===== */}
          <div className="flex items-center gap-2">
            <I.pin />
            <h3 className="font-semibold">Location & Compensation</h3>
          </div>

          <div className="mt-3 grid md:grid-cols-2 gap-4">
            <div>
              <Label required>Country</Label>
              <Select defaultValue="">
                <option value="" disabled>
                  Select country
                </option>
                <option>Nigeria</option>
                <option>Ghana</option>
                <option>Kenya</option>
                <option>South Africa</option>
                <option>Egypt</option>
              </Select>
            </div>
            <div>
              <Label>City</Label>
              <Input placeholder="e.g. Lagos, Cape Town" />
            </div>
          </div>

          <div className="mt-3 grid md:grid-cols-3 gap-4">
            <div>
              <Label>Salary Range</Label>
              <Select defaultValue="">
                <option value="" disabled>
                  Select salary range
                </option>
                <option>$1k – $2k / mo</option>
                <option>$2k – $4k / mo</option>
                <option>$4k – $6k / mo</option>
                <option>$6k+ / mo</option>
              </Select>
            </div>
            <div>
              <Label>Currency</Label>
              <Select defaultValue="USD">
                <option>USD</option>
                <option>EUR</option>
                <option>NGN</option>
                <option>ZAR</option>
                <option>GHS</option>
              </Select>
            </div>
            <div>
              <Label>Benefits</Label>
              <Input placeholder="Health insurance, remote work..." />
            </div>
          </div>

          <hr className="my-5 border-gray-200" />

          {/* ===== Application Details ===== */}
          <div className="flex items-center gap-2">
            <I.send />
            <h3 className="font-semibold">Application Details</h3>
          </div>

          <div className="mt-3 grid md:grid-cols-2 gap-4">
            <div>
              <Label>Application Deadline</Label>
              <div className="relative">
                <Input type="text" placeholder="mm/dd/yyyy" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <I.calendar />
                </span>
              </div>
            </div>
            <div>
              <Label>Number of Positions</Label>
              <Input type="number" min="1" placeholder="1" />
            </div>
          </div>

          <div className="mt-3">
            <Label>Application Instructions</Label>
            <Textarea
              rows={3}
              placeholder="Provide specific instructions for applicants (e.g., documents to include, application process...)"
            />
          </div>

          <div className="mt-3">
            <Label>Contact Email</Label>
            <Input type="email" placeholder="hr@company.com" />
          </div>

          {/* Buttons */}
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button className="rounded-xl px-6 py-3 text-sm font-semibold border border-gray-200 bg-white">
              Save as Draft
            </button>
            <button
              className="rounded-xl px-6 py-3 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#8A358A,#9333EA)" }}
            >
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 21V3l20 9-20 9z" />
                </svg>
                Post Job
              </span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
