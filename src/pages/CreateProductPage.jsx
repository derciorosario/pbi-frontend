// src/pages/CreateProductPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import COUNTRIES from "../constants/countries";
import AudienceTree from "../components/AudienceTree";
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

export default function CreateProductPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [cats, setCats] = useState([]); // [{id,name,subcategories:[{id,name}]}]

  // Audience tree + selections (mirrors Events/Services)
  const [audTree, setAudTree] = useState([]);
  const [audSel, setAudSel] = useState({
    identityIds: new Set(),
    categoryIds: new Set(),
    subcategoryIds: new Set(),
    subsubCategoryIds: new Set(),
  });

  // Form state
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    subcategoryId: "",
    price: "",
    quantity: "",
    description: "",
    country: "",
    tagsInput: "",
  });

  // Images: [{ title, base64url }]
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

  // Load identities for AudienceTree
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

  // If editing, load existing product
  useEffect(() => {
    if (!isEditMode) return;
    (async () => {
      try {
        const { data } = await client.get(`/products/${id}`);
        setForm((f) => ({
          ...f,
          title: data.title || "",
          categoryId: data.categoryId || "",
          subcategoryId: data.subcategoryId || "",
          price: data.price?.toString?.() || "",
          quantity: data.quantity?.toString?.() || "",
          description: data.description || "",
          country: data.country || "",
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
        toast.error("Failed to load product");
        navigate("/business");
      }
    })();
  }, [isEditMode, id, navigate]);

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

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    if (!form.title.trim()) return "Title is required.";
    if (!form.description.trim()) return "Description is required.";
    if (!images.length) return "Please add at least one product image.";
    if (form.price !== "" && Number(form.price) < 0) return "Price cannot be negative.";
    if (form.quantity !== "" && Number(form.quantity) < 0) return "Quantity cannot be negative.";
    return null;
  }

  async function handleFilesChosen(files) {
    const arr = Array.from(files || []);
    if (!arr.length) return;

    // Only allow images
    const imgFiles = arr.filter((f) => f.type.startsWith("image/"));
    if (imgFiles.length !== arr.length) {
      toast.error("Only image files are allowed.");
    }
    const remaining = 20 - images.length;
    const slice = imgFiles.slice(0, Math.max(0, remaining));

    try {
      const mapped = await Promise.all(
        slice.map(async (file) => {
          const base64url = await fileToDataURL(file);
          // default title = file name (no extension)
          const base = file.name.replace(/\.[^/.]+$/, "");
          return { title: base, base64url };
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

  function parsedTags() {
    return (form.tagsInput || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        categoryId: form.categoryId || undefined,
        subcategoryId: form.subcategoryId || undefined,
        price:
          form.price !== "" && !Number.isNaN(Number(form.price))
            ? Number(form.price)
            : undefined,
        quantity:
        form.quantity !== "" && !Number.isNaN(Number(form.quantity))
            ? Number(form.quantity)
            : undefined,
        description: form.description,
        country: form.country || undefined,
        tags: parsedTags(),
        // Images (ONLY): [{ title, base64url }]
        images,
        // Audience
        identityIds: Array.from(audSel.identityIds),
        categoryIds: Array.from(audSel.categoryIds),
        subcategoryIds: Array.from(audSel.subcategoryIds),
        subsubCategoryIds: Array.from(audSel.subsubCategoryIds),
      };

      let res;
      if (isEditMode) {
        res = await client.put(`/products/${id}`, payload);
        toast.success("Product updated!");
      } else {
        res = await client.post("/products", payload);
        toast.success("Product published!");
      }

      navigate("/business");
      return res?.data;
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Could not save product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
      {/* ===== Header ===== */}
      <Header page={"business"} />

      {/* ===== Content ===== */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 fle justify-center gap-6">
        {/* Left/Main Form */}
        <section className="lg:col-span-8">
          <form
            onSubmit={onSubmit}
            className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">
                  {isEditMode ? "Edit Product" : "Create New Product Post"}
                </h1>
                <p className="text-sm text-gray-600">
                  Share your product with the Pan-African community
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/business")}
                  className={styles.ghost}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primary}>
                  {saving ? "Saving…" : isEditMode ? "Update" : "Publish Product"}
                </button>
              </div>
            </div>

            {/* Product Images */}
            <div>
              <h2 className="font-semibold mb-2">Product Images</h2>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFilesChosen(e.target.files)}
              />
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center text-gray-500 cursor-pointer hover:bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-sm">➕ Click to add images (JPG/PNG/WebP…)</div>
                <div className="text-xs text-gray-400 mt-1">Up to 20 images</div>
              </div>

              {images.length > 0 && (
                <div className="mt-4 grid sm:grid-cols-2 gap-4">
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

            {/* Product Title */}
            <div>
              <h2 className="font-semibold">Product Title</h2>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Enter your product title..."
                className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                required
              />
            </div>

        {/** 
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h2 className="font-semibold">Category</h2>
                <select
                  value={form.categoryId}
                  onChange={(e) => setField("categoryId", e.target.value)}
                  className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  <option value="">Select Category</option>
                  <option>Technology</option>
                  <option>Fashion</option>
                  <option>Food</option>
                  <option>Home</option>
                  <option>Beauty</option>
                </select>
              </div>
              <div>
                <h2 className="font-semibold">Subcategory (optional)</h2>
                <select
                  value={form.subcategoryId}
                  onChange={(e) => setField("subcategoryId", e.target.value)}
                  className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  <option value="">Select Subcategory</option>
                  <option>Mobile</option>
                  <option>Clothing</option>
                  <option>Beverages</option>
                  <option>Skincare</option>
                  <option>Furniture</option>
                </select>
              </div>
            </div> */}

            {/* Price + Quantity */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h2 className="font-semibold">Price</h2>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                  placeholder="0.00"
                  className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div>
                <h2 className="font-semibold">Quantity Available</h2>
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setField("quantity", e.target.value)}
                  placeholder="Enter quantity"
                  className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="font-semibold">Product Description</h2>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Describe your product in detail..."
                className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
                rows={4}
                required
              />
            </div>

            {/* Location */}
            <div>
              <h2 className="font-semibold">Location</h2>
              <div className="relative">
                <select
                  value={form.country}
                  onChange={(e) => setField("country", e.target.value)}
                  className="mt-1 w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2 top-[38px]">
                  <I.chevron />
                </span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h2 className="font-semibold">Tags</h2>
              <input
                type="text"
                value={form.tagsInput}
                onChange={(e) => setField("tagsInput", e.target.value)}
                placeholder="Add tags separated by commas..."
                className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              <p className="mt-1 text-xs text-gray-500">
                Tags help others find your product
              </p>
            </div>

            {/* ===== Share With (Audience selection) ===== */}
            <section>
              <h2 className="font-semibold text-brand-600">Share With (Target Audience)</h2>
              <p className="text-xs text-gray-600 mb-3">
                Select who should see this product. Choose multiple identities, categories, subcategories, and sub-subs.
              </p>
              <AudienceTree
                tree={audTree}
                selected={audSel}
                onChange={(next) => setAudSel(next)}
              />
            </section>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => navigate("/business")} className={styles.ghost}>
                Cancel
              </button>
              <button type="submit" className={styles.primaryWide} disabled={saving}>
                {saving ? "Saving…" : isEditMode ? "Update Product" : "Publish Product"}
              </button>
            </div>
          </form>
        </section>

        {/* Right Sidebar */}
        <aside className="lg:col-span-4 space-y-4 hidden">
          {/* Boost Your Post */}
          <div className="rounded-2xl bg-brand-700 p-6 text-white shadow-sm">
            <h3 className="text-lg font-semibold">🚀 Boost Your Post</h3>
            <p className="mt-1 text-sm">Reach more potential customers across Africa</p>
            <button className="mt-4 bg-white text-brand-700 rounded-lg px-4 py-2 text-sm font-semibold">
              Learn More
            </button>
          </div>

          {/* Tips */}
          <div className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm">
            <h3 className="font-semibold text-brand-600">📌 Product Posting Tips</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>✅ Use high-quality images</li>
              <li>✅ Write detailed descriptions</li>
              <li>✅ Set competitive pricing</li>
              <li>✅ Use relevant tags</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
