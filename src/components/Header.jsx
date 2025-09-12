// src/components/Header.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import I from "../lib/icons";
import styles from "../lib/styles";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { useSocket } from "../contexts/SocketContext";
import * as messageApi from "../api/messages";
import client from "../api/client";
import LoginDialog from "./LoginDialog.jsx";
import logoImg from "../assets/logo.png";

function Header({ page }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, profile, signOut } = useAuth();
  const { totalUnreadCount, connected } = useSocket();

  const [profileOpen, setProfileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [connectionRequestCount, setConnectionRequestCount] = useState(0);
  const [meetingRequestCount, setMeetingRequestCount] = useState(0);

  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const profileMenuRef = useRef(null);
  const moreMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const data = useData();

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        // Don't close if user clicked the hamburger itself — backdrop handles this
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Get unread message count
  useEffect(() => {
    if (!user) return;

    async function fetchUnreadCount() {
      try {
        const { data } = await messageApi.getUnreadCount();
        setUnreadMessageCount(data.count || 0);
      } catch (error) {
        console.error("Failed to fetch unread message count:", error);
      }
    }

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // Get connection request count
  useEffect(() => {
    if (!user) return;

    async function fetchConnectionRequests() {
      try {
        const { data } = await client.get("/connections/requests");
        setConnectionRequestCount((data.incoming || []).length);
      } catch (error) {
        console.error("Failed to fetch connection requests:", error);
      }
    }

    fetchConnectionRequests();
    const interval = setInterval(fetchConnectionRequests, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // Get meeting request count
  useEffect(() => {
    if (!user) return;

    async function fetchMeetingRequests() {
      try {
        const { data } = await client.get("/meeting-requests/upcoming");
        const pendingRequests = (data || []).filter(
          (req) => req.status === "pending" && req.requester?.id !== user.id
        );
        setMeetingRequestCount(pendingRequests.length);
      } catch (error) {
        console.error("Failed to fetch meeting requests:", error);
      }
    }

    fetchMeetingRequests();
    const interval = setInterval(fetchMeetingRequests, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // Use socket-provided unread count when available
  useEffect(() => {
    if (connected && totalUnreadCount !== undefined) {
      setUnreadMessageCount(totalUnreadCount);
    }
  }, [connected, totalUnreadCount]);

  const allNavItems = [
    { name: "feed", label: "Feed", path: "/", icon: <I.feed /> },
    { name: "people", label: "People", path: "/people", icon: <I.people /> },
    { name: "companies", label: "Companies", path: "/companies", icon: <I.company/> },
    { name: "jobs", label: "Jobs", path: "/jobs", icon: <I.jobs /> },
    { name: "events", label: "Events", path: "/events", icon: <I.calendar /> },
    { name: "products", label: "Products", path: "/products", icon: <I.products /> },
    { name: "services", label: "Services", path: "/services", icon: <I.briefcase /> },
    { name: "tourism", label: "Tourism", path: "/tourism", icon: <I.pin /> },
    { name: "funding", label: "Opportunites", path: "/funding", icon: <I.funding /> },
  ];

 const primaryNav = allNavItems.slice(0, 7);   // first 7 items
const moreNav = allNavItems.slice(7);         // the rest go to "More"

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
  const anyMoreActive = moreNav.some(isActive);
  const notifBadgeCount = Math.min(99, (connectionRequestCount || 0) + (meetingRequestCount || 0));

  const NavButton = ({ item, onClick }) => {
    const active = isActive(item);
    return (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setMoreOpen(false);
          onClick?.();
          navigate(item.path);
        }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
          active ? "bg-brand-50 text-brand-600" : "text-gray-700 hover:bg-brand-50 hover:text-brand-600"
        }`}
      >
        {item.icon} {!user && item.name === "feed" ? "Home" : item.label}
      </a>
    );
  };

  return (
    <>
      <header className="sticky z-50 top-0 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
          {/* Mobile: Hamburger */}
          <button
            className="md:hidden -ml-2 p-2 rounded-lg hover:bg-gray-100"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <svg className="h-6 w-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="leading-tight">
              <img src={logoImg} width={120} alt="54Links" />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center max-md:overflow-hidden gap-2 text-sm ml-6 max-lg:overflow-x-auto">
            {primaryNav.map((item) => (
              <NavButton key={item.name} item={item} />
            ))}

            {/* "+" More menu (currently hidden) */}
            <div className="relative" ref={moreMenuRef}>
              <button
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((o) => !o)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors border ${
                  anyMoreActive || moreOpen
                    ? "bg-brand-500 text-white border-brand-500"
                    : "text-gray-700 border-gray-200 hover:bg-brand-50 hover:text-brand-600"
                }`}
                title="More"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="hidden lg:inline">More</span>
              </button>

              {moreOpen && (
                <div role="menu" className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                  {moreNav.map((item) => {
                    const active = isActive(item);
                    return (
                      <button
                        key={item.name}
                        role="menuitem"
                        onClick={() => {
                          setMoreOpen(false);
                          navigate(item.path);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 rounded-md ${
                          active ? "bg-brand-50 text-brand-700" : "hover:bg-brand-50 hover:text-brand-700 text-gray-700"
                        }`}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right cluster */}
          <div className="ml-auto items-center flex px-3 gap-3 sm:gap-5 flex-1 max-w-md">
            <div className="flex-1">{/* spacer */}</div>

            {user ? (
              <>
                {/* Notifications */}
                <button
                  onClick={() => navigate("/notifications")}
                  className="relative p-1.5 rounded-lg hover:bg-gray-100"
                  aria-label="Notifications"
                >
                  {notifBadgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-white text-[10px]">
                      {notifBadgeCount > 9 ? "9+" : notifBadgeCount}
                    </span>
                  )}
                  <svg className="text-gray-600" viewBox="0 0 24 24" fill="currentColor" height="20" width="20">
                    <path d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22ZM18 16v-5a6 6 0 1 0-12 0v5l-1.8 1.8A1 1 0 0 0 5 20h14a1 1 0 0 0 .8-1.6Z" />
                  </svg>
                </button>

                {/* Messages */}
                <button
                  onClick={() => navigate("/messages")}
                  className="relative p-1.5 rounded-lg hover:bg-gray-100"
                  aria-label="Messages"
                >
                  {unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-brand-500 text-white text-[10px]">
                      {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                    </span>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 -960 960 960" fill="#5f6368">
                    <path d="M80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Z" />
                  </svg>
                </button>

                {/* Profile */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileOpen((o) => !o)}
                    className="ml-1 sm:ml-2 h-10 w-10 rounded-full bg-brand-50 grid place-items-center flex-shrink-0 overflow-hidden"
                    aria-label="Open profile menu"
                  >
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-semibold text-brand-600 text-sm">{initials}</span>
                    )}
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                      <div
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/profile");
                        }}
                        className="flex cursor-pointer items-center gap-2 p-2 border-b"
                      >
                        <button className="h-10 w-10 rounded-full bg-brand-50 grid place-items-center flex-shrink-0 overflow-hidden">
                          {user?.avatarUrl ? (
                            <img src={user?.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                          ) : (
                            <span className="font-semibold text-brand-600 text-sm">{initials}</span>
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate max-w-[180px]">
                            {user?.name || profile?.name || "User"}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[180px]">
                            {user?.email || profile?.email}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/profile");
                        }}
                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-brand-50 hover:text-brand-600 rounded-md"
                      >
                        Profile
                      </button>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/settings");
                        }}
                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-brand-50 hover:text-brand-600 rounded-md"
                      >
                        Settings
                      </button>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
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
                onClick={() => setLoginDialogOpen(true)}
                className={`${styles.primary} ml-2 px-4 py-2 rounded-full text-sm font-semibold`}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Panel */}
          <div
            className="absolute left-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-xl border-r border-gray-200 p-4 flex flex-col"
            ref={mobileMenuRef}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2" onClick={() => { setMobileOpen(false); navigate("/"); }}>
                <img src={logoImg} alt="54Links" className="h-8 w-auto" />
              </div>
              <button
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <svg className="h-6 w-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User (if logged in) */}
            {user && (
              <div
                className="mt-4 flex items-center gap-3 p-3 rounded-xl border border-gray-200"
                onClick={() => {
                  setMobileOpen(false);
                  navigate("/profile");
                }}
              >
                <div className="h-10 w-10 rounded-full bg-brand-50 grid place-items-center overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-semibold text-brand-600 text-sm">{initials}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{user?.name || profile?.name || "User"}</div>
                  <div className="text-xs text-gray-500 truncate">{user?.email || profile?.email}</div>
                </div>
              </div>
            )}

            {/* Nav */}
            <div className="mt-4 space-y-1 overflow-y-auto">
              {primaryNav.map((item) => {
                const active = isActive(item);
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setMobileOpen(false);
                      navigate(item.path);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="text-sm">
                      {!user && item.name === "feed" ? "Home" : item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-auto pt-3 border-t border-gray-200 space-y-2">
              {user ? (
                <>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        navigate("/notifications");
                      }}
                      className="relative flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <I.bell />
                      <span>Notifications</span>
                      {notifBadgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-white text-[11px]">
                          {notifBadgeCount > 9 ? "9+" : notifBadgeCount}
                        </span>  
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        navigate("/messages");
                      }}
                      className="relative flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <I.chat />
                      <span>Messages</span>
                      {unreadMessageCount > 0 && (
                        <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-white text-[11px]">
                          {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                        </span>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      navigate("/profile");
                    }}
                    className="w-full rounded-lg px-3 py-2 text-sm border border-gray-200 hover:bg-gray-50"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      navigate("/settings");
                    }}
                    className="w-full rounded-lg px-3 py-2 text-sm border border-gray-200 hover:bg-gray-50"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      signOut();
                    }}
                    className="w-full rounded-lg px-3 py-2 text-sm text-red-600 border border-red-200 hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setLoginDialogOpen(true);
                  }}
                  className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white bg-[#0a66c2] hover:bg-[#004182] focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/30"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Dialog */}
      <LoginDialog
        isOpen={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        initialTab="login"
      />
    </>
  );
}

export default Header;
