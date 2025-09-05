// src/components/Header.jsx 
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import I from "../lib/icons";
import styles from "../lib/styles";
import { useAuth } from "../contexts/AuthContext";

function Header({ page }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { name: "feed", label: "Feed", path: "/", icon: <I.feed /> },
    { name: "people", label: "People", path: "/people", icon: <I.people /> },
    { name: "jobs", label: "Jobs", path: "/jobs", icon: <I.jobs /> },
    { name: "events", label: "Events", path: "/events", icon: <I.calendar /> },
    { name: "products", label: "Products", path: "/products", icon: <I.products /> },
    { name: "services", label: "Services", path: "/services", icon: <I.briefcase /> },
    { name: "tourism", label: "Tourism", path: "/tourism", icon: <I.pin /> },
  ];

  function isActive(item) {
    if (page) return page === item.name;
    return pathname === item.path;
  }

  function getInitials(name) {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.charAt(0).toUpperCase() || "";
    const second = parts[1]?.charAt(0).toUpperCase() || "";
    return first + second;
  }

  const initials = getInitials(user?.name || profile?.name);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div
            className="h-9 w-9 rounded-xl grid place-items-center text-white font-bold"
            style={{ background: "linear-gradient(135deg,#0a66c2,#004182)" }}
          >
            P
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-brand-600">PANAFRICAN</div>
            <div className="text-[11px] text-gray-500 -mt-1">
              Business Initiative
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-4 text-sm ml-6">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <a
                key={item.name}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
                  active
                    ? "bg-brand-500 text-white"
                    : "text-gray-700 hover:bg-brand-50 hover:text-brand-600"
                }`}
              >
                {item.icon} {!user && item.name=="feed" ? "Home" : item.label }
              </a>
            );
          })}
        </nav>

        {/* Search + notifications + messages + profile */}
        <div className="ml-auto hidden md:flex items-center gap-2 flex-1 max-w-md">
          <div className="flex-1">{/* just for layout */}</div>

          {user ? (
            <>
              {/* Notifications */}
              <button
                onClick={() => navigate("/notifications")}
                className="relative"
              >
                <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-white text-[10px]">
                  3
                </span>
                <svg
                  className="text-gray-600"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  height={"20"}
                >
                  <path d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22ZM18 16v-5a6 6 0 1 0-12 0v5l-1.8 1.8A1 1 0 0 0 5 20h14a1 1 0 0 0 .8-1.6Z" />
                </svg>
              </button>

              {/* Messages */}
              <button onClick={() => navigate("/messages")} className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="20px"
                  viewBox="0 -960 960 960"
                  fill="#5f6368"
                >
                  <path d="M80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Z" />
                </svg>
              </button>

              {/* Profile dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="ml-2 h-10 w-10 rounded-full bg-brand-50 grid place-items-center flex-shrink-0 overflow-hidden"
                >
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt="avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-semibold text-brand-600 text-sm">
                      {initials}
                    </span>
                  )}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                    <div className="flex items-center gap-2 p-2 border-b">
                      <img
                        src={
                          profile?.avatarUrl ||
                          "https://placehold.co/40x40?text=U"
                        }
                        alt="avatar"
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium text-sm">
                          {user?.name || profile?.name || "User"}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {user?.email || profile?.email}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/profile");
                      }}
                      className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-brand-50 hover:text-brand-600 rounded-md"
                    >
                      Profile
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/settings");
                      }}
                      className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-brand-50 hover:text-brand-600 rounded-md"
                    >
                      Settings
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className={`${styles.primary} ml-2 px-4 py-2 rounded-full text-sm font-semibold`}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
