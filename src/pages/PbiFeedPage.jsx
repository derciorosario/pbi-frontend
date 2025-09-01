import React from "react";
import { Link } from "react-router-dom";
import I from "../components/ui/UiIcons";
import Header from "../components/layout/Header";

export default function PbiFeedPage() {
  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
      <Header activeKey="feed" notificationCount={3} />

      {/* Hero */}
      <section className="relative overflow-visible">
        <div className="relative" style={{ background: "linear-gradient(90deg,#8A358A 0%,#9333EA 100%)" }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-16">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 text-white">
                <h1 className="text-[42px] md:text-6xl font-extrabold leading-[1.05]">Connect<br />Globally</h1>
                <p className="mt-5 max-w-xl text-white/90 text-lg">
                  The largest pan-African networking platform for professionals, freelancers, and entrepreneurs.
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <Link to="/signup" className="rounded-xl px-6 py-3 font-semibold text-[#8A358A] bg-white shadow-sm">
                    Join now
                  </Link>
                  <Link
                    to="/feed/explore"
                    className="rounded-xl px-6 py-3 font-semibold border border-white/60 text-white hover:bg-white/10"
                  >
                    Explore feed
                  </Link>
                </div>
              </div>
              <div className="lg:col-span-6">
                <img
                  alt="networking"
                  className="w-full rounded-[28px] object-cover aspect-[16/9] shadow-xl"
                  src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hero top filter */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-30">
          <div className="-mt-10 md:-mt-14 lg:-mt-16 w-full lg:w-[720px] relative z-30">
            <div className="rounded-[22px] bg-white shadow-xl ring-1 ring-black/5 p-4 md:p-5 relative z-30">
              <div className="flex items-center gap-6 text-sm font-medium text-gray-500 border-b">
                {["Opportunities", "Talents", "People", "Companies", "Events"].map((tab, i) => (
                  <button key={tab} className={`pb-3 relative ${i === 0 ? "text-gray-900" : "hover:text-gray-700"}`}>
                    {tab}
                    {i === 0 && (
                      <span
                        className="absolute left-0 -bottom-[1px] h-[3px] w-24 rounded-full"
                        style={{ background: "linear-gradient(90deg,#8A358A,#9333EA)" }}
                      />
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid md:grid-cols-3 gap-3">
                {[
                  { label: "Country", value: "Angola" },
                  { label: "City", value: "Luanda" },
                  { label: "Category", value: "Agriculture" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-[11px] text-gray-500">{f.label}</label>
                    <div className="mt-1 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2">
                      <span className="text-sm text-gray-700">{f.value}</span>
                      <I.chevron />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 px-3 py-2">
                  <input className="flex-1 bg-transparent outline-none text-sm" placeholder="Search by skill, location, interest…" />
                  <Link
                    to="/feed/explore"
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-white text-sm font-semibold shadow"
                    style={{ background: "linear-gradient(90deg,#8A358A,#9333EA)" }}
                  >
                    <I.search /> Search
                  </Link>
                </div>
              </div>
            </div>
            <div className="mt-3 rounded-[22px] h-6 bg-black/0 shadow-[0_20px_35px_-25px_rgba(0,0,0,0.35)] relative z-20" />
          </div>
        </div>
      </section>
    </div>
  );
}
