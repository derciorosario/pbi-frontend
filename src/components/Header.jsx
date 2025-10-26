// src/components/Header.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import I from "../lib/icons";
import styles from "../lib/styles";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { useSocket } from "../contexts/SocketContext";
import LoginDialog from "./LoginDialog.jsx";
import SupportDialog from "./SupportDialog.jsx";
import logoImg from "../assets/logo.png";
import { ChevronDown } from "lucide-react";
import client from "../api/client";

function Header({ page }) {


  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, profile, signOut, settings, setToken, refreshAuth } = useAuth();
  const { socket, totalUnreadCount, connected } = useSocket();

  const [profileOpen, setProfileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [connectionRequestCount, setConnectionRequestCount] = useState(0); // socket-driven
  const [meetingRequestCount, setMeetingRequestCount] = useState(0);       // socket-driven
  const [jobApplicationCount, setJobApplicationCount] = useState(0);       // socket-driven
  const [eventRegistrationCount, setEventRegistrationCount] = useState(0); // socket-driven
  const [companyInvitationCount, setCompanyInvitationCount] = useState(0); // socket-driven

  // Badge counts state for all notification types including messages
  const [badgeCounts, setBadgeCounts] = useState({
    connectionsPending: 0,
    meetingsPending: 0,
    messagesPending: 0,
    jobApplicationsPending: 0,
    eventRegistrationsPending: 0,
    companyInvitationsPending: 0
  });

  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginDialogOpenForSignUp, setLoginDialogOpenForSignUp] = useState(false);
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);

  const profileMenuRef = useRef(null);
  const moreMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const data = useData();

  // ---------- Accounts for switching (self + represented companies + company reps) ----------
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState(localStorage.getItem('activeAccountId') || user?.id || null);

  useEffect(() => {
    if (!user?.id) {
      setAccounts([]);
      setActiveAccountId(null);
      return;
    }

    const isCompany = (user?.accountType || user?.type) === "company";

    // 1) Current identity (self)
    const self = {
      id: user.id,
      type: isCompany ? "company" : "user",
      name: user.name || profile?.name || (isCompany ? "Company" : "User"),
      avatarUrl: user.avatarUrl || profile?.avatarUrl,
      // no authToken here; we are already this identity
    };

    // 2) Companies this user represents (authorized only)
    // user.representativeOf[].company + authorizationToken
    const representedCompanies = Array.isArray(user.representativeOf)
      ? user.representativeOf
          .filter((r) => r?.status === "authorized" && r?.company?.id)
          .map((r) => ({
            id: r.company.id,
            type: "company",
            name: r.company.name,
            avatarUrl: r.company.avatarUrl,
            authToken: r.authorizationToken, // can use directly if present
          }))
      : [];

    // 3) Representatives of this company (if current user is a company account)
    // user.companyRepresentatives[].representative + authorizationToken
    const companyReps = Array.isArray(user.companyRepresentatives)
      ? user.companyRepresentatives
          .filter((rep) => rep?.status === "authorized" && rep?.representative?.id)
          .map((rep) => ({
            id: rep.representative.id,
            type: "representative", // distinct type so handler can use token if present
            name: rep.representative.name,
            avatarUrl: rep.representative.avatarUrl,
            authToken: rep.authorizationToken, // use directly to assume rep context
          }))
      : [];

    // Build final list:
    // - Always include self
    // - If user is individual: add represented companies
    // - If user is company: add company representatives
    const list = isCompany ? [self, ...companyReps] : [self, ...representedCompanies];

    setAccounts(list);

    // Keep current active if still in the list; otherwise default to self
    setActiveAccountId((prev) => {
      const newActive = list.some((a) => a.id === prev) ? prev : self.id;
      localStorage.setItem('activeAccountId', newActive); // Persist it
      return newActive;
    });
  }, [
    user?.id,
    user?.name,
    user?.avatarUrl,
    user?.accountType,
    user?.type,
    user?.representativeOf,
    user?.companyRepresentatives,
    profile?.name,
    profile?.avatarUrl,
  ]);

  async function handleSwitchAccount(account) {
    try {
      // If we already are this identity, just close
      if (account.id === activeAccountId) {
        setProfileOpen(false);
        return;
      }

      const { data } = await client.post("/auth/company-token", { companyId: account.id });
      if (data?.token) {
        setToken(data.token);
        await refreshAuth(data.token); // Pass the new token to ensure immediate use
       
        localStorage.setItem('activeAccountId', account.id); // Persist the active account
        setActiveAccountId(account.id);
        setProfileOpen(false);
      }

      navigate('/')

    } catch (err) {
      console.error("Switch account failed:", err);
    }
  }
  // -----------------------------------------------------------------------------------

  // Redirect to /people if user has hideMainFeed enabled
  useEffect(() => {
    if (settings?.hideMainFeed && pathname === "/") {
      navigate("/people");
    }
  }, [settings?.hideMainFeed, pathname, navigate]);

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
        // backdrop handles this
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Unread messages via socket (mirror SocketContext if it has the count)
  useEffect(() => {
    if (!connected || !socket || !user?.id) return;

    const handleUnread = (payload) => {
      const count =
        (payload && payload.data && typeof payload.data.count === "number" && payload.data.count) ??
        (typeof payload?.count === "number" ? payload.count : 0);
      setUnreadMessageCount(count);
    };

    socket.emit("get_unread_count");
    socket.on("get_unread_count_result", handleUnread);
    socket.on("unread_count_update", handleUnread);

    return () => {
      socket.off("get_unread_count_result", handleUnread);
      socket.off("unread_count_update", handleUnread);
    };
  }, [connected, socket, user?.id]);

  useEffect(() => {
    if (typeof totalUnreadCount === "number") {
      setUnreadMessageCount(totalUnreadCount);
    }
  }, [totalUnreadCount]);

 
  
  // ⬇️ Connection + Meeting badge counts via socket + 4s polling
  useEffect(() => {
    if (!connected || !socket || !user?.id) return;

    const applyCounts = (counts = {}) => {
      setConnectionRequestCount(
        Number.isFinite(counts.connectionsPending) ? counts.connectionsPending : 0
      );
      setMeetingRequestCount(
        Number.isFinite(counts.meetingsPending) ? counts.meetingsPending : 0
      );
      setJobApplicationCount(
        Number.isFinite(counts.jobApplicationsPending) ? counts.jobApplicationsPending : 0
      );
      setEventRegistrationCount(
        Number.isFinite(counts.eventRegistrationsPending) ? counts.eventRegistrationsPending : 0
      );
      setCompanyInvitationCount(
        Number.isFinite(counts.companyInvitationsPending) ? counts.companyInvitationsPending : 0
      );

      // Update badge counts state with backend data including messages
      setBadgeCounts({
        connectionsPending: Number.isFinite(counts.connectionsPending) ? counts.connectionsPending : 0,
        meetingsPending: Number.isFinite(counts.meetingsPending) ? counts.meetingsPending : 0,
        messagesPending: Number.isFinite(counts.messagesPending) ? counts.messagesPending : 0,
        jobApplicationsPending: Number.isFinite(counts.jobApplicationsPending) ? counts.jobApplicationsPending : 0,
        eventRegistrationsPending: Number.isFinite(counts.eventRegistrationsPending) ? counts.eventRegistrationsPending : 0,
        companyInvitationsPending: Number.isFinite(counts.companyInvitationsPending) ? counts.companyInvitationsPending : 0
      });
    };

    const handlePush = (payload) => applyCounts(payload);

    // ask once immediately
    const fetchCounts = () =>
      socket.emit("get_header_badge_counts", (res) => applyCounts(res || {}));

    fetchCounts();
    socket.on("header_badge_counts", handlePush);

    // poll every 4s (pause when tab hidden to save work)
    const intervalId = setInterval(() => {
      if (document.visibilityState !== "hidden") fetchCounts();
    }, 4000);

    return () => {
      socket.off("header_badge_counts", handlePush);
      clearInterval(intervalId);
    };
  }, [connected, socket, user?.id]);


  const allNavItems = React.useMemo(() => [
    ...(settings?.hideMainFeed ? [] : [{ name: "feed", label: "Feed", path: "/", icon: <I.feed /> }]),
    { name: "people", label: "People", path: "/people", icon: <I.people/> },
    { name: "companies", label: "Organizations", path: "/companies", icon: <I.company/> },
    { name: "jobs", label: "Jobs", path: "/jobs", icon: <I.jobs /> },
    { name: "events", label: "Events", path: "/events", icon: <I.calendar /> },
    { name: "products", label: "Products", path: "/products", icon: <I.products /> },
    { name: "services", label: "Services", path: "/services", icon: <I.briefcase /> },
    { name: "tourism", label: "Tourism", path: "/tourism", icon: <I.pin /> },
    { name: "funding", label: "Funding", path: "/funding", icon: <I.funding /> },
  ], [settings?.hideMainFeed]);

  // Navigation logic: Show all items on xl+ screens, use "More" button on smaller screens
  const [isAboveXlScreen, setIsAboveXlScreen] = useState(
    typeof window !== "undefined" && window.innerWidth >= 1280
  );

  useEffect(() => {
    function handleResize() {
      setIsAboveXlScreen(window.innerWidth >= 1280);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const shouldShowAllItems = !isAboveXlScreen; // ✅ small: all items, xl+: use More
  const primaryNav = shouldShowAllItems ? allNavItems : allNavItems.slice(0, 7);
  const moreNav = shouldShowAllItems ? [] : allNavItems.slice(7);

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
  const notifBadgeCount = Math.min(
    99,
    (connectionRequestCount || 0) + (meetingRequestCount || 0) + (jobApplicationCount || 0) + (eventRegistrationCount || 0) + (companyInvitationCount || 0)
  );

  // Calculate total badge count including message notifications from backend
  const totalBadgeCount = Math.min(
    99,
    notifBadgeCount + (badgeCounts.messagesPending || 0)
  );

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
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
          active
            ? "bg-brand-50 text-brand-600"
            : "text-gray-700 hover:bg-brand-50 hover:text-brand-600"
        } ${shouldShowAllItems ? 'flex-shrink-0' : ''}`}
      >
        {item.icon} {(!user || pathname.includes('/landing')) && item.name === "feed" ? "Home" : item.label}
      </a>
    );
  };

  // Click handlers that also RESET the two counts via socket
  const goNotifications = () => {
    /*
    if (connected && socket) {
      socket.emit("mark_header_badge_seen", { type: "all" }, () => {});
    }
    setConnectionRequestCount(0);
    setMeetingRequestCount(0);

    */
    navigate("/notifications");
  };

 

  return (
    <>
      <header className="sticky z-50 top-0 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="mx-auto max-w-7xl h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
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
          <nav style={user?.accountType=="admin" ? {display:'none'}:{}} className="hidden md:flex items-center gap-1 text-sm ml-4 lg:ml-6 flex-1 min-w-0">
            <div className={`flex items-center gap-1 ${shouldShowAllItems ? 'overflow-x-auto':''}`}>
              {primaryNav.map((item) => (
                <NavButton key={item.name} item={item} />
              ))}

              {/* "+" More menu - Hide completely on xl+ screens, show on smaller screens */}
              {!shouldShowAllItems && moreNav.length > 0 && (
                <div className="relative flex-shrink-0" ref={moreMenuRef}>
                  <button
                    aria-haspopup="menu"
                    aria-expanded={moreOpen}
                    onClick={() => setMoreOpen((o) => !o)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors border whitespace-nowrap ${
                      anyMoreActive || moreOpen
                        ? "bg-brand-500 text-white border-brand-500"
                        : "text-gray-700 border-gray-200 hover:bg-brand-50 hover:text-brand-600"
                    }`}
                    title="More"
                  >
                    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span>More</span>
                  </button>

                {moreOpen && (
                  <div role="menu" className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
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
              )}
            </div>
          </nav>

          {/* Right cluster */}
          <div  className="ml-auto flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0">
            {user ? (
              <>
                {/* Notifications */}
                <button
                  style={user?.accountType=="admin" ? {display:'none'}:{}}
                  onClick={()=>{
                    goNotifications()
                  }}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Notifications"
                >
                  {totalBadgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-white text-[10px] font-medium">
                      {totalBadgeCount > 9 ? "9+" : totalBadgeCount}
                    </span>
                  )}
                  <svg className="text-gray-600 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22ZM18 16v-5a6 6 0 1 0-12 0v5l-1.8 1.8A1 1 0 0 0 5 20h14a1 1 0 0 0 .8-1.6Z" />
                  </svg>
                </button>

                {/* Messages */}
                <button
                  style={user?.accountType=="admin" ? {display:'none'}:{}}
                  onClick={() => navigate("/messages")}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Messages"
                >
                  {unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-brand-500 text-white text-[10px] font-medium">
                      {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                    </span>
                  )}
                  <svg className="text-gray-600 h-5 w-5" viewBox="0 -960 960 960" fill="currentColor">
                    <path d="M80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Z" />
                  </svg>
                </button>

                {/* Profile */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileOpen((o) => !o)}
                    className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-brand-50 grid place-items-center flex-shrink-0 overflow-hidden hover:bg-brand-100 transition-colors relative"
                    aria-label="Open profile menu"
                  >
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="font-semibold text-brand-600 text-sm">{getInitials(user?.name || profile?.name)}</span>
                    )}
                  </button>

                  {/* Put arrow outside the avatar */}
                  <span className="absolute border bottom-0 right-0 translate-x-0 translate-y-1/4 bg-white rounded-full p-[1px] shadow-sm">
                    <ChevronDown size={12} className="text-gray-600" />
                  </span>

                  {profileOpen && (
                    <div  className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
                      <div
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/profile");
                        }}
                        style={user?.accountType=="admin" ? {display:'none'}:{}}
                        className="flex cursor-pointer items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 rounded-t-lg transition-colors"
                      >
                        <div className="h-10 w-10 rounded-full bg-brand-50 grid place-items-center flex-shrink-0 overflow-hidden">
                          {user?.avatarUrl ? (
                            <img
                              src={user?.avatarUrl}
                              alt="avatar"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="font-semibold text-brand-600 text-sm">
                              {getInitials(user?.name || profile?.name)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {user?.name || profile?.name || "User"}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {user?.email || profile?.email}
                          </div>
                        </div>
                      </div>

                      {/* ---------- Switch Accounts (companies & representatives) ---------- */}
                   
                   {accounts.length > 1 && (
                  <div className="border-t border-gray-100 mt-2 pt-2 max-h-60 overflow-y-auto">
                    <div className="px-3 py-1 text-xs font-medium text-gray-400">
                      Switch account
                    </div>
                    {accounts.map((acc) => (
                      <button
                        key={`${acc.type}:${acc.id}`}
                        onClick={() => handleSwitchAccount(acc)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                          activeAccountId === acc.id
                            ? "bg-brand-50 text-brand-700 font-semibold"
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                        title={
                          acc.type === "company"
                            ? "Switch to company"
                            : acc.type === "representative"
                            ? "Switch to representative"
                            : "Switch to personal"
                        }
                      >
                        <div className="h-7 w-7 rounded-full flex-shrink-0 overflow-hidden bg-gray-100 flex items-center justify-center">
                          {acc.avatarUrl ? (
                            <img
                              src={acc.avatarUrl}
                              alt={acc.name}
                              className="h-full w-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <span className="text-xs font-bold text-brand-600">
                              {(acc.name || "A")?.charAt(0)}
                            </span>
                          )}
                        </div>

                        {/* ✅ Fix: add min-w-0, overflow-hidden, truncate */}
                        <div className="min-w-0 flex flex-col items-start justify-start">
                          <div className="truncate w-full">{acc.name}</div>
                          <div className="text-[10px] text-gray-400 truncate w-full text-left self-start">
                            {acc.type === "company"
                              ? "Company"
                              : acc.type === "representative"
                              ? "Representative"
                              : "Personal"}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                      {/* ------------------------------------------------------------------- */}

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/profile");
                        }}
                        style={user?.accountType=="admin" ? {display:'none'}:{}}
                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-brand-50 hover:text-brand-600 rounded-md transition-colors"
                      >
                        Profile
                      </button>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/settings");
                        }}
                        style={user?.accountType=="admin" ? {display:'none'}:{}}
                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-brand-50 hover:text-brand-600 rounded-md transition-colors"
                      >
                        Settings & Privacy
                      </button>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setSupportDialogOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-brand-50 hover:text-brand-600 rounded-md transition-colors"
                      >
                        Support
                      </button>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          signOut();
                        }}
                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Sign out
                      </button>

                       <div className="border-t border-gray-100 mt-3 pt-2 text-[11px] text-gray-400 text-center space-x-1">
                          <a href="/privacy" className="hover:underline">Privacy</a> ·
                          <a href="/terms" className="hover:underline">Terms</a> ·
                          <a href="/landing" className="hover:underline">About 54links</a>
                      </div>
                    </div>
                  )}
                </div>

              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setLoginDialogOpen(true)}
                  className="border border-brand-600 text-brand-600 px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap hover:bg-brand-50 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => setLoginDialogOpenForSignUp(true)}
                  className={`${styles.primary} px-4 py-2  text-sm font-semibold whitespace-nowrap hover:opacity-90 transition-opacity`}
                >
                  Join Now
                </button>
              </div>
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setMobileOpen(false); navigate("/"); }}>
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
                    <span className="font-semibold text-brand-600 text-sm">{getInitials(user?.name || profile?.name)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{user?.name || profile?.name || "User"}</div>
                  <div className="text-xs text-gray-500 truncate">{user?.email || profile?.email}</div>
                </div>
              </div>
            )}

            {/* Nav */}
            <div className="space-y-1 overflow-y-auto flex-1">
              {primaryNav.map((item) => {
                const active = isActive(item);
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setMobileOpen(false);
                      navigate(item.path);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="text-sm font-medium">
                      {(!user || pathname.includes('/landing')) && item.name === "feed" ? "Home" : item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-auto pt-4 border-t border-gray-200 space-y-3">
              {user ? (
                <>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        goNotifications();
                      }}
                      className="relative flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <I.bell />
                      <span>Notifications</span>
                      {totalBadgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-white text-[11px] font-medium">
                          {totalBadgeCount > 9 ? "9+" : totalBadgeCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        navigate("/messages");
                      }}
                      className="relative flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <I.chat />
                      <span>Messages</span>
                      {unreadMessageCount > 0 && (
                        <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-white text-[11px] font-medium">
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
                    className="w-full rounded-lg px-3 py-2.5 text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      navigate("/settings");
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      setSupportDialogOpen(true);
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Support
                  </button>

                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      signOut();
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                  >
                    Sign out
                  </button>

                   <div className="border-t border-gray-100 mt-3 pt-2 text-[11px] text-gray-400 text-center space-x-1">
                          <a href="/privacy" className="hover:underline">Privacy</a> ·
                          <a href="/terms" className="hover:underline">Terms</a> ·
                          <a href="/landing" className="hover:underline">About 54links</a>
                    </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setLoginDialogOpen(true)}
                    className="border border-brand-600 text-brand-600 px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap hover:bg-brand-50 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setLoginDialogOpenForSignUp(true)}
                    className={`${styles.primary} px-4 py-2  text-sm font-semibold whitespace-nowrap hover:opacity-90 transition-opacity`}
                  >
                    Join Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Dialogs */}
      <LoginDialog
        isOpen={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        initialTab="login"
      />
      <LoginDialog
        isOpen={loginDialogOpenForSignUp}
        onClose={() => setLoginDialogOpenForSignUp(false)}
        initialTab="signup"
      />

      {/* Support Dialog */}
      <SupportDialog
        isOpen={supportDialogOpen}
        onClose={() => setSupportDialogOpen(false)}
      />
    </>
  );
}

export default Header;
