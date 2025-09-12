// src/pages/CreateJobOpportunity.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../api/client";
import COUNTRIES from "../constants/countries";
import Header from "../components/Header";
import AudienceTree from "../components/AudienceTree";
import { toast } from "../lib/toast";
import { useAuth } from "../contexts/AuthContext";
import FullPageLoader from "../components/ui/FullPageLoader";

/* brand icons (trimmed) */
const I = {
  briefcase: () => (<svg className="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="currentColor"><path d="M10 3h4a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v3H3V8a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm4 3V5h-4v1h4Z"/><path d="M3 11h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7Zm8 2H5v2h6v-2Z"/></svg>),
  doc: () => (<svg className="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h8l6 6v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v6h6" className="opacity-70"/></svg>),
  pin: () => (<svg className="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg>),
  send: () => (<svg className="h-5 w-5 text-brand-600" viewBox="0 0 24 24" fill="currentColor"><path d="m2 21 21-9L2 3v7l15 2-15 2v7z"/></svg>),
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

/* ---------- helpers for read-only view ---------- */
const styles = {
  badge: "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
  chip: "inline-flex items-center rounded-full bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 text-xs",
};

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
  } catch {
    return dateStr;
  }
}
function fmtSalary(minSalary, maxSalary, currency) {
  const cur = currency || "";
  if (minSalary && maxSalary) return `${minSalary}–${maxSalary} ${cur}`;
  if (minSalary) return `From ${minSalary} ${cur}`;
  if (maxSalary) return `Up to ${maxSalary} ${cur}`;
  return "—";
}
function buildAudienceMaps(tree = []) {
  const ids = new Map(), cats = new Map(), subs = new Map(), subsubs = new Map();
  for (const idn of tree) {
    ids.set(String(idn.id), idn.name || idn.title || `Identity ${idn.id}`);
    for (const c of (idn.categories || [])) {
      cats.set(String(c.id), c.name || c.title || `Category ${c.id}`);
      for (const s of (c.subcategories || [])) {
        subs.set(String(s.id), s.name || s.title || `Subcategory ${s.id}`);
        for (const ss of (s.subsubs || [])) {
          subsubs.set(String(ss.id), ss.name || ss.title || `Sub-sub ${ss.id}`);
        }
      }
    }
  }
  return { ids, cats, subs, subsubs };
}

// Try to collect images from various job fields
function extractMedia(job = {}) {
  const urls = new Set();
  const addUrl = (u) => {
    if (typeof u === "string" && u.trim()) urls.add(u.trim());
  };

  const fromArray = (arr) => {
    if (Array.isArray(arr)) arr.forEach((u) => {
      if (typeof u === "string") addUrl(u);
      else if (u && typeof u.url === "string") addUrl(u.url);
    });
  };

  addUrl(job.coverImageUrl);
  addUrl(job.imageUrl);
  addUrl(job.bannerUrl);
  addUrl(job.heroUrl);

  // gallery-like fields
  fromArray(job.images);
  fromArray(job.gallery);
  fromArray(job.photos);
  fromArray(job.media);

  // attachments with image mime or extension
  if (Array.isArray(job.attachments)) {
    job.attachments.forEach((a) => {
      const u = a?.url || a?.href;
      const mime = a?.mimeType || a?.contentType;
      if (mime?.startsWith?.("image/")) addUrl(u);
      else if (typeof u === "string" && /\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(u)) addUrl(u);
    });
  }

  // prefer explicit logo if present
  const logoUrl = job.logoUrl || job.companyLogoUrl || null;

  // choose a cover if there is a likely hero
  const all = Array.from(urls);
  const coverImageUrl = job.coverImageUrl || job.bannerUrl || job.heroUrl || all[0] || null;

  // gallery excludes the cover to avoid duplication
  const images = all.filter((u) => u !== coverImageUrl);

  return { logoUrl, coverImageUrl, images };
}

/* ---------- Read-only component for non-owners (with images) ---------- */
function ReadOnlyJobView({ form, audSel, audTree, media }) {
  const maps = useMemo(() => buildAudienceMaps(audTree), [audTree]);
  const identities = Array.from(audSel.identityIds || []).map((k) => maps.ids.get(String(k))).filter(Boolean);
  const categories = Array.from(audSel.categoryIds || []).map((k) => maps.cats.get(String(k))).filter(Boolean);
  const subcategories = Array.from(audSel.subcategoryIds || []).map((k) => maps.subs.get(String(k))).filter(Boolean);
  const subsubs = Array.from(audSel.subsubCategoryIds || []).map((k) => maps.subsubs.get(String(k))).filter(Boolean);

  const skills = (form.requiredSkills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { logoUrl, coverImage, images = [] } = media || {};

  return (
    <div className="mt-6 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      {/* Cover image (hero) */}
      {coverImage ? (
        <div className="relative aspect-[16/6] w-full bg-gray-100">
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img src={coverImage} alt="Job cover" className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {logoUrl ? (
              <div className="flex-shrink-0 h-12 w-12 rounded-xl overflow-hidden border border-gray-200 bg-white">
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <img src={logoUrl} alt="Company logo" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <div>
              <h1 className="text-xl font-bold">{form.title || "Untitled role"}</h1>
              <div className="mt-1 text-sm text-gray-700">
                {form.companyName ? (
                  <>
                    <span className="font-medium">{form.companyName}</span>
                    {form.make_company_name_private ? (
                      <span className="ml-2 text-xs text-gray-500">(company kept private)</span>
                    ) : null}
                  </>
                ) : "—"}
              </div>
            </div>
          </div>
          <span className={`${styles.badge} bg-amber-50 border-amber-300 text-amber-800`}>
            View-only (not your job)
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-4">
            <div className="text-gray-700 font-medium flex items-center gap-2"><I.doc/> Job Details</div>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              <div>Department: {form.department || "—"}</div>
              <div>Experience: {form.experienceLevel || "—"}</div>
              <div>Type: {form.jobType || "—"}</div>
              <div>Work Mode: {form.workMode || "—"}</div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-gray-700 font-medium flex items-center gap-2"><I.pin/> Location</div>
            <div className="mt-2 text-sm text-gray-700">
              <div>{[form.city, form.country].filter(Boolean).join(", ") || "—"}</div>
              <div className="mt-1">Salary: {fmtSalary(form.minSalary, form.maxSalary, form.currency)}</div>
              <div className="mt-1">Benefits: {form.benefits || "—"}</div>
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <div className="text-gray-700 font-medium flex items-center gap-2"><I.send/> Applications</div>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              <div>Deadline: {fmtDate(form.applicationDeadline)}</div>
              <div>Positions: {form.positions || "—"}</div>
              <div>Contact: {form.contactEmail || "—"}</div>
            </div>
          </div>
        </div>

        {/* Media gallery if multiple images exist */}
        {(images?.length || 0) > 0 ? (
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Images</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {images.map((src, idx) => (
                <div key={idx} className="relative w-full aspect-[16/10] bg-gray-100 rounded-xl overflow-hidden border">
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <img src={src} alt={`Job image ${idx + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <h3 className="text-sm font-semibold text-gray-700">Description</h3>
          <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
            {form.description || "No description provided."}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700">Required Skills</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {skills.length ? skills.map((s) => <span key={s} className={styles.chip}>{s}</span>) : <span className="text-sm text-gray-500">—</span>}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700">Target Audience</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {identities.map((x) => <span key={`i-${x}`} className={styles.chip}>{x}</span>)}
            {categories.map((x) => <span key={`c-${x}`} className={styles.chip}>{x}</span>)}
            {subcategories.map((x) => <span key={`s-${x}`} className={styles.chip}>{x}</span>)}
            {subsubs.map((x) => <span key={`ss-${x}`} className={styles.chip}>{x}</span>)}
            {!identities.length && !categories.length && !subcategories.length && !subsubs.length && (
              <span className="text-sm text-gray-500">Everyone</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="px-4 py-2 rounded-xl border border-brand-600 text-brand-600 bg-white hover:bg-brand-50" onClick={() => history.back()}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- main page ---------- */
export default function CreateJobOpportunity() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get job ID from URL if editing
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { user } = useAuth();
  const [loading,setLoading]=useState(false)

  const [ownerUserId, setOwnerUserId] = useState(null);

  // Legacy single list for primary category dropdown (kept for compatibility in DB)
  const [cats, setCats] = useState([]); // [{id,name,subcategories:[{id,name}]}]
  // NEW: full audience tree from /public/identities
  const [audTree, setAudTree] = useState([]);

  const [form, setForm] = useState({
    title: "", companyName: "", make_company_name_private: false, department: "", experienceLevel: "",
    jobType: "", workMode: "", description: "", requiredSkills: "",
    country:"", city: "",
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

  // NEW: media state for images
  const [media, setMedia] = useState({ logoUrl: null, coverImageUrl: null, images: [] });

  const readOnly = isEditMode && ownerUserId && user?.id !== ownerUserId;

  // Check if we're in edit mode and fetch job data if we are
  useEffect(() => {
    if (!id) return;
    setIsEditMode(true);
    setIsLoading(true);

    (async () => {
      try {
        const { data } = await client.get(`/jobs/${id}`);
        const job = data.job;

        // infer owner field across possible shapes
        const ownerId =
          job.ownerUserId ??
          job.postedByUserId ??
          job.createdById ??
          job.userId ??
          job.createdBy?.id ??
          job.poster?.id ??
          null;
        setOwnerUserId(ownerId);

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
          applicationDeadline: job.applicationDeadline ? job.applicationDeadline.split("T")[0] : "",
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

        // Collect images/logos/cover
        setMedia(extractMedia(job));
      } catch (error) {
        console.error("Error fetching job data:", error);
        toast.error("Failed to load job data");
        navigate("/jobs");
      } finally {
        setIsLoading(false);
      }
    })();
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
    if (readOnly) return;
    const { name, value } = e.target;
    setForm(f => {
      const next = { ...f, [name]: value };
      if (name === "categoryId") next.subcategoryId = "";
      return next;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;
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
        await client.put(`/jobs/${id}`, payload);
        toast.success("Job updated successfully!");
      } else {
        await client.post("/jobs", payload);
        toast.success("Job created successfully!");
        navigate("/jobs");
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error saving job:", error);
      toast.error(isEditMode ? "Failed to update job" : "Failed to create job");
      setIsLoading(false);
    }
  };


  if (isLoading) {
      return (
        <FullPageLoader message="Loading job…" tip="Fetching..." />
      );
    }
  

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header page={"jobs"} />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-5 cursor-pointer">
          <a onClick={() => navigate("/jobs")} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
            <I.back /> Back to Jobs
          </a>
        </div>

       {user?.id && <div>
         <h1 className="text-2xl md:text-3xl font-bold">
          {isEditMode ? "Edit Job Opportunity" : "Create Job Opportunity"}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {isEditMode
            ? "Update your job posting details below."
            : "Post a new job opening and choose exactly who should see it."}
        </p>
       </div>}

        {/* Show read-only summary for non-owners (with images) */}
        {readOnly ? (
          <ReadOnlyJobView form={form} audSel={audSel} audTree={audTree} media={media} />
        ) : isLoading && !isEditMode ? (
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
              <h3 className="font-semibold">Share with (identities & industries)</h3>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Pick who should see this job. You can select multiple identities, industries and roles.
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
                    onClick={() => document.getElementById("applicationDeadline").showPicker()}
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
