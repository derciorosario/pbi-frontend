// src/components/EventCard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../lib/toast";
import styles from "../lib/styles.jsx";
import I from "../lib/icons.jsx";
import ConnectionRequestModal from "./ConnectionRequestModal";
import ProfileModal from "./ProfileModal";
import EventDetails from "./EventDetails";
import { Edit, Eye, Share2, MapPin, Clock, User as UserIcon } from "lucide-react";

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

export default function EventCard({
  e,
  type = "grid",          // "grid" | "list"
  matchPercentage = 20,   // optional match % chip
}) {
  const navigate = useNavigate();
  const data = useData();
  const { user } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(e?.connectionStatus || "none");
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false); // event details modal

  const isOwner = user?.id && e?.organizerUserId && user.id === e.organizerUserId;
  const isList = type === "list";

  const imageUrl = e?.coverImageBase64 || e?.coverImage || null;

  const allTags = [e.eventType || "Event", e.categoryName, e.subcategoryName].filter(Boolean);
  const visibleTags = allTags.slice(0, 2);
  const extraCount = Math.max(0, allTags.length - visibleTags.length);

  const isPaid = e?.price != null && e.price !== "" && !isNaN(Number(e.price));
  const priceText = isPaid ? `${e?.currency || "USD"} ${e.price}` : "Free";

  const timeAgo = useMemo(() => computeTimeAgo(e?.timeAgo, e?.createdAt), [e?.timeAgo, e?.createdAt]);

  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
    setConnectionStatus("pending_outgoing");
  }

  const containerBase =
    "group relative rounded-[15px] border border-gray-100 bg-white shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300 ease-out";
  const containerLayout = isList
    ? "grid grid-cols-[160px_1fr] md:grid-cols-[224px_1fr] items-stretch"
    : "flex flex-col";

  return (
    <>
      <div
        className={`${containerBase} ${containerLayout} ${!isList && isHovered ? "transform -translate-y-1" : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* IMAGE SIDE */}
        {isList ? (
          <div className="relative h-full min-h-[160px] md:min-h-[176px] overflow-hidden">
            {imageUrl ? (
              <>
                <img src={imageUrl} alt={e?.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* audience over image when there IS image */}
                {Array.isArray(e?.audienceCategories) && e.audienceCategories.length > 0 && (
                  <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                    {e.audienceCategories.map((c) => (
                      <span
                        key={c.id || c.name}
                        className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // clean placeholder (no text/icon)
              <div className="absolute inset-0 w-full h-full bg-gray-100" />
            )}

            {/* Quick actions on image */}
            <div className="absolute top-3 right-3 flex gap-2">
              {/* View / Edit */}
              <button
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (isOwner) navigate(`/event/${e.id}`);
                  else setEventDetailsOpen(true);
                }}
                className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                aria-label="View event"
              >
                {isOwner ? <Edit size={16} className="text-gray-600" /> : <Eye size={16} className="text-gray-600" />}
              </button>

              {/* Share */}
              <button
                onClick={(ev) => {
                  ev.stopPropagation();
                  const shareUrl = `${window.location.origin}/events/view=${e.id}`;
                  if (navigator.share) {
                    navigator.share({ title: e.title, text: e.description, url: shareUrl }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied to clipboard");
                  }
                }}
                className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                aria-label="Share event"
              >
                <Share2 size={16} className="text-gray-600" />
              </button>
            </div>
          </div>
        ) : (
          // GRID IMAGE
          <div className="relative overflow-hidden">
            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={e?.title}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* audience over image when there IS image */}
                {Array.isArray(e?.audienceCategories) && e.audienceCategories.length > 0 && (
                  <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                    {e.audienceCategories.map((c) => (
                      <span
                        key={c.id || c.name}
                        className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // clean placeholder (no text/icon)
              <div className="w-full h-48 bg-gray-100" />
            )}

            {/* View & Share */}
            <div className="absolute top-4 right-4 flex gap-2">
                 <button
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (isOwner) navigate(`/event/${e.id}`);
                  else setEventDetailsOpen(true);
                }}
                className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                aria-label="View event"
              >
                {isOwner ? <Edit size={16} className="text-gray-600" /> : <Eye size={16} className="text-gray-600" />}
              </button>

              <button
                onClick={(ev) => {
                  ev.stopPropagation();
                  const shareUrl = `${window.location.origin}/events/view=${e.id}`;
                  if (navigator.share) {
                    navigator.share({ title: e.title, text: e.description, url: shareUrl }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied to clipboard");
                  }
                }}
                className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 group/share"
                aria-label="Share event"
              >
                <Share2 size={16} className="text-gray-600 group-hover/share:text-brand-600 transition-colors duration-200" />
              </button>
            </div>
          </div>
        )}

        {/* CONTENT SIDE */}
        <div className={`${isList ? "p-4 md:p-5" : "p-5"} flex flex-col flex-1`}>
          {/* Title */}
          <h3 className="font-semibold text-lg text-gray-900 truncate mb-0.5 group-hover:text-brand-600 transition-colors duration-200">
            {e?.title}
          </h3>

          {/* audienceCategories HERE ONLY when there is NO image */}
          {!imageUrl && Array.isArray(e?.audienceCategories) && e.audienceCategories.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {e.audienceCategories.map((c) => (
                <span
                  key={c.id || c.name}
                  className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full"
                >
                  {c.name}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <p className={`mt-2 text-sm text-gray-600 leading-relaxed ${isList ? "line-clamp-2 md:line-clamp-3" : "line-clamp-2"}`}>
            {e?.description}
          </p>

          {/* Price */}
          <div className={`${isList ? "mt-2 mb-2" : "mt-2 mb-3"}`}>
            <span className="text-sm font-bold text-gray-700">{priceText}</span>
          </div>

          {/* Meta: organizer + match + time + location */}
          <div className={`${isList ? "mb-2" : "mb-3"} space-y-2`}>
            <div className="flex items-center justify-between">
              {/* Organizer inline profile */}
              {e?.organizerUserName ? (
                <div
                  className="flex items-center gap-2 text-sm text-gray-600 _profile hover:underline cursor-pointer"
                  onClick={() => {
                    if (e?.organizerUserId) {
                      setOpenId(e.organizerUserId);
                      data._showPopUp?.("profile");
                    }
                  }}
                >
                  {e?.organizerUserAvatarUrl ? (
                    <img
                      src={e.organizerUserAvatarUrl}
                      alt={e.organizerUserName}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-brand-100 rounded-full grid place-items-center">
                      <UserIcon size={12} className="text-brand-600" />
                    </div>
                  )}
                  <span className="font-medium">{e.organizerUserName}</span>
                </div>
              ) : <span />}

              {/* Match % chip */}
              {matchPercentage !== undefined && matchPercentage !== null && (
                <div className="flex items-center gap-1">
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      matchPercentage >= 80
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : matchPercentage >= 60
                        ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}
                  >
                    {matchPercentage}% match
                  </div>
                </div>
              )}
            </div>

            {/* time + location */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {timeAgo}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {e?.city ? `${e.city}, ` : ""}
                {e?.country || "—"}
              </span>
            </div>
          </div>

          {/* Tags (show 2) with +X tooltip if more */}
          {!!visibleTags.length && (
            <div className={`${isList ? "mb-3" : "mb-4"} flex flex-wrap gap-2`}>
              {visibleTags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-50 to-brand-100 text-brand-700 px-3 py-1 text-xs font-medium border border-brand-200/50"
                >
                  {t}
                </span>
              ))}

              {extraCount > 0 && (
                <div className="relative inline-block group/tagmore">
                  <span
                    className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs font-medium cursor-default hover:bg-gray-200 transition-colors duration-200"
                    aria-describedby={`event-tags-more-${e.id}`}
                    tabIndex={0}
                  >
                    +{extraCount} more
                  </span>

                  <div
                    id={`event-tags-more-${e.id}`}
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
          <div className={`flex items-center gap-2 mt-auto pt-2 ${isList ? "justify-end md:justify-start" : ""}`}>
            {/* View (Edit if owner) */}
            <button
              onClick={() => {
                if (isOwner) navigate(`/event/${e.id}`);
                else setEventDetailsOpen(true);
              }}
              className="flex hidden items-center justify-center h-10 w-10 flex-shrink-0 rounded-xl border-2 border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200 group/view"
              aria-label={isOwner ? "Edit event" : "View event"}
            >
              {isOwner ? (
                <Edit size={16} className="transition-transform duration-200 group-hover/view:scale-110" />
              ) : (
                <Eye size={16} className="transition-transform duration-200 group-hover/view:scale-110" />
              )}
            </button>

            {/* Message */}
            <button
              onClick={() => {
                if (!user?.id) {
                  data._showPopUp("login_prompt");
                  return;
                }
                navigate(`/messages?userId=${e.organizerUserId}`);
                toast.success("Starting conversation with " + (e.organizerUserName || "event organizer"));
              }}
              className={`${
                type === "grid" ? "flex-1" : ""
              } rounded-xl px-4 py-2.5 text-sm font-medium bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md`}
            >
              Message
            </button>

            {/* Connect */}
            {!isOwner && renderConnectButton()}
          </div>
        </div>

        {/* Subtle bottom gradient for depth (grid only) */}
        {!isList && (
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50" />
        )}
      </div>

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={e?.organizerUserId}
        toName={e?.organizerUserName || "Event Organizer"}
        onSent={onSent}
      />

      {/* Profile Modal */}
      <ProfileModal
        userId={openId}
        isOpen={!!openId}
        onClose={() => setOpenId(null)}
        onSent={onSent}
      />

      {/* Event Details Modal */}
      <EventDetails
        eventId={e?.id}
        isOpen={eventDetailsOpen}
        item={e}
        onClose={() => setEventDetailsOpen(false)}
      />
    </> 
  );

  // --- helpers ---
  function renderConnectButton() {
    const status = connectionStatus || e?.connectionStatus || "none";

    if (status === "connected") {
      return (
        <button className="rounded-xl px-4 py-2.5 text-sm font-medium bg-green-100 text-green-700 cursor-default">
          Connected
        </button>
      );
    }
    if (status === "pending_outgoing" || status === "outgoing_pending") {
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
    if (!user?.id) {
      return (
        <button
          onClick={() => data._showPopUp("login_prompt")}
          className="rounded-xl px-4 py-2.5 text-sm font-medium border-2 border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200"
        >
          Connect
        </button>
      );
    }
    return (
      <button
        onClick={() => setModalOpen(true)}
        className="rounded-xl px-4 py-2.5 text-sm font-medium border-2 border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200"
      >
        Connect
      </button>
    );
  }
}

