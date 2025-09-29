// src/components/EventCard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../lib/toast";
import styles from "../lib/styles.jsx";
import I from "../lib/icons.jsx";
import * as socialApi from "../api/social";
import ConnectionRequestModal from "./ConnectionRequestModal";
import ProfileModal from "./ProfileModal";
import EventDetails from "./EventDetails";
import EventRegistrationDialog from "./EventRegistrationDialog";
import ConfirmDialog from "./ConfirmDialog";
import CommentsDialog from "./CommentsDialog";
import client,{API_URL} from "../api/client";
import { Edit, Eye, Share2, MapPin, Clock, User as UserIcon, Copy as CopyIcon, Heart, MessageCircle, Flag, Calendar, MoreVertical, Trash2 } from "lucide-react";
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
  const { user, settings } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(e?.connectionStatus || "none");
  const [registrationStatus, setRegistrationStatus] = useState(
    e?.registrationStatus || "not_registered"
  );
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false); // event details modal
  const [registrationOpen, setRegistrationOpen] = useState(false); // event registration modal

  // Social state
  const [liked, setLiked] = useState(!!e?.liked);
  const [likeCount, setLikeCount] = useState(Number(e?.likes || 0));
  const [commentCount, setCommentCount] = useState(
    Array.isArray(e?.comments) ? e.comments.length : Number(e?.commentsCount || 0)
  );

  // Report dialog
  const [reportOpen, setReportOpen] = useState(false);

  // Share popover
  const [shareOpen, setShareOpen] = useState(false);
  const shareMenuRef = useRef(null);
  const cardRef = useRef(null);

  // Comments dialog
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);

  // Options menu
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const optionsMenuRef = useRef(null);
  
  // Close menus on outside click / Esc
  useEffect(() => {
    function onDown(e) {
      if (
        shareMenuRef.current &&
        !shareMenuRef.current.contains(e.target) &&
        !cardRef.current?.contains(e.target)
      ) {
        setShareOpen(false);
      }
      if (
        optionsMenuRef.current &&
        !optionsMenuRef.current.contains(e.target)
      ) {
        setOptionsMenuOpen(false);
        setShowDeleteConfirm(false);
      }
    }
    function onEsc(e) {
      if (e.key === "Escape") {
        setShareOpen(false);
        setOptionsMenuOpen(false);
        setShowDeleteConfirm(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // Initial fetch for like & comments count (optional)
  useEffect(() => {
    if (!e?.id) return;
    socialApi
      .getLikeStatus("event", e.id)
      .then(({ data }) => {
        setLiked(data.liked);
        setLikeCount(data.count);
      })
      .catch(() => {});
    socialApi
      .getComments("event", e.id)
      .then(({ data }) => {
        const len = Array.isArray(data) ? data.length : 0;
        setCommentCount(len);
      })
      .catch(() => {});
  }, [e?.id]);

  const isOwner = user?.id && e?.organizerUserId && user.id === e.organizerUserId;
  const isList = type === "list";

  let imageUrl = e?.coverImageBase64 || e?.coverImage || null;
   imageUrl =
  imageUrl && (imageUrl?.startsWith("data:image") || imageUrl?.startsWith("http"))
    ? imageUrl
    : imageUrl
    ? `${API_URL}/uploads/${imageUrl}`
    : null; 


  // Share data
  const shareUrl = `${window.location.origin}/event/${e?.id}`;
  const shareTitle = e?.title || "Event on 54Links";
  const shareQuote = (e?.description || "").slice(0, 160) + ((e?.description || "").length > 160 ? "…" : "");
  const shareHashtags = ["54Links", "Events", "Networking"].filter(Boolean);
  const messengerAppId = import.meta?.env?.VITE_FACEBOOK_APP_ID || undefined;

  const CopyLinkButton = () => (
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

  const ShareMenu = () => (
    <div
      ref={shareMenuRef}
      className="absolute top-12 right-3 z-30 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
      role="dialog"
      aria-label="Share options"
    >
      <div className="text-xs font-medium text-gray-500 px-1 pb-2">
        Share this event
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
        <CopyLinkButton />
      </div>
    </div>
  );

  const OptionsMenu = () => (
    <div
      ref={optionsMenuRef}
      className="absolute z-30 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-xl top-12 right-3"
      role="dialog"
      aria-label="Options menu"
    >
      {showDeleteConfirm ? (
        // Confirmation mode
        <>
          <div className="px-3 py-2 text-sm font-medium text-gray-900 border-b border-gray-200 mb-2">
            Delete this event?
          </div>
          <button
            onClick={async () => {
              try {
                await client.delete(`/events/${e.id}`);
                toast.success("Event deleted successfully");
                setIsDeleted(true); // Hide the card
              } catch (error) {
                console.error("Failed to delete event:", error);
                toast.error(error?.response?.data?.message || "Failed to delete event");
              }
              setOptionsMenuOpen(false);
              setShowDeleteConfirm(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mb-1"
          >
            <Trash2 size={16} />
            Confirm Delete
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </>
      ) : (
        // Initial menu
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
          Delete
        </button>
      )}
    </div>
  );

  const allTags = [
    ...(Array.isArray(e?.audienceCategories) ? e?.audienceCategories.map(i=>i.name) : []),
    e.eventType || "Event",
    e.categoryName,
    e.subcategoryName
  ].filter(Boolean);
  const visibleTags = allTags.slice(0, 2);
  const extraCount = Math.max(0, allTags.length - visibleTags.length);

  const isPaid = e?.price != null && e.price !== "" && !isNaN(Number(e.price));
  const priceText = isPaid ? `${e?.currency || "USD"} ${e.price}` : "Free";

  const timeAgo = useMemo(() => computeTimeAgo(e?.timeAgo, e?.createdAt), [e?.timeAgo, e?.createdAt]);

  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
    setConnectionStatus("pending_outgoing");
    // Restore body scroll when modal closes
    document.body.style.overflow = '';
  }

  function onModalClose() {
    setModalOpen(false);
    // Restore body scroll when modal closes
    document.body.style.overflow = '';
  }

  const containerBase =
    "group relative rounded-[15px] border border-gray-100 bg-white shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300 ease-out";
  const containerLayout = isList
    ? (settings?.contentType === 'text'
        ? "flex flex-col" // Full width for text mode in list
        : "grid grid-cols-[160px_1fr] md:grid-cols-[224px_1fr] items-stretch")
    : "flex flex-col";

  /* ----------------------- Like handler ----------------------- */
  const toggleLike = async () => {
    if (!user?.id) {
      data._showPopUp?.("login_prompt");
      return;
    }
    setLiked((p) => !p);
    setLikeCount((n) => (liked ? Math.max(0, n - 1) : n + 1));
    try {
      const { data } = await socialApi.toggleLike("event", e.id);
      setLiked(data.liked);
      setLikeCount(data.count);
    } catch (error) {
      setLiked((p) => !p);
      setLikeCount((n) => (liked ? n + 1 : Math.max(0, n - 1)));
    }
  };

  /* ----------------------- Report handler ----------------------- */
  const reportEvent = async (description) => {
    try {
      await socialApi.reportContent("event", e.id, "other", description);
      toast.success("Report submitted. Thank you.");
    } catch (e) {
      toast.success("Report submitted. Thank you.");
    }
  };

  return (
    <>
      <div
        ref={cardRef}
        className={`${containerBase} relative ${containerLayout} ${!isList && isHovered ? "transform -translate-y-1" : ""} ${isDeleted ? "hidden" : ""}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* IMAGE SIDE */}
        {isList ? (
          // Only show image side in list view if not text mode
          settings?.contentType !== 'text' && (
            <div className="relative h-full min-h-[160px] md:min-h-[176px] overflow-hidden">
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt={e?.title} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  
                  {/* Organizer name and logo on image */}
                  <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                    <div
                      className="flex items-center gap-2 text-sm text-gray-600 _profile hover:underline cursor-pointer"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        if (e?.organizerUserId) {
                          setOpenId(e.organizerUserId);
                          data._showPopUp?.("profile");
                        }
                      }}
                    >
                      {e?.avatarUrl ? (
                        <img
                          src={e.avatarUrl}
                          alt={e?.organizerUserName || "User"}
                          className="w-7 h-7 rounded-full shadow-lg object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 bg-white shadow-lg rounded-full grid place-items-center">
                          <UserIcon size={12} className="text-brand-600" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="inline-flex items-center gap-1 bg-white text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                          {e?.organizerUserName || "User"}
                        </span>
                      </div>
                    </div>
                  </div>
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
                    setShareOpen((s) => !s);
                  }}
                  className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                  aria-label="Share event"
                >
                  <Share2 size={16} className="text-gray-600" />
                </button>

                {/* Options (Delete) - only for owner */}
                {isOwner && (
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setOptionsMenuOpen((s) => !s);
                    }}
                    className="p-2 hidden rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                    aria-label="More options"
                  >
                    <MoreVertical size={16} className="text-gray-600" />
                  </button>
                )}
              </div>
            </div>
          )
        ) : (
          // GRID IMAGE
          <div className="relative overflow-hidden">
            {settings?.contentType === 'text' ? null : imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={e?.title}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Organizer name and logo on image */}
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                  <div
                    className="flex items-center gap-2 text-sm text-gray-600 _profile hover:underline cursor-pointer"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      if (e?.organizerUserId) {
                        setOpenId(e.organizerUserId);
                        data._showPopUp?.("profile");
                      }
                    }}
                  >
                    {e?.avatarUrl ? (
                      <img
                        src={e.avatarUrl}
                        alt={e?.organizerUserName || "User"}
                        className="w-7 h-7 rounded-full shadow-lg object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-white shadow-lg rounded-full grid place-items-center">
                        <UserIcon size={12} className="text-brand-600" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1 bg-white text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                        {e?.organizerUserName || "User"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // clean placeholder (no text/icon)
              <div className="w-full h-48 bg-gray-100" />
            )}

            {/* View & Share - only show when not text mode */}
            {settings?.contentType !== 'text' && (
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
                    setShareOpen((s) => !s);
                  }}
                  className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 group/share"
                  aria-label="Share event"
                >
                  <Share2 size={16} className="text-gray-600 group-hover/share:text-brand-600 transition-colors duration-200" />
                </button>

                {/* Options (Delete) - only for owner */}
                {isOwner && (
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setOptionsMenuOpen((s) => !s);
                    }}
                    className="p-2 hidden rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                    aria-label="More options"
                  >
                    <MoreVertical size={16} className="text-gray-600" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* CONTENT SIDE */}
        <div className={`${isList ? "p-4 md:p-5" : "p-5"} flex flex-col flex-1`}>
          {/* Text mode: Buttons and audience categories at top */}
          {settings?.contentType === 'text' && (
            <div className={`${!isList ? 'flex-col gap-y-2':'items-center justify-between gap-2'} flex  mb-3`}>
              <div className="flex gap-2">
                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    if (isOwner) navigate(`/event/${e.id}`);
                    else setEventDetailsOpen(true);
                  }}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                  aria-label="View event"
                >
                  {isOwner ? <Edit size={16} /> : <Eye size={16} />}
                </button>
                {!isOwner && (
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      if (!user?.id) {
                        data._showPopUp("login_prompt");
                        return;
                      }
                      setRegistrationOpen(true);
                    }}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                    aria-label="Register for event"
                  >
                    <Calendar size={16} className="text-gray-600" />
                  </button>
                )}
                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setShareOpen((s) => !s);
                  }}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                  aria-label="Share event"
                >
                  <Share2 size={16} className="text-gray-600" />
                </button>

                {/* Options (Delete) - only for owner */}
                {isOwner && (
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setOptionsMenuOpen((s) => !s);
                    }}
                    className="p-2 hidden rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                    aria-label="More options"
                  >
                    <MoreVertical size={16} className="text-gray-600" />
                  </button>
                )}
              </div>
              <div
                className="flex items-center gap-2 text-sm text-gray-600 _profile hover:underline cursor-pointer"
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (e?.organizerUserId) {
                    setOpenId(e.organizerUserId);
                    data._showPopUp?.("profile");
                  }
                }}
              >
                {e?.avatarUrl ? (
                  <img
                    src={e.avatarUrl}
                    alt={e?.organizerUserName || "User"}
                    className="w-7 h-7 rounded-full shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 bg-white shadow-lg rounded-full grid place-items-center">
                    <UserIcon size={12} className="text-brand-600" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="inline-flex items-center gap-1 bg-white text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                    {e?.organizerUserName || "User"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-lg text-gray-900  mb-0.5 group-hover:text-brand-600 transition-colors duration-200">
            {e?.title}
          </h3>

          {/* Organizer display when there's no image */}
          {!imageUrl && (
            <div
              className="flex items-center gap-2 text-sm text-gray-600 _profile hover:underline cursor-pointer mt-2"
              onClick={(ev) => {
                ev.stopPropagation();
                if (e?.organizerUserId) {
                  setOpenId(e.organizerUserId);
                  data._showPopUp?.("profile");
                }
              }}
            >
              {e?.avatarUrl ? (
                <img
                  src={e.avatarUrl}
                  alt={e?.organizerUserName || "User"}
                  className="w-7 h-7 rounded-full shadow-lg object-cover"
                />
              ) : (
                <div className="w-7 h-7 bg-white shadow-lg rounded-full grid place-items-center">
                  <UserIcon size={12} className="text-brand-600" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="inline-flex items-center gap-1 bg-white text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                  {e?.organizerUserName || "User"}
                </span>
              </div>
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
            <div className="flex items-center justify-between pb-2">
              {/* Organizer display removed - now shown prominently above */}
             

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

          {/* NEW: social row (like / comment / report) hidden for now */}
          <div className="mt-1 mb-2 flex items-center gap-5 text-sm text-gray-600">
            <button
              onClick={toggleLike}
              className="inline-flex items-center gap-1 hover:text-brand-700"
              title={liked ? "Unlike" : "Like"}
            >
              <Heart
                size={16}
                className={liked ? "fill-brand-500 text-brand-500" : ""}
              />
              <span>{likeCount}</span>
            </button>

            <button
              onClick={() => setCommentsDialogOpen(true)}
              className="inline-flex items-center gap-1 hover:text-brand-700"
              title="Comments"
            >
              <MessageCircle size={16} />
              <span>{commentCount}</span>
            </button>

            <button
             onClick={() =>{
                 if (!user?.id) {
                  data._showPopUp?.("login_prompt");
                  return;
                }else{
                  setReportOpen(true)
                }
              } }
              className="inline-flex _login_prompt items-center gap-1 hover:text-rose-700"
              title="Report this event"
            >
              <Flag size={16} />
              <span>Report</span>
            </button>
          </div>

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

           
           {/* Registration Status Buttons - Show different buttons based on status */}
          {!isOwner && (
            <>
              {/* Registered Status - Show checkmark when already registered */}
              {registrationStatus === 'registered' && (
                <button
                  className={`${
                    type === "grid" ? "flex-1" : ""
                  } rounded-xl px-4 py-2.5 text-sm font-medium bg-green-100 text-green-700 cursor-default flex items-center justify-center gap-2`}
                  disabled
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Registered</span>
                </button>
              )}

              {/* Not Registered - Show regular Register button */}
              {registrationStatus === 'not_registered' && (
                <button
                  onClick={() => {
                    if (!user?.id) {
                      data._showPopUp("login_prompt");
                      return;
                    }
                    setRegistrationOpen(true);
                  }}
                  className={`${
                    type === "grid" ? "flex-1" : ""
                  } rounded-xl px-4 py-2.5 text-sm font-medium bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md`}
                >
                  <span>Register</span>
                </button>
              )}

              {/* Unauthenticated - Show Register button that prompts login */}
              {(!registrationStatus || registrationStatus === 'unauthenticated') && (
                <button
                  onClick={() => data._showPopUp("login_prompt")}
                  className={`${
                    type === "grid" ? "flex-1" : ""
                  } rounded-xl px-4 py-2.5 text-sm font-medium bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md`}
                >
                  <span>Register</span>
                </button>
              )}
            </>
          )}

            {/* Message - Hidden for now */}
            {false && (
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
                  type === "grid" ? "" : "flex-1"
                } rounded-xl px-4 py-2.5 text-sm font-medium border-2 border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md`}
              >
                Message
              </button>
            )}

            {/* Connect */}
            {(!isOwner && connectionStatus!="connected") && 
            <div className="_login_prompt">
              {renderConnectButton()}
            </div>}
            
          </div>
        </div>

        {/* Subtle bottom gradient for depth (grid only) */}
        {!isList && (
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50" />
        )}
        
        {/* SHARE MENU - inside the card for proper positioning */}
        {shareOpen && <ShareMenu />}

        {/* OPTIONS MENU */}
        {optionsMenuOpen && <OptionsMenu />}
      </div>

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={onModalClose}
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

      {/* Event Registration Dialog */}
      {/* Event Registration Dialog */}
    <EventRegistrationDialog
      open={registrationOpen}
      onClose={(registered) => {
        if (registered === "registered") {
          setRegistrationStatus('registered');
        }
        setRegistrationOpen(false);
      }}
      event={e}
    />

      {/* Report dialog */}
      <ConfirmDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report this event?"
        text="Tell us what's happening. Our team will review."
        confirmText="Submit report"
        cancelText="Cancel"
        withInput
        inputType="textarea"
        inputLabel="Report details"
        inputPlaceholder="Describe the issue (spam, scam, offensive, etc.)"
        requireValue
        onConfirm={reportEvent}
      />

      {/* Comments Dialog */}
      <CommentsDialog
        open={commentsDialogOpen}
        onClose={() => setCommentsDialogOpen(false)}
        entityType="event"
        entityId={e?.id}
        currentUser={user}
        onCountChange={(n) => setCommentCount(n)}
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
        onClick={() => {
          setModalOpen(true);
          // Prevent body scroll when modal opens
          document.body.style.overflow = 'hidden';
        }}
        className="rounded-xl px-4 py-2.5 text-sm font-medium border-2 border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200"
      >
        Connect
      </button>
    );
  }
}

