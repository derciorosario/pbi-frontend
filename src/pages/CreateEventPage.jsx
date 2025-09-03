import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import COUNTRIES from "../constants/countries";
import FullPageLoader from "../components/ui/FullPageLoader";
import CoverImagePicker from "../components/CoverImagePicker";
import Header from "../components/Header";

const styles = {
  primary: "rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-[#8A358A] hover:bg-[#7A2F7A] focus:outline-none focus:ring-2 focus:ring-[#8A358A]/30",
  primaryGhost: "rounded-lg px-3 py-1.5 text-sm font-semibold border border-[#8A358A] text-[#8A358A] bg-white hover:bg-[#8A358A]/5",
};

const I = {
  chevron: () => <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="m6 9 6 6 6-6"/></svg>,
};

export default function CreateEventPage() {
  const navigate = useNavigate();

  // form state
  const [form, setForm] = useState({
    eventType: "Workshop",
    title: "",
    description: "",
    categoryId: "",
    subcategoryId: "",
    date: "",
    startTime: "",
    endTime: "",
    timezone: "Africa/Lagos",
    locationType: "In-Person",
    country: "",
    city: "",
    address: "",
    onlineUrl: "",
    registrationType: "Free",
    price: "",
    currency: "USD",
    capacity: "",
    registrationDeadline: "",
    coverImageUrl: "",
  });

  const [meta, setMeta] = useState({ categories: [], currencies: [], timezones: [] });
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverImageBase64, setCoverImageBase64] = useState(null);

  // Fetch categories/subcategories/currencies/timezones
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/events/meta");
        setMeta(data);
        // Pick a sensible default country (optional)
        setForm((f) => ({ ...f, country: f.country || "Nigeria", timezone: f.timezone || (data.timezones[0] || "Africa/Lagos") }));
      } catch (e) {
        console.error(e);
        alert(e?.response?.data?.message || "Failed to load form metadata");
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

  const subcategoryOptions = useMemo(() => {
    if (!form.categoryId) return [];
    const cat = meta.categories.find((c) => c.id === form.categoryId);
    return cat?.subcategories || [];
  }, [form.categoryId, meta.categories]);

  function setField(name, value) {
    setForm((f) => {
      const next = { ...f, [name]: value };
      // If category changes and current subcategory doesn't belong, reset it
      if (name === "categoryId") next.subcategoryId = "";
      // If switching to Free, clear price/currency
      if (name === "registrationType" && value === "Free") {
        next.price = "";
        // keep currency but it won't be sent by BE since Free
      }
      // Location toggles
      if (name === "locationType") {
        if (value === "Virtual") {
          next.address = "";
          next.city = "";
          next.country = "";
        } else {
          next.onlineUrl = "";
        }
      }
      return next;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    // basic FE checks
    if (!form.title || !form.description) {
      alert("Title and description are required");
      return;
    }
    if (!form.date || !form.startTime) {
      alert("Date and start time are required");
      return;
    }
    if (form.registrationType === "Paid" && (!form.price || !form.currency)) {
      alert("Price and currency are required for paid events");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form,coverImageBase64 };
      // Clean optional fields
      if (!payload.subcategoryId) delete payload.subcategoryId;
      if (payload.registrationType === "Free") {
        delete payload.price;
        delete payload.currency;
      }
      if (payload.locationType === "Virtual") {
        delete payload.address; delete payload.city; delete payload.country;
      } else {
        delete payload.onlineUrl;
      }

      const { data } = await client.post("/events", payload);
      // success
      navigate(`/events/${data.id}`);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Could not create event");
    } finally {
      setSaving(false);
    }
  }

  if (loadingMeta) {
    return <FullPageLoader message="Loading event form…" tip="Fetching categories and preferences" />;
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
     <Header page={'events'}/>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate("/events")} className="flex items-center gap-2 text-sm text-gray-600 hover:underline">
          ← Go to Events
        </button>

        <h1 className="text-2xl font-bold mt-3">Create Event</h1>
        <p className="text-sm text-gray-600">Share your event with the community</p>

        <form onSubmit={onSubmit} className="mt-6 rounded-2xl bg-white border p-6 shadow-sm space-y-8">
          {/* Event Type */}
          <section>
            <h2 className="font-semibold">Event Type</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {["Workshop", "Conference", "Networking"].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setField("eventType", t)}
                  className={`border rounded-xl p-4 text-left hover:border-[#8A358A] ${
                    form.eventType === t ? "border-[#8A358A] bg-[#8A358A]/5" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="font-medium">{t}</div>
                  <div className="text-xs text-gray-500">{t === "Workshop" ? "Interactive learning session" : t === "Conference" ? "Large-scale gathering" : "Connect with peers"}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Basic Info */}
          <section>
            <h2 className="font-semibold">Basic Information</h2>
            <div className="mt-3 grid gap-4">
              <input
                type="text"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Enter event title"
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full"
                required
              />
              {/* Category (Industry) */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <select
                    value={form.categoryId}
                    onChange={(e) => setField("categoryId", e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8"
                  >
                    <option value="">Select category (industry)</option>
                    {meta.categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                    <I.chevron />
                  </span>
                </div>

                {/* Optional Subcategory */}
                <div className="relative">
                  <select
                    value={form.subcategoryId}
                    onChange={(e) => setField("subcategoryId", e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8"
                    disabled={!form.categoryId || subcategoryOptions.length === 0}
                  >
                    <option value="">{subcategoryOptions.length ? "Select subcategory (optional)" : "No subcategories"}</option>
                    {subcategoryOptions.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                    <I.chevron />
                  </span>
                </div>
              </div>

              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Describe your event..."
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-full"
                rows={4}
                required
              />
            </div>
          </section>

          {/* Date & Time */}
          <section>
            <h2 className="font-semibold">Date & Time</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <input type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" required />
              <input type="time" value={form.startTime} onChange={(e) => setField("startTime", e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" required />
              <input type="time" value={form.endTime} onChange={(e) => setField("endTime", e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div className="relative mt-3">
              <select
                value={form.timezone}
                onChange={(e) => setField("timezone", e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8"
              >
                {meta.timezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                <I.chevron />
              </span>
            </div>
          </section>

          {/* Location */}
          <section>
            <h2 className="font-semibold">Location</h2>
            <div className="mt-3 flex gap-6 text-sm">
              {["In-Person", "Virtual", "Hybrid"].map((opt) => (
                <label key={opt} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="locationType"
                    checked={form.locationType === opt}
                    onChange={() => setField("locationType", opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>

            {form.locationType !== "Virtual" ? (
              <>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="relative">
                    <select
                      value={form.country}
                      onChange={(e) => setField("country", e.target.value)}
                      className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8"
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                      <I.chevron />
                    </span>
                  </div>

                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    placeholder="City"
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>

                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder="Full address"
                  className="mt-3 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full"
                />
              </>
            ) : (
              <input
                type="url"
                value={form.onlineUrl}
                onChange={(e) => setField("onlineUrl", e.target.value)}
                placeholder="Meeting link (Zoom/Meet/etc.)"
                className="mt-3 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full"
              />
            )}
          </section>

          {/* Registration */}
          <section>
            <h2 className="font-semibold">Registration</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <select
                  value={form.registrationType}
                  onChange={(e) => setField("registrationType", e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8"
                >
                  <option>Free</option>
                  <option>Paid</option>
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                  <I.chevron />
                </span>
              </div>

              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setField("capacity", e.target.value)}
                placeholder="Seats / capacity (optional)"
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </div>

            {form.registrationType === "Paid" && (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                  placeholder="Price"
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  required
                />
                <div className="relative">
                  <select
                    value={form.currency}
                    onChange={(e) => setField("currency", e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm pr-8"
                  >
                    {meta.currencies.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                    <I.chevron />
                  </span>
                </div>
              </div>
            )}

            <input
              type="date"
              value={form.registrationDeadline}
              onChange={(e) => setField("registrationDeadline", e.target.value)}
              className="mt-3 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full"
            />
          </section>

          {/* Cover image (optional) */}
          <section>
            <h2 className="font-semibold">Cover Image</h2>
            <CoverImagePicker
        label="Cover Image (optional)"
        value={coverImageBase64}
        onChange={setCoverImageBase64}
      />
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className={styles.primaryGhost}
              onClick={() => navigate("/events")}
            >
              Cancel
            </button>
            <button type="submit" className={styles.primary} disabled={saving}>
              {saving ? "Publishing…" : "Publish Event"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
