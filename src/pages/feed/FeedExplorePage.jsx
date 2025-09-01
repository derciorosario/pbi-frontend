// src/pages/feed/FeedExplorePage.jsx
import React, { useState } from "react";
import I from "../../components/ui/UiIcons";
import FeedFiltersCard from "../../components/feed/FeedFiltersCard";
import { posts, suggestions, nearby } from "../../data/feedMock";

export default function FeedExplorePage() {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
      {/* ===== 3-column body only ===== */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Mobile filter button */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm"
          >
            <I.filter /> Filters
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* LEFT: filters (sticky on desktop) */}
          <aside className="lg:col-span-3 self-start sticky top-24 hidden lg:block">
            <FeedFiltersCard />
          </aside>

          {/* MIDDLE: feed */}
          <section className="lg:col-span-6 space-y-4">
            <h3 className="font-semibold text-2xl">Activity Feed</h3>

            {posts.map((p) => (
              <article key={p.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      alt=""
                      className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                      src={`https://i.pravatar.cc/100?img=${p.id + 10}`}
                    />
                    <div>
                      <div className="font-semibold">{p.author}</div>
                      <div className="text-xs text-gray-500">{p.subtitle}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="grid place-items-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600">
                      <I.msg />
                    </button>
                    <button
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-white"
                      style={{ background: "linear-gradient(135deg,#8A358A,#9333EA)" }}
                    >
                      Connect
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-[15px] text-gray-700">{p.text}</p>
                {p.image && <img src={p.image} alt="" className="mt-4 w-full rounded-xl object-cover aspect-[16/9]" />}

                <div className="mt-4 flex items-center gap-5 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <I.heart />
                    {p.stats.likes}
                  </div>
                  <div className="flex items-center gap-1">
                    <I.comment />
                    {p.stats.comments}
                  </div>
                  <div className="flex items-center gap-1">
                    <I.share /> Share
                  </div>
                </div>
              </article>
            ))}
          </section>

          {/* RIGHT: suggestions + nearby */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
              <h3 className="font-semibold">Suggested Connections (24)</h3>

              <div className="mt-4 space-y-3">
                {suggestions.map((s, idx) => (
                  <div key={s.name} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          alt=""
                          className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                          src={`https://i.pravatar.cc/100?img=${30 + idx}`}
                        />
                        <div>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-gray-500">{s.role}</div>
                          <div className="text-[11px] text-gray-400">Looking for: {s.tag}</div>
                        </div>
                      </div>
                      <button className="grid place-items-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600">
                        <I.eye />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        className="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-white"
                        style={{ background: "linear-gradient(135deg,#8A358A,#9333EA)" }}
                      >
                        Connect
                      </button>
                      <button className="flex-1 rounded-lg px-3 py-1.5 text-sm border border-gray-200 text-gray-700 bg-white">
                        Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="mt-3 w-full rounded-lg py-2 text-sm font-medium text-[#8A358A] hover:underline">
                View All Connections
              </button>
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
              <h3 className="font-semibold">Professionals Nearby</h3>
              <div className="mt-3 space-y-3">
                {nearby.map((p) => (
                  <div key={p.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        alt=""
                        className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                        src={`https://i.pravatar.cc/100?u=${p.name}`}
                      />
                      <div>
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.role}</div>
                      </div>
                    </div>
                    <button className="rounded-lg px-3 py-1.5 text-sm border border-gray-200 bg-white">Connect</button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Filters Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[60]">
          <button
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setMobileFiltersOpen(false)}
            aria-label="Close filters"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-auto rounded-t-2xl bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="font-semibold flex items-center gap-2">
                <I.filter /> Filters
              </div>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-gray-200"
                aria-label="Close"
              >
                <I.close />
              </button>
            </div>
            <div className="pt-3">
              <FeedFiltersCard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
