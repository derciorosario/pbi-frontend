// src/pages/ProfilePage.jsx
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import FeedErrorRetry from "../components/FeedErrorRetry";
import { useParams } from "react-router-dom";
import {
    MapPin,
    X,
    Briefcase,
    CalendarDays,
    Star,
    Hash,
    User2,
    Target,
    Layers,
    Languages,
    ExternalLink,
    Clock,
    Video,
    Map as MapIcon,
    Link as LinkIcon,
    UserCheck,
    UserMinus,
    UserX,
    Trash2,
    ShieldBan,
    Flag,
    Activity,
    Share2,
    Copy as CopyIcon,
    Users,
    Eye,
    MessageCircle,
    Mail,
    Globe,
    Calendar,
  } from "lucide-react";
import client from "../api/client";
import ConnectionRequestModal from "../components/ConnectionRequestModal";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "../lib/toast";
import Header from "../components/Header";
import DefaultLayout from "../layout/DefaultLayout";
import ConfirmDialog from "../components/ConfirmDialog";
import MediaViewer from "../components/MediaViewer";
import JobCard from "../components/JobCard";
import NeedCard from "../components/NeedCard";
import ServiceCard from "../components/ServiceCard";
import ProductCard from "../components/ProductCard-1";
import MomentCard from "../components/MomentCard";
import ExperienceCard from "../components/ExperienceCard";
import CrowdfundCard from "../components/CrowdfundCard";
import EventCard from "../components/EventCard";
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
  FacebookMessengerShareButton,
  FacebookMessengerIcon,
} from "react-share";
import TIMEZONES from "../constants/timezones";
import FormMediaViewer from "../components/FormMediaViewer";

/* -------------------------------- utils --------------------------------- */
function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.floor((now - then) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${m > 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d > 1 ? "s" : ""} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo > 1 ? "s" : ""} ago`;
  const y = Math.floor(mo / 12);
  return `${y} year${y > 1 ? "s" : ""} ago`;
}
function fmtLoc(city, country) {
  if (city && country) return `${city}, ${country}`;
  return city || country || "";
}
function Chip({ children, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    green: "bg-green-100 text-green-700",
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  );
}
function Section({ title, icon: Icon, children }) {
  return (
    <div className="mt-5 text-left">
      <div className="flex items-center gap-2 mb-2">
        {Icon ? <Icon size={16} className="text-brand-600" /> : null}
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0).toUpperCase() || "";
  const second = parts[1]?.charAt(0).toUpperCase() || "";
  return first + second;
}

// User Search Component
const UserSearch = ({ onSelect, selectedUsers, onRemove, thisUserId }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);

  const searchUsers = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await client.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      // Filter out already selected users
      const filteredResults = data.filter(user =>
        !selectedUsers.some(selected => selected.id === user.id) && user?.id != thisUserId
      );
      setResults(filteredResults);
    } catch (error) {
      console.error("Error searching users:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle clicking outside to close results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      searchUsers(value);
    }, 300);
  };

  const handleSelect = (user) => {
    onSelect(user);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-gray-700 mb-1">
        Add Participants 
      </label>
      
      {/* Selected users chips */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 rounded-full px-3 py-1 text-xs font-medium"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-brand-100 flex items-center justify-center text-xs font-medium text-brand-700">
                  {getInitials(user.name)}
                </div>
              )}
              {user.name || user.email}
              {user?.id != thisUserId && (
                <button
                  type="button"
                  onClick={() => onRemove(user.id)}
                  className="text-brand-500 hover:text-brand-700"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div ref={searchRef} className="relative">
        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search users by name or email..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          {loading && (
            <div className="absolute right-3 top-2.5">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
            </div>
          )}
        </div>

        {/* Search results */}
        {results.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {results.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelect(user)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-xs font-medium text-brand-700">
                    {getInitials(user.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user.email}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Share data and components
const ShareMenu = ({ profile, shareMenuRef, setShareOpen }) => {
  const shareUrl = `https://54links.com/profile/${profile?.id}`;
  const shareTitle = `${profile?.name || "Profile"} on 54Links`;
  const shareDescription = profile?.about || `Check out ${profile?.name || "this profile"} on 54Links`;

  const shareQuote = shareDescription.slice(0, 160) + (shareDescription.length > 160 ? "…" : "");
  const shareHashtags = ["54Links", "Profile", "Networking"].filter(Boolean);
  const messengerAppId = import.meta?.env?.VITE_FACEBOOK_APP_ID || undefined;

  return (
    <div
      ref={shareMenuRef}
      style={{ transform:'translate(30%,0)'}}
      className="absolute top-0  right-0 mt-2 z-30 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
      role="dialog"
      aria-label="Share options"
    >
      <div className="text-xs font-medium text-gray-500 px-1 pb-2">
        Share this profile
      </div>

      <div className="grid grid-cols-3 gap-2">
        <WhatsappShareButton url={shareUrl} title={shareTitle} separator=" — ">
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50">
            <WhatsappIcon size={40} round />
            <span className="text-xs text-gray-700">WhatsApp</span>
          </div>
        </WhatsappShareButton>

        <FacebookShareButton url={shareUrl} quote={shareQuote} hashtag="#54Links">
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50">
            <FacebookIcon size={40} round />
            <span className="text-xs text-gray-700">Facebook</span>
          </div>
        </FacebookShareButton>

        <LinkedinShareButton url={shareUrl} title={shareTitle} summary={shareQuote} source="54Links">
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50">
            <LinkedinIcon size={40} round />
            <span className="text-xs text-gray-700">LinkedIn</span>
          </div>
        </LinkedinShareButton>

        <TwitterShareButton url={shareUrl} title={shareTitle} hashtags={shareHashtags}>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50">
            <TwitterIcon size={40} round />
            <span className="text-xs text-gray-700">X / Twitter</span>
          </div>
        </TwitterShareButton>

        <TelegramShareButton url={shareUrl} title={shareTitle}>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50">
            <TelegramIcon size={40} round />
            <span className="text-xs text-gray-700">Telegram</span>
          </div>
        </TelegramShareButton>

        <EmailShareButton url={shareUrl} subject={shareTitle} body={shareQuote + "\n\n" + shareUrl}>
          <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50">
            <EmailIcon size={40} round />
            <span className="text-xs text-gray-700">Email</span>
          </div>
        </EmailShareButton>

        {messengerAppId && (
          <FacebookMessengerShareButton url={shareUrl} appId={messengerAppId}>
            <div className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50">
              <FacebookMessengerIcon size={40} round />
              <span className="text-xs text-gray-700">Messenger</span>
            </div>
          </FacebookMessengerShareButton>
        )}
      </div>

      <div className="mt-2">
        <CopyLinkButton shareUrl={shareUrl} setShareOpen={setShareOpen} />
      </div>
    </div>
  );
};

const CopyLinkButton = ({ shareUrl, setShareOpen }) => {
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied");
          setShareOpen(false);
        } catch {
          toast.error("Failed to copy link");
        }
      }}
      className="flex items-center gap-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
    >
      <CopyIcon size={16} />
      Copy link
    </button>
  );
};
/* ----------------------- meeting time / status utils --------------------- */
function addMinutes(dateIso, mins) {
  if (!dateIso) return null;
  try {
    const date = new Date(dateIso);
    if (isNaN(date.getTime())) return null;
    const t = date.getTime();
    return new Date(t + mins * 60000).toISOString();
  } catch {
    return null;
  }
}
function isJoinWindow(startIso, durationMin) {
  if (!startIso) return false;
  try {
    const now = Date.now();
    const startDate = new Date(startIso);
    if (isNaN(startDate.getTime())) return false;
    const start = startDate.getTime();
    const joinOpen = start - 10 * 60 * 1000; // 10min antes
    const endTimeStr = addMinutes(startIso, Number(durationMin) || 30);
    const end = endTimeStr ? new Date(endTimeStr).getTime() : start + (Number(durationMin) || 30) * 60 * 1000;
    return now >= joinOpen && now <= end;
  } catch {
    return false;
  }
}
function humanWhen(startIso, tz, durationMin) {
  if (!startIso) return "Invalid date";
  try {
    const s = new Date(startIso);
    if (isNaN(s.getTime())) return "Invalid date";
    const opts = { dateStyle: "medium", timeStyle: "short", timeZone: tz || undefined };
    return `${s.toLocaleString(undefined, opts)} • ${durationMin} min`;
  } catch {
    return "Invalid date";
  }
}
/* ----------------------- MeetingRequestModal (inline) -------------------- */




function MeetingRequestModal({ open, onClose, toUserId, toName, onCreated }) {
  const defaultTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [form, setForm] = useState({
    date: "",
    time: "",
    duration: "30",
    mode: "video",
    location: "",
    link: "",
    title: `Meeting with ${toName ?? "User"}`,
    agenda: "",
    timezone: defaultTz,
  });
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    if (open && toName) {
      setForm(prev => ({
        ...prev,
        title: `Meeting with ${toName}`
      }));
      setParticipants([{ id: toUserId, name: toName }]);
    }
  }, [open, toName, toUserId]);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setSubmitting(false);
    // Initialize with the primary recipient if provided
    if (toUserId && toName) {
      setParticipants([{ id: toUserId, name: toName }]);
    }
  }, [open, toUserId, toName]);
  function validate() {
    const e = {};
    if (!form.date) e.date = "Pick a date";
    if (!form.time) e.time = "Pick a time";
    if (!form.title.trim()) e.title = "Add a title";
    if (participants.length === 0) e.participants = "Add at least one participant";
    // leave like that: if (form.mode === "video" && !form.link.trim()) e.link = "Add a call link";
    // if (form.mode === "in_person" && !form.location.trim()) e.location = "Add a location";
    return e;

  }

  const handleAddParticipant = (user) => {
  if (!participants.some(p => p.id === user.id)) {
    setParticipants(prev => [...prev, user]);
  }
};

