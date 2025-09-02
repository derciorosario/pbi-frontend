// src/pages/PbiFeedPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HomeHeroImg from '../../assets/home-hero.png'

/* ---------------- SVG icons ---------------- */
const I = {
  feed: () => <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z"/></svg>,
  people: () => <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4ZM6 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM2 20a6 6 0 0 1 12 0v1H2Zm12.5 1v-1a7.5 7.5 0 0 1 9.5-7.2V21Z"/></svg>,
  jobs: () => <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M10 3h4a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v3H3V8a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm4 3V5h-4v1h4Z"/><path d="M3 11h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7Zm8 2H5v2h6v-2Z"/></svg>,
  calendar: () => <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h2v3H7zm8 0h2v3h-2z"/><path d="M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm0 5v9h14v-9H5Z"/></svg>,
  biz: () => <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21V3h8v6h10v12H3Z"/><path d="M7 7h2v2H7zm0 4h2v2H7zm0 4h2v2H7z"/></svg>,
  pin: () => <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5Z"/></svg>,
  chevron: () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="m6 9 6 6 6-6"/></svg>,
  search: () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-3.5-3.5"/></svg>,
  heart: () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-6.716-4.349-9.428-7.061A5.5 5.5 0 0 1 11.5 6.5L12 7l.5-.5a5.5 5.5 0 0 1 8.928 7.439C18.716 16.651 12 21 12 21z"/></svg>,
  comment: () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  share: () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M16 6l-4-4-4 4M12 2v14"/></svg>,
  msg: () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  eye: () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5c5 0 9.3 3.1 11 7-1.7 3.9-6 7-11 7S2.7 15.9 1 12c1.7-3.9 6-7 11-7Zm0 10a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z"/></svg>,
  filter: () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h18v2l-7 7v5l-4 2v-7L3 7z"/></svg>,
  close: () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6 6 18M6 6l12 12"/></svg>,
};

/* ---------------- Mock data ---------------- */
const filtrosIndustria = ["Technology", "Finance", "Education", "Agriculture", "Health"];
const filtrosCategoria = ["Jobs", "Partnerships", "Investment", "Events"];

const posts = [
  {
    id: 1,
    author: "Kwame Asante",
    subtitle: "Tech Lead • Accra, Ghana • 2h",
    text: "Looking for React developers for an innovative fintech project. Remote opportunity focused on the African market. #ReactJS #Fintech #RemoteWork",
    stats: { likes: 24, comments: 8, shares: 3 },
    image: null,
  },
  {
    id: 2,
    author: "Amara Diallo",
    subtitle: "Marketing Consultant • Lagos, Nigeria • 4h",
    text: "Networking event in Lagos next week! Connect with entrepreneurs and investors. Limited spots.",
    stats: { likes: 42, comments: 15, shares: 8 },
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: 3,
    author: "Amara Okafor",
    subtitle: "Software Developer • 4h",
    text: "Just completed a mobile app for local farmers to connect directly with buyers. Looking for partnerships to scale across West Africa. #MobileApp #Agriculture #Partnership",
    stats: { likes: 67, comments: 15, shares: 6 },
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1600&auto=format&fit=crop",
  },
];

const sugestoes = [
  { name: "Michael Chen", role: "Angel Investor", tag: "Fintech Startups" },
  { name: "Lisa Ndovu", role: "CTO", tag: "Partnerships" },
  { name: "Laura Costa", role: "Product Manager", tag: "User Feedback" },
];

const proximos = [
  { name: "Omar Hassan", role: "Data Scientist • Nigeria" },
  { name: "Fatima Al-Rashid", role: "Marketing Director • Nigeria" },
  { name: "James Ochieng", role: "Investor • Nigeria" },
  { name: "Amina Hassan", role: "Tech Entrepreneur • Nigeria" },
];

