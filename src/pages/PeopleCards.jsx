// src/components/PeopleProfileCard.jsx
import React, { useMemo, useState } from "react";
import I from "../lib/icons.jsx";
import ProfileModal from "../components/ProfileModal.jsx";
import ConnectionRequestModal from "../components/ConnectionRequestModal.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useData } from "../contexts/DataContext.jsx";
import { useNavigate } from "react-router-dom";
import { ExternalLink, MapPin, Clock, Eye } from "lucide-react";

/* --- Small reusable subcomponents --- */
const Pill = ({ children, className = "" }) => (
  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${className}`}>
    {children}
  </span>
);
const Tag = ({ children }) => (
  <Pill className="bg-brand-50 text-brand-600 border border-brand-200/50">{children}</Pill>
);

function avatarSrc({ avatarUrl, email, name }) {
  if (avatarUrl) return avatarUrl;
  if (email) return `https://i.pravatar.cc/300?u=${encodeURIComponent(email)}`;
  if (name) return `https://i.pravatar.cc/300?u=${encodeURIComponent(name)}`;
  return null; // clean placeholder (no "No image" text)
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
  country,
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
  matchPercentage = 20,  // optional % chip (overlay on image when list; chip near hero in grid)
  type = "grid",         // "grid" | "list"
}) {
  const { user } = useAuth();
  const data = useData();
  const navigate = useNavigate();

  const [openId, setOpenId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(initialStatus || "none");
  const [isHovered, setIsHovered] = useState(false);

  const isList = type === "list";
  const location = [city, country].filter(Boolean).join(", ");
  const heroUrl = avatarSrc({ avatarUrl, email, name });
  const computedTime = useMemo(() => computeTimeAgo(timeAgo, createdAt), [timeAgo, createdAt]);

  const allTags = useMemo(() => {
    const set = new Set([...goals, ...cats].filter(Boolean).map(String));
    return [...set];
  }, [goals, cats]);
  const visibleTags = allTags.slice(0, 2);
  const extraCount = Math.max(0, allTags.length - visibleTags.length);

  const MAX_CHARS = 150;
  const isLong = !!about && about.length > MAX_CHARS;
  const displayedAbout = !about ? "" : isLong ? `${about.slice(0, MAX_CHARS)}...` : about;

  function onSent() {
    setConnectionStatus("pending_outgoing");
    onConnect?.();
  }

  const containerBase =
    "group relative rounded-[15px] border border-gray-100 bg-white shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300 ease-out";
  const containerLayout = isList
    ? "grid grid-cols-[160px_1fr] md:grid-cols-[224px_1fr] items-stretch"
    : "flex flex-col";

  return (
    <div
      className={`${containerBase} ${containerLayout} ${!isList && isHovered ? "transform -translate-y-1" : ""}`}
      
    >
       <ProfileModal
        userId={openId}
        isOpen={!!openId}
        onClose={() => setOpenId(null)}
        onSent={onSent}
      />
      {/* MEDIA: left column ONLY when list; otherwise top hero in grid */}
      {isList ? (
        <div className="relative h-full min-h-[160px] md:min-h-[176px] overflow-hidden">
          {heroUrl ? (
            <>
              <img src={heroUrl} alt={name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gray-100" />
          )}

          {/* Quick actions on image */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenId(id);
                data._showPopUp?.("profile");
              }}
              className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
              aria-label="View profile"
            >
              <Eye size={16} className="text-gray-600" />
            </button>

            {matchPercentage !== undefined && matchPercentage !== null && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                {matchPercentage}% match
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden">
          {heroUrl ? (
            <div className="relative">
              <img
                src={heroUrl}
                alt={name}
                className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {matchPercentage !== undefined && matchPercentage !== null && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                    {matchPercentage}% match
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* CONTENT */}
      <div className={`${isList ? "p-4 md:p-5" : "p-5"} flex flex-col flex-1`}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className="text-[15px] font-semibold text-gray-900 truncate hover:underline cursor-pointer group-hover:text-brand-600 transition-colors"
              onClick={() => {
                setOpenId(id);
                data._showPopUp?.("profile");
              }}
            >
              {name}
            </div>
            {role && <div className="text-sm text-gray-600 truncate">{role}</div>}

            {(location || computedTime) && (
              <div className="mt-0.5 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  {location && (
                    <>
                      <MapPin size={14} />
                      {location}
                    </>
                  )}
                </span>
              
              </div>
            )}
          </div>

          {/* Dot/menu -> open profile */}
          
        </div>

        {/* About */}
        {about && (
          <p className={`mt-3 text-[15px] leading-relaxed text-gray-700 ${isList ? "line-clamp-2 md:line-clamp-3" : "line-clamp-3"}`}>
            {displayedAbout}
          </p>
        )}

        {/* Looking For */}
        {lookingFor && (
          <p className="mt-3 text-[15px] leading-relaxed text-gray-700">
            Looking for: <span className="font-medium">{lookingFor}</span>
          </p>
        )}

        {/* Tags: show 2 + tooltip */}
        {!!visibleTags.length && (
          <div className="mt-4 mb-4 flex flex-wrap gap-2">
            {visibleTags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}

            {extraCount > 0 && (
              <div className="relative inline-block group/tagmore">
                <Pill
                  className="bg-gray-100 text-gray-600 cursor-default hover:bg-gray-200"
                  aria-describedby={`people-tags-more-${id}`}
                  tabIndex={0}
                >
                  +{extraCount} more
                </Pill>
                <div
                  id={`people-tags-more-${id}`}
                  role="tooltip"
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg
                  opacity-0 invisible transition-opacity duration-200
                  group-hover/tagmore:opacity-100 group-hover/tagmore:visible
                  focus-within:opacity-100 focus-within:visible z-10 whitespace-nowrap"
                >
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {allTags.slice(2).map((tag, i) => (
                      <span key={i} className="inline-block">
                        {tag}
                        {i < allTags.length - 3 ? "," : ""}
                      </span>
                    ))}
                  </div>
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                    border-l-4 border-r-4 border-t-4
                    border-l-transparent border-r-transparent border-t-gray-900"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto pt-2 flex flex-wrap items-center gap-3">
          {/* View profile */}
          <button
            onClick={() => {
              setOpenId(id);
              data._showPopUp?.("profile");
            }}
            className="h-10 w-10 grid place-items-center rounded-xl border-2 border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200"
            aria-label="View profile"
          >
            <Eye size={16} />
          </button>

          {/* Message */}
          <button
            onClick={() => {
              if (!user) {
                data._showPopUp("login_prompt");
                return;
              }
              if (onMessage) onMessage(id);
              else navigate(`/messages?userId=${id}`);
            }}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800 transition-all duration-200 shadow-sm hover:shadow-md ${
              type === "grid" ? "flex-1" : ""
            }`}
          >
            Message
          </button>

          {/* Connect */}
          {renderConnectButton()}
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
     
    </div>
  );

  function renderConnectButton() {
    const status = (connectionStatus || "none").toLowerCase();

    if (status === "connected") {
      return (
        <button className="rounded-xl px-4 py-2.5 text-sm font-medium bg-green-100 text-green-700 cursor-default">
          Connected
        </button>
      );
    }
    if (status === "pending_outgoing" || status === "outgoing_pending" || status === "pending") {
      return (
        <button className="rounded-xl px-4 py-2.5 text-sm font-medium bg-yellow-100 text-yellow-700 cursor-default">
          Pending
        </button>
      );
    }
    if (status === "pending_incoming" || status === "incoming_pending") {
      return (
        <button
          onClick={() => navigate("/notifications")}
          className="rounded-xl px-4 py-2.5 text-sm font-medium bg-brand-100 text-brand-600 hover:bg-brand-200"
        >
          <ExternalLink size={16} className="mr-1" />
          Respond
        </button>
      );
    }
    if (!user) {
      return (
        <button
          onClick={() => data._showPopUp("login_prompt")}
          className="rounded-xl px-4 py-2.5 text-sm font-medium border-2 border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600 transition-colors"
        >
          Connect
        </button>
      );
    }
    return (
      <button
        onClick={() => setModalOpen(true)}
        className="rounded-xl px-4 py-2.5 text-sm font-medium border-2 border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600 transition-colors"
      >
        Connect
      </button>
    );
  }
}
