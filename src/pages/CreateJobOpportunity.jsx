// src/pages/CreateJobOpportunity.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../api/client";
import COUNTRIES from "../constants/countries";
import Header from "../components/Header";
import { toast } from "../lib/toast";

/* brand icons (trimmed) */
const I = {
  briefcase: () => (<svg className="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="currentColor"><path d="M10 3h4a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v3H3V8a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm4 3V5h-4v1h4Z"/><path d="M3 11h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7Zm8 2H5v2h6v-2Z"/></svg>),
  doc: () => (<svg className="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v6h6" className="opacity-70"/></svg>),
  pin: () => (<svg className="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg>),
  send: () => (<svg className="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="currentColor"><path d="m2 21 21-9L2 3v7l15 2-15 2v7z"/></svg>),
  back: () => (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15 19 8 12l7-7"/></svg>),
  chevron: () => (<svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="m6 9 6 6 6-6"/></svg>),
  caret: () => (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>),
  caretUp: () => (<svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>),
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

/** ------- Audience Tree (identities -> categories -> subcategories -> subsubs) ------- **/
function AudienceTree({ tree, selected, onChange }) {
  const [open, setOpen] = useState({}); // collapse state by key id

  const toggle = (k) => setOpen(o => ({ ...o, [k]: !o[k] }));

  const isChecked = (type, id) => selected[type].has(id);
  const setChecked = (type, id, value) => {
    const next = {
      identityIds: new Set(selected.identityIds),
      categoryIds: new Set(selected.categoryIds),
      subcategoryIds: new Set(selected.subcategoryIds),
      subsubCategoryIds: new Set(selected.subsubCategoryIds),
    };
    const bucket = next[type];
    if (value) bucket.add(id); else bucket.delete(id);
    onChange(next);
  };

  // When you check a category, auto-check its identity; when uncheck, also uncheck children
  const onCategoryCheck = (identityId, category) => (e) => {
    const checked = e.target.checked;
    const next = {
      identityIds: new Set(selected.identityIds),
      categoryIds: new Set(selected.categoryIds),
      subcategoryIds: new Set(selected.subcategoryIds),
      subsubCategoryIds: new Set(selected.subsubCategoryIds),
    };

    if (checked) {
      next.identityIds.add(identityId);
      next.categoryIds.add(category.id);
    } else {
      next.categoryIds.delete(category.id);
      // remove all subchildren of this category
      (category.subcategories || []).forEach(sc => {
        next.subcategoryIds.delete(sc.id);
        (sc.subsubs || []).forEach(ss => next.subsubCategoryIds.delete(ss.id));
      });
      // keep identity if other categories remain under it
    }
    onChange(next);
  };

  const onSubcategoryCheck = (identityId, categoryId, subcat) => (e) => {
    const checked = e.target.checked;
    const next = {
      identityIds: new Set(selected.identityIds),
      categoryIds: new Set(selected.categoryIds),
      subcategoryIds: new Set(selected.subcategoryIds),
      subsubCategoryIds: new Set(selected.subsubCategoryIds),
    };

    if (checked) {
      next.identityIds.add(identityId);
      next.categoryIds.add(categoryId);
      next.subcategoryIds.add(subcat.id);
    } else {
      next.subcategoryIds.delete(subcat.id);
      (subcat.subsubs || []).forEach(ss => next.subsubCategoryIds.delete(ss.id));
    }
    onChange(next);
  };

  const onSubsubCheck = (identityId, categoryId, subcategoryId, ss) => (e) => {
    const checked = e.target.checked;
    const next = {
      identityIds: new Set(selected.identityIds),
      categoryIds: new Set(selected.categoryIds),
      subcategoryIds: new Set(selected.subcategoryIds),
      subsubCategoryIds: new Set(selected.subsubCategoryIds),
    };
    if (checked) {
      next.identityIds.add(identityId);
      next.categoryIds.add(categoryId);
      next.subcategoryIds.add(subcategoryId);
      next.subsubCategoryIds.add(ss.id);
    } else {
      next.subsubCategoryIds.delete(ss.id);
    }
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-gray-200">
      {tree.map((identity) => {
        // NOTE: identity.id should exist on API; if not, you can synthesize a stable key from the name.
        const identityId = identity.id || identity.name; 
        const idKey = `id-${identityId}`;
        const openId = !!open[idKey];

        return (
          <div key={idKey} className="border-b last:border-b-0">
            <button
              type="button"
              onClick={() => toggle(idKey)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-600"
                  checked={isChecked("identityIds", identityId)}
                  onChange={e => setChecked("identityIds", identityId, e.target.checked)}
                />
                <span className="font-medium">{identity.name}</span>
              </div>
              <span className="text-gray-500">{openId ? <I.caretUp/> : <I.caret/>}</span>
            </button>

            {openId && (
              <div className="bg-gray-50/60 px-4 py-3 space-y-3">
                {(identity.categories || []).map((cat) => {
                  const cKey = `cat-${cat.id}`;
                  const openCat = !!open[cKey];
                  return (
                    <div key={cKey} className="rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between px-3 py-2 bg-white">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-brand-600"
                            checked={isChecked("categoryIds", cat.id)}
                            onChange={onCategoryCheck(identityId, cat)}
                          />
                          <span className="text-sm font-medium">{cat.name}</span>
                        </label>
                        <button type="button" onClick={() => toggle(cKey)} className="text-gray-500 hover:text-gray-700">
                          {openCat ? <I.caretUp/> : <I.caret/>}
                        </button>
                      </div>

                      {openCat && (
                        <div className="px-3 py-2 space-y-2 bg-gray-50">
                          {(cat.subcategories || []).map((sc) => {
                            const scKey = `sc-${sc.id}`;
                            const openSc = !!open[scKey];
                            return (
                              <div key={scKey} className="border rounded-md">
                                <div className="flex items-center justify-between px-3 py-2 bg-white">
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 accent-brand-600"
                                      checked={isChecked("subcategoryIds", sc.id)}
                                      onChange={onSubcategoryCheck(identityId, cat.id, sc)}
                                    />
                                    <span className="text-sm">{sc.name}</span>
                                  </label>
                                  <button type="button" onClick={() => toggle(scKey)} className="text-gray-500 hover:text-gray-700">
                                    {openSc ? <I.caretUp/> : <I.caret/>}
                                  </button>
                                </div>

                                {openSc && (sc.subsubs?.length > 0) && (
                                  <div className="px-3 py-2 bg-gray-50 grid sm:grid-cols-2 gap-2">
                                    {sc.subsubs.map((ss) => (
                                      <label key={ss.id} className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          className="h-4 w-4 accent-brand-600"
                                          checked={isChecked("subsubCategoryIds", ss.id)}
                                          onChange={onSubsubCheck(identityId, cat.id, sc.id, ss)}
                                        />
                                        <span className="text-xs">{ss.name}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CreateJobOpportunity() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get job ID from URL if editing
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Legacy single list for primary category dropdown (kept for compatibility in DB)
  const [cats, setCats] = useState([]); // [{id,name,subcategories:[{id,name}]}]
  // NEW: full audience tree from /public/identities
  const [audTree, setAudTree] = useState([]);

  const [form, setForm] = useState({
    title: "", companyName: "", make_company_name_private: false, department: "", experienceLevel: "",
    jobType: "", workMode: "", description: "", requiredSkills: "",
    country: COUNTRIES[0] || "", city: "",
    minSalary: "", maxSalary: "", currency: "USD", benefits: "",
    applicationDeadline: "", positions: 1, applicationInstructions: "", contactEmail: "",
    categoryId: "", subcategoryId: "",
  });

  // NEW: selection sets (use Sets to keep toggling simple)
  const [audSel, setAudSel] = useState({
    identityIds: new Set(),
    categoryIds: new Set(),
    subcategoryIds: new Set(),
    subsubCategoryIds: new Set(),
  });

  // Check if we're in edit mode and fetch job data if we are
  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      setIsLoading(true);
      
      const fetchJobData = async () => {
        try {
          const { data } = await client.get(`/jobs/${id}`);
          const job = data.job;
          
          // Update form with job data
          setForm({
            title: job.title || "",
            companyName: job.companyName || "",
            make_company_name_private: job.make_company_name_private || false,
            department: job.department || "",
            experienceLevel: job.experienceLevel || "",
            jobType: job.jobType || "",
            workMode: job.workMode || "",
            description: job.description || "",
            requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills.join(", ") : job.requiredSkills || "",
            country: job.country || COUNTRIES[0] || "",
            city: job.city || "",
            minSalary: job.minSalary?.toString() || "",
            maxSalary: job.maxSalary?.toString() || "",
            currency: job.currency || "USD",
            benefits: job.benefits || "",
            applicationDeadline: job.applicationDeadline ? job.applicationDeadline.split('T')[0] : "",
            positions: job.positions || 1,
            applicationInstructions: job.applicationInstructions || "",
            contactEmail: job.contactEmail || "",
            categoryId: job.categoryId || "",
            subcategoryId: job.subcategoryId || "",
          });
          
          // Set audience selections
          if (job.audienceIdentities?.length || job.audienceCategories?.length ||
              job.audienceSubcategories?.length || job.audienceSubsubs?.length) {
            setAudSel({
              identityIds: new Set(job.audienceIdentities?.map(i => i.id) || []),
              categoryIds: new Set(job.audienceCategories?.map(c => c.id) || []),
              subcategoryIds: new Set(job.audienceSubcategories?.map(s => s.id) || []),
              subsubCategoryIds: new Set(job.audienceSubsubs?.map(s => s.id) || []),
            });
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching job data:", error);
          toast.error("Failed to load job data");
          setIsLoading(false);
          navigate("/jobs");
        }
      };
      
      fetchJobData();
    }
  }, [id, navigate]);

  // Load legacy categories for primary dropdown (industry)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/categories/tree");
        setCats(data.categories || []);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    })();
  }, []);

  // Load full identities tree (who to share with)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/public/identities");
        // Expecting data.identities: same structure you shared
        setAudTree(data.identities || []);
      } catch (error) {
        console.error("Error loading identities:", error);
      }
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
      if (name === "categoryId") next.subcategoryId = "";
      return next;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Convert Set → Array
      const identityIds = Array.from(audSel.identityIds);
      const categoryIds = Array.from(audSel.categoryIds);
      const subcategoryIds = Array.from(audSel.subcategoryIds);
      const subsubCategoryIds = Array.from(audSel.subsubCategoryIds);

      if (!form.categoryId && categoryIds.length === 0) {
        alert("Please pick at least one Industry (primary or in the Share With section).");
        setIsLoading(false);
        return;
      }

      const payload = {
        ...form,
        positions: Number(form.positions || 1),
        requiredSkills: form.requiredSkills, // backend will normalize
        minSalary: form.minSalary === "" ? null : Number(form.minSalary),
        maxSalary: form.maxSalary === "" ? null : Number(form.maxSalary),
        subcategoryId: form.subcategoryId || null,

        // NEW (arrays)
        identityIds,
        categoryIds,
        subcategoryIds,
        subsubCategoryIds,
      };

      if (isEditMode) {
        // Update existing job
        await client.put(`/jobs/${id}`, payload);
        toast.success('Job updated successfully!');
      } else {
        // Create new job
        await client.post("/jobs", payload);
        toast.success('Job created successfully!');
      }
      
      setIsLoading(false);
      navigate("/jobs");
    } catch (error) {
      console.error("Error saving job:", error);
      toast.error(isEditMode ? "Failed to update job" : "Failed to create job");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header page={'jobs'}/>
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-5 cursor-pointer">
          <a onClick={() => navigate('/jobs')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
            <I.back /> Back to Jobs
          </a>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold">
          {isEditMode ? "Edit Job Opportunity" : "Create Job Opportunity"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {isEditMode
            ? "Update your job posting details below."
            : "Post a new job opening and choose exactly who should see it."}
        </p>

        {isLoading && !isEditMode ? (
          <div className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm p-5 md:p-6 flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin text-3xl mb-2">⟳</div>
              <p>Loading job data...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm p-5 md:p-6">
          {/* ===== Basic Information ===== */}
          <div className="flex items-center gap-2"><I.briefcase /><h3 className="font-semibold">Basic Information</h3></div>
          <div className="mt-3 grid md:grid-cols-2 gap-4">
            <div><Label required>Job Title</Label><Input name="title" value={form.title} onChange={onChange} placeholder="e.g. Senior Software Engineer" required/></div>
            <div>
              <Label required>Company Name</Label>
              <Input name="companyName" value={form.companyName} onChange={onChange} placeholder="Your company name" required/>
              <div className="mt-1 flex items-center">
                <input
                  type="checkbox"
                  id="make_company_name_private"
                  name="make_company_name_private"
                  checked={form.make_company_name_private}
                  onChange={(e) => setForm({...form, make_company_name_private: e.target.checked})}
                  className="h-4 w-4 accent-brand-600 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="make_company_name_private" className="ml-2 text-sm text-gray-700">
                  Make it private
                </label>
              </div>
            </div>
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

          {/* ===== Share With (Audience selection) ===== */}
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-brand-600" />
            <h3 className="font-semibold">Share with (identities & industry tree)</h3>
          </div>
          <p className="text-xs text-gray-600 mb-3">
            Pick **who** should see this job. You can select multiple identities, industries, sub-industries, and sub-subcategories.
          </p>

          <AudienceTree
            tree={audTree}
            selected={audSel}
            onChange={(next) => setAudSel(next)}
          />

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
                <Input
                  name="applicationDeadline"
                  type="date"
                  value={form.applicationDeadline}
                  onChange={onChange}
                  id="applicationDeadline"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  onClick={() => document.getElementById('applicationDeadline').showPicker()}
                  tabIndex="-1"
                >
                  <I.calendar />
                </button>
              </div>
            </div>
            <div><Label>Number of Positions</Label><Input name="positions" type="number" min="1" value={form.positions} onChange={onChange}/></div>
          </div>

          <div className="mt-3"><Label>Application Instructions</Label><Textarea name="applicationInstructions" value={form.applicationInstructions} onChange={onChange} rows={3} placeholder="Provide specific instructions for applicants…"/></div>
          <div className="mt-3"><Label>Contact Email</Label><Input name="contactEmail" type="email" value={form.contactEmail} onChange={onChange} placeholder="hr@company.com"/></div>

          <div className="flex justify-end gap-3 mt-8">
            {isLoading ? (
              <button type="button" className="px-4 py-2 rounded-xl bg-brand-600 text-white opacity-70 cursor-not-allowed" disabled>
                <span className="inline-block animate-spin mr-2">⟳</span>
                {isEditMode ? "Updating..." : "Creating..."}
              </button>
            ) : (
              <button type="submit" className="px-4 py-2 rounded-xl bg-brand-600 text-white hover:opacity-90">
                {isEditMode ? "Update Job" : "Create Job"}
              </button>
            )}
          </div>
        </form>
        )}
      </main>
    </div>
  );
}
