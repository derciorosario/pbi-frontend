// src/pages/PeopleCards.jsx
import React, { useMemo, useState } from "react";
import I from "../lib/icons.jsx";
import ProfileModal from "../components/ProfileModal.jsx";
import ConnectionRequestModal from "../components/ConnectionRequestModal.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useData } from "../contexts/DataContext.jsx";
import { useNavigate } from "react-router-dom";
import { ExternalLink, MapPin, Clock, Eye, UserX, UserCheck, Trash2, CalendarDays, MessageCircle, Link2, Building2 } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import client from "../api/client";
import { toast } from "../lib/toast.js";

// Import MeetingRequestModal from ProfileModal.jsx
const MeetingRequestModal = ({ open, onClose, toUserId, toName, onCreated }) => {
  
  const defaultTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [form, setForm] = useState({
    date: "",
    time: "",
    duration: "30",
    mode: "video", // 'video' | 'in_person'
    location: "",
    link: "",
    title: `Meeting with ${toName ?? "User"}`,
    agenda: "",
    timezone: defaultTz,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (!open) return;
    setErrors({});
    setSubmitting(false);
  }, [open]);

  function validate() {
    const e = {};
    if (!form.date) e.date = "Pick a date";
    if (!form.time) e.time = "Pick a time";
    if (!form.title.trim()) e.title = "Add a title";
    return e;
  }

  function handleChange(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const eMap = validate();
    setErrors(eMap);
    if (Object.keys(eMap).length) return;

    const isoStart = new Date(`${form.date}T${form.time}:00`).toISOString();

    // Create meeting request via API
    setSubmitting(true);
    try {
      const payload = {
        toUserId,
        title: form.title,
        agenda: form.agenda,
        scheduledAt: isoStart,
        duration: parseInt(form.duration),
        timezone: form.timezone,
        mode: form.mode,
        location: form.mode === "in_person" ? form.location : null,
        link: form.mode === "video" ? form.link : null
      };

      const { data } = await client.post("/meeting-requests", payload);
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
      {/* Responsive container: header + scrollable body + sticky footer */}
      <div className="w-[92vw] sm:w-full sm:max-w-lg max-h-[80vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-brand-500 px-4 py-3">
          <div className="text-white font-medium">Request Meeting</div>
          <button onClick={onClose} className="text-white/90 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body (scrollable) */}
        <form id="meetingForm" onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g., Intro call about collaboration"
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                value={form.date}
                onChange={(e) => handleChange("date", e.target.value)}
              />
              {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                value={form.time}
                onChange={(e) => handleChange("time", e.target.value)}
              />
              {errors.time && <p className="text-xs text-red-600 mt-1">{errors.time}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                value={form.duration}
                onChange={(e) => handleChange("duration", e.target.value)}
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Timezone</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                value={form.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Meeting mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleChange("mode", "video")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  form.mode === "video" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
                  <path d="m16 2 4 4" />
                  <path d="M21 2v8" />
                </svg>
                Video call
              </button>
              <button
                type="button"
                onClick={() => handleChange("mode", "in_person")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  form.mode === "in_person" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                In person
              </button>
            </div>
          </div>

          {form.mode === "video" ? (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Call link</label>
              <div className="flex items-center gap-2">
                <div className="rounded-lg border border-gray-300 px-3 py-2 flex-1 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <input
                    type="url"
                    className="w-full text-sm focus:outline-none"
                    placeholder="https://meet.google.com/abc-defg-hij"
                    value={form.link}
                    onChange={(e) => handleChange("link", e.target.value)}
                  />
                </div>
              </div>
              {errors.link && <p className="text-xs text-red-600 mt-1">{errors.link}</p>}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                placeholder="e.g., Avenida Julius Nyerere 123, Maputo"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
              />
              {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
            </div>
          )}

          {form.date && form.time && (
            <div className="rounded-lg border bg-gray-50 px-3 py-2 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
                <span>
                  {new Date(`${form.date}T${form.time}:00`).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  ({form.timezone}) • {form.duration} min • {form.mode === "video" ? "Video call" : "In person"}
                </span>
              </div>
            </div>
          )}
        </form>

        {/* Sticky footer */}
        <div className="p-4 border-t flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:border-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="meetingForm"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            {submitting ? "Creating…" : "Create request"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* --- Small reusable subcomponents --- */
const Pill = ({ children, className = "" }) => (
  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${className}`}>
    {children}
  </span>
);

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0).toUpperCase() || "";
  const second = parts[1]?.charAt(0).toUpperCase() || "";
  return first + second;
}

function computeTimeAgo(explicit, createdAt) {
  if (explicit) return explicit;
  if (!createdAt) return "";
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

/* --- Main Card --- */
export default function PeopleProfileCard({
  id,
  avatarUrl,
  name,
  role,
  city,
  countryOfResidence,
  email,
  about,
  lookingFor,
  goals = [],
  cats = [],
  onConnect,
  onMessage,
  connectionStatus: initialStatus,
  createdAt,
  timeAgo,               // optional precomputed
  matchPercentage = 0,  // optional % chip (overlay on image when list; chip near hero in grid)
  type = "grid",         // "grid" | "list"
  accountType = "individual", // "individual" | "company"
  companyMemberships = [], // company membership data
}) {
  const { user } = useAuth();
  const data = useData();
  const navigate = useNavigate();

  const [openId, setOpenId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(initialStatus || "none");
  const [isHovered, setIsHovered] = useState(false);
  const [openConfirmRemove, setOpenConfirmRemove] = useState(false);

  async function removeConnectionApi(note) {
    // `note` comes from ConfirmDialog (when withInput=true)
    await client.delete(`/connections/${id}`, { data: { note } });
    setConnectionStatus("none");
    toast.success("Connection removed");
  }

  const isList = type === "list";
  const location = [city, countryOfResidence].filter(Boolean).join(", ");
  const computedTime = useMemo(() => computeTimeAgo(timeAgo, createdAt), [timeAgo, createdAt]);

  const allTags = useMemo(() => {
    const set = new Set([...goals, ...cats].filter(Boolean).map(String));
    return [...set];
  }, [goals, cats]);
  const visibleTags = allTags.slice(0, 1);
  const extraCount = Math.max(0, allTags.length - visibleTags.length);

  const MAX_CHARS = 200;
  const isLong = !!about && about.length > MAX_CHARS;
  const displayedAbout = !about ? "" : isLong ? `${about.slice(0, MAX_CHARS)}...` : about;

  function onSent() {
    setConnectionStatus("pending_outgoing");
    onConnect?.();
  }

  const isCompany = accountType === "company";
  
  const containerBase =
    `group relative rounded-2xl border-2 ${isCompany ? 'border-gray-100 shadow-sm' : 'border-gray-100'} ${isCompany ? 'bg-white' : 'bg-white'}  overflow-hidden transition-all duration-300 ease-out`;
  const containerLayout = isList
    ? "flex"
    : "flex flex-col";

  return (
    <div
      className={`${containerBase} ${containerLayout} ${!isList && isHovered ? "transform -translate-y-2" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ProfileModal
        userId={openId}
        isOpen={!!openId}
        onClose={() => setOpenId(null)}
        onSent={onSent}
      />

      {/* MEDIA: left column ONLY when list; otherwise top hero in grid */}
      {isList ? (
        <div className="relative overflow-hidden">
          
              <div className="p-5 pr-0">
                  {avatarUrl ? (
                  <div
                    className={`flex bg-brand-300 items-center justify-center w-24 h-24 shadow-xl ${isCompany ? 'border-4 border-white rounded-2xl' : 'border-4 border-white rounded-2xl'} overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-200`}
                    onClick={() => {
                      navigate(`/profile/${id}`)
                    }}
                    title={`View ${name}'s profile`}
                  >
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="w-full h-full"
                      style={{ objectFit: isCompany ? 'contain' : 'cover' }}
                    />
                  </div>
                ) : (
                  <div
                    className={`w-24 h-24 rounded-2xl shadow-xl ${isCompany ? 'border-4 border-white bg-gradient-to-br from-blue-100 to-blue-200' : 'border-4 border-white bg-gradient-to-br from-brand-100 to-brand-200'} flex items-center justify-center cursor-pointer hover:shadow-2xl transition-all duration-200`}
                    onClick={() => {
                      navigate(`/profile/${id}`)
                    }}
                    title={`View ${name}'s profile`}
                  >
                    <span className={`${isCompany ? 'text-blue-700' : 'text-brand-700'} font-bold text-3xl`}>
                      {getInitials(name)}
                    </span>
                  </div>
                )}
              </div>

         
        </div>
      ) : 
      (
        /* Header Section - Bold banner design with company/profile showcase */
        <div className="relative w-full overflow-hidden">
          {/* Company/Brand Banner Background */}
          <div className={`h-32 ${isCompany ? 'bg-gradient-to-br from-blue-500 via-blue-400 to-blue-300' : 'bg-gradient-to-br from-brand-500 via-brand-300 to-brand-100'} relative`}>
            {/* Decorative pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)`,
                color: 'white'
              }} />
            </div>
            
            {/* Match percentage badge - top right */}
            {(matchPercentage != 0) && (
              <div className="absolute top-3 right-3">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm border-2 ${
                  matchPercentage >= 80 
                    ? 'bg-white/95 text-green-700 border-green-400' 
                    : matchPercentage >= 60 
                    ? 'bg-white/95 text-brand-700 border-brand-400'
                    : 'bg-white/95 text-gray-700 border-gray-300'
                }`}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {matchPercentage}%
                </div>
              </div>
            )}
          </div>

          {/* Profile Content - Overlapping the banner */}
          <div className="relative px-5 pb-5 bg-white">
            {/* Avatar positioned to overlap banner more */}
            <div className="flex items-start gap-4 -mt-16">
              <div className="relative flex-shrink-0 -translate-y-4">
                {avatarUrl ? (
                  <div
                    className={`flex bg-white items-center justify-center w-24 h-24 shadow-xl ${isCompany ? 'border-4 border-white rounded-2xl' : 'border-4 border-white rounded-2xl'} overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-200`}
                    onClick={() => {
                      navigate(`/profile/${id}`)
                    }}
                    title={`View ${name}'s profile`}
                  >
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="w-full h-full"
                      style={{ objectFit: isCompany ? 'contain' : 'cover' }}
                    />
                  </div>
                ) : (
                  <div
                    className={`w-24 h-24 rounded-2xl shadow-xl ${isCompany ? 'border-4 border-white bg-gradient-to-br from-blue-100 to-blue-200' : 'border-4 border-white bg-gradient-to-br from-brand-100 to-brand-200'} flex items-center justify-center cursor-pointer hover:shadow-2xl transition-all duration-200`}
                    onClick={() => {
                      navigate(`/profile/${id}`)
                    }}
                    title={`View ${name}'s profile`}
                  >
                    <span className={`${isCompany ? 'text-blue-700' : 'text-brand-700'} font-bold text-3xl`}>
                      {getInitials(name)}
                    </span>
                  </div>
                )}

                {/* Company logos for approved staff members */}
                {companyMemberships && companyMemberships.length > 0 && (
                  <div className="absolute -bottom-1 -right-1 flex -space-x-1">
                    {[...companyMemberships]
                      .sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0))
                      .slice(0, 3)
                      .map((membership, index) => (
                        membership.company.avatarUrl ? (
                          <img
                            key={membership.companyId}
                            src={membership.company.avatarUrl}
                            alt={membership.company.name}
                            className={`h-7 w-7 rounded-full border-2 border-white shadow-md object-cover ${
                              membership.isMain ? 'ring-2 ring-brand-400' : ''
                            }`}
                            title={`${membership.company.name} (${membership.role})`}
                          />
                        ) : (
                          <div
                            key={membership.companyId}
                            className={`h-7 w-7 rounded-full border-2 border-white shadow-md bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-600 ${
                              membership.isMain ? 'ring-2 ring-brand-400' : ''
                            }`}
                            title={`${membership.company.name} (${membership.role})`}
                          >
                            {getInitials(membership.company.name)}
                          </div>
                        )
                      ))}
                    {companyMemberships.length > 3 && (
                      <div className="h-7 w-7 rounded-full border-2 border-white shadow-md bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-600">
                        +{companyMemberships.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Name, account type, role, and location - next to image */}
              <div className="flex-1 min-w-0 pt-4 space-y-2">
                {/* Account type label for companies */}
                {isCompany && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wide">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Association
                  </div>
                )}
                
                {/* Name */}
                <div
                  className="cursor-pointer group/name"
                  onClick={() => {
                    navigate(`/profile/${id}`)
                  }}
                >
                  <h3 className={`font-bold text-sm ${isCompany ? 'text-gray-900' : 'text-gray-900'} group-hover/name:text-brand-600 transition-colors leading-tight break-words`} title={name}>
                    {name || "Anonymous User"}
                  </h3>
                </div>

                {/* Role */}
                {role ? (
                  <div className={`text-sm ${isCompany ? 'font-semibold text-gray-700' : 'font-semibold text-gray-600'} break-words`} title={role}>
                    {isCompany ? `${role || 'Company'}` : role}
                  </div>
                ) : (
                  <div className="text-sm font-medium text-gray-500 italic">
                    {isCompany ? 'Company Profile' : 'Professional'}
                  </div>
                )}

                {/* Location */}
                {location && (
                  <div className="flex items-start text-sm text-gray-600 gap-1.5">
                    <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="break-words text-[12px]" title={location}>{location}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CONTENT */}
      <div className={`${isList ? "pb-5 pl-5 pr-5 md:pb-6 md:pl-6 md:pr-6" : "pb-6 pl-6 pr-6"} mt-1 flex flex-col flex-1`}>
             { type=="list" && <>

          {/* Quick actions on image */}
        
<div className="mt-6">
        <h3 
        onClick={() => navigate(`/profile/${id}`)} className={`font-bold text-sm mb-2 hover:underline ${isCompany ? 'text-gray-900' : 'text-gray-900'} group-hover/name:text-brand-600 transition-colors leading-tight break-words`} title={name}>
                    {name || "Anonymous User"}
        </h3>
        </div>
          <div className="absolute top-3 right-3 flex items-center gap-2">
          
            {matchPercentage != 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 backdrop-blur-sm text-brand-600 border border-brand-200">
                {matchPercentage}% match
              </span>
            )}
          </div>
         
         </> }
        {/* Tags */}
        {!!visibleTags.length && (
          <div className="mb-4 flex flex-wrap gap-2">
            {visibleTags.map((t) => (
              <span key={t} className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${false ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-brand-50 text-brand-400 border _border-brand-200'}`}>
                {t}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-600">
                +{extraCount} more
              </span>
            )}
          </div>
        )}


     
        {/* About */}
        {about && (
          <div className="mb-4">
            <p title={about} className={`text-[14px] leading-relaxed text-gray-700 ${isList ? "line-clamp-2 md:line-clamp-2" : "line-clamp-2"}`}>
              {displayedAbout}
            </p>
            {/*isLong && (
              <button 
                onClick={() => navigate(`/profile/${id}`)}
                className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                Read more
              </button>
            )*/}
          </div>
        )}

     

        {/* Actions */}
        <div className={`mt-auto ${!isCompany ? 'pt-3':''} flex items-center gap-3`}>
          {/* Message */}
          {(user?.id != id && !isCompany)  && (
            <button
              onClick={() => {
                if (!user) {
                  data._showPopUp("login_prompt");
                  return;
                }
                if (onMessage) onMessage(id);
                else navigate(`/messages?userId=${id}`);
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-brand-50 text-brand-500 active:bg-brand-800 transition-all duration-200 shadow-sm hover:shadow-md ${
                type === "grid" ? "flex-1 justify-center" : ""
              }`}
            >
              <MessageCircle size={16} />
              Message
            </button>
          )}

          {/* Request Meeting - only show when connected */}
          {connectionStatus === "connected" && (
            <button
              onClick={() => {
                if (!user) {
                  data._showPopUp("login_prompt");
                  return;
                }
                setMeetingModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border border-brand-200 bg-white text-brand-700 hover:border-brand-500 hover:text-brand-700 transition-all duration-200"
            >
              <CalendarDays size={16} />
              Meeting
            </button>
          )}

          {/* Connect */}
          {connectionStatus != "connected" && (
            <div className={type === "grid" ? "flex-1" : ""}>
              {renderConnectButton()}
            </div>
          )}



        </div>
      </div>

      {/* Modals */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={id}
        toName={name}
        onSent={onSent}
      />

      <MeetingRequestModal
        open={meetingModalOpen}
        onClose={() => setMeetingModalOpen(false)}
        toUserId={id}
        toName={name}
        onCreated={(meeting) => {
          toast.success("Meeting request sent successfully!");
        }}
      />

      <ConfirmDialog
        open={openConfirmRemove}
        onClose={() => setOpenConfirmRemove(false)}
        title="Remove this connection?"
        text="This will remove the connection. You can send a new request later."
        confirmText="Remove"
        cancelText="Cancel"
        tone="danger"
        withInput={true}
        inputLabel="Optional note"
        inputPlaceholder="Why are you removing this connection?"
        inputType="textarea"
        requireValue={false}
        onConfirm={removeConnectionApi}
      />
    </div>
  );

  function renderConnectButton() {
    const status = (connectionStatus || "none").toLowerCase();

    if (status === "connected") {
      return (
        <button
          onClick={() => setOpenConfirmRemove(true)}
          title="Connected — click to remove"
          aria-label="Connected. Click to remove connection"
          className={`group/conn rounded-xl px-4 py-2.5 text-sm font-semibold w-full
                    bg-green-50 text-green-700 border-2 border-green-200
                    hover:bg-red-50 hover:text-red-700 hover:border-red-300
                    focus:outline-none focus:ring-2 focus:ring-red-500/30
                    transition-all duration-200 flex items-center justify-center gap-2 ${
                      type === "grid" ? "flex-1" : ""
                    }`}
        >
          <UserCheck size={16} className="block group-hover/conn:hidden group-focus/conn:hidden" />
          <UserX size={16} className="hidden group-hover/conn:block group-focus/conn:block" />
          <span className="block group-hover/conn:hidden group-focus/conn:hidden">Connected</span>
          <span className="hidden group-hover/conn:block group-focus/conn:block">Remove</span>
        </button>
      );
    }

    if (status === "pending_outgoing" || status === "outgoing_pending" || status === "pending") {
      return (
        <button className={`rounded-xl px-4 py-2.5 text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200 cursor-default ${
          type === "grid" ? "w-full" : ""
        }`}>
          Pending
        </button>
      );
    }

    if (status === "pending_incoming" || status === "incoming_pending") {
      return (
        <button
          onClick={() => navigate("/notifications")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 transition-colors ${
            type === "grid" ? "w-full" : ""
          }`}
        >
          Respond
        </button>
      );
    }

    if (!user) {
      return (
        <button
          onClick={() => data._showPopUp("login_prompt")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold border-2 border-gray-200 bg-white text-gray-500 hover:border-brand-300 hover:text-brand-600 transition-all duration-200 ${
            type === "grid" ? "w-full" : ""
          }`}
        >
          Connect
        </button>
      );
    }

    return (
      <button
        onClick={() => setModalOpen(true)}
        className={`rounded-xl px-4 py-2.5 text-sm font-semibold border-2  hover:border-brand-300 hover:text-brand-600 transition-all duration-200 ${
          type === "grid" ? "w-full" : ""
        }`}
      >
        Connect
      </button>
    );
  }
}