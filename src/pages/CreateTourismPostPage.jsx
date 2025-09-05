// src/pages/CreateTourismPostPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  Briefcase,
  Calendar,
  Building2,
  MapPin,
  Bell,
  Search,
  Image as ImageIcon,
} from "lucide-react";

/* ---------------- Shared styles ---------------- */
const styles = {
  primary:
    "rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-[#8A358A] hover:bg-[#7A2F7A] focus:outline-none focus:ring-2 focus:ring-[#8A358A]/30",
  primaryWide:
    "w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-[#8A358A] hover:bg-[#7A2F7A] focus:outline-none focus:ring-2 focus:ring-[#8A358A]/30",
};

export default function CreateTourismPostPage() {
  const navigate = useNavigate();
  const [postType, setPostType] = useState("Destination");

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
            <div
              className="h-9 w-9 rounded-xl grid place-items-center text-white font-bold"
              style={{ background: "linear-gradient(135deg,#8A358A,#9333EA)" }}
            >
              P
            </div>
            <div className="leading-tight">
              <div className="font-semibold">54LINKS</div>
              <div className="text-[11px] text-gray-500 -mt-1">
                Business Initiative
              </div>
            </div>
          </div>

          {/* Navbar */}
          <nav className="hidden md:flex items-center gap-4 text-sm ml-6">
            <a onClick={() => navigate("/")} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"><Home size={16}/> Feed</a>
            <a onClick={() => navigate("/people")} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"><Users size={16}/> People</a>
            <a onClick={() => navigate("/jobs")} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"><Briefcase size={16}/> Jobs</a>
            <a onClick={() => navigate("/events")} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"><Calendar size={16}/> Events</a>
            <a onClick={() => navigate("/business")} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"><Building2 size={16}/> Business</a>
            <a onClick={() => navigate("/tourism")} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white cursor-pointer" style={{ background: "#8A358A" }}><MapPin size={16}/> Tourism</a>
          </nav>

          {/* Search + Notifications + Profile */}
          <div className="ml-auto hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="flex items-center gap-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2">
              <Search size={16} className="text-gray-500" />
              <input
                className="w-full bg-transparent outline-none text-sm"
                placeholder="Search people, jobs, events..."
              />
            </div>
            <button onClick={()=>navigate('/notifications')} className="relative">
              <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-white text-[10px]">3</span>
              <svg className="h-[18px] w-[18px] text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22ZM18 16v-5a6 6 0 1 0-12 0v5l-1.8 1.8A1 1 0 0 0 5 20h14a1 1 0 0 0 .8-1.6Z"/></svg>
            </button>
            <button onClick={()=>navigate('/profile')} className="ml-2 h-10 w-10 rounded-full bg-gray-100 grid place-items-center flex-shrink-0">AB</button>
          </div>
        </div>
      </header>

      {/* ===== Content ===== */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate("/tourism")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:underline"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold mt-3">Create Tourism Post</h1>
        <p className="text-sm text-gray-600">
          Share amazing destinations, experiences, and cultural insights across Africa
        </p>

        <div className="mt-6 rounded-2xl bg-white border p-6 shadow-sm space-y-8">
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
                  onClick={() => setPostType(t.label)}
                  className={`border rounded-xl p-4 text-left hover:border-[#8A358A] ${
                    postType === t.label
                      ? "border-[#8A358A] bg-[#8A358A]/5"
                      : "border-gray-200 bg-white"
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
              placeholder="Enter an engaging title for your post"
              className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full"
            />
          </section>

          {/* Location */}
          <section>
            <h2 className="font-semibold">Country & City/Location *</h2>
            <div className="mt-2 grid sm:grid-cols-2 gap-4">
              <select className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
                <option>Select Country</option>
                <option>Nigeria</option>
                <option>Ghana</option>
                <option>Kenya</option>
              </select>
              <input
                type="text"
                placeholder="Enter specific location"
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </section>

          {/* Media Upload */}
          <section>
            <h2 className="font-semibold">Photos & Videos</h2>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-500">
              <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2">Upload Media</p>
              <p className="text-xs">Drag and drop your photos or videos here, or click to browse</p>
              <button className="mt-3 rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700">
                Choose Files
              </button>
              <p className="mt-1 text-xs text-gray-400">Supported formats: JPG, PNG (Max 5MB each)</p>
            </div>
          </section>

          {/* Description */}
          <section>
            <h2 className="font-semibold">Description *</h2>
            <textarea
              placeholder="Describe this destination, share your experience, cultural insights, travel tips..."
              className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full"
              rows={4}
            />
          </section>

          {/* Season & Budget */}
          <section>
            <h2 className="font-semibold">Best Season to Visit & Budget Range</h2>
            <div className="mt-2 grid sm:grid-cols-2 gap-4">
              <select className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
                <option>Select Season</option>
                <option>Summer</option>
                <option>Winter</option>
                <option>All Year</option>
              </select>
              <select className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
                <option>Select Budget</option>
                <option>$100 - $500</option>
                <option>$500 - $2000</option>
                <option>$2000+</option>
              </select>
            </div>
          </section>

          {/* Tags */}
          <section>
            <h2 className="font-semibold">Tags</h2>
            <input
              type="text"
              placeholder="Add relevant tags (e.g., wildlife, beaches, culture, adventure)"
              className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full"
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate tags with commas to help others discover your post
            </p>
          </section>

          {/* Visibility */}
          <section>
            <h2 className="font-semibold">Post Visibility</h2>
            <div className="mt-2 flex flex-col gap-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="visibility" defaultChecked /> Public – Anyone can see this post
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="visibility" /> Connections Only – Only your connections can see this post
              </label>
            </div>
          </section>

          {/* Boost Post */}
          <section className="border rounded-xl p-4 bg-purple-50">
            <h3 className="font-semibold text-[#8A358A]">Boost Your Post</h3>
            <p className="mt-1 text-sm text-gray-600">
              Get more visibility and reach more travelers interested in African destinations
            </p>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" /> Boost this post for 7 days ($15)
            </label>
          </section>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button className="rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700">
              Save as Draft
            </button>
            <button className="rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700">
              Preview
            </button>
            <button className={styles.primaryWide}>Publish Post</button>
          </div>
        </div>
      </main>
    </div>
  );
}
