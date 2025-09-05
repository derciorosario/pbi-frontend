import { Building, Crown, Pencil, PlusCircle, Rocket } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/* ---------------- Shared styles (solid purple buttons) ---------------- */
const styles = {
  primary:
    "rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-[#8A358A] hover:bg-[#7A2F7A] focus:outline-none focus:ring-2 focus:ring-[#8A358A]/30",
  primaryWide:
    "w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-[#8A358A] hover:bg-[#7A2F7A] focus:outline-none focus:ring-2 focus:ring-[#8A358A]/30",
  pill:
    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-white bg-[#8A358A] hover:bg-[#7A2F7A]",
};

/* ---------------- Minimal icon set ---------------- */
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

const companies = [
  {
    id: 1,
    logo: "https://i.pravatar.cc/100?img=2",
    name: "TechFlow Solutions",
    verified: true,
    location: "Lagos, Nigeria",
    time: "2 hours ago",
    industry: "Software Development • 50–100 employees",
    title: "Seeking Investment for AI-Powered Agriculture Platform",
    desc: "We’re developing an innovative AI platform that helps African farmers optimize crop yields through predictive analytics and IoT sensors. Looking for Series A funding of $2M to expand across West Africa.",
    tags: ["Agriculture Tech", "AI/ML", "Seeking Investment"],
    stats: { views: "1.2k", likes: 89, comments: 23 },
  },
  {
    id: 2,
    llogo: "https://i.pravatar.cc/100?img=5",
    name: "GreenPower Africa",
    verified: true,
    location: "Nairobi, Kenya",
    time: "5 hours ago",
    industry: "Renewable Energy • 100–200 employees",
    title: "Solar Microgrid Project – Seeking Technology Partners",
    desc: "We’re implementing solar microgrids across rural Kenya and looking for technology partners specializing in energy storage solutions and smart grid management systems.",
    tags: ["Solar Energy", "Smart Grid", "Partnership"],
    stats: { views: "856", likes: 67, comments: 15 },
  },
];

const matches = [
  { name: "Michael Chen", title: "Angel Investor", looking: "Fintech Startups" },
  { name: "Lisa Ndovu", title: "CTO", looking: "Partnerships" },
  { name: "Kwame Asante", title: "Tech Lead", looking: "Fintech Startups" },
  { name: "Amara Diallo", title: "Marketing Consultant", looking: "Fintech Startups" },
];

/* ---------------- Left sidebar cards ---------------- */

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
      <button className={`mt-4 ${styles.primaryWide} flex items-center justify-center`}>
         <svg width="19" height="16" viewBox="0 0 19 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clip-path="url(#clip0_294_101)">
            <path d="M9.96875 3.3125C10.325 3.09375 10.5625 2.69687 10.5625 2.25C10.5625 1.55937 10.0031 1 9.3125 1C8.62187 1 8.0625 1.55937 8.0625 2.25C8.0625 2.7 8.3 3.09375 8.65625 3.3125L6.86562 6.89375C6.58125 7.4625 5.84375 7.625 5.34688 7.22813L2.5625 5C2.71875 4.79063 2.8125 4.53125 2.8125 4.25C2.8125 3.55938 2.25312 3 1.5625 3C0.871875 3 0.3125 3.55938 0.3125 4.25C0.3125 4.94062 0.871875 5.5 1.5625 5.5C1.56875 5.5 1.57812 5.5 1.58438 5.5L3.0125 13.3562C3.18438 14.3062 4.0125 15 4.98125 15H13.6438C14.6094 15 15.4375 14.3094 15.6125 13.3562L17.0406 5.5C17.0469 5.5 17.0562 5.5 17.0625 5.5C17.7531 5.5 18.3125 4.94062 18.3125 4.25C18.3125 3.55938 17.7531 3 17.0625 3C16.3719 3 15.8125 3.55938 15.8125 4.25C15.8125 4.53125 15.9062 4.79063 16.0625 5L13.2781 7.22813C12.7812 7.625 12.0437 7.4625 11.7594 6.89375L9.96875 3.3125Z" fill="white"/>
          </g>
          <defs>
            <clipPath id="clip0_294_101">
              <path d="M0.3125 0H18.3125V16H0.3125V0Z" fill="white"/>
            </clipPath>
          </defs>
        </svg>
        <span className="ml-1">Boost Your Profile</span>
        </button>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <h3 className="font-semibold">Quick Actions</h3>
      <ul className="mt-3 space-y-2 text-sm text-gray-700">
        <li>
          <a
            className="rounded-lg px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
            href="#"
          >
            <Pencil size={16} className="text-[#8a358a]" />
            Edit Profile
          </a>
        </li>
        <li>
          <a
            className="rounded-lg px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
            href="#"
          >
            <Rocket size={16} className="text-[#8a358a]" />
            Boost Company profile
          </a>
        </li>
       

         <li>
          <a
            className="rounded-lg px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
            href="#"
          >
            <Building size={16} className="text-[#8a358a]" />
            Saved Companies
          </a>
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
        <label className="text-xs text-gray-500">Search Companies</label>
        <input placeholder="Name" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
      </div>
      <div className="mt-3">
        <label className="text-xs text-gray-500">Location</label>
        <select className="mt-1 w-full rounded-xl border px-3 py-2 text-sm">
          <option>Select location</option>
          <option>Lagos</option>
          <option>Accra</option>
          <option>Cape Town</option>
          <option>Nairobi</option>
        </select>
      </div>
      <div className="mt-3">
        <label className="text-xs text-gray-500">Industry</label>
        <select className="mt-1 w-full rounded-xl border px-3 py-2 text-sm">
          <option>Select industry</option>
          <option>Tech</option>
          <option>Energy</option>
          <option>Agriculture</option>
          <option>Finance</option>
        </select>
      </div>
      <div className="mt-3">
        <label className="text-xs text-gray-500">Category</label>
        <select className="mt-1 w-full rounded-xl border px-3 py-2 text-sm">
          <option>Select category</option>
          <option>Startup</option>
          <option>SME</option>
          <option>Enterprise</option>
        </select>
      </div>
      <button className={`mt-4 w-full ${styles.primary}`}>Apply Filters</button>
    </div>
  );
}