/* ---------- Reusable: Feed Filters Card ---------- */
function FeedFiltersCard() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2">
        <I.filter />
        <h3 className="font-semibold">Filters</h3>
      </div>

      <div className="mt-4">
        <label className="text-xs text-gray-500">Search</label>
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
          <I.search />
          <input className="w-full text-sm outline-none" placeholder="Search by skills, location, or interest..." />
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs text-gray-500">Location</label>
        <select className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
          <option>Select location</option>
          <option>Accra</option>
          <option>Luanda</option>
          <option>Lagos</option>
          <option>Nairobi</option>
        </select>
      </div>

      <div className="mt-4">
        <label className="text-xs text-gray-500">Industry</label>
        <select className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
          <option>Select Industry</option>
          {filtrosIndustria.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="text-xs text-gray-500">Category</label>
        <select className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
          <option>Select category</option>
          {filtrosCategoria.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <button
        className="mt-5 w-full rounded-xl py-2.5 font-semibold text-white"
        style={{ background: "#8A358A" }}
      >
        Apply filters
      </button>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function PbiFeedPage() {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const navigate=useNavigate()
  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={()=>navigate('/')}>
            <div
              className="h-9 w-9 rounded-xl grid place-items-center text-white font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#8A358A,#9333EA)" }}
            >
              P
            </div>
            <div className="leading-tight">
              <div className="font-semibold">PANAFRICAN</div>
              <div className="text-[11px] text-gray-500 -mt-1">Business Initiative</div>
            </div>
          </div>

          {/* Menu with icons */}
          <nav className="hidden md:flex items-center gap-4 text-sm ml-6">
            <a
              href="#"
              onClick={()=>navigate('/')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white"
              style={{ background: "#8A358A" }}
            >
              <I.feed /> Feed
            </a>
            <a
              href="#"
              onClick={()=>navigate('/people')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100"
            >
              <I.people /> People
            </a>
            <a
              href="#"
              onClick={()=>navigate('/jobs')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100"
            >
              <I.jobs /> Jobs
            </a>
            <a
              href="#"
              onClick={()=>navigate('/events')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100"
            >
              <I.calendar /> Events
            </a>
            <a
              href="#"
              onClick={()=>navigate('/business')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100"
            >
              <I.biz /> Business
            </a>
            <a
              href="#"
              onClick={()=>navigate('/tourism')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100"
            >
              <I.pin /> Tourism
            </a>
          </nav>

          {/* Search + right-side icons */}
          <div className="ml-auto hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="flex items-center gap-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2">
              <I.search />
              <input
                className="w-full bg-transparent outline-none text-sm"
                placeholder="Search people, jobs, events..."
              />
            </div>
            <button className="relative" onClick={()=>navigate('/notifications')}>
              <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-white text-[10px]">
                3
              </span>
              <svg
                className="h-[18px] w-[18px] text-gray-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22ZM18 16v-5a6 6 0 1 0-12 0v5l-1.8 1.8A1 1 0 0 0 5 20h14a1 1 0 0 0 .8-1.6Z"/>
              </svg>
            </button>
            <button  onClick={()=>navigate('/profile')} className="ml-2 h-10 w-10 rounded-full bg-gray-100 grid place-items-center flex-shrink-0">
              AB
            </button>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative overflow-visible">
        <div className="relative" style={{ background: "linear-gradient(90deg,#8A358A 0%,#9333EA 100%)" }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-16">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 text-white">
                <h1 className="text-[42px] md:text-6xl font-extrabold leading-[1.05]">
                  Connect<br />Globally
                </h1>
                <p className="mt-5 max-w-xl text-white/90 text-lg">
                  The largest Pan-African networking platform for professionals, freelancers, and entrepreneurs.
                  Discover opportunities, connect with talent, and grow your business.
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <button onClick={()=>navigate('/signup')} className="rounded-xl px-6 py-3 font-semibold text-[#8A358A] bg-white shadow-sm">
                    Sign Up  
                  </button>
                  <button  className="rounded-xl px-6 py-3 font-semibold border border-white/60 text-white hover:bg-white/10">
                    <a href="#explore">Explore</a>
                  </button>
                </div>
              </div>
              <div className="lg:col-span-6">
                <img
                  alt="networking"
                  className="w-full rounded-[28px] object-cover aspect-[16/9] shadow-xl"
                  src="https://theblackrise.com/wp-content/uploads/2023/11/AdobeStock_257397505-scaled.jpeg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hero Filters Card */}
       {/* Hero Filters Card */}
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-30">
  <div className="-mt-10 md:-mt-14 lg:-mt-16 w-full lg:w-[720px] relative z-30">
    <div className="rounded-[22px] bg-white shadow-xl ring-1 ring-black/5 p-4 md:p-5 relative z-30">
      <div className="flex items-center gap-6 text-sm font-medium text-gray-500 border-b">
        {["Opportunities", "Talent", "People", "Companies", "Events"].map((tab, i) => (
          <button
            key={tab}
            className={`pb-3 relative ${i === 0 ? "text-gray-900" : "hover:text-gray-700"}`}
          >
            {tab}
            {i === 0 && (
              <span className="absolute left-0 -bottom-[1px] h-[3px] w-24 rounded-full bg-[#8A358A]" />
            )}
          </button>
        ))}
      </div>

      {/* === Filtros Hero === */}
      <div className="mt-4 grid md:grid-cols-3 gap-3">
        {/* País */}
        <div>
          <label className="text-[11px] text-gray-500">Country</label>
          <select className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
            <option>Select country</option>
      <option>Angola</option>
      <option>Ghana</option>
      <option>Nigeria</option>
      <option>Kenya</option>
      <option>South Africa</option>
      <option>Mozambique</option>
      <option>Tanzania</option>
      <option>Uganda</option>
      <option>Zimbabwe</option>
      <option>Zambia</option>
      <option>Namibia</option>
      <option>Cameroon</option>
      <option>Senegal</option>
      <option>Ivory Coast</option>
      <option>Rwanda</option>
      <option>Ethiopia</option>
      <option>Morocco</option>
      <option>Egypt</option>
      <option>Sudan</option>
          </select>
        </div>

        {/* Cidade */}
        <div>
          <label className="text-[11px] text-gray-500">City</label>
          <select className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
            <option>Select city</option>
            <option>Luanda</option>
            <option>Accra</option>
            <option>Lagos</option>
            <option>Nairobi</option>
            <option>Johannesburg</option>
          </select>
        </div>

        {/* Categoria */}
        <div>
          <label className="text-[11px] text-gray-500">Category</label>
          <select className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
            <option>Select category</option>
    <option>Agriculture</option>
    <option>Energy</option>
    <option>Manufacturing</option>
    <option>Infrastructure & Construction</option>
    <option>Commerce & Financial Services</option>
    <option>E-Commerce</option>
    <option>Technology</option>
    <option>Fashion</option>
    <option>Oil & Gas</option>
    <option>Automobile</option>
    <option>Media & Entertainment</option>
    <option>Marketing & Advertising</option>
    <option>Education</option>
          </select>
        </div>
      </div>

      {/* Campo de busca */}
      <div className="mt-3">
        <div className="flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 px-3 py-2">
          <input
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="Search by skills, location, or interest..."
          />
          <button
            className="flex items-center gap-2 rounded-full px-4 py-2 text-white text-sm font-semibold shadow"
            style={{ background: "#8A358A" }}
          >
            <I.search /> Search
          </button>
        </div>
      </div>
    </div>
    <div className="mt-3 rounded-[22px] h-6 bg-black/0 shadow-[0_20px_35px_-25px_rgba(0,0,0,0.35)] relative z-20" />
  </div>
</div>

      </section>

      {/* ===== Body ===== */}
    
    {/* ===== Body ===== */}
<main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
  {/* MOBILE button to open filters */}
  <div className="md:hidden mb-4">
    <button
      onClick={() => setMobileFiltersOpen(true)}
      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm"
    >
      <I.filter /> Filters
    </button>
  </div>

  <div className="grid lg:grid-cols-12 gap-6">
    {/* LEFT: Filters com scroll interno */}
    <aside className="lg:col-span-3 hidden lg:block sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-1">
      <div className="sticky top-0">
        <FeedFiltersCard />
      </div>
    </aside>

    {/* MIDDLE: Feed */}
    <section className="lg:col-span-6 space-y-4">
      <h3 id="explore" className="font-semibold text-2xl">Activity Feed</h3>
      {posts.map((p) => (
        <article key={p.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          {/* Post header */}
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
                style={{ background: "#8A358A" }}
              >
                Connect
              </button>
            </div>
          </div>
          {/* Text / image */}
          <p className="mt-3 text-[15px] text-gray-700">{p.text}</p>
          {p.image && (
            <img src={p.image} alt="" className="mt-4 w-full rounded-xl object-cover aspect-[16/9]" />
          )}
          {/* Actions */}
          <div className="mt-4 flex items-center gap-5 text-sm text-gray-500">
            <div className="flex items-center gap-1"><I.heart /> {p.stats.likes}</div>
            <div className="flex items-center gap-1"><I.comment /> {p.stats.comments}</div>
            <div className="flex items-center gap-1"><I.share /> Share</div>
          </div>
        </article>
      ))}
    </section>

    {/* RIGHT: Suggestions + Nearby com scroll interno */}
    <aside className="lg:col-span-3 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto space-y-4">
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
        <h3 className="font-semibold">Connection Suggestions (24)</h3>
        <div className="mt-4 space-y-3">
          {sugestoes.map((s, idx) => (
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
                    <div className="text-[11px] text-[#8a358a]">Looking for: {s.tag}</div>
                  </div>
                </div>
                <button className="grid place-items-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600">
                  <I.eye />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button className="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ background: "#8A358A" }}>
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
        <h3 className="font-semibold">Nearby Professionals</h3>
        <div className="mt-3 space-y-3">
          {proximos.map((p) => (
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
              <button className="rounded-lg px-3 py-1.5 text-sm border border-gray-200 bg-white">
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  </div>
</main>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[60]">
          {/* Overlay */}
          <button
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setMobileFiltersOpen(false)}
            aria-label="Close filters"
          />
          {/* Bottom Sheet */}
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