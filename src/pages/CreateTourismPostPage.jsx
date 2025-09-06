// src/pages/CreateTourismPostPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Home, Users, Briefcase, Calendar, Building2, MapPin, Bell, Search, Image as ImageIcon,
} from "lucide-react";
import AudienceTree from "../components/AudienceTree";
import COUNTRIES from "../constants/countries";
import client from "../api/client";
import { toast } from "../lib/toast";

/* ---------------- Shared styles (brand) ---------------- */
const styles = {
  primary:
    "rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
  primaryWide:
    "w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
  ghost:
    "rounded-lg px-3 py-1.5 text-sm font-semibold border border-brand-600 text-brand-600 bg-white hover:bg-brand-50",
};

const I = {
  trash: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM6 9h2v9H6V9Z" />
    </svg>
  ),
  chevron: () => (
    <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
};

/* File → data URL */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => resolve(r.result);
    r.readAsDataURL(file);
  });
}

export default function CreateTourismPostPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [postType, setPostType] = useState("Destination");
  const [saving, setSaving] = useState(false);

  // Audience
  const [audTree, setAudTree] = useState([]);
  const [audSel, setAudSel] = useState({
    identityIds: new Set(),
    categoryIds: new Set(),
    subcategoryIds: new Set(),
    subsubCategoryIds: new Set(),
  });

  // Form
  const [form, setForm] = useState({
    title: "",
    country: "",
    location: "",
    description: "",
    season: "",
    budgetRange: "",
    tagsInput: "",
  });

  // Images ONLY: [{ title, base64url }]
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

  /* -------- Load AudienceTree -------- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/public/identities");
        setAudTree(data.identities || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  /* -------- Edit mode: load post -------- */
  useEffect(() => {
    if (!isEditMode) return;
    (async () => {
      try {
        const { data } = await client.get(`/tourism/${id}`);
        setPostType(data.postType || "Destination");
        setForm((f) => ({
          ...f,
          title: data.title || "",
          country: data.country || "",
          location: data.location || "",
          description: data.description || "",
          season: data.season || "",
          budgetRange: data.budgetRange || "",
          tagsInput: Array.isArray(data.tags) ? data.tags.join(", ") : "",
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

        setAudSel({
          identityIds: new Set((data.audienceIdentities || []).map((x) => x.id)),
          categoryIds: new Set((data.audienceCategories || []).map((x) => x.id)),
          subcategoryIds: new Set((data.audienceSubcategories || []).map((x) => x.id)),
          subsubCategoryIds: new Set((data.audienceSubsubs || []).map((x) => x.id)),
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load tourism post");
        navigate("/tourism");
      }
    })();
  }, [isEditMode, id, navigate]);

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function parsedTags() {
    return (form.tagsInput || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function validate() {
    if (!form.title.trim()) return "Title is required.";
    if (!form.country.trim()) return "Country is required.";
    if (!form.description.trim()) return "Description is required.";
    if (!images.length) return "Please add at least one image.";
    return null;
  }

  async function handleFilesChosen(files) {
    const arr = Array.from(files || []);
    if (!arr.length) return;

    // Images only; size cap 5MB each
    const onlyImages = arr.filter((f) => f.type.startsWith("image/"));
    if (onlyImages.length !== arr.length) {
      toast.error("Only image files are allowed.");
    }

    const sizeErrors = onlyImages.filter((f) => f.size > 5 * 1024 * 1024);
    if (sizeErrors.length) {
      toast.error("Each image must be ≤ 5MB.");
    }
    const accepted = onlyImages.filter((f) => f.size <= 5 * 1024 * 1024);

    const remaining = 20 - images.length;
    const slice = accepted.slice(0, Math.max(0, remaining));

    try {
      const mapped = await Promise.all(
        slice.map(async (file) => {
          const base64url = await fileToDataURL(file);
          const nameBase = file.name.replace(/\.[^/.]+$/, "");
          return { title: nameBase, base64url };
        })
      );
      setImages((prev) => [...prev, ...mapped]);
    } catch (err) {
      console.error(err);
      toast.error("Some images could not be read.");
    }
  }

  function updateImageTitle(idx, title) {
    setImages((prev) => prev.map((x, i) => (i === idx ? { ...x, title } : x)));
  }

  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) return toast.error(err);

    setSaving(true);
    try {
      const payload = {
        postType,
        title: form.title,
        country: form.country,
        location: form.location || undefined,
        description: form.description,
        season: form.season || undefined,
        budgetRange: form.budgetRange || undefined,
        tags: parsedTags(),
        // IMAGES ONLY:
        images, // [{ title, base64url }]
        // Audience
        identityIds: Array.from(audSel.identityIds),
        categoryIds: Array.from(audSel.categoryIds),
        subcategoryIds: Array.from(audSel.subcategoryIds),
        subsubCategoryIds: Array.from(audSel.subsubCategoryIds),
      };

      let res;
      if (isEditMode) {
        res = await client.put(`/tourism/${id}`, payload);
        toast.success("Tourism post updated!");
      } else {
        res = await client.post("/tourism", payload);
        toast.success("Tourism post published!");
      }

      navigate("/tourism");
      return res?.data;
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Could not save tourism post");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="h-9 w-9 rounded-xl grid place-items-center text-white font-bold bg-brand-700">
              P
            </div>
            <div className="leading-tight">
              <div className="font-semibold">54LINKS</div>
              <div className="text-[11px] text-gray-500 -mt-1">Business Initiative</div>
            </div>
          </div>

          {/* Navbar */}
          <nav className="hidden md:flex items-center gap-4 text-sm ml-6">
            <a onClick={() => navigate("/")} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer">
              <Home size={16} /> Feed
            </a>
            <a onClick={() => navigate("/people")} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer">
              <Users size={16} /> People
            </a>
            <a onClick={() => navigate("/jobs")} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer">
              <Briefcase size={16} /> Jobs
            </a>
            <a onClick={() => navigate("/events")} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer">
              <Calendar size={16} /> Events
            </a>
            <a onClick={() => navigate("/business")} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer">
              <Building2 size={16} /> Business
            </a>
            <a onClick={() => navigate("/tourism")} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white cursor-pointer bg-brand-600 hover:bg-brand-700">
              <MapPin size={16} /> Tourism
            </a>
          </nav>

          {/* Search + Notifications + Profile */}
          <div className="ml-auto hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="flex items-center gap-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2">
              <Search size={16} className="text-gray-500" />
              <input className="w-full bg-transparent outline-none text-sm" placeholder="Search people, jobs, events..." />
            </div>
            <button onClick={() => navigate("/notifications")} className="relative">
              <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-white text-[10px]">3</span>
              <svg className="h-[18px] w-[18px] text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22ZM18 16v-5a6 6 0 1 0-12 0v5l-1.8 1.8A1 1 0 0 0 5 20h14a1 1 0 0 0 .8-1.6Z"/>
              </svg>
            </button>
            <button onClick={() => navigate("/profile")} className="ml-2 h-10 w-10 rounded-full bg-gray-100 grid place-items-center flex-shrink-0">AB</button>
          </div>
        </div>
      </header>

      {/* ===== Content ===== */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/tourism")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:underline"
          type="button"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold mt-3">{isEditMode ? "Edit Tourism Post" : "Create Tourism Post"}</h1>
        <p className="text-sm text-gray-600">
          Share amazing destinations, experiences, and cultural insights across Africa
        </p>

        <form onSubmit={onSubmit} className="mt-6 rounded-2xl bg-white border border-gray-100 p-6 shadow-sm space-y-8">
          {/* Post Type */}
          <section>
            <h2 className="font-semibold">Post Type</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Destination", desc: "Share a beautiful location" },
                { label: "Experience", desc: "Share travel experiences" },
                { label: "Culture", desc: "Share cultural insights" },
              ].map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setPostType(t.label)}
                  className={`border rounded-xl p-4 text-left transition-colors ${
                    postType === t.label ? "border-brand-600 bg-brand-50" : "border-gray-200 bg-white hover:border-brand-600"
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-xs text-gray-500">{t.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Title */}
          <section>
            <h2 className="font-semibold">Title *</h2>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Enter an engaging title for your post"
              className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
              required
            />
          </section>

          {/* Location */}
          <section>
            <h2 className="font-semibold">Country & City/Location *</h2>
            <div className="mt-2 grid sm:grid-cols-2 gap-4">
              <div className="relative">
                <select
                  value={form.country}
                  onChange={(e) => setField("country", e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-200 pr-8"
                  required
                >
                  <option value="">Select Country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2 top-3">
                  <I.chevron />
                </span>
              </div>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="Enter specific location (e.g., Zanzibar, Stone Town)"
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </section>

          {/* Media Upload (Images Only) */}
          <section>
            <h2 className="font-semibold">Photos</h2>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-500">
              <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2">Upload Images</p>
              <p className="text-xs">Drag and drop your photos here, or click to browse</p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFilesChosen(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Choose Files
              </button>
              <p className="mt-1 text-xs text-gray-400">Supported formats: JPG, PNG, WebP, GIF (Max 5MB each)</p>

              {images.length > 0 && (
                <div className="mt-6 grid sm:grid-cols-2 gap-4 text-left">
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
                        <input
                          type="text"
                          value={img.title}
                          onChange={(e) => updateImageTitle(idx, e.target.value)}
                          placeholder={`Image ${idx + 1} title`}
                          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
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
            </div>
          </section>

          {/* Description */}
          <section>
            <h2 className="font-semibold">Description *</h2>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Describe this destination, share your experience, cultural insights, and travel tips..."
              className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
              rows={4}
              required
            />
          </section>

          {/* Season & Budget */}
          <section>
            <h2 className="font-semibold">Best Season to Visit & Budget Range</h2>
            <div className="mt-2 grid sm:grid-cols-2 gap-4">
              <div className="relative">
                <select
                  value={form.season}
                  onChange={(e) => setField("season", e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-200 pr-8"
                >
                  <option value="">Select Season</option>
                  <option>Summer</option>
                  <option>Winter</option>
                  <option>All Year</option>
                  <option>Rainy Season</option>
                  <option>Dry Season</option>
                </select>
                <span className="pointer-events-none absolute right-2 top-3">
                  <I.chevron />
                </span>
              </div>

              <div className="relative">
                <select
                  value={form.budgetRange}
                  onChange={(e) => setField("budgetRange", e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-brand-200 pr-8"
                >
                  <option value="">Select Budget</option>
                  <option>$100 - $500</option>
                  <option>$500 - $2000</option>
                  <option>$2000+</option>
                </select>
                <span className="pointer-events-none absolute right-2 top-3">
                  <I.chevron />
                </span>
              </div>
            </div>
          </section>

          {/* Tags */}
          <section>
            <h2 className="font-semibold">Tags</h2>
            <input
              type="text"
              value={form.tagsInput}
              onChange={(e) => setField("tagsInput", e.target.value)}
              placeholder="Add relevant tags (e.g., wildlife, beaches, culture, adventure)"
              className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate tags with commas to help others discover your post
            </p>
          </section>

          {/* ===== Share With (Audience selection) ===== */}
          <section>
            <h2 className="font-semibold text-brand-600">Share With (Target Audience)</h2>
            <p className="text-xs text-gray-600 mb-3">
              Select who should see this post. Choose multiple identities, categories, subcategories, and sub-subs.
            </p>
            <AudienceTree
              tree={audTree}
              selected={audSel}
              onChange={(next) => setAudSel(next)}
            />
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate("/tourism")} className={styles.ghost}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryWide} disabled={saving}>
              {saving ? "Saving…" : isEditMode ? "Update Post" : "Publish Post"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
