// src/components/layout/Header.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import I from "../ui/UiIcons";

const tabs = [
  { key: "feed",     label: "Feed",     to: "/feed/explore", icon: <I.feed/> },
  { key: "people",   label: "People",   to: "/people",        icon: <I.people/> },
  { key: "jobs",     label: "Jobs",     to: "/jobs",          icon: <I.jobs/> },
  { key: "events",   label: "Events",   to: "/events",        icon: <I.calendar/> },
  { key: "business", label: "Business", to: "/business",      icon: <I.biz/> },
  { key: "tourism",  label: "Tourism",  to: "/tourism",       icon: <I.pin/> },
];

export default function Header({
  showSearch = true,
  activeKey,                 // opcional: força a tab ativa
  notificationCount = 0,
  avatar = "AB",
}) {
  const { pathname } = useLocation();

  // tenta inferir a aba ativa pelo path, se activeKey não for passado
  const inferActive = () => {
    if (activeKey) return activeKey;
    const found = tabs.find(t => pathname.startsWith(t.to));
    return found?.key ?? "feed";
  };
  const current = inferActive();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div
            className="h-9 w-9 rounded-xl grid place-items-center text-white font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#8A358A,#9333EA)" }}
          >
            F
          </div>
          <div className="leading-tight">
            <div className="font-semibold">PANAFRICAN</div>
            <div className="text-[11px] text-gray-500 -mt-1">Business Initiative</div>
          </div>
        </Link>

        {/* Navegação */}
        <nav className="hidden md:flex items-center gap-4 text-sm ml-6">
          {tabs.map(t => {
            const isActive = current === t.key;
            return (
              <Link
                key={t.key}
                to={t.to}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  isActive ? "text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
                style={isActive ? { background: "linear-gradient(135deg,#8A358A,#9333EA)" } : {}}
              >
                {t.icon} {t.label}
              </Link>
            );
          })}
        </nav>

        {/* Busca + ações à direita */}
        <div className="ml-auto hidden md:flex items-center gap-2 flex-1 max-w-md">
          {showSearch && (
            <div className="flex items-center gap-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2">
              <I.search />
              <input
                className="w-full bg-transparent outline-none text-sm"
                placeholder="Search people, jobs, events..."
              />
            </div>
          )}

          <button className="relative">
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-white text-[10px]">
                {notificationCount}
              </span>
            )}
            <svg className="h-[18px] w-[18px] text-gray-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22ZM18 16v-5a6 6 0 1 0-12 0v5l-1.8 1.8A1 1 0 0 0 5 20h14a1 1 0 0 0 .8-1.6Z"/>
            </svg>
          </button>

          <button className="ml-2 h-10 w-10 rounded-full bg-gray-100 grid place-items-center flex-shrink-0">
            {avatar}
          </button>
        </div>
      </div>
    </header>
  );
}