const handleRemoveParticipant = (userId) => {
  setParticipants(prev => prev.filter(p => p.id !== userId));
};
  function handleChange(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  async function handleSubmit(e) {
    e.preventDefault();
    const eMap = validate();
    setErrors(eMap);
    if (Object.keys(eMap).length) return;
    const isoStart = new Date(`${form.date}T${form.time}:00`).toISOString();
    setSubmitting(true);
    try {
      const primaryParticipant = participants[0];
      const additionalParticipants = participants.slice(1).map(p => p.id);
      const payload = {
        toUserId: primaryParticipant.id,
        title: form.title,
        agenda: form.agenda,
        scheduledAt: isoStart,
        duration: parseInt(form.duration),
        timezone: form.timezone,
        mode: form.mode,
        location: form.mode === "in_person" ? form.location : null,
        link: form.mode === "video" ? form.link : null,
        participants: additionalParticipants
      };
      const { data } = await client.post("/meeting-requests", payload);
      toast.success("Meeting request sent successfully!");
      onCreated?.(data);
      onClose();
    } catch (error) {
      console.error("Error creating meeting request:", error);
      toast.error(error?.response?.data?.message || "Failed to send meeting request");
    } finally {
      setSubmitting(false);
    }
  }
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[92vw] sm:w-full sm:max-w-lg max-h-[80vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between bg-brand-500 px-4 py-3">
          <div className="text-white font-medium">Request Meeting</div>
          <button onClick={onClose} className="text-white/90 hover:text-white"><X size={20} /></button>
        </div>
        <form id="meetingForm" onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
            <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              value={form.title} onChange={(e) => handleChange("title", e.target.value)} placeholder="e.g., Intro call about collaboration" />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>
          
          {/* Participants Section */}
          <UserSearch
            onSelect={handleAddParticipant}
            selectedUsers={participants}
            onRemove={handleRemoveParticipant}
            thisUserId={toUserId}
          />
          {errors.participants && <p className="text-xs text-red-600 mt-1">{errors.participants}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <input min={new Date().toISOString().split('T')[0]} type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                value={form.date} onChange={(e) => handleChange("date", e.target.value)} />
              {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
              <input type="time" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                value={form.time} onChange={(e) => handleChange("time", e.target.value)} />
              {errors.time && <p className="text-xs text-red-600 mt-1">{errors.time}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                value={form.duration} onChange={(e) => handleChange("duration", e.target.value)}>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Timezone</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                value={form.timezone} onChange={(e) => handleChange("timezone", e.target.value)}>
               
                {TIMEZONES.map((i,_i)=>(
                                   <option value={i.value}>{`${i.offset} - ${i.label}`}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Meeting mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => handleChange("mode", "video")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  form.mode === "video" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-300 bg-white text-gray-700"}`}>
                <Video size={18} /> Video call
              </button>
              <button type="button" onClick={() => handleChange("mode", "in_person")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  form.mode === "in_person" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-300 bg-white text-gray-700"}`}>
                <MapIcon size={18} /> In person
              </button>
            </div>
          </div>
          {form.mode === "video" ? (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Call link <span className="text-gray-600">(optional)</span></label>
              <div className="flex items-center gap-2">
                <div className="rounded-lg border border-gray-300 px-3 py-2 flex-1 flex items-center gap-2">
                  <LinkIcon size={16} className="text-gray-500" />
                  <input type="url" className="w-full text-sm focus:outline-none"
                    placeholder="Insert call link" value={form.link}
                    onChange={(e) => handleChange("link", e.target.value)} />
                </div>
              </div>
              {errors.link && <p className="text-xs text-red-600 mt-1">{errors.link}</p>}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
              <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                placeholder="e.g., Avenida Julius Nyerere 123, Maputo" value={form.location}
                onChange={(e) => handleChange("location", e.target.value)} />
              {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
            </div>
          )}
          {form.date && form.time && (
            <div className="rounded-lg border bg-gray-50 px-3 py-2 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <CalendarDays size={14} className="text-brand-600" />
                <span>
                  {new Date(`${form.date}T${form.time}:00`).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  {" "}({form.timezone}) • {form.duration} min • {form.mode === "video" ? "Video call" : "In person"}
                </span>
              </div>
            </div>
          )}
        </form>
        <div className="p-4 border-t flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:border-gray-400">
            Cancel
          </button>
          <button type="submit" form="meetingForm" disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60">
            <Clock size={18} /> {submitting ? "Creating…" : `Create request (${participants.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Página ---------------------------------- */

// Loading component similar to Profile.jsx
const Loading = () => (
  <div className="min-h-screen grid place-items-center text-brand-700">
    <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"/>
    </svg>
    <span className="ml-2">Loading…</span>
  </div>
);

export default function PublicProfilePage() {
  const { userId } = useParams();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [fetchError, setFetchError] = useState(false);
  const retryTimeoutRef = useRef(null);
  const [crOpen, setCrOpen] = useState(false);
  const [openConfirmRemoveConnection, setOpenConfirmRemoveConnection] = useState(false);

  // state for blocking/reporting
  const [openConfirmBlock, setOpenConfirmBlock] = useState(false);
  const [openConfirmReport, setOpenConfirmReport] = useState(false);

  // Feed items state for Posts and activities section
  const [feedItems, setFeedItems] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showAllPosts, setShowAllPosts] = useState(false);

  // Gallery images state
  const [galleryImages, setGalleryImages] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  // Tab state for Posts/Images/Videos
  const [activeTab, setActiveTab] = useState('posts');

  // Image slider modal state
  const [imageSliderOpen, setImageSliderOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Helper function to extract and validate images from feed items
  const extractValidImages = (items) => {
    const allImages = [];

    items.forEach(item => {
      switch (item.kind) {
        case 'job':
          // Jobs have coverImageBase64 (from backend model)
          if (item.coverImageBase64 && (
            item.coverImageBase64.startsWith('data:image/') ||
            item.coverImageBase64.startsWith('http://') ||
            item.coverImageBase64.startsWith('https://')
          )) {
            allImages.push({
              url: item.coverImageBase64,
              alt: item.title || 'Job image',
              type: 'job',
              itemId: item.id,
              itemTitle: item.title
            });
          }
          break;

        case 'event':
          // Events have coverImageBase64 and coverImageUrl (from backend model)
          if (item.coverImageBase64 && (
            item.coverImageBase64.startsWith('data:image/') ||
            item.coverImageBase64.startsWith('http://') ||
            item.coverImageBase64.startsWith('https://')
          )) {
            allImages.push({
              url: item.coverImageBase64,
              alt: item.title || 'Event image',
              type: 'event',
              itemId: item.id,
              itemTitle: item.title
            });
          }

          if (item.coverImageUrl && (
            item.coverImageUrl.startsWith('data:image/') ||
            item.coverImageUrl.startsWith('http://') ||
            item.coverImageUrl.startsWith('https://')
          )) {
            allImages.push({
              url: item.coverImageUrl,
              alt: item.title || 'Event cover image',
              type: 'event',
              itemId: item.id,
              itemTitle: item.title
            });
          }

          // Process images array if it exists (from EventCard.jsx pattern)
          if (Array.isArray(item.images)) {
            item.images.forEach((img, index) => {
              if (img && (
                img.startsWith('data:image/') ||
                img.startsWith('http://') ||
                img.startsWith('https://')
              )) {
                allImages.push({
                  url: img,
                  alt: `${item.title || 'Event image'} ${index + 1}`,
                  type: 'event',
                  itemId: item.id,
                  itemTitle: item.title
                });
              }
            });
          }
          break;

        case 'service':
          // Services have images array (from ServiceCard.jsx pattern)
          if (Array.isArray(item.images)) {
            item.images.forEach((img, index) => {
              if (img && (
                img.startsWith('data:image/') ||
                (typeof img === 'string' && (
                  /\.(jpe?g|png|gif|webp|svg)$/i.test(img) ||
                  img.startsWith('http://') ||
                  img.startsWith('https://')
                ))
              )) {
                allImages.push({
                  url: img,
                  alt: `${item.title || 'Service image'} ${index + 1}`,
                  type: 'service',
                  itemId: item.id,
                  itemTitle: item.title
                });
              }
            });
          }
          break;

        case 'product':
          // Products have images array (from ProductCard.jsx pattern)
          if (Array.isArray(item.images)) {
            item.images.forEach((img, index) => {
              if (img && (
                img.startsWith('data:image/') ||
                img.startsWith('http://') ||
                img.startsWith('https://')
              )) {
                allImages.push({
                  url: img,
                  alt: `${item.title || 'Product image'} ${index + 1}`,
                  type: 'product',
                  itemId: item.id,
                  itemTitle: item.title
                });
              }
            });
          }
          break;

        case 'tourism':
          // Tourism items have images array (from ExperienceCard.jsx pattern)
          if (Array.isArray(item.images)) {
            item.images.forEach((img, index) => {
              if (img && typeof img === 'object' && img?.base64url && (
                img.base64url.startsWith('data:image/') ||
                img.base64url.startsWith('http://') ||
                img.base64url.startsWith('https://')
              )) {
                allImages.push({
                  url: img.base64url,
                  alt: `${item.title || 'Tourism image'} ${index + 1}`,
                  type: 'tourism',
                  itemId: item.id,
                  itemTitle: item.title
                });
              } else if (img && typeof img === 'string' && (
                img.startsWith('data:image/') ||
                img.startsWith('http://') ||
                img.startsWith('https://')
              )) {
                allImages.push({
                  url: img,
                  alt: `${item.title || 'Tourism image'} ${index + 1}`,
                  type: 'tourism',
                  itemId: item.id,
                  itemTitle: item.title
                });
              }
            });
          }
          break;

        case 'funding':
          // Funding items have images array (from CrowdfundCard.jsx pattern)
          if (Array.isArray(item.images)) {
            item.images.forEach((img, index) => {
              if (img && typeof img === 'object' && img?.base64url && (
                img.base64url.startsWith('data:image/') ||
                img.base64url.startsWith('http://') ||
                img.base64url.startsWith('https://')
              )) {
                allImages.push({
                  url: img.base64url,
                  alt: `${item.title || 'Funding image'} ${index + 1}`,
                  type: 'funding',
                  itemId: item.id,
                  itemTitle: item.title
                });
              } else if (img && typeof img === 'string' && (
                img.startsWith('data:image/') ||
                img.startsWith('http://') ||
                img.startsWith('https://')
              )) {
                allImages.push({
                  url: img,
                  alt: `${item.title || 'Funding image'} ${index + 1}`,
                  type: 'funding',
                  itemId: item.id,
                  itemTitle: item.title
                });
              }
            });
          }
          break;

        case 'need':
          // Needs have attachments array (from NeedCard.jsx pattern)
          if (Array.isArray(item.attachments)) {
            item.attachments.forEach((attachment, index) => {
              if (attachment && typeof attachment === 'object' && attachment?.base64url && (
                attachment.base64url.startsWith('data:image/') ||
                attachment.base64url.startsWith('http://') ||
                attachment.base64url.startsWith('https://')
              )) {
                allImages.push({
                  url: attachment.base64url,
                  alt: `${item.title || 'Need attachment'} ${index + 1}`,
                  type: 'need',
                  itemId: item.id,
                  itemTitle: item.title
                });
              } else if (attachment && typeof attachment === 'string' && (
                attachment.startsWith('data:image/') ||
                (/\.(jpe?g|png|gif|webp|svg)$/i.test(attachment) ||
                 attachment.startsWith('http://') ||
                 attachment.startsWith('https://'))
              )) {
                allImages.push({
                  url: attachment,
                  alt: `${item.title || 'Need attachment'} ${index + 1}`,
                  type: 'need',
                  itemId: item.id,
                  itemTitle: item.title
                });
              }
            });
          }
          break;

        case 'moment':
          // Moments have images array (from MomentCard.jsx pattern)
          if (Array.isArray(item.images)) {
            item.images.forEach((img, index) => {
              if (img && typeof img === 'object' && img?.base64url && (
                img.base64url.startsWith('data:image/') ||
                img.base64url.startsWith('http://') ||
                img.base64url.startsWith('https://')
              )) {
                allImages.push({
                  url: img.base64url,
                  alt: `${item.title || 'Moment image'} ${index + 1}`,
                  type: 'moment',
                  itemId: item.id,
                  itemTitle: item.title
                });
              }
            });
          }

          // Also check attachments array as fallback (from MomentCard.jsx)
          if (Array.isArray(item.attachments)) {
            item.attachments.forEach((attachment, index) => {
              if (attachment && typeof attachment === 'object' && attachment?.base64url && (
                attachment.base64url.startsWith('data:image/') ||
                attachment.base64url.startsWith('http://') ||
                attachment.base64url.startsWith('https://')
              )) {
                allImages.push({
                  url: attachment.base64url,
                  alt: `${item.title || 'Moment attachment'} ${index + 1}`,
                  type: 'moment',
                  itemId: item.id,
                  itemTitle: item.title
                });
              }
            });
          }
          break;
      }
    });

    return allImages;
  };

  
// Add this function to filter items by user ID
const filterItemsByUserId = (items, targetUserId) => {
  if (!targetUserId || !items.length) return [];
  
  return items.filter(item => {
    // Extract the owner/user ID based on item kind
    let itemUserId;
    
    switch (item.kind) {
      case 'job':
        itemUserId = item.postedByUserId || item.postedBy?.id;
        break;
      case 'event':
        itemUserId = item.organizerUserId || item.organizer?.id;
        break;
      case 'service':
        itemUserId = item.providerUserId || item.provider?.id;
        break;
      case 'product':
        itemUserId = item.sellerUserId || item.seller?.id;
        break;
      case 'tourism':
        itemUserId = item.authorUserId || item.author?.id;
        break;
      case 'funding':
        itemUserId = item.creatorUserId || item.creator?.id;
        break;
      case 'need':
        itemUserId = item.userId || item.user?.id;
        break;
      case 'moment':
        itemUserId = item.userId || item.user?.id;
        break;
      default:
        itemUserId = null;
    }
    
    // Compare as strings to ensure type consistency
    return String(itemUserId) === String(targetUserId);
  });
};


  // Get valid images for the Images tab
const userFeedItems = useMemo(() => {
  return filterItemsByUserId(feedItems, userId);
}, [feedItems, userId]);

// Update video extraction
useEffect(() => {
  if (userFeedItems.length > 0) {
    const videos = extractVideoUrls(userFeedItems);
    setVideoUrls(videos);
  }
}, [userFeedItems])


const validImages = extractValidImages(userFeedItems);


  // Combine gallery images and feed images for the image slider
  const allImages = useMemo(() => {
    const galleryFormatted = galleryImages.map(img => ({
      url: img.imageUrl,
      alt: img.title || 'Gallery image',
      type: 'gallery',
      itemId: img.id,
      itemTitle: img.title || 'Gallery image'
    }));
    return [...galleryFormatted, ...validImages];
  }, [galleryImages, validImages]);

  // Add keyboard event listener for image slider
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [imageSliderOpen]);

  // Image slider handlers
  const openImageSlider = (imageIndex) => {
    setCurrentImageIndex(imageIndex);
    setImageSliderOpen(true);
  };

  const closeImageSlider = () => {
    setImageSliderOpen(false);
    setCurrentImageIndex(0);
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const goToPrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!imageSliderOpen) return;

    switch (e.key) {
      case 'Escape':
        closeImageSlider();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        goToPrevImage();
        break;
      case 'ArrowRight':
        e.preventDefault();
        goToNextImage();
        break;
    }
  };

  // Share menu state
  const [shareOpen, setShareOpen] = useState(false);
  const shareMenuRef = useRef(null);
  const shareButtonRef = useRef(null);

  // Media viewer state
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);

  // Meeting modal + list
  const [mrOpen, setMrOpen] = useState(false);
  const [meetings, setMeetings] = useState([]);

  const data = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  function openCR() {
    if (!user) return data._showPopUp("login_prompt");
    setCrOpen(true);
  }
  function openMR() {
    if (!user) return data._showPopUp("login_prompt");
    setMrOpen(true);
  }

  const languages = useMemo(() => {
    if (!Array.isArray(profile?.languages)) return [];
    return profile.languages.map((l) => (typeof l === "string" ? { name: l } : l)).filter(Boolean);
  }, [profile]);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    let mounted = true;
    setLoading(true);
    setFetchError(false);
    setError("");
    try {
      const { data } = await client.get(`/users/${userId}/public`);
      if (mounted) setProfile(data);
    } catch (e) {
      console.error(e);
      if (mounted) {
        setFetchError(true);
        // Automatic retry after 3 seconds
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          fetchProfile();
        }, 3000);
      }
    } finally {
      if (mounted) setLoading(false);
    }
    return () => { mounted = false; };
  }, [userId]);

  useEffect(() => {
    fetchProfile();
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [fetchProfile]);

 

 useEffect(() => {
  if (!userId || !user) return;
  async function loadMeetings() {
    try {
      const { data } = await client.get("/meeting-requests");
      
      // Get all meetings where the profile user (userId) is involved in any capacity
      const relevantMeetings = [
        // Meetings where profile user is requester
        ...data.sent.filter((m) => m.fromUserId === userId),
        // Meetings where profile user is recipient  
        ...data.received.filter((m) => m.toUserId === userId),
        // Meetings where profile user is participant
        ...data.invitations.filter((m) => 
          m.participants?.some(p => p.user?.id === userId)
        ),
        // Also include meetings where current logged-in user is involved AND profile user is also involved
        ...data.sent.filter((m) => 
          m.fromUserId === user.id && 
          (m.toUserId === userId || m.participants?.some(p => p.user?.id === userId))
        ),
        ...data.received.filter((m) => 
          m.toUserId === user.id && 
          (m.fromUserId === userId || m.participants?.some(p => p.user?.id === userId))
        ),
        ...data.invitations.filter((m) => 
          m.participants?.some(p => p.user?.id === user.id) && 
          (m.fromUserId === userId || m.toUserId === userId || m.participants?.some(p => p.user?.id === userId))
        )
      ].filter((m, index, array) => 
        // Remove duplicates and only show accepted meetings
        array.findIndex(m2 => m2.id === m.id) === index && 
        m.status === "accepted"
      );

      console.log("Loaded meetings for profile:", {
        profileUserId: userId,
        currentUserId: user.id,
        meetingsCount: relevantMeetings.length,
        meetings: relevantMeetings.map(m => ({
          id: m.id,
          title: m.title,
          from: m.requester?.name,
          to: m.recipient?.name,
          participants: m.participants?.map(p => p.user?.name)
        }))
      });

      const formatted = relevantMeetings.map((m) => ({
        id: m.id,
        toUserId: m.toUserId,
        title: m.title,
        agenda: m.agenda,
        mode: m.mode,
        link: m.link,
        location: m.location,
        timezone: m.timezone,
        duration: m.duration,
        isoStart: m.scheduledAt,
        createdAt: m.createdAt,
        from: m.requester,
        to: m.recipient,
        // Include all participants including requester, recipient, and additional participants
        participants: [
          m.requester,
          m.recipient,
          ...(m.participants || []).map(p => p.user).filter(user => 
            user && user.id !== m.requester?.id && user.id !== m.recipient?.id
          )
        ].filter(Boolean) // Remove any null/undefined
      }));
      
      setMeetings(formatted);
    } catch (err) {
      console.error("Error loading meetings:", err);
    }
  }
  loadMeetings();
}, [user?.id, userId]);


  // Load categories for feed items
  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get("/feed/meta");
        setCategories(data.categories || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Load user's feed items when profile loads
  useEffect(() => {
    if (!userId) return;

    async function loadUserFeed() {
      setLoadingFeed(true);

      try {
        const params = {
          tab: "all",
          userId: userId,
          limit: 20,
          offset: 0,
        };

        const { data } = await client.get("/feed", { params });
        setFeedItems(data.items || []);
      } catch (error) {
        console.error("Error loading user feed:", error);
      } finally {
        setLoadingFeed(false);
      }
    }

    loadUserFeed();
  }, [userId]);

  // Load user's gallery images when profile loads
  useEffect(() => {
    if (!userId) return;

    async function loadUserGallery() {
      setLoadingGallery(true);

      try {
        const { data } = await client.get(`/users/${userId}/gallery`);
        setGalleryImages(data.gallery || []);
      } catch (error) {
        console.error("Error loading user gallery:", error);
        setGalleryImages([]);
      } finally {
        setLoadingGallery(false);
      }
    }

    loadUserGallery();
  }, [userId]);

  // Test the new getUserItems API endpoint (for testing purposes only)
  useEffect(() => {
    if (!userId) return;

    async function testUserItemsAPI() {
      try {
        const { data } = await client.get(`/users/${userId}/items`);
        // Log the response for testing but don't render it
        console.log("User items API test:", {
          userId: data.userId,
          totalItems: data.totalItems,
          counts: data.counts,
          itemsCount: data.items?.length || 0
        });
      } catch (error) {
        console.error("Error testing user items API:", error);
      }
    }

    // Only run this test in development
    if (import.meta.env.DEV) {
      testUserItemsAPI();
    }
  }, [userId]);
  



/**  useEffect(() => {
  if (!userId) return;
  async function loadMeetings() {
    try {
      // Use the new dedicated endpoint for profile meetings
      const { data } = await client.get(`/meeting-requests/profile/${userId}`);
      
      console.log("Profile meetings loaded:", {
        profileUserId: userId,
        meetingsCount: data.length,
        meetings: data.map(m => ({
          id: m.id,
          title: m.title,
          from: m.requester?.name,
          to: m.recipient?.name,
          participantsCount: m.participants?.length || 0,
          participants: m.participants?.map(p => p.user?.name)
        }))
      });

      const formatted = data.map((m) => {
        // Create a Set to ensure no duplicate users
        const participantSet = new Set();
        const participants = [];

        // Add requester if not null
        if (m.requester && m.requester.id) {
          participantSet.add(m.requester.id);
          participants.push(m.requester);
        }

        // Add recipient if not null
        if (m.recipient && m.recipient.id) {
          if (!participantSet.has(m.recipient.id)) {
            participantSet.add(m.recipient.id);
            participants.push(m.recipient);
          }
        }

        // Add all other participants
        if (m.participants && Array.isArray(m.participants)) {
          m.participants.forEach(participant => {
            if (participant.user && participant.user.id && !participantSet.has(participant.user.id)) {
              participantSet.add(participant.user.id);
              participants.push(participant.user);
            }
          });
        }

        console.log(`Formatted meeting ${m.id}:`, {
          title: m.title,
          totalParticipants: participants.length,
          participants: participants.map(p => p.name)
        });

        return {
          id: m.id,
          toUserId: m.toUserId,
          title: m.title,
          agenda: m.agenda,
          mode: m.mode,
          link: m.link,
          location: m.location,
          timezone: m.timezone,
          duration: m.duration,
          isoStart: m.scheduledAt,
          createdAt: m.createdAt,
          from: m.requester,
          to: m.recipient,
          participants: participants
        };
      });
      
      setMeetings(formatted);
    } catch (err) {
      console.error("Error loading profile meetings:", err);
      // Fallback to original method if new endpoint doesn't exist
      await loadMeetingsFallback();
    }
  }

  async function loadMeetingsFallback() {
    try {
      const { data } = await client.get("/meeting-requests");
      
      const relevantMeetings = [
        ...data.received.filter((m) => m.fromUserId === userId),
        ...data.sent.filter((m) => m.toUserId === userId),
        ...data.invitations.filter((m) => m.participants?.some(p => p.user?.id === userId))
      ].filter((m) => m.status === "accepted");

      const formatted = relevantMeetings.map((m) => {
        const participantSet = new Set();
        const participants = [];

        if (m.requester && m.requester.id) {
          participantSet.add(m.requester.id);
          participants.push(m.requester);
        }

        if (m.recipient && m.recipient.id) {
          if (!participantSet.has(m.recipient.id)) {
            participantSet.add(m.recipient.id);
            participants.push(m.recipient);
          }
        }

        if (m.participants && Array.isArray(m.participants)) {
          m.participants.forEach(participant => {
            if (participant.user && participant.user.id && !participantSet.has(participant.user.id)) {
              participantSet.add(participant.user.id);
              participants.push(participant.user);
            }
          });
        }

        return {
          id: m.id,
          toUserId: m.toUserId,
          title: m.title,
          agenda: m.agenda,
          mode: m.mode,
          link: m.link,
          location: m.location,
          timezone: m.timezone,
          duration: m.duration,
          isoStart: m.scheduledAt,
          createdAt: m.createdAt,
          from: m.requester,
          to: m.recipient,
          participants: participants
        };
      });
      
      setMeetings(formatted);
    } catch (err) {
      console.error("Error loading meetings fallback:", err);
    }
  }

  loadMeetings();
}, [user?.id, userId]);

**/


  // Add this function to extract video URLs from the feed items structure
const extractVideoUrls = (items) => {
  const videoUrls = [];

  items.forEach(item => {
    // Handle items with videoUrl field
    if (item.videoUrl && (
      item.videoUrl.startsWith('http://') || 
      item.videoUrl.startsWith('https://') ||
      item.videoUrl.startsWith('data:video/')
    )) {
      videoUrls.push({
        url: item.videoUrl,
        alt: item.title || `Video from ${item.kind}`,
        type: item.kind,
        itemId: item.id,
        itemTitle: item.title
      });
    }

    // Handle items with images array containing videos
    if (Array.isArray(item.images)) {
      item.images.forEach((media, index) => {
        // Handle string URLs in images array
        if (typeof media === 'string' && (
          media.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v|3gp|ogv)$/) ||
          media.startsWith('data:video/')
        )) {
          videoUrls.push({
            url: media,
            alt: `${item.title || item.kind} video ${index + 1}`,
            type: item.kind,
            itemId: item.id,
            itemTitle: item.title
          });
        }
        
        // Handle object format in images array (like in moments/needs)
        if (typeof media === 'object' && media?.base64url && (
          media.base64url.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v|3gp|ogv)$/) ||
          media.base64url.startsWith('data:video/') ||
          media.type === 'video'
        )) {
          videoUrls.push({
            url: media.base64url,
            alt: media.name || `${item.title || item.kind} video`,
            type: item.kind,
            itemId: item.id,
            itemTitle: item.title
          });
        }
      });
    }

    // Handle items with attachments array containing videos
    if (Array.isArray(item.attachments)) {
      item.attachments.forEach((attachment, index) => {
        if (typeof attachment === 'object' && attachment?.base64url && (
          attachment.base64url.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v|3gp|ogv)$/) ||
          attachment.base64url.startsWith('data:video/') ||
          attachment.type === 'video'
        )) {
          videoUrls.push({
            url: attachment.base64url,
            alt: attachment.name || `${item.title || item.kind} video ${index + 1}`,
            type: item.kind,
            itemId: item.id,
            itemTitle: item.title
          });
        }
      });
    }
  });

  return videoUrls;
};

// Add this state for videos and media viewer
const [videoUrls, setVideoUrls] = useState([]);
// Replace the existing media viewer state with separate state for FormMediaViewer (for videos only)
const [formMediaViewerOpen, setFormMediaViewerOpen] = useState(false);
const [formMediaViewerUrls, setFormMediaViewerUrls] = useState([]);
const [formMediaViewerInitialIndex, setFormMediaViewerInitialIndex] = useState(0);

// Update only the video click handler to use the new state
const handleVideoClick = (videoIndex) => {
  // Create array of all video URLs for the media viewer
  const allVideoUrls = videoUrls.map(video => video.url);
  setFormMediaViewerUrls(allVideoUrls);
  setFormMediaViewerInitialIndex(videoIndex);
  setFormMediaViewerOpen(true);
};
// Add this useEffect to extract videos when feedItems changes





  // Close share menu on outside click / Esc
  useEffect(() => {
    function onDown(e) {
      if (
        shareButtonRef.current &&
        shareMenuRef.current &&
        !shareButtonRef.current.contains(e.target) &&
        !shareMenuRef.current.contains(e.target)
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

  function upsertMeetingList(newOne) {
    const updated = [newOne, ...meetings].sort((a, b) => new Date(b.isoStart) - new Date(a.isoStart));
    setMeetings(updated);
  }

  // handlers for blocking/reporting
  async function handleBlockUser(note) {
    if (!user) return data._showPopUp("login_prompt");
    await client.post(`/users/${userId}/block`, { note });
    setProfile(p => {
      const next = {
        ...p,
        block: { ...(p?.block || {}), iBlockedThem: true, status: "i_blocked" }
      };
      if (["connected","outgoing_pending","incoming_pending","pending","pending_outgoing","pending_incoming"].includes(p?.connectionStatus)) {
        next.connectionStatus = "none";
      }
      return next;
    });
    toast.success("User blocked");
  }

  async function handleUnblockUser() {
    if (!user) return data._showPopUp("login_prompt");
    await client.delete(`/users/${userId}/block`);
    setProfile(p => {
      const next = {
        ...p,
        block: { ...(p?.block || {}), iBlockedThem: false, status: "none" }
      };
      if (p?.connectionStatus === "blocked") next.connectionStatus = "none";
      return next;
    });
    toast.success("User unblocked");
  }

  async function handleReportUser(description) {
    if (!user) return data._showPopUp("login_prompt");
    await client.post(`/reports`, {
      targetType: "user",
      targetId: userId,
      description,
    });
    toast.success("Report submitted. Thanks for keeping the community safe.");
  }

  async function handleRemoveConnection(note) {
    if (!user) return data._showPopUp("login_prompt");
    try {
      await client.delete(`/connections/${userId}`, { data: { note } });
      setProfile((p) => ({ ...p, connectionStatus: "none" }));
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to remove connection");
    }
  }

  const isUnblock = !!profile?.block?.iBlockedThem;

  // Render function for feed items (same as FeedExplorePage.jsx)
  const renderFeedItem = (item) => {
    // Render by kind while preserving order from API
    if (item.kind === "job") {
      return (
        <JobCard
          type="grid"
          key={`job-${item.id}`}
          matchPercentage={item.matchPercentage}
          job={{
            ...item,
            categoryName: categories.find((c) => String(c.id) === String(item.categoryId))?.name,
            subcategoryName: categories
              .find((c) => String(c.id) === String(item.categoryId))
              ?.subcategories?.find((s) => String(s.id) === String(item.subcategoryId))?.name,
          }}
        />
      );
    }
    if (item.kind === "need") {
      return (
        <NeedCard
          type="grid"
          key={`need-${item.id}`}
          matchPercentage={item.matchPercentage}
          need={{
            ...item,
            categoryName: categories.find((c) => String(c.id) === String(item.categoryId))?.name,
            subcategoryName: categories
              .find((c) => String(c.id) === String(item.categoryId))
              ?.subcategories?.find((s) => String(s.id) === String(item.subcategoryId))?.name,
          }}
        />
      );
    }
    if (item.kind === "service") {
      return <ServiceCard type="grid" key={`service-${item.id}`} item={item} matchPercentage={item.matchPercentage} currentUserId={user?.id} />;
    }
    if (item.kind === "product") {
      return <ProductCard type="grid" key={`product-${item.id}`} item={item} matchPercentage={item.matchPercentage} currentUserId={user?.id} />;
    }
    if (item.kind === "moment") {
      return (
        <MomentCard
          type="grid"
          key={`moment-${item.id}`}
          matchPercentage={item.matchPercentage}
          moment={{
            ...item,
            categoryName: categories.find((c) => String(c.id) === String(item.categoryId))?.name,
            subcategoryName: categories
              .find((c) => String(c.id) === String(item.categoryId))
              ?.subcategories?.find((s) => String(s.id) === String(item.subcategoryId))?.name,
          }}
        />
      );
    }
    if (item.kind === "tourism") {
      return <ExperienceCard type="grid" key={`tourism-${item.id}`} item={item} matchPercentage={item.matchPercentage} currentUserId={user?.id} />;
    }
    if (item.kind === "funding") {
      return <CrowdfundCard type="grid" key={`funding-${item.id}`} item={item} matchPercentage={item.matchPercentage} currentUserId={user?.id} />;
    }
    // default = event
    return <EventCard type="grid" key={`event-${item.id}`} item={item} e={item} matchPercentage={item.matchPercentage} />;
  };

  function renderConnectButton() {
    if (!profile) return null;
    if (profile.connectionStatus === "outgoing_pending") {
      return (
        <button className="col-span-1 rounded-lg px-3 py-2 text-sm font-medium bg-yellow-100 text-yellow-700 cursor-default">
          Pending request
        </button>
      );
    } else if (profile.connectionStatus === "incoming_pending") {
      return (
        <button
          onClick={() => navigate("/notifications")}
          className="col-span-1 items-center flex justify-center rounded-lg px-3 py-2 text-sm font-medium bg-brand-100 text-brand-600 cursor-pointer"
        >
          <ExternalLink size={16} className="mr-1" />
          Respond
        </button>
      );
    } else if (profile.connectionStatus === "connected") {
      return (
        <div className="col-span-1">
          <button
            onClick={() => setOpenConfirmRemoveConnection(true)}
            title="Connected — click to remove"
            aria-label="Connected. Click to remove connection"
            className="group/conn w-full inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold
                       bg-green-100 text-green-700 border border-green-200
                       hover:bg-red-50 hover:text-red-700 hover:border-red-300
                       focus:outline-none focus:ring-2 focus:ring-red-500/30
                       transition-all duration-200"
          >
            <span className="flex items-center gap-1">
              {/* Main icon/label swap */}
              <UserCheck size={14} className="block group-hover/conn:hidden group-focus/conn:hidden" />
              <UserX     size={14} className="hidden group-hover/conn:block group-focus/conn:block" />

              <span className="block group-hover/conn:hidden group-focus/conn:hidden">Connected</span>
              <span className="hidden group-hover/conn:block group-focus/conn:block">Remove</span>

              {/* Affordance: show delete icon BEFORE hover; show 'tap to remove' AFTER hover */}
              <span className="ml-1 inline-flex items-center">
                <Trash2
                  size={12}
                  className="block group-hover/conn:hidden group-focus/conn:hidden text-gray-500"
                  aria-hidden="true"
                />
                <span className="hidden group-hover/conn:inline group-focus/conn:inline text-[10px] leading-none text-gray-500">
                  tap to remove
                </span>
              </span>
            </span>
          </button>
        </div>
      );
    } else {
      return (
        <button
          onClick={openCR}
          className="col-span-1 rounded-lg px-3 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-colors"
        >
          Connect
        </button>
      );
    }
  }

  return (
     <DefaultLayout>
          <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho simples da página (opcional, pode trocar pelo seu Header global) */}
     
      <Header/>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading && <Loading />}
        {fetchError && (
          <FeedErrorRetry
            onRetry={() => {
              setFetchError(false);
              if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
              retryTimeoutRef.current = null;
              fetchProfile();
            }}
            message="Failed to load profile. Please try again."
            buttonText="Try Again"
          />
        )}

        {!loading && !error && profile && (
          <>
            {/* Modern Header Section */}
         
         {/* Modern Header Section */}
<div className="bg-white rounded-xl shadow-sm  mb-6">
  {/* Cover Image or Gradient Background */}
  {profile.coverImage ? (
    <div className="h-32 relative rounded-t-xl overflow-hidden">
      <img
        src={profile.coverImage}
        alt={`${profile.name}'s cover`}
        className="w-full h-full object-cover object-center"
      />
      {/* Gradient overlay for text readability */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
    </div>
  ) : (
    <div className="bg-gradient-to-r rounded-xl from-brand-700 to-brand-500 h-32"></div>
  )}

  {/* Profile Content - Overlay on gradient/cover */}
  <div className="px-6 pb-6 relative">
    <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 gap-4 mb-6">
      {/* Profile Image and Company Logos */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 flex-1">
        <div className="relative">
          {profile.avatarUrl ? (
            <div
              className={`${profile.accountType === "company" ? "h-32 w-32 rounded-md" : "h-32 w-32 rounded-full"} border-4 border-white shadow-lg bg-white flex justify-center items-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity`}
              onClick={() => setMediaViewerOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setMediaViewerOpen(true);
                }
              }}
              aria-label={`View ${profile.name}'s profile picture`}
            >
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full"
                style={{ objectFit: profile.accountType === "company" ? 'contain' : 'cover' }}
              />
            </div>
          ) : (
            <div className={`${profile.accountType === "company" ? "h-32 w-32 rounded-md" : "h-32 w-32 rounded-full"} border-4 border-white shadow-lg bg-brand-50 grid place-items-center overflow-hidden`}>
              <span className="font-semibold text-brand-600 text-xl">
                {getInitials(profile.name)}
              </span>
            </div>
          )}

          {/* Company logos for approved staff members */}
          {profile.companyMemberships && profile.companyMemberships.length > 0 && (
            <div className="absolute -bottom-2 -right-2 flex -space-x-2">
              {[...profile.companyMemberships]
                .sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0))
                .slice(0, 3)
                .map((membership, index) => (
                  membership.company.avatarUrl ? (
                    <img
                      key={membership.companyId}
                      src={membership.company.avatarUrl}
                      alt={membership.company.name}
                      className={`h-7 w-7 rounded-full border-2 border-white shadow-sm object-cover ${
                        membership.isMain ? 'ring-2 ring-brand-400' : ''
                      }`}
                      title={`${membership.company.name} (${membership.role})`}
                    />
                  ) : (
                    <div
                      key={membership.companyId}
                      className={`h-7 w-7 rounded-full border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 ${
                        membership.isMain ? 'ring-2 ring-brand-400' : ''
                      }`}
                      title={`${membership.company.name} (${membership.role})`}
                    >
                      {getInitials(membership.company.name)}
                    </div>
                  )
                ))}
              {profile.companyMemberships.length > 3 && (
                <div className="h-7 w-7 rounded-full border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 z-10">
                  +{profile.companyMemberships.length - 3}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Info - Name on gradient/cover, title on white background */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className={`${profile.accountType === "company" ? "text-3xl" : "text-2xl"} font-bold text-white drop-shadow-lg max-md:text-black`}>
              {profile.name}
            </h1>
            {profile.accountType && (
              <Chip tone={profile.accountType === "company" ? "blue" : "gray"}>
                {profile.accountType === "company" ? "Company" : "Individual"}
              </Chip>
            )}
            {profile.primaryIdentity && <Chip tone="brand">{profile.primaryIdentity}</Chip>}
            {profile.experienceLevel && <Chip tone="gray">{profile.experienceLevel}</Chip>}
          </div>

          {/* Professional Title - On white background after gradient/cover */}
          {profile.accountType === "company" ? (
            <div className="mb-2 px-4 py-2 bg-white rounded-lg shadow-sm border">
              <p className="text-gray-900 text-lg font-semibold mb-2">
                {profile.professionalTitle || (profile.categories && profile.categories.length > 0 ? profile.categories.join(", ") : "Company")}
              </p>
              {profile.categories && profile.categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {profile.categories.map((cat, idx) => (
                    <Chip key={`cat-${idx}`} tone="brand">{cat}</Chip>
                  ))}
                  {profile.subcategories && profile.subcategories.map((subcat, idx) => (
                    <Chip key={`subcat-${idx}`} tone="gray">{subcat}</Chip>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mb-2 px-4 py-2 bg-white rounded-lg shadow-sm border">
              <p className="text-gray-900 text-lg font-semibold">
                {profile.professionalTitle || profile.title || "—"}
              </p>
            </div>
          )}

          {(profile.city || profile.country) && (
            <div className="flex items-center gap-1 text-sm">
              <MapPin size={14} className="" />
              <span>{fmtLoc(profile.city, profile.country)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4 md:mt-0">
        {user?.id!=profile?.id && renderConnectButton()}

      

        {/* Share Button */}
        <div className="relative">
          <button
            ref={shareButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              setShareOpen((s) => !s);
            }}
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg flex items-center gap-2 transition font-medium"
          >
            <Share2 size={16} />
          </button>
          {shareOpen && <ShareMenu profile={profile} shareMenuRef={shareMenuRef} setShareOpen={setShareOpen} />}
        </div>

       {user?.id!=profile?.id && <button
          onClick={() => {
            if (!user) {
              data._showPopUp("login_prompt");
              return;
            }
            navigate(`/messages?userId=${userId}`);
            toast.success("Starting conversation with " + profile.name);
          }}
          className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg flex items-center gap-2 transition font-medium"
        >
          <MessageCircle size={16} />
        </button>
        }
        {/* Request Meeting Button - only show when connected */}
        {(profile?.connectionStatus=="connected" &&  (!profile?.block?.iBlockedThem && !profile?.block?.theyBlockedMe)) && (
          <button
            onClick={openMR}
            className="border border-brand-200 hover:bg-brand-50 text-brand-700 px-4 py-2.5 rounded-lg flex items-center gap-2 transition font-medium"
          >
            <CalendarDays size={16} />
          </button>
        )}
      </div>
    </div>
  </div>
</div>

          
            {profile.about && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
          <div className="space-y-6 text-gray-600 text-sm leading-relaxed">
            <p>{profile.about}</p>

            {/* Integrated Professional Summary */}
            <div className="border-t border-gray-100 pt-6">
              {/* What you do - smoothly integrated near professional info */}
              {profile.professionalTitle && (
                <div className="mb-4">
                  <p className="text-gray-900 font-semibold mb-2 flex items-center gap-2">
                    <span className="text-blue-600">→</span>
                    {profile.accountType === "company" ? "What we do" : "What I do"}
                  </p>
                  <p className="text-gray-700">{profile.professionalTitle}</p>
                </div>
              )}

              {/* Looking For - smoothly integrated */}
              {Array.isArray(profile.lookingFor) && profile.lookingFor.length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-900 font-semibold mb-2 flex items-center gap-2">
                    <span className="text-blue-600">🔍</span>
                    Looking for
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.lookingFor.map((item, i) => (
                      <span key={`looking-${i}`} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Identities - only show if they exist and are different from looking for */}
              {Array.isArray(profile.identities) && profile.identities.length > 0 &&
               (!Array.isArray(profile.lookingFor) || !profile.lookingFor.some(lf => profile.identities.includes(lf))) && (
                <div className="mb-4">
                  <p className="text-gray-900 font-semibold mb-2 flex items-center gap-2">
                    <span className="text-purple-600">✦</span>
                    {profile.accountType === "company" ? "Company focuses" : "Focus areas"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.identities.map((identity, i) => (
                      <span key={`identity-${i}`} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">
                        {identity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Interests - smoothly integrated */}
              {profile.interests?.categories && profile.interests.categories.length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-900 font-semibold mb-2 flex items-center gap-2">
                    <span className="text-green-600">★</span>
                    Interested in
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.categories.map((cat, i) => (
                      <span key={`cat-int-${i}`} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Subcategory Interests */}
              {profile.interests?.subcategories && profile.interests.subcategories.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.subcategories.map((sub, i) => (
                      <span key={`sub-int-${i}`} className="bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Expertise & Interests - smoothly integrated */}
              {(profile.cats?.length || profile.subs?.length) && (
                <div className="mb-4">
                  <p className="text-gray-900 font-semibold mb-2 flex items-center gap-2">
                    <span className="text-indigo-600">◆</span>
                    Expertise & interests
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(profile.cats || []).map((c) => (
                      <span key={`cat-${c}`} className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-sm">
                        {c}
                      </span>
                    ))}
                    {(profile.subs || []).map((s) => (
                      <span key={`sub-${s}`} className="bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Specialties */}
              {Array.isArray(profile.subsubs) && profile.subsubs.length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-900 font-semibold mb-2 flex items-center gap-2">
                    <span className="text-amber-600">◈</span>
                    Specialties
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(profile.subsubs)].map((s3, i) => (
                        <span key={`s3-${i}`} className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm">
                          {s3}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* For companies, show skills as "Expertise" */}
              {profile.accountType === "company" && profile.skills && profile.skills.length > 0 && (
                <div>
                  <p className="text-gray-900 font-semibold mb-2 flex items-center gap-2">
                    <span className="text-emerald-600">●</span>
                    Company expertise
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, idx) => (
                      <span key={`skill-${idx}`} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      
            {/* Contact - Modern Card Design */}
            {(profile.email || profile.website || (Array.isArray(profile.links) && profile.links.length)) && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-3">
                  {profile.email && (
                    <div className="flex items-center gap-3 text-gray-600 text-sm">
                      <Mail size={16} className="text-gray-400" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-3 text-gray-600 text-sm">
                      <Globe size={16} className="text-gray-400" />
                      <a href={profile.website} target="_blank" rel="noreferrer" className="text-brand-700 hover:text-brand-800">
                        {profile.website}
                      </a>
                    </div>
                  )}
                  {Array.isArray(profile.links) &&
                    profile.links.map((l, i) => (
                      <div key={i} className="flex items-center gap-3 text-gray-600 text-sm">
                        <ExternalLink size={16} className="text-gray-400" />
                        <a href={l} target="_blank" rel="noreferrer" className="text-brand-700 hover:text-brand-800 truncate">
                          {l}
                        </a>
                      </div>
                    ))}
                </div>
              </div>
            )}


            
            {/* Skills & Languages - Modern Card Design */}
            {(Array.isArray(profile.skills) && profile.skills.length > 0) || languages.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Skills */}
                  {Array.isArray(profile.skills) && profile.skills.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Hash size={18} className="text-brand-600" />
                        Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((s, i) => (
                          <span key={`${s}-${i}`} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {languages.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Languages size={18} className="text-brand-600" />
                        {profile.accountType === "company" ? "Working Languages" : "Languages"}
                      </h3>
                      <div className="space-y-2">
                        {languages.map((l, i) => (
                          <div key={`${l.name}-${i}`} className="flex justify-between items-center">
                            <span className="text-gray-700 text-sm">{l.name}</span>
                            <span className="text-gray-500 text-xs">{l.level}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}



            {/* Work Samples - Enhanced Modern Card Design */}
            {Array.isArray(profile.workSamples) && profile.workSamples.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Work Samples</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {profile.workSamples.map(ws => (
                    <div key={ws.id} className="group border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-brand-200 transition-all duration-200">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-gray-900 text-base group-hover:text-brand-700 transition-colors">
                            {ws.title}
                          </h3>
                          <div className="mt-2 text-xs text-gray-500">
                            {ws.completionDate ? new Date(ws.completionDate).toLocaleDateString() : null}
                            {ws.createdAt ? ` • added ${timeAgo(ws.createdAt)}` : null}
                          </div>
                        </div>
                      </div>

                      {/* Category */}
                      {ws.category && (
                        <div className="mb-3">
                          <span className="inline-flex items-center bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-sm font-medium">
                            {ws.category}
                          </span>
                        </div>
                      )}

                      {/* Technologies */}
                      {Array.isArray(ws.technologies) && ws.technologies.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {ws.technologies.slice(0, 8).map((t, i) => (
                              <span key={`${ws.id}-tech-${i}`} className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium">
                                {t}
                              </span>
                            ))}
                            {ws.technologies.length > 8 && (
                              <span className="text-xs text-gray-500 px-2.5 py-1">
                                +{ws.technologies.length - 8} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {ws.description && (
                        <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
                          {ws.description}
                        </p>
                      )}

                      {/* Attachments */}
                      {Array.isArray(ws.attachments) && ws.attachments.length > 0 && (
                        <div className="mb-4 space-y-4">
                          {/* Image attachments grid */}
                          {ws.attachments.filter(a => a?.isImage).length > 0 && (
                            <div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {ws.attachments
                                  .filter(a => a?.isImage)
                                  .slice(0, 6)
                                  .map((a, idx) => {
                                    const src = a.base64url || a.url;
                                    if (!src) return null;
                                    return (
                                      <a
                                        key={`${ws.id}-img-${idx}`}
                                        href={src}
                                        target="_blank"
                                        rel="noreferrer"
                                        title={a.name || "Image"}
                                        className="block group/image"
                                      >
                                        <div className="aspect-video rounded-lg border-2 border-gray-200 group-hover/image:border-brand-300 transition-colors overflow-hidden">
                                          <img
                                            src={src}
                                            alt={a.name || ws.title}
                                            className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-200"
                                            loading="lazy"
                                          />
                                        </div>
                                      </a>
                                    );
                                  })}
                              </div>
                              {ws.attachments.filter(a => a?.isImage).length > 6 && (
                                <p className="text-xs text-gray-500 mt-2">
                                  +{ws.attachments.filter(a => a?.isImage).length - 6} more images
                                </p>
                              )}
                            </div>
                          )}

                          {/* Document attachments */}
                          {ws.attachments.filter(a => !a?.isImage).length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-700">Documents</h4>
                              <div className="space-y-2">
                                {ws.attachments
                                  .filter(a => !a?.isImage)
                                  .slice(0, 4)
                                  .map((a, idx) => {
                                    const href = a.base64url || a.url || "#";
                                    const filename = a.name || "document";
                                    return (
                                      <a
                                        key={`${ws.id}-doc-${idx}`}
                                        href={href}
                                        target="_blank"
                                        rel="noreferrer"
                                        download={filename}
                                        className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors group/doc"
                                        title={filename}
                                      >
                                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                          <ExternalLink size={14} className="text-gray-500 group-hover/doc:text-brand-600" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 group-hover/doc:text-brand-700 truncate flex-1">
                                          {filename}
                                        </span>
                                      </a>
                                    );
                                  })}
                                {ws.attachments.filter(a => !a?.isImage).length > 4 && (
                                  <p className="text-xs text-gray-500 ml-11">
                                    +{ws.attachments.filter(a => !a?.isImage).length - 4} more documents
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Project Link */}
                      {ws.projectUrl && (
                        <div className="pt-3 border-t border-gray-100">
                          <a
                            href={ws.projectUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                          >
                            <ExternalLink size={16} />
                            View Project
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* CV/Resume Section - Modern Card Design */}
            {Array.isArray(profile.cvBase64) && profile.cvBase64.length > 0 && (0!==0) && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CV/Resume
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.cvBase64.map((cv, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 bg-red-600 text-white flex items-center justify-center rounded font-bold text-sm">
                            PDF
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {cv.title || cv.original_filename}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {Math.round((cv.base64.length * 3) / 4 / 1024)} KB • Uploaded {new Date(cv.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <a
                          href={cv.base64}
                          download={cv.original_filename}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm"
                          title="Download CV"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posts and activities - Modern Card Design */}
            {userFeedItems.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="md:flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 max-md:mb-4">
                    <Activity size={20} className="text-brand-600" />
                     Posts and activities
                  </h2>

                  {/* Tab Buttons */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab('posts')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'posts'
                          ? 'bg-white text-brand-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Posts ({userFeedItems.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('images')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'images'
                          ? 'bg-white text-brand-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Images {(galleryImages.length + validImages.length) > 0 && `(${galleryImages.length + validImages.length})`}
                    </button>
                    <button
                      onClick={() => setActiveTab('videos')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'videos'
                          ? 'bg-white text-brand-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Videos ({videoUrls.length})
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {loadingFeed ? (
                    <div className="text-sm text-gray-600">Loading content...</div>
                  ) : (
                    <>
                      {/* Posts Tab */}
                      {activeTab === 'posts' && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {showAllPosts
                              ? feedItems.map(renderFeedItem)
                              : userFeedItems.slice(0, 4).map(renderFeedItem)
                            }
                          </div>

                          {userFeedItems.length > 4 && (
                            <div className="flex justify-center pt-2">
                              <button
                                onClick={() => setShowAllPosts(!showAllPosts)}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors duration-200"
                              >
                                <span>
                                  {showAllPosts
                                    ? `View Less`
                                    : `View All ${feedItems.length} posts`
                                  }
                                </span>
                                <ExternalLink size={16} className={`transition-transform duration-200 ${showAllPosts ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {/* Images Tab */}
                      {activeTab === 'images' && (
                        <>
                          {loadingGallery ? (
                            <div className="text-sm text-gray-600">Loading gallery...</div>
                          ) : (
                            <>
                              {/* Gallery Images Section */}
                              {galleryImages.length > 0 && (
                                <div className="mb-6">
                                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <span className="text-brand-600">📸</span>
                                    Gallery ({galleryImages.length})
                                  </h4>
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {galleryImages.map((image, index) => (
                                      <div
                                        key={`gallery-${image.id}`}
                                        className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                                        onClick={() => {
                                          // Combine gallery images with feed images for the slider
                                          const allImages = [...galleryImages.map(img => ({
                                            url: img.imageUrl,
                                            alt: img.title || 'Gallery image',
                                            type: 'gallery',
                                            itemId: img.id,
                                            itemTitle: img.title || 'Gallery image'
                                          })), ...validImages];
                                          const galleryIndex = index;
                                          openImageSlider(galleryIndex);
                                        }}
                                      >
                                        <img
                                          src={image.imageUrl}
                                          alt={image.title || 'Gallery image'}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                          loading="lazy"
                                        />
                                        {/* Overlay with title on hover */}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-end p-3">
                                          <div className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="font-medium">Gallery</div>
                                            <div className="truncate">{image.title || 'Gallery image'}</div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Feed Images Section */}
                              {validImages.length > 0 && (
                                <div className="mb-6">
                                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <span className="text-brand-600">📱</span>
                                    From Posts ({validImages.length})
                                  </h4>
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {validImages.map((image, index) => (
                                      <div
                                        key={`${image.itemId}-${index}`}
                                        className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                                        onClick={() => {
                                          // Combine gallery images with feed images for the slider
                                          const allImages = [...galleryImages.map(img => ({
                                            url: img.imageUrl,
                                            alt: img.title || 'Gallery image',
                                            type: 'gallery',
                                            itemId: img.id,
                                            itemTitle: img.title || 'Gallery image'
                                          })), ...validImages];
                                          const feedImageIndex = galleryImages.length + index;
                                          openImageSlider(feedImageIndex);
                                        }}
                                      >
                                        <img
                                          src={image.url}
                                          alt={image.alt}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                          loading="lazy"
                                        />
                                        {/* Overlay with item type and title on hover */}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-end p-3">
                                          <div className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="font-medium capitalize">{image.type}</div>
                                            <div className="truncate">{image.itemTitle}</div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* No images message */}
                              {galleryImages.length === 0 && validImages.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                  <div className="text-sm">No images found</div>
                                  <div className="text-xs mt-1">Images from posts and gallery will appear here</div>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}

                      {/* Videos Tab */}
                    
{activeTab === 'videos' && (
  <>
    {loadingFeed ? (
      <div className="text-sm text-gray-600">Loading videos...</div>
    ) : (
      <>
        {videoUrls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videoUrls.map((video, index) => (
              <div
                key={`${video.itemId}-${index}`}
                className="group relative aspect-video rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer bg-black"
                onClick={() => handleVideoClick(index)}
              >
                {/* Video thumbnail with play button */}
                <div className="relative w-full h-full">
                  <video
                    src={video.url}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                    preload="metadata"
                  />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center group-hover:bg-opacity-100 transition-all">
                      <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Video info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                    <div className="text-white text-xs">
                      <div className="font-medium capitalize truncate">{video.type}</div>
                      <div className="truncate opacity-90">{video.itemTitle || 'Video'}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Video size={48} className="mx-auto mb-3 text-gray-300" />
            <div className="text-sm">No videos found</div>
            <div className="text-xs mt-1">Videos from posts will appear here</div>
          </div>
        )}
      </>
    )}
  </>
)}


                    </>
                  )}
                </div>
              </div>
            )}


            {/* Overview - Modern Card Design */}
            {(profile.stats || profile.counts || profile.connections?.count || profile.requests?.incoming?.length || profile.requests?.outgoing?.length) && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star size={20} className="text-brand-600" />
                  Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {(() => {
                    const parts = [];
                    const counts = profile.counts || {};
                    const add = (label, value) => {
                      if (typeof value === "number") {
                        parts.push(
                          <div key={label} className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="font-bold text-brand-600 text-lg">{value}</p>
                            <p className="text-gray-500 text-xs">{label}</p>
                          </div>
                        );
                      }
                    };
                    add("Jobs", counts.jobs ?? profile.recent?.jobs?.length);
                    add("Events", counts.events ?? profile.recent?.events?.length);
                    add("Funding", counts.funding ?? profile.recent?.funding?.length);
                    add("Services", counts.services ?? profile.recent?.services?.length);
                    add("Products", counts.products ?? profile.recent?.products?.length);
                    add("Tourism posts", counts.tourism ?? profile.recent?.tourism?.length);
                    add("Connections", profile.connections?.count);
                    add("Incoming requests", profile.requests?.incoming?.length);
                    add("Outgoing requests", profile.requests?.outgoing?.length);
                    return parts;
                  })()}
                </div>
              </div>
            )}

           

           

          
          
          {/* Meetings - Modern Card Design */}
<div className={`bg-white rounded-xl shadow-sm p-6 mb-6 ${user?.id==profile?.id ? 'hidden':''}`}> 
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
      <CalendarDays size={20} className="text-brand-600" />
      Meetings
    </h2>
    {(profile?.connectionStatus=="connected" && (!profile?.block?.iBlockedThem && !profile?.block?.theyBlockedMe)) && (
      <button
        onClick={openMR}
        className="inline-flex items-center gap-2 px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm"
      >
        <CalendarDays size={16} />
        Request Meeting
      </button>
    )}
  </div>

  {meetings.length > 0 ? (
    <div className="space-y-3">
      {meetings.map((m) => {
        const joinable = true; // m.mode === "video" && isJoinWindow(m.isoStart, m.duration);
        const now = Date.now();
        let start, end, status;
        try {
          const startDate = new Date(m.isoStart);
          if (!isNaN(startDate.getTime())) {
            start = startDate.getTime();
            const endTimeStr = addMinutes(m.isoStart, Number(m.duration) || 30);
            end = endTimeStr ? new Date(endTimeStr).getTime() : start + (Number(m.duration) || 30) * 60 * 1000;
            status = now < start ? "Upcoming" : now > end ? "Ended" : "Ongoing";
          } else {
            status = "Upcoming";
          }
        } catch {
          status = "Upcoming";
        }
        
        // Check if current user is involved in this meeting
        const isUserInvolved = m.participants?.some(p => p.id === user?.id) || 
                              m.from?.id === user?.id || 
                              m.to?.id === user?.id;
        
        return (
          <div key={m.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="font-semibold text-sm text-gray-900 truncate">{m.title || "Untitled meeting"}</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    status === "Upcoming" ? "bg-blue-100 text-blue-700"
                    : status === "Ongoing" ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"}`}>
                    {status}
                  </span>
                  {!isUserInvolved && (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                      Observer
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  {humanWhen(m.isoStart, m.timezone, m.duration)} • {m.mode === "video" ? "Online" : "In person"}
                </div>
                
                {/* Meeting organizer and recipient */}
                <div className="flex items-center gap-4 mb-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <span>Organized by:</span>
                    <button
                      onClick={() => navigate(`/profile/${m.from?.id}`)}
                      className="text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                    >
                      {m.from?.avatarUrl ? (
                        <img 
                          src={m.from.avatarUrl} 
                          alt={m.from.name}
                          className="w-4 h-4 rounded-full"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                          {getInitials(m.from?.name)}
                        </div>
                      )}
                      {m.from?.name}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>For:</span>
                    <button
                      onClick={() => navigate(`/profile/${m.to?.id}`)}
                      className="text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                    >
                      {m.to?.avatarUrl ? (
                        <img 
                          src={m.to.avatarUrl} 
                          alt={m.to.name}
                          className="w-4 h-4 rounded-full"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                          {getInitials(m.to?.name)}
                        </div>
                      )}
                      {m.to?.name}
                    </button>
                  </div>
                </div>

                {m.mode === "in_person" && m.location ? (
                  <div className="text-xs text-gray-500 mb-2">📍 {m.location}</div>
                ) : null}
                {m.mode === "video" && m.link ? (
                  <div className="text-xs text-gray-500 mb-2 truncate">🔗 {m.link}</div>
                ) : null}
                {m.agenda ? (
                  <div className="text-xs text-gray-500 mb-2">📝 {m.agenda}</div>
                ) : null}
                
                {/* Participants Section */}
                <div className="mt-3">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {m.participants && m.participants.map((participant, index) => (
                        <button
                          key={participant.id}
                          onClick={() => navigate(`/profile/${participant.id}`)}
                          className="transition-transform hover:scale-110 hover:z-10"
                          title={participant.name}
                        >
                          {participant?.avatarUrl ? (
                            <img 
                              src={participant.avatarUrl} 
                              alt={participant.name}
                              className="h-6 w-6 rounded-full border-2 border-white"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                              {getInitials(participant.name)}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {m.participants?.length || 0} participant{m.participants?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {/* Participant names (visible on larger screens) */}
                  <div className="hidden sm:block mt-2">
                    <div className="flex flex-wrap gap-1 text-xs text-gray-600">
                      {m.participants && m.participants.map((participant, index) => (
                        <button
                          key={participant.id}
                          onClick={() => navigate(`/profile/${participant.id}`)}
                          className="text-brand-600 hover:text-brand-700 transition-colors"
                        >
                          {participant.name}{index < m.participants.length - 1 ? ',' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {m.mode === "video" ? (
                  <a href={m.link || "#"} target="_blank" rel="noreferrer"
                    title={joinable ? "Open call link" : `Join opens 10 min before start`}
                    className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium ${
                      joinable ? "bg-brand-500 text-white hover:bg-brand-600" : "bg-gray-100 text-gray-500 cursor-not-allowed"}`}
                    onClick={(e) => { if (!joinable) e.preventDefault(); }}>
                    Join
                  </a>
                ) : m.location ? (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.location)}`}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium bg-brand-50 text-brand-700 hover:bg-brand-100">
                    Open Map
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    <div className="text-center py-4">
      <p className="text-sm text-gray-600 mb-3">No meetings yet.</p>
      {profile.connectionStatus === "connected" && <button
        onClick={openMR}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors text-sm"
      >
        <CalendarDays size={16} />
        Request Meeting
      </button>}
    </div>
  )}
</div>


            {/* Footer Actions - Modern Card Design */}
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              {/* Member Since */}
              <div className="text-xs text-gray-500 mb-4">
                Member since {new Date(profile.memberSince).toLocaleDateString()} • {timeAgo(profile.memberSince)}
              </div>

              {/* Block/Report section */}
              <div className="flex items-center gap-3 mb-4">
                {user && <button
                  onClick={() => (isUnblock ? handleUnblockUser() : setOpenConfirmBlock(true))}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all
                    ${isUnblock
                      ? "border border-red-300 text-red-700 bg-red-50 hover:bg-red-100"
                      : "border border-gray-300 text-gray-700 bg-white hover:border-red-300 hover:text-red-700 hover:bg-red-50"}`}
                  aria-label={isUnblock ? "Unblock user" : "Block user"}
                  title={isUnblock ? "Unblock user" : "Block user"}
                >
                  <ShieldBan size={16} />
                  <span>{isUnblock ? "Unblock user" : "Block user"}</span>
                </button>}

                <button
                  onClick={() => setOpenConfirmReport(true)}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 bg-white hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50 transition-all"
                  aria-label="Report user"
                  title="Report user"
                >
                  <Flag size={16}/>
                  <span>Report user</span>
                </button>
              </div>

              {/* Action Buttons */}
             
            </div>
          </>
        )}
      </div>

      {/* Modais */}
      <ConnectionRequestModal
        open={crOpen}
        onClose={() => setCrOpen(false)}
        toUserId={userId}
        toName={profile?.name}
        onSent={() => {
          setProfile({ ...profile, connectionStatus: "outgoing_pending" });
        }}
      />

      <MeetingRequestModal
        open={mrOpen}
        onClose={() => setMrOpen(false)}
        toUserId={userId}
        toName={profile?.name}
        onCreated={(m) => {
          upsertMeetingList(m); // add to local list for immediate render
        }}
      />

      <ConfirmDialog
        open={openConfirmRemoveConnection}
        onClose={() => setOpenConfirmRemoveConnection(false)}
        title="Remove this connection?"
        text="This action will remove the connection. You can send a new request later."
        confirmText="Remove"
        cancelText="Cancel"
        tone="danger"
        withInput={true}
        inputLabel="Optional reason"
        inputPlaceholder="Why are you removing this connection?"
        inputType="textarea"
        requireValue={false}
        onConfirm={handleRemoveConnection}
        onResult={(r) => {
         toast.success("Connection removed");
        }}
      />

      {/* Block dialog */}
      <ConfirmDialog
        open={openConfirmBlock}
        onClose={() => setOpenConfirmBlock(false)}
        title="Block this user?"
        text="They won't be able to message or connect with you. Any connection and pending requests will be removed."
        confirmText="Block"
        cancelText="Cancel"
        tone="danger"
        withInput={true}
        inputLabel="Optional note"
        inputPlaceholder="Why are you blocking this user?"
        inputType="textarea"
        requireValue={false}
        onConfirm={handleBlockUser}
      />

      {/* Report dialog */}
      <ConfirmDialog
        open={openConfirmReport}
        onClose={() => setOpenConfirmReport(false)}
        title="Report this user?"
        text="Tell us what's going on. Our team will review."
        confirmText="Submit report"
        cancelText="Cancel"
        tone="default"
        withInput={true}
        inputLabel="Report details"
        inputPlaceholder="Describe the issue (spam, harassment, impersonation, etc.)"
        inputType="textarea"
        requireValue={true}
        onConfirm={handleReportUser}
      />

      <MediaViewer
        isOpen={mediaViewerOpen}
        onClose={() => setMediaViewerOpen(false)}
        mediaUrl={profile?.avatarUrl}
        mediaType="image"
        alt={`${profile?.name}'s profile picture`}
      />

      {formMediaViewerOpen && formMediaViewerUrls.length > 0 && (
        <FormMediaViewer
          urls={formMediaViewerUrls}
          initialIndex={formMediaViewerInitialIndex}
          onClose={() => {
            setFormMediaViewerOpen(false);
            setFormMediaViewerUrls([]);
            setFormMediaViewerInitialIndex(0);
          }}
        />
      )}

      {/* Image Slider Modal */}
      {imageSliderOpen && allImages.length > 0 && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black bg-opacity-90">
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
            {/* Close button */}
            <button
              onClick={closeImageSlider}
              className="absolute top-4 right-4 z-20 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2"
              aria-label="Close image slider"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Main image */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <img
                src={allImages[currentImageIndex].url}
                alt={allImages[currentImageIndex].alt}
                className="w-full h-full object-contain"
              />

              {/* Image info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <div className="text-white">
                  <div className="text-sm font-medium capitalize">
                    {allImages[currentImageIndex].type}
                  </div>
                  <div className="text-sm opacity-90 truncate">
                    {allImages[currentImageIndex].itemTitle}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={goToPrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={goToNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-2"
                  aria-label="Next image"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white text-sm bg-black bg-opacity-70 px-3 py-1 rounded-full">
              {currentImageIndex + 1} of {allImages.length}
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex gap-2 max-w-2xl overflow-x-auto">
                {allImages.map((image, index) => (
                  <button
                    key={`${image.itemId}-${index}`}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-12 rounded border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-white opacity-100'
                        : 'border-gray-400 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover rounded"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
      </DefaultLayout>
   );
  }

