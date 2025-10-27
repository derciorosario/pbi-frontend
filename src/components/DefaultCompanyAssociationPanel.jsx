// src/components/CompanyAssociationPanel.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import client from "../api/client";
import {
  ShieldCheck,
  Eye,
  MessageSquare,
  UserPlus,
  CalendarDays,
  ChevronRight,
  Briefcase,
  UserCircle,
  Globe,
  PlusCircle,
  MinusCircle,
  Share2,
  Copy as CopyIcon,
} from "lucide-react";
import {
  FacebookShareButton,
  FacebookIcon,
  LinkedinShareButton,
  LinkedinIcon,
  TwitterShareButton,
  TwitterIcon,
  WhatsappShareButton,
  WhatsappIcon,
  TelegramShareButton,
  TelegramIcon,
  EmailShareButton,
  EmailIcon,
} from "react-share";

export default function CompanyAssociationPanel() {
  const { refreshAuth, setToken, user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [switching, setSwitching] = useState(false);


  // share popup
  const [shareOpen, setShareOpen] = useState(false);
  const shareMenuRef = useRef(null);
  const cardRef = useRef(null);

  // Close share menu on outside click / Esc
  useEffect(() => {
    function onDown(e) {
      if (
        shareMenuRef.current &&
        !shareMenuRef.current.contains(e.target) &&
        !cardRef.current?.contains(e.target)
      ) {
        setShareOpen(false);
      }
    }
    function onEsc(e) {
      if (e.key === "Escape") setShareOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  

  // Fetch company totals
  const fetchCompanyTotals = async () => {
    try {
      const { data } = await client.get("/company/representative/totals");
      const transformed = data.companies.map((c) => ({
        id: c.companyId,
        name: c.company.name,
        logo: c.company.avatarUrl || "",
        tagline:
          c.company.profile?.professionalTitle ||
          `${c.company.accountType} · ${c.company.city || "Business"}`,
        profileVisitors: c.totals.connections,
        newMessages: c.totals.newMessages,
        connectionRequests: c.totals.newRequests,
        upcomingMeetings: c.totals.upcomingMeetings,
        website: c.company.webpage || "",
        companyData: c,
        onManage: () => handleCompanySwitch(c),
        onPostJob: () => handlePostJob(c),
        onPostEvent: () => handlePostEvent(c),
      }));
      setCompanies(transformed);
      if (!selectedCompanyId && transformed.length > 0) {
        setSelectedCompanyId(transformed[0].id);
      }
    } catch (err) {
      console.error("Error fetching company totals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySwitch = async (companyData) => {
    if (switching) return; // Prevent multiple simultaneous switches

    try {
      setSwitching(true);
      const { data } = await client.post("/auth/company-token", {
        companyId: companyData.companyId,
      });

      if (data.token) {
        setToken(data.token);
        await refreshAuth(data.token); // Pass the new token to ensure immediate use
        // After refreshAuth, the user state should be updated
        localStorage.setItem('activeAccountId', companyData.companyId);
        // Update selectedCompanyId to match
        setSelectedCompanyId(companyData.companyId);
      }
    } catch (err) {
      console.error("Error switching company:", err);
    } finally {
      setSwitching(false);
    }
  };

  const handlePostJob = async (companyData) => {
    await handleCompanySwitch(companyData);
    navigate("/jobs/create");
  };

  const handlePostEvent = async (companyData) => {
    await handleCompanySwitch(companyData);
    navigate("/events/create");
  };

  useEffect(() => {
    fetchCompanyTotals();
    const interval = setInterval(fetchCompanyTotals, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && user?.representativeOf?.length) return <LoadingSkeleton />;

 
  const company = companies.find((c) => c.id === selectedCompanyId);
  if (!company) return null;

  const shareUrl = `${window.location.origin}/company/${company.companyData.companyId}`;
  const shareTitle = `Check out ${company.name} on 54Links`;
  const shareQuote = `${company.name} - ${company.tagline || "Business Profile"}`;
  const shareHashtags = ["54Links", "Business", "Networking"];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      console.log("Link copied");
      setShareOpen(false);
    } catch {
      console.error("Copy failed");
    }
  };

  const CopyLinkButton = () => (
    <button
      onClick={copyLink}
      className="flex items-center gap-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
    >
      <CopyIcon size={16} />
      Copy link
    </button>
  );

  const ShareMenu = () => (
    <div
      ref={shareMenuRef}
      className="absolute  bottom-12 right-1 z-30 w-52 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
    >
      <div className="text-xs font-medium text-gray-500 pb-2">
        Share this company
      </div>
      <div className="grid grid-cols-3 gap-2">
        <WhatsappShareButton url={shareUrl} title={shareTitle}>
          <div className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50">
            <WhatsappIcon size={20} round />
            <span className="text-xs">WhatsApp</span>
          </div>
        </WhatsappShareButton>
        <FacebookShareButton url={shareUrl} quote={shareQuote} hashtag="#54Links">
          <div className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50">
            <FacebookIcon size={20} round />
            <span className="text-xs">Facebook</span>
          </div>
        </FacebookShareButton>
        <LinkedinShareButton url={shareUrl} title={shareTitle} summary={shareQuote}>
          <div className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50">
            <LinkedinIcon size={20} round />
            <span className="text-xs">LinkedIn</span>
          </div>
        </LinkedinShareButton>
        <TwitterShareButton url={shareUrl} title={shareTitle} hashtags={shareHashtags}>
          <div className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50">
            <TwitterIcon size={20} round />
            <span className="text-xs">Twitter</span>
          </div>
        </TwitterShareButton>
        <TelegramShareButton url={shareUrl} title={shareTitle}>
          <div className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50">
            <TelegramIcon size={20} round />
            <span className="text-xs">Telegram</span>
          </div>
        </TelegramShareButton>
        <EmailShareButton url={shareUrl} subject={shareTitle} body={shareQuote + "\n\n" + shareUrl}>
          <div className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50">
            <EmailIcon size={20} round />
            <span className="text-xs">Email</span>
          </div>
        </EmailShareButton>
      </div>
      <div className="mt-2">
        <CopyLinkButton />
      </div>
    </div>
  );

  return (
    <div
      ref={cardRef}
      className={`rounded-2xl ${(!user?.representativeOf || !user?.representativeOf?.length) ? 'hidden':'mb-4'} border border-slate-200 bg-white shadow-sm overflow-hidden  relative`}
    >
      {/* cover */}
      <div className="bg-gradient-to-r from-[#004182] to-[#0a66c2] h-16" />

      {/* header */}
      <div className="px-4 -mt-6 flex items-center gap-3">
        <LogoBadge name={company.name} logoUrl={company.logo} />
        <div className="min-w-0 flex-1">
          {companies.length > 1 ? (
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              disabled={switching}
              className={`text-sm font-semibold rounded-lg px-2 py-1 -translate-y-2 ${
                switching
                  ? "text-white bg-slate-400 cursor-not-allowed opacity-75"
                  : "text-white bg-transparent"
              }`}
              style={{
                color: 'white',
                backgroundColor: switching ? '#94a3b8' : 'transparent'
              }}
            >
              {companies.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                  className="text-slate-900 bg-white"
                  style={{ color: '#0f172a', backgroundColor: 'white' }}
                >
                  {(c.name.length > 15 ? c.name.substring(0, 15) + "..." : c.name)}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-1">
              <h3 className="font-semibold text-white">
                {company.name}
              </h3>
              <ShieldCheck className="h-4 w-4 text-[#0a66c2]" />
            </div>
          )}
          {company.tagline && (
            <p className="text-sm text-slate-600">{company.tagline}</p>
          )}
        </div>

      </div>

      {/* metrics */}
      <div className="px-4 pt-4 flex items-center gap-3 justify-center">
        <div className="flex items-center gap-1" title="Profile Visitors">
          <Eye className="h-4 w-4 text-[#0a66c2]" />
          <span className="text-sm font-semibold text-slate-900">
            {Intl.NumberFormat().format(company.profileVisitors || 0)}
          </span>
        </div>
        <div className="flex items-center gap-1" title="New Messages">
          <MessageSquare className="h-4 w-4 text-[#0a66c2]" />
          <span className="text-sm font-semibold text-slate-900">
            {Intl.NumberFormat().format(company.newMessages || 0)}
          </span>
        </div>
        <div className="flex items-center gap-1" title="Connection Requests">
          <UserPlus className="h-4 w-4 text-[#0a66c2]" />
          <span className="text-sm font-semibold text-slate-900">
            {Intl.NumberFormat().format(company.connectionRequests || 0)}
          </span>
        </div>
        <div className="flex items-center gap-1" title="Upcoming Meetings">
          <CalendarDays className="h-4 w-4 text-[#0a66c2]" />
          <span className="text-sm font-semibold text-slate-900">
            {Intl.NumberFormat().format(company.upcomingMeetings || 0)}
          </span>
        </div>
      </div>

      <div className="my-4 border-t border-slate-200" />

     
     {/* actions */}
<div className="px-4 pb-4 flex flex-col gap-2 relative">
  <ActionButton label="Manage company" onClick={company.onManage} primary />

  {showMore && (
    <>
      <ActionButton
        label="Share a Job Opening"
        onClick={company.onPostJob}
        icon={Briefcase}
      />
      <ActionButton
        label="Post an Event"
        onClick={company.onPostEvent}
        icon={CalendarDays}
      />

      {/* Share Profile with popup (like JobCard) */}
      <div className="relative">
        <ActionButton
          label="Share Profile"
          onClick={() => setShareOpen((s) => !s)}
          icon={UserCircle}
        />
        {shareOpen && (
          <div className="absolute left-0 top-full mt-2 z-50">
            <ShareMenu
              shareUrl={shareUrl}
              shareTitle={shareTitle}
              shareQuote={shareQuote}
              shareHashtags={shareHashtags}
              copyToClipboard={copyLink}
            />
          </div>
        )}
      </div>

      {company.website && (
        <a
          href={company.website}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <span className="inline-flex items-center gap-2">
            <Globe className="h-4 w-4" /> Visit website
          </span>
          <ChevronRight className="h-4 w-4 opacity-70" />
        </a>
      )}
    </>
  )}

  <div className="flex justify-center mt-2">
    <button
      onClick={() => setShowMore((v) => !v)}
      className="flex items-center gap-1 text-xs font-medium text-[#0a66c2]"
    >
      {showMore ? (
        <>
          <MinusCircle className="h-4 w-4" /> Show Less
        </>
      ) : (
        <>
          <PlusCircle className="h-4 w-4" /> Show More
        </>
      )}
    </button>
  </div>
</div>


      {/* share menu popup */}
      {shareOpen && <ShareMenu />}
    </div>
  );
}

/* ---------------- helpers ---------------- */
function LogoBadge({ name = "", logoUrl }) {
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="relative h-12 w-12 rounded-full ring-2 ring-white bg-brand-100 overflow-hidden shrink-0">
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="h-full w-full object-cover bg-brand-100" />
      ) : (
        <div className="h-full w-full grid place-items-center bg-brand-100 text-[#004182] font-semibold">
          {initials || "CO"}
        </div>
      )}
    </div>
  );
}


function ActionButton({ label, onClick, icon: Icon, primary }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium ${
        primary
          ? "border-[#0a66c2]/20 bg-[#0a66c2]/5 text-[#004182]"
          : "border-slate-200 text-slate-700 hover:bg-slate-50"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </span>
      <ChevronRight className="h-4 w-4 opacity-70" />
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-4">
      <div className="bg-gradient-to-r from-[#004182] to-[#0a66c2] h-16" />
      <div className="px-4 -mt-6 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full ring-2 ring-white bg-slate-200 animate-pulse" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3" />
          <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
        </div>
      </div>
    </div>
  );
}

