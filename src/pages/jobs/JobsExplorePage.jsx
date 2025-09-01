// src/pages/JobsFeedPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, PlusCircle, Rocket } from "lucide-react";

/* ---------------- Shared styles ---------------- */
const styles = {
  primary:
    "rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-[#8A358A] hover:bg-[#7A2F7A] focus:outline-none",
  primaryWide:
    "w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-[#8A358A] hover:bg-[#7A2F7A]",
};

const I = {
  search: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-3.5-3.5" />
    </svg>
  ),
  see: () => (
    <svg stroke="currentColor" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
      <path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/>
    </svg>
  ),
  msg: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 -960 960 960" fill="currentColor">
      <path d="M80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"/>
    </svg>
  ),
  heart: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21s-6.7-4.35-9.43-7.06A5.5 5.5 0 0 1 11.5 6.5L12 7l.5-.5a5.5 5.5 0 0 1 8.93 7.44C18.72 16.65 12 21 12 21z" />
    </svg>
  ),
  comment: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  share: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M16 6l-4-4-4 4M12 2v14" />
    </svg>
  ),
  dots: () => (
    <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
    </svg>
  ),
  plus: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11 5h2v14h-2z"/><path d="M5 11h14v2H5z"/>
    </svg>
  ),
  edit: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/>
    </svg>
  ),
  boost: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  briefcase: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  filter: () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 5h18v2l-7 7v5l-4 2v-7L3 7z"/>
    </svg>
  ),
  close: () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#000">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  ),

 
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
const jobs = [
  {
    id: 1,
    title: "Senior Software Engineer",
    company: "Microsoft Nigeria",
    tags: ["Full-time", "Remote", "Senior Level"],
    desc: "Join our team to build scalable cloud solutions that serve millions of users across Africa.",
    location: "Lagos, Nigeria",
    salary: "$80k - $120k",
    ago: "2 days ago",
  },
  {
    id: 2,
    title: "Product Marketing Manager",
    company: "Spotify Africa",
    tags: ["Full-time", "Hybrid", "Mid Level"],
    desc: "Drive product adoption and growth across African markets. Lead marketing campaigns and expand our reach.",
    location: "Cape Town, SA",
    salary: "$60k - $85k",
    ago: "1 week ago",
  },
  {
    id: 3,
    title: "UX/UI Designer",
    company: "Slack Technologies",
    tags: ["Contract", "Remote", "Mid Level"],
    desc: "Create intuitive user experiences for our collaboration platform. Work with product teams to design features that delight users.",
    location: "Remote",
    salary: "$70k - $95k",
    ago: "3 days ago",
  },
];

const matches = [
  { name: "Michael Chen", title: "Angel Investor", looking: "Fintech Startups" },
  { name: "Lisa Ndovu", title: "CTO", looking: "Partnerships" },
  { name: "Kwame Asante", title: "Tech Lead", looking: "Fintech Startups" },
  { name: "Amara Diallo", title: "Marketing Consultant", looking: "Fintech Startups" },
];

/* ---------------- Left Sidebar ---------------- */
function ProfileCard() {
  return (
    <div className="rounded-2xl bg-white border p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <img
          src="https://i.pravatar.cc/100?img=5"
          alt=""
          className="h-12 w-12 rounded-full"
        />
        <div>
          <div className="font-semibold">Sarah Johnson</div>
          <div className="text-xs text-gray-500">Tech Entrepreneur<br/>Lagos, Nigeria</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 bg-gray-50 rounded-xl text-center text-sm">
        <div className="p-3 border-r">
          <div className="text-xs text-gray-500">Profile Views</div>
          <div className="font-semibold">247</div>
        </div>
        <div className="p-3 border-r">
          <div className="text-xs text-gray-500">Connections</div>
          <div className="font-semibold">89</div>
        </div>
        <div className="p-3">
          <div className="text-xs text-gray-500">Posts</div>
          <div className="font-semibold">23</div>
        </div>
      </div>
      <button className={`mt-4 ${styles.primaryWide}`}>Boost Your Profile</button>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="rounded-2xl bg-white border p-4 shadow-sm">
      <h3 className="font-semibold">Quick Actions</h3>
      <ul className="mt-3 space-y-2 text-sm">
        <li className="flex gap-2 items-center">
          <Pencil size={16} className="text-[#8A358A]" /> Edit Profile
        </li>
        <li className="flex gap-2 items-center">
          <Rocket size={16} className="text-[#8A358A]" /> Boost Job Post
        </li>
        <li className="flex gap-2 items-center">
          <PlusCircle size={16} className="text-[#8A358A]" /> Create Job Post
        </li>
      </ul>
    </div>
  );
}

