// src/pages/CreateProductPage.jsx
import React from "react";
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
} from "lucide-react";

/* ---------------- Shared styles ---------------- */
const styles = {
  primary:
    "rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-[#8A358A] hover:bg-[#7A2F7A] focus:outline-none focus:ring-2 focus:ring-[#8A358A]/30",
  primaryWide:
    "w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-[#8A358A] hover:bg-[#7A2F7A] focus:outline-none focus:ring-2 focus:ring-[#8A358A]/30",
};

export default function CreateProductPage() {
  const navigate = useNavigate();

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
              <div className="font-semibold">PANAFRICAN</div>
              <div className="text-[11px] text-gray-500 -mt-1">
                Business Initiative
              </div>
            </div>
          </div>

          {/* Navbar */}
          <nav className="hidden md:flex items-center gap-4 text-sm ml-6">
            <a
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              <Home size={16} /> Feed
            </a>
            <a
              onClick={() => navigate("/people")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              <Users size={16} /> People
            </a>
            <a
              onClick={() => navigate("/jobs")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              <Briefcase size={16} /> Jobs
            </a>
            <a
              onClick={() => navigate("/events")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              <Calendar size={16} /> Events
            </a>
            <a
              onClick={() => navigate("/business")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white cursor-pointer"
              style={{ background: "#8A358A" }}
            >
              <Building2 size={16} /> Business
            </a>
            <a
              onClick={() => navigate("/tourism")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              <MapPin size={16} /> Tourism
            </a>
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
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-12 gap-6">
        {/* Left/Main Form */}
        <section className="lg:col-span-8">
          <div className="rounded-2xl bg-white border p-6 shadow-sm space-y-6">
            <h1 className="text-xl font-bold">Create New Product Post</h1>
            <p className="text-sm text-gray-600">
              Share your product with the Pan-African community
            </p>

            {/* Product Images */}
            <div>
              <h2 className="font-semibold mb-2">Product Images</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl h-28 flex flex-col items-center justify-center text-gray-400 cursor-pointer">
                  <span className="text-sm">➕ Add Photo</span>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-xl h-28 flex items-center justify-center text-gray-400 cursor-pointer">
                  +
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-xl h-28 flex items-center justify-center text-gray-400 cursor-pointer">
                  +
                </div>
              </div>
            </div>

            {/* Product Title */}
            <div>
              <h2 className="font-semibold">Product Title</h2>
              <input
                type="text"
                placeholder="Enter your product title..."
                className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full"
              />
            </div>

            {/* Category + Subcategory */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h2 className="font-semibold">Category</h2>
                <select className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full">
                  <option>Select Category</option>
                  <option>Technology</option>
                  <option>Fashion</option>
                  <option>Food</option>
                </select>
              </div>
              <div>
                <h2 className="font-semibold">Subcategory</h2>
                <select className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full">
                  <option>Select Subcategory</option>
                  <option>Mobile</option>
                  <option>Clothing</option>
                  <option>Beverages</option>
                </select>
              </div>
            </div>

            {/* Price + Quantity */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h2 className="font-semibold">Price</h2>
                <input
                  type="number"
                  placeholder="$ 0.00"
                  className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full"
                />
              </div>
              <div>
                <h2 className="font-semibold">Quantity Available</h2>
                <input
                  type="number"
                  placeholder="Enter quantity"
                  className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="font-semibold">Product Description</h2>
              <textarea
                placeholder="Describe your product in detail..."
                className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full"
                rows={4}
              />
            </div>

            {/* Location */}
            <div>
              <h2 className="font-semibold">Location</h2>
              <select className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full">
                <option>Select Country</option>
                <option>Nigeria</option>
                <option>Kenya</option>
                <option>Ghana</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <h2 className="font-semibold">Tags</h2>
              <input
                type="text"
                placeholder="Add tags separated by commas..."
                className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm w-full"
              />
              <p className="mt-1 text-xs text-gray-500">
                Tags help others find your product
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button className="rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700">
                Save Draft
              </button>
              <button className={styles.primaryWide}>Publish Product</button>
            </div>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="lg:col-span-4 space-y-4">
          {/* Boost Your Post */}
          <div className="rounded-2xl bg-gradient-to-r from-[#8A358A] to-[#9333EA] p-6 text-white shadow-sm">
            <h3 className="text-lg font-semibold">🚀 Boost Your Post</h3>
            <p className="mt-1 text-sm">
              Reach more potential customers across Africa
            </p>
            <button className="mt-4 bg-white text-[#8A358A] rounded-lg px-4 py-2 text-sm font-semibold">
              Learn More
            </button>
          </div>

          {/* Tips */}
          <div className="rounded-2xl bg-white border p-6 shadow-sm">
            <h3 className="font-semibold text-[#8A358A]">
              📌 Product Posting Tips
            </h3>
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
