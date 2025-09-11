// src/pages/NotificationsPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/* ---------------- Shared styles (solid purple buttons) ---------------- */
const styles = {
  primary:
    "rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-[#8A358A] hover:bg-[#7A2F7A] focus:outline-none focus:ring-2 focus:ring-[#8A358A]/30",
  outline:
    "rounded-lg px-3 py-1.5 text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
};

/* ---------------- Minimal icons ---------------- */
const I = {
  feed: () => (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z" />
    </svg>
  ),
  people: () => (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4ZM6 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM2 20a6 6 0 0 1 12 0v1H2Zm12.5 1v-1a7.5 7.5 0 0 1 9.5-7.2V21Z" />
    </svg>
  ),
  jobs: () => (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 3h4a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v3H3V8a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm4 3V5h-4v1h4Z" />
      <path d="M3 11h18v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7Zm8 2H5v2h6v-2Z" />
    </svg>
  ),
  calendar: () => (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 2h2v3H7zm8 0h2v3h-2z" />
      <path d="M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm0 5v9h14v-9H5Z" />
    </svg>
  ),
  biz: () => (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 21V3h8v6h10v12H3Z" />
      <path d="M7 7h2v2H7zm0 4h2v2H7zm0 4h2v2H7z" />
    </svg>
  ),
  pin: () => (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5Z" />
    </svg>
  ),
  search: () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-3.5-3.5" />
    </svg>
  ),
};

/* ---------------- Mock Notifications ---------------- */
const notifications = [
  {
    type: "connection",
    user: "Marcus Johnson",
    title: "New Connection Request",
    desc: "Marcus Johnson wants to connect with you. Software Engineer at TechCorp.",
    time: "2 minutes ago",
    actions: ["Accept", "Decline"],
  },
  {
    type: "job",
    title: "Job Application Update",
    desc: "Your application for Senior Frontend Developer at InnovateTech has been reviewed.",
    time: "1 hour ago",
    actions: ["View Details"],
  },
  {
    type: "event",
    title: "Event Invitation",
    desc: "You're invited to African Tech Summit 2024 in Lagos, Nigeria. March 15-17, 2024.",
    time: "3 hours ago",
    actions: ["RSVP", "View Event"],
  },
  {
    type: "message",
    user: "Amara Okafor",
    title: "New Message",
    desc: "Amara Okafor sent you a message about the consulting project proposal.",
    time: "5 hours ago",
    actions: ["Reply"],
  },
  {
    type: "service",
    title: "Service Booking Confirmed",
    desc: "Your booking for Business Coaching Session with Dr. Kwame Asante has been confirmed.",
    time: "1 day ago",
    actions: ["View Booking"],
  },
  {
    type: "tourism",
    title: "Tourism Recommendation",
    desc: "Discover Victoria Falls Cultural Tour - a perfect experience for your upcoming trip to Zimbabwe.",
    time: "2 days ago",
    actions: ["Explore"],
  },
  {
    type: "profile",
    title: "Profile Update",
    desc: "Your profile has been successfully updated with new skills and certifications.",
    time: "3 days ago",
    actions: ["View Profile"],
  },
];

/* ---------------- Page ---------------- */
export default function NotificationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-gray-900">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div
              className="h-9 w-9 rounded-xl grid place-items-center text-white font-bold"
              style={{ background: "#8A358A" }}
            >
              P
            </div>
            <div className="leading-tight">
              <div className="font-semibold">54Links</div>
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
            <button className="relative">
              <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-white text-[10px]">2</span>
              <svg className="h-[18px] w-[18px] text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22ZM18 16v-5a6 6 0 1 0-12 0v5l-1.8 1.8A1 1 0 0 0 5 20h14a1 1 0 0 0 .8-1.6Z" />
              </svg>
            </button>
            <button onClick={() => navigate("/profile")} className="ml-2 h-10 w-10 rounded-full bg-gray-100 grid place-items-center">
              AB
            </button>
          </div>
        </div>
      </header>

      {/* ===== Content ===== */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-gray-500">Stay updated with your network activities</p>

        {/* Filter bar */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-2">
            {["All", "Connections", "Jobs", "Events", "Messages", "System"].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  filter === t ? "bg-[#8A358A] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm">
              ⚙ Settings
            </button>
            <button className={`${styles.primary}`}>Mark All Read</button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="mt-6 space-y-4">
          {notifications.map((n, idx) => (
            <div key={idx} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 flex justify-between">
              <div>
                <h3 className="font-semibold">{n.title}</h3>
                <p className="text-sm text-gray-600">{n.desc}</p>
                <div className="mt-2 flex gap-2 text-sm">
                  {n.actions.map((a) => (
                    <button
                      key={a}
                      className={`${a === "Accept" || a === "RSVP" ? styles.primary : styles.outline}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs text-gray-400">{n.time}</div>
            </div>
          ))}
        </div>

        <button className={`mt-6 mx-auto block ${styles.outline}`}>Load More Notifications</button>
      </main>
    </div>
  );
}
