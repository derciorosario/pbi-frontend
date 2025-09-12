// src/pages/CrowdfundForm.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import COUNTRIES from "../constants/countries";
import client from "../api/client";
import AudienceTree from "../components/AudienceTree";
import DefaultLayout from "../layout/DefaultLayout";
import Header from "./Header";

/* --- Minimal inline icons --- */
const I = {
  upload: () => (
    <svg className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3 7 8h3v6h4V8h3l-5-5z" />
      <path d="M5 18h14v3H5z" />
    </svg>
  ),
  chevron: () => (
    <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  trash: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM6 9h2v9H6V9Z" />
    </svg>
  ),
};

/* --- Small form atoms --- */
const Label = ({ children, required }) => (
  <label className="text-[12px] font-medium text-gray-700">
    {children} {required && <span className="text-pink-600">*</span>}
  </label>
);

const Input = (props) => (
  <input
    {...props}
    className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 ${
      props.className || ""
    }`}
  />
);

const Select = ({ children, ...rest }) => (
  <div className="relative">
    <select
      {...rest}
      className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
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
    className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 ${
      props.className || ""
    }`}
  />
);

/* Helper: File -> dataURL */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => resolve(r.result);
    r.readAsDataURL(file);
  });
}

/** Create/Edit Crowdfunding Project */
export default function CrowdfundForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const {loading,setLoading}=useState(false)

  const fileRef = useRef(null);
  // Images: [{ title, base64url }]
  const [images, setImages] = useState([]);
  const [cats, setCats] = useState([]); // [{id,name,subcategories:[{id,name}]}]
  const [saving, setSaving] = useState(false);
  
  // Audience tree data and selection
  const [audTree, setAudTree] = useState([]);
  const [audSel, setAudSel] = useState({
    identityIds: new Set(),
    categoryIds: new Set(),
    subcategoryIds: new Set(),
    subsubCategoryIds: new Set(),
  });

  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    country: "",
    city: "",
    goal: "",
    raised: "",
    currency: "USD",
    deadline: "",
    pitch: "",
    rewards: "",
    team: "",
    links: "", // comma/newline separated
    tags: "", // comma separated
    email: "",
    phone: "",
    visibility: "public",
    status: "draft",
  });

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const chooseFiles = () => fileRef.current?.click();

  /* Load categories and audience tree */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/categories/tree");
        setCats(data.categories || []);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    })();
    
    // Load audience tree data
    (async () => {
      try {
        const { data } = await client.get("/public/identities");
        setAudTree(data.identities || []);
      } catch (err) {
        console.error("Error loading identities:", err);
      }
    })();
  }, []);

  /* Edit mode: fetch existing project */
  useEffect(() => {
    if (!isEditMode) return;
    (async () => {
      try {
        const { data } = await client.get(`/funding/projects/${id}`);
        setForm((f) => ({
          ...f,
          title: data.title || "",
          categoryId: data.categoryId || "",
          country: data.country || "",
          city: data.city || "",
          goal: data.goal?.toString?.() || "",
          raised: data.raised?.toString?.() || "",
          currency: data.currency || "USD",
          deadline: data.deadline ? new Date(data.deadline).toISOString().split("T")[0] : "",
          pitch: data.pitch || "",
          rewards: data.rewards || "",
          team: data.team || "",
          links: Array.isArray(data.links) ? data.links.join(", ") : data.links || "",
          tags: Array.isArray(data.tags) ? data.tags.join(", ") : data.tags || "",
          email: data.email || "",
          phone: data.phone || "",
          visibility: data.visibility || "public",
          status: data.status || "draft",
        }));

        if (Array.isArray(data.images)) {
          setImages(
            data.images
              .filter((x) => x?.base64url)
              .map((x, i) => ({
                title: x.title || x.name || `Image ${i + 1}`,
                base64url: x.base64url,
              }))
          );
        }
        
        // Set audience selection if available
        if (data.audienceIdentities || data.audienceCategories ||
            data.audienceSubcategories || data.audienceSubsubs) {
          setAudSel({
            identityIds: new Set((data.audienceIdentities || []).map((x) => x.id)),
            categoryIds: new Set((data.audienceCategories || []).map((x) => x.id)),
            subcategoryIds: new Set((data.audienceSubcategories || []).map((x) => x.id)),
            subsubCategoryIds: new Set((data.audienceSubsubs || []).map((x) => x.id)),
          });
        }
      } catch (err) {
        console.error(err);
        alert("Could not load the project.");
        navigate("/funding");
      }
    })();
  }, [isEditMode, id, navigate]);

  /* Upload guard: images only, <=5MB each, max 20 total */
  async function handleFilesChosen(fileList) {
    const arr = Array.from(fileList || []);
    if (!arr.length) return;

    const onlyImages = arr.filter((f) => f.type.startsWith("image/"));
    if (onlyImages.length !== arr.length) {
      alert("Only image files are allowed.");
    }

    const oversize = onlyImages.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversize.length) {
      alert("Each image must be at most 5MB.");
    }
    const accepted = onlyImages.filter((f) => f.size <= 5 * 1024 * 1024);

    const remaining = 20 - images.length;
    const slice = accepted.slice(0, Math.max(0, remaining));

    try {
      const mapped = await Promise.all(
        slice.map(async (file) => {
          const base64url = await fileToDataURL(file);
          const base = file.name.replace(/\.[^/.]+$/, "");
          return { title: base, base64url };
        })
      );
      setImages((prev) => [...prev, ...mapped]);
    } catch (err) {
      console.error(err);
      alert("Some images could not be read.");
    }
  }

  function updateImageTitle(idx, title) {
    setImages((prev) => prev.map((x, i) => (i === idx ? { ...x, title } : x)));
  }

  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  /* Helpers -> payload */
  function parsedTags() {
    return (form.tags || "")
      .split(/[,\n]/g)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function parsedLinks() {
    return (form.links || "")
      .split(/[,\n]/g)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function validate() {
    if (!form.title.trim()) return "Title is required.";
    if (!form.categoryId) return "Category is required.";
    if (!form.country) return "Country is required.";
    if (!form.goal || Number(form.goal) <= 0) return "Funding goal must be greater than zero.";
    if (!form.deadline) return "Deadline is required.";
    if (!form.pitch.trim()) return "Project pitch/description is required.";
    if (!images.length) return "Please add at least one image.";
    return null;
  }

  async function handleSubmit(status) {
    const err = validate();
    if (err) return alert(err);

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        categoryId: form.categoryId || undefined,
        country: form.country,
        city: form.city || undefined,
        goal: Number(form.goal),
        raised: form.raised ? Number(form.raised) : 0,
        currency: form.currency,
        deadline: form.deadline, // YYYY-MM-DD
        pitch: form.pitch,
        rewards: form.rewards || undefined,
        team: form.team || undefined,
        links: parsedLinks(),
        tags: parsedTags(),
        email: form.email || undefined,
        phone: form.phone || undefined,
        visibility: form.visibility || "public",
        status, // "draft" | "published"
        images, // [{ title, base64url }]
        // Include audience targeting data
        identityIds: Array.from(audSel.identityIds),
        categoryIds: Array.from(audSel.categoryIds),
        subcategoryIds: Array.from(audSel.subcategoryIds),
        subsubCategoryIds: Array.from(audSel.subsubCategoryIds),
      };

      if (isEditMode) {
        await client.put(`/funding/projects/${id}`, payload);
        alert("Project updated successfully!");
      } else {
        await client.post("/funding/projects", payload);
        alert(status === "draft" ? "Draft saved!" : "Project published!");
      }
      navigate("/funding");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Could not save the project.");
    } finally {
      setSaving(false);
    }
  }

  return (
   
     <DefaultLayout>
        <Header page={'funding'}/>
         <div className="max-w-4xl mx-auto my-5">
      <button
        onClick={() => navigate("/funding")}
        className="flex mb-5 items-center gap-2 text-sm text-gray-600 hover:text-brand-600"
        type="button"
      >
        ← Back to Funding
      </button>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm">
        <h2 className="text-xl font-semibold">{isEditMode ? "Edit Funding Project" : "Create Funding Project"}</h2>
        <p className="text-sm text-gray-500 mt-1">
          Present your idea, set goals, and raise funds from the 54Links community.
        </p>

        {/* Title & Category */}
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div>
            <Label required>Project Title</Label>
            <Input
              name="title"
              value={form.title}
              onChange={change}
              placeholder="e.g., Payments platform for SMEs"
              required
            />
          </div>
          <div>
            <Label required>Category</Label>
            <Select name="categoryId" value={form.categoryId} onChange={change} required>
              <option value="">Select</option>
              {cats.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Location */}
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div>
            <Label required>Country</Label>
            <Select name="country" value={form.country} onChange={change} required>
              <option value="">Select a country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>City</Label>
            <Input name="city" value={form.city} onChange={change} placeholder="e.g., Accra, Lagos" />
          </div>
        </div>

        {/* Goal, Raised, Currency, Deadline */}
        <div className="mt-4 grid md:grid-cols-4 gap-4">
          <div>
            <Label required>Funding Goal</Label>
            <Input
              name="goal"
              type="number"
              min="0"
              value={form.goal}
              onChange={change}
              placeholder="e.g., 50000"
              required
            />
          </div>
          
          <div>
            <Label>Amount Raised</Label>
            <Input
              name="raised"
              type="number"
              min="0"
              value={form.raised}
              onChange={change}
              placeholder="e.g., 25000"
            />
          </div>

          <div>
            <Label>Currency</Label>
            <Select name="currency" value={form.currency} onChange={change}>
              {[
                "USD","EUR","GBP","NGN","GHS","ZAR","KES","UGX","TZS","XOF","XAF","MAD","DZD","TND","EGP","ETB",
                "NAD","BWP","MZN","ZMW","RWF","BIF","SOS","SDG","CDF",
              ].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          </div>

          <div>
            <Label required>Deadline</Label>
            <Input name="deadline" type="date" value={form.deadline} onChange={change} required />
          </div>
        </div>

        {/* Media (images only) */}
        <div className="mt-4">
          <Label>Media (images)</Label>
          <div className="mt-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/60">
            <div className="p-6 text-center">
              <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-white shadow">
                <I.upload />
              </div>
              <div className="font-semibold text-gray-700">Upload images</div>
              <p className="text-sm text-gray-500">Drag & drop, or click below to select files</p>

              <button
                onClick={chooseFiles}
                type="button"
                className="mt-3 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium"
              >
                Choose files
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFilesChosen(e.target.files)}
              />

              {/* Preview */}
              {images.length > 0 && (
                <div className="mt-5 grid sm:grid-cols-2 gap-4 text-left">
                  {images.map((img, idx) => (
                    <div key={idx} className="border rounded-xl overflow-hidden">
                      <div className="h-44 bg-gray-100">
                        <img
                          src={img.base64url}
                          alt={img.title || `Image ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-3 flex items-center gap-2">
                        <Input
                          value={img.title}
                          onChange={(e) => updateImageTitle(idx, e.target.value)}
                          placeholder={`Image ${idx + 1} title`}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="p-2 rounded hover:bg-gray-100"
                          title="Remove"
                        >
                          <I.trash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-2 text-[11px] text-gray-400">
                Formats: JPG, PNG, WebP, GIF — up to 5MB each, max 20 images.
              </p>
            </div>
          </div>
        </div>

        {/* Pitch / Description */}
        <div className="mt-4">
          <Label required>Pitch / Description</Label>
          <Textarea
            name="pitch"
            value={form.pitch}
            onChange={change}
            rows={6}
            placeholder="Explain the problem, your solution, market, traction, and how funds will be used."
            required
          />
        </div>

        {/* Rewards / Team */}
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div>
            <Label>Rewards / Perks (optional)</Label>
            <Textarea
              name="rewards"
              value={form.rewards}
              onChange={change}
              rows={4}
              placeholder="e.g., Early access, platform credits, swag…"
            />
          </div>
          <div>
            <Label>Team</Label>
            <Textarea
              name="team"
              value={form.team}
              onChange={change}
              rows={4}
              placeholder="Who’s building this? Roles and experience."
            />
          </div>
        </div>

        {/* Links */}
        <div className="mt-4">
          <Label>Links (site, deck, demo)</Label>
          <Input
            name="links"
            value={form.links}
            onChange={change}
            placeholder="Separate with commas or new lines: https://..., https://..."
          />
        </div>

        {/* Contact & Tags */}
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div>
            <Label>Contact Email</Label>
            <Input name="email" value={form.email} onChange={change} placeholder="you@company.com" />
          </div>
          <div>
            <Label>Phone (optional)</Label>
            <Input name="phone" value={form.phone} onChange={change} placeholder="+244 ..." />
          </div>
        </div>

        <div className="mt-4">
          <Label>Tags</Label>
          <Input
            name="tags"
            value={form.tags}
            onChange={change}
            placeholder="fintech, payments, SME"
          />
          <p className="mt-1 text-[11px] text-gray-400">Use commas to help discovery.</p>
        </div>
        
        {/* Audience Targeting */}
        <div className="mt-4">
          <Label>Target Audience</Label>
          <div className="mt-2 border border-gray-200 rounded-xl p-4 bg-gray-50/60">
            <p className="text-sm text-gray-500 mb-3">
              Select who should see this funding project in their feeds and recommendations.
            </p>
            {audTree.length > 0 ? (
              <AudienceTree
                tree={audTree || []}
                selected={audSel}
                onChange={setAudSel}
              />
            ) : (
              <p className="text-sm text-gray-400 italic">Loading audience options...</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3 justify-end">
         
          <button
            onClick={() => handleSubmit("published")}
            type="button"
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60"
          >
            {saving ? "Publishing…" : "Publish project"}
          </button>
        </div>
      </div>
    </div>
     </DefaultLayout>
  );
}