/* ---------------- Right: matches ---------------- */
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

function CompanyCard({ c }) {
  return (
    <article className="rounded-2xl bg-white border shadow-sm p-5">
      <div className="flex items-start gap-3">
        <img src={c.logo} alt="" className="h-10 w-10 rounded-full" />
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold">{c.name}</span>
            {c.verified && <span className="text-green-600 text-xs font-medium">✔ Verified</span>}
            <span>• {c.location}</span>
            <span>• {c.time}</span>
          </div>
          <div className="text-xs text-gray-500">{c.industry}</div>
          <h3 className="mt-2 font-semibold">{c.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{c.desc}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {c.tags.map((t) => (
              <span key={t} className="px-2 py-1 text-xs rounded-full bg-gray-100">{t}</span>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
            <div className="flex gap-4">
              <span>{c.stats.views} views</span>
              <span>{c.stats.likes} likes</span>
              <span>{c.stats.comments} comments</span>
            </div>
            <div className="flex gap-2">
              <button className={styles.secondary}>Save</button>
              <button className={styles.primary}>Connect</button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}



/* ---------------- Page ---------------- */
export default function PeopleFeedPage() {
  const [activeTab, setActiveTab] = useState("Projects");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const navigate=useNavigate()

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
      {/* ===== Header (compact) ===== */}
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
              <div className="font-semibold">54LINKS</div>
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white"
              style={{ background: "#8A358A" }}
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

          <div className="ml-auto hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="flex items-center gap-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2">
              <I.search />
              <input className="w-full bg-transparent outline-none text-sm" placeholder="Search people, jobs, events..." />
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
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 grid lg:grid-cols-12 gap-6">
        {/* MOBILE button to open filters */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm"
          >
            <I.filter /> Filters
          </button>
        </div>

        {/* Left column - Full height sidebar */}
        <aside className="lg:col-span-3 space-y-4 hidden lg:block">
          <ProfileCard />
          <QuickActions />
          <div className="sticky top-24">
            <FiltersCard />
          </div>
        </aside>

        {/* Middle and Right columns container */}
      {/* Middle and Right columns container */}
<div className="lg:col-span-9 grid lg:grid-cols-6 gap-6">
  
  {/* Middle column - Feed */}
  <section className="lg:col-span-4 space-y-4">
    {/* Hero banner agora dentro do meio */}
    <div
      className="rounded-2xl p-6 text-white shadow-sm"
      style={{ background: "linear-gradient(90deg,#8A358A 0%,#9333EA 100%)" }}
    >
      <h2 className="text-2xl font-bold">Find the Companies You Can Collaborate With</h2>
      <p className="mt-1 text-white/90">
        Discover innovative companies and organizations that align with your goals. From startups to established enterprises, explore opportunities, partnerships, and collaborations across industries.
      </p>

    
    </div>

    {/* Tabs + Add */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
        {["Projects", "Companies", "Suggested"].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`pb-2 relative ${activeTab === t ? "text-gray-900" : "hover:text-gray-800"}`}
          >
            {t}
            {activeTab === t && (
              <span
                className="absolute left-0 -bottom-[1px] h-[3px] w-full rounded-full"
                style={{ background: "linear-gradient(90deg,#8A358A,#9333EA)" }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="relative">
        <button className={`${styles.primary} inline-flex items-center gap-2`}>
          <I.plus /> Add
        </button>
      </div>
    </div>

    {/* Feed header */}
    <h3 className="font-semibold text-2xl mt-1">Feed activities</h3>

    {/* Posts */}
    {companies.map((c) => (
              <CompanyCard key={c.id} c={c} />
   ))}
    <button className={`mx-auto max-w-[200px] block mt-4 ${styles.primaryWide}`}>
      Load More Posts
    </button>
  </section>

  {/* Right column - Matches sempre no topo */}
  <aside className="lg:col-span-2 space-y-4">
    <SuggestedMatches />
  </aside>
</div>

      </main>

    

      {/* Mobile Filters Bottom Sheet */}
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
              <FiltersCard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}