function FiltersCard() {
  return (
    <div className="rounded-2xl bg-white border p-4 shadow-sm">
      <h3 className="font-semibold">Filters</h3>
      <div className="mt-3">
        <label className="text-xs text-gray-500">Search Jobs</label>
        <input className="w-full border rounded-xl mt-1 px-3 py-2 text-sm" placeholder="Job title, company" />
      </div>
      <div className="mt-3">
        <label className="text-xs text-gray-500">Location</label>
        <select className="w-full border rounded-xl mt-1 px-3 py-2 text-sm">
          <option>Select location</option>
          <option>Lagos</option><option>Cape Town</option><option>Remote</option>
        </select>
      </div>
      <div className="mt-3">
        <label className="text-xs text-gray-500">Industry</label>
        <select className="w-full border rounded-xl mt-1 px-3 py-2 text-sm">
          <option>Select industry</option>
          <option>Fintech</option><option>Tech</option><option>Marketing</option>
        </select>
      </div>
      <div className="mt-3">
        <label className="text-xs text-gray-500">Category</label>
        <select className="w-full border rounded-xl mt-1 px-3 py-2 text-sm">
          <option>Select category</option>
          <option>Engineering</option><option>Design</option><option>Management</option>
        </select>
      </div>
      <button className={`mt-4 ${styles.primaryWide}`}>Apply Filters</button>
    </div>
  );
}

/* ---------------- Job Card ---------------- */
function JobCard({ job }) {
  return (
    <div className="rounded-2xl bg-white border p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{job.title}</h3>
          <div className="text-sm text-gray-500">{job.company}</div>
        </div>
        <button className="text-gray-400">♡</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {job.tags.map(t => (
          <span key={t} className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">{t}</span>
        ))}
      </div>
      <p className="mt-3 text-sm text-gray-700">{job.desc}</p>
      <div className="mt-3 flex justify-between text-sm text-gray-500">
        <span>{job.location}</span>
        <span>{job.salary}</span>
      </div>
      <div className="text-xs text-gray-400 mt-2">{job.ago}</div>
    </div>
  );
}

/* ---------------- Right Sidebar ---------------- */

function SuggestedMatches() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <h3 className="font-semibold">Suggested Matches</h3>
      <div className="mt-4 space-y-3">
        {matches.map((m, i) => (
          <div key={m.name} className="rounded-xl border border-gray-100 p-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                  src={`https://i.pravatar.cc/100?img=${20 + i}`}
                />
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-gray-500">{m.title}</div>
                  <div className="text-[11px] text-[#8a358a]">Looking for: {m.looking}</div>
                </div>
              </div>
              <button className="grid place-items-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600">
                <I.see />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button className={`flex-1 ${styles.primary}`}>Connect</button>
              <button className="flex-1 rounded-lg px-3 py-1.5 text-sm border border-gray-200 bg-white text-gray-700">
                Message
              </button>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-3 w-full rounded-lg py-2 text-sm font-medium text-[#8A358A] hover:underline">
        See all matches
      </button>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function JobsFeedPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#F7F7FB]">
      {/* Header */}
       <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={()=>navigate('/')}>
            <div
              className="h-9 w-9 rounded-xl grid place-items-center text-white font-bold"
              style={{ background: "linear-gradient(135deg,#8A358A,#9333EA)" }}
            >
              P
            </div>
            <div className="leading-tight">
              <div className="font-semibold">PANAFRICAN</div>
              <div className="text-[11px] text-gray-500 -mt-1">Business Initiative</div>
            </div>
          </div>

           <nav className="hidden md:flex items-center gap-4 text-sm ml-6">
          
            <a
              href="#"
              onClick={()=>navigate('/')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100"
            ><I.feed /> Feed
              
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
              style={{ background: "#8A358A" }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white"
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

          <div className="ml-auto hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="flex items-center gap-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2">
              <I.search />
              <input className="w-full bg-transparent outline-none text-sm" placeholder="Search people, jobs, events..." />
            </div>
            <button className="relative">
              <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-white text-[10px]">3</span>
              <svg className="h-[18px] w-[18px] text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22ZM18 16v-5a6 6 0 1 0-12 0v5l-1.8 1.8A1 1 0 0 0 5 20h14a1 1 0 0 0 .8-1.6Z"/></svg>
            </button>
            <button onClick={()=>navigate('/profile')} className="ml-2 h-10 w-10 rounded-full bg-gray-100 grid place-items-center flex-shrink-0">AB</button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl grid lg:grid-cols-12 gap-6 px-6 py-8">
        {/* Left */}
        <aside className="lg:col-span-3 space-y-4">
          <ProfileCard />
          <QuickActions />
          <FiltersCard />
        </aside>

        {/* Middle */}
        <section className="lg:col-span-6 space-y-4">
          <div className="rounded-2xl bg-gradient-to-r from-[#8A358A] to-[#9333EA] text-white p-6">
            <h2 className="text-xl font-bold">Find Your Next Opportunity</h2>
            <p className="text-sm mt-1">Connect with employers across Africa and discover career opportunities.</p>
            <div className="mt-4 flex gap-3 text-xs">
              <span className="bg-white/20 px-3 py-1 rounded-full">Active Jobs</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">245+ Companies</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">124,589 Job Seekers</span>
            </div>
          </div>
          {jobs.map(j => <JobCard key={j.id} job={j} />)}
          <button className={`mx-auto block mt-4 ${styles.primaryWide}`}>Load More Jobs</button>
        </section>

        {/* Right */}
        <aside className="lg:col-span-3">
          <SuggestedMatches />
        </aside>
      </main>
    </div>
  );
}
