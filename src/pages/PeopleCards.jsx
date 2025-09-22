// src/components/PeopleProfileCard.jsx
import React, { useMemo, useState } from "react";
import I from "../lib/icons.jsx";
import ProfileModal from "../components/ProfileModal.jsx";
import ConnectionRequestModal from "../components/ConnectionRequestModal.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useData } from "../contexts/DataContext.jsx";
import { useNavigate } from "react-router-dom";
import { ExternalLink, MapPin, Clock, Eye, UserX, UserCheck, Trash2 } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import client from "../api/client";
import { toast } from "../lib/toast.js";


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

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

  const isCompany = accountType === "company";
  
  const containerBase =
    `group relative rounded-[15px] border ${isCompany ? 'border-blue-100' : 'border-gray-100'} ${isCompany ? 'bg-blue-50/20' : 'bg-white'} shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300 ease-out`;
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
        <div className="relative h-full w-full min-h-[160px] md:min-h-[176px] overflow-hidden">
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
        <div className="relative overflow-hidden w-full">
         
            <div className="relative">
               {heroUrl ? (<img
                src={heroUrl}
                alt={name}
                className={`w-full ${isCompany ? 'h-[60px]' : 'h-[45px]'} blur-sm opacity-80 object-cover transition-transform duration-500 group-hover:scale-105`}
              />) : (
                <div className={`w-full ${isCompany ? 'bg-blue-50' : 'bg-brand-50'} ${isCompany ? 'h-[60px]' : 'h-[45px]'}`}>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {matchPercentage !== undefined && matchPercentage !== null && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                    {matchPercentage}% match
                  </span>
                )} 
              </div>
              
            </div>
        
        </div>
      )}

      {/* Profile Image (circular) - only when there's no heroUrl */}

       
      
        <div className="relative translate-x-3 -mt-8 z-10 flex justify-between">
          <div className="relative">
            {heroUrl ? (
              <div className={`${isCompany ? 'w-20 h-20 rounded-md' : 'w-16 h-16 rounded-full'}  ${isCompany ? 'bg-blue-50' : 'bg-blue-50'} border-4 ${isCompany ? 'border-blue-50' : 'border-white'} overflow-hidden shadow-md`}>

                <img
                  src={heroUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />

              </div>
            ) : (
              <div className={`${isCompany ? 'w-20 h-20' : 'w-16 h-16'} rounded-full border-4 ${isCompany ? 'border-blue-50' : 'border-white'} ${isCompany ? 'bg-blue-100' : 'bg-brand-100'} flex items-center justify-center shadow-md`}>
                <span className={`${isCompany ? 'text-blue-600' : 'text-brand-600'} font-medium text-lg`}>{getInitials(name)}</span>
              </div>
            )}

            {/* Company logos for approved staff members */}
            {companyMemberships && companyMemberships.length > 0 && (
              <div className="absolute -bottom-2 -right-2 flex -space-x-2">
                {/* Sort to show main company first */}
                {[...companyMemberships]
                  .sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0))
                  .slice(0, 3)
                  .map((membership, index) => (
                  <img
                    key={membership.companyId}
                    src={
                      membership.company.avatarUrl ||
                      `https://i.pravatar.cc/150?u=${encodeURIComponent(membership.company.name)}`
                    }
                    alt={membership.company.name}
                    className="h-7 w-7 rounded-full border-2 border-white shadow-sm object-cover ${
                      membership.isMain ? 'ring-2 ring-brand-400' : ''
                    }"
                    title={`${membership.company.name} (${membership.role})`}
                  />
                ))}
                {companyMemberships.length > 3 && (
                  <div className="h-7 w-7 rounded-full border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 z-10">
                    +{companyMemberships.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>

           {/* View profile */}
          <button
            onClick={() => {
              setOpenId(id);
              data._showPopUp?.("profile");
            }}
            className="h-10 w-10 translate-y-10 mr-6 flex-shrink-0 grid place-items-center rounded-xl border-2 border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200"
            aria-label="View profile"
          >
            <Eye size={16} />
          </button>
         
        </div>
      

      {/* CONTENT */}
      <div className={`${isList ? "p-4 md:p-5" : "p-5"} flex flex-col flex-1`}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className={`${isCompany ? 'text-[17px]' : 'text-[15px]'} font-semibold ${isCompany ? 'text-blue-900' : 'text-gray-900'} truncate hover:underline cursor-pointer group-hover:text-brand-600 transition-colors`}
              onClick={() => {
                setOpenId(id);
                data._showPopUp?.("profile");
              }}
            >
              {name}
            </div>
            {role && (
              <div className={`text-sm ${isCompany ? 'font-medium text-blue-700' : 'text-gray-600'} truncate`}>
                {isCompany ? `${role || 'Company'}` : role}
              </div>
            )}

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
              <span key={t} className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${isCompany ? 'bg-blue-50 text-blue-600 border border-blue-200/50' : 'bg-brand-50 text-brand-600 border border-brand-200/50'}`}>
                {t}
              </span>
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
        <div className="mt-auto pt-2 flex items-center gap-2">
        

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
          className="group/conn rounded-xl px-2.5 py-2 text-sm font-semibold w-full
                    bg-green-100 text-green-700 border-2 border-green-200
                    hover:bg-red-50 hover:text-red-700 hover:border-red-300
                    focus:outline-none focus:ring-2 focus:ring-red-500/30
                    transition-all duration-200 flex items-center justify-center"
        >
          <span className="flex items-center gap-2">
            {/* Main icon/label swap */}
            <UserCheck size={16} className="block group-hover/conn:hidden group-focus/conn:hidden" />
            <UserX     size={16} className="hidden group-hover/conn:block group-focus/conn:block" />

            <span className="block group-hover/conn:hidden group-focus/conn:hidden">Connected</span>
            <span className="hidden group-hover/conn:block group-focus/conn:block">Remove</span>

            {/* Affordance: delete icon BEFORE hover; 'tap to remove' AFTER hover */}
            <span className="ml-2 inline-flex items-center">
              <Trash2
                size={14}
                className="block group-hover/conn:hidden group-focus/conn:hidden text-gray-500"
                aria-hidden="true"
              />
              <span className="hidden group-hover/conn:inline group-focus/conn:inline text-[11px] leading-none text-gray-500">
                tap to remove
              </span>
            </span>
          </span>
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
