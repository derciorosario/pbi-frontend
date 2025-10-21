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
import LogoGray from '../assets/logo.png';
import { Edit, Eye, Share2, MapPin, Clock, User as UserIcon, Copy as CopyIcon, Heart, MessageCircle, Flag, Calendar, MoreVertical, Trash2, Globe } from "lucide-react";
import LikesDialog from "./LikesDialog";
import VideoPlayer from "./VideoPlayer";

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
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false); // event details modal
  const [registrationOpen, setRegistrationOpen] = useState(false); // event registration modal

  // Social state
  const [liked, setLiked] =  useState(!!e?.isLiked);
  const [likeCount, setLikeCount] = useState(Number(e.likesCount || 0));
  const [commentCount, setCommentCount] = useState(Number(e?.commentsCount || 0));

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
  const [showFullDescription, setShowFullDescription] = useState(false);
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
 /* useEffect(() => { leave this section as it is
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
  }, [e?.id]);*/

  const isOwner = user?.id && e?.organizerUserId && user.id === e.organizerUserId;
  const isList = type === "list";

  // Process media files - PRIORITY: Video over Image
  const processMediaUrl = (url) => {
    if (!url) return null;
    return (url?.startsWith("data:") || url?.startsWith("http"))
      ? url
      : `${API_URL}/uploads/${url}`;
  };

  // Get media to display - VIDEO has priority over IMAGE
  const mediaToDisplay = useMemo(() => {
    const videoUrl = processMediaUrl(e?.videoUrl);
    const coverImageUrl = processMediaUrl(e?.coverImageBase64 || e?.coverImage);
    
    // If video exists, show video only
    if (videoUrl) {
      return { type: 'video', url: videoUrl };
    }
    
    // If no video but cover image exists, show image
    if (coverImageUrl) {
      return { type: 'image', url: coverImageUrl };
    }
    
    return null;
  }, [e?.videoUrl, e?.coverImageBase64, e?.coverImage]);

  console.log({ 
    eventId: e?.id, 
    coverImage: e?.coverImageBase64, 
    videoUrl: e?.videoUrl,
    mediaToDisplay 
  });

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
      className="absolute bottom-0 right-3 z-30 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
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
        <>
          <button
            onClick={() => {
              navigate(`/event/${e.id}`);
              setOptionsMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors mb-1"
          >
            <Edit size={16} />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </>
      )}
    </div>
  );

  const allTags = [
    "Event",
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

  const cleanText = (htmlContent) => {
    if (!htmlContent) return "";
    const contentWithPeriods = htmlContent.replace(/<br\s*\/?>/gi, ". ");
    const div = document.createElement("div");
    div.innerHTML = contentWithPeriods;
    let textContent = div.textContent || div.innerText || "";
    textContent = textContent.replace(/\s+/g, " ").trim();
    return textContent;
  };

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
        className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${
          isDeleted ? "hidden" : ""
        }`}
      >
        {/* HEADER - Organizer/User Info */}
        <div className="px-4 pt-3 pb-2 flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Avatar */}
            <div
              className="cursor-pointer flex-shrink-0"
              onClick={(event) => {
                event.stopPropagation();
                if (e?.organizerUserId) {
                  navigate(`/profile/${e.organizerUserId}`);
                }
              }}
            >
              {e?.avatarUrl ? (
                <div className={`flex bg-white items-center justify-center w-20 h-20 ${
                  e?.postedBy?.accountType === "company" ? "rounded" : "rounded-full"
                } border border-gray-300 overflow-hidden`}>
                  <img
                    src={e.avatarUrl}
                    alt={e?.organizerUserName || "User"}
                    className="w-full h-full"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div className={`w-20 h-20 bg-gray-200 flex items-center justify-center ${
                  e?.postedBy?.accountType === "company" ? "rounded" : "rounded-full"
                } border border-gray-100`}>
                  <UserIcon size={24} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* Organizer/User Name and Meta */}
            <div className="flex-1 min-w-0">
              <div
                className="font-semibold text-sm text-gray-900 hover:underline cursor-pointer"
                onClick={(event) => {
                  event.stopPropagation();
                  if (e?.organizerUserId) {
                    navigate(`/profile/${e.organizerUserId}`);
                  }
                }}
              >
                {e?.organizerUserName || "User"}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {e?.profile?.professionalTitle || "Event Organizer"}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <span>{timeAgo}</span>
                <span>•</span>
                <Globe size={12} />
              </div>
            </div>
          </div>

          {/* Options Menu Toggle */}
          <div className="relative flex-shrink-0">
            {isOwner && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOptionsMenuOpen((s) => !s);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="More options"
              >
                <MoreVertical size={20} className="text-gray-600" />
              </button>
            )}
            {optionsMenuOpen && <OptionsMenu />}
          </div>
        </div>

        {/* POST CONTENT */}
        <div className="px-4 pb-3">
          {/* Event Title */}
          <h3
            className="font-semibold text-base text-gray-900 mb-1 hover:text-brand-600 cursor-pointer transition-colors"
            onClick={() => {
              if (isOwner) navigate(`/event/${e.id}`);
              else setEventDetailsOpen(true);
            }}
          >
            {e?.title}
          </h3>

          {/* Description */}
          <div className="text-sm text-gray-700 mb-2">
            <div className={showFullDescription ? "" : "line-clamp-3"}>
              {cleanText(e?.description)}
            </div>
            {e?.description && cleanText(e?.description).length > 250 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-gray-500 hover:text-brand-600 font-medium mt-1"
              >
                {showFullDescription ? "Show less" : "Show more"}
              </button>
            )}
          </div>

        </div>

        {/* MEDIA - Show either VIDEO or IMAGE (Video has priority) */}
        {settings?.contentType !== "text" && mediaToDisplay && (
          <div className="relative">
            {mediaToDisplay.type === 'video' ? (
              <VideoPlayer
                src={mediaToDisplay.url}
                alt="Event video"
              />
            ) : (
              <img
                src={mediaToDisplay.url}
                alt="Event cover"
                className="w-full max-h-96 object-cover cursor-pointer"
                onClick={() => setEventDetailsOpen(true)}
              />
            )}
          </div>
        )}

        {/* Tags and Match Percentage */}
        <div className="flex justify-between px-4 pt-3 pb-3">
          {allTags.length > 0 && (
            <div className="flex-1">
              <div className="flex flex-wrap gap-1.5 flex-1">
                {allTags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-brand-500"
                  >
                    #{tag.replace(/\s+/g, "")}
                  </span>
                ))}
                {allTags.length > 3 && (
                  <div className="relative inline-block group/tags">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-gray-600 bg-gray-100 cursor-help">
                      +{allTags.length - 3} more
                    </span>

                    {/* Tooltip with remaining tags */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible transition-opacity duration-200 group-hover/tags:opacity-100 group-hover/tags:visible z-10 whitespace-nowrap max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {allTags.slice(3).map((tag, i) => (
                          <span key={i} className="inline-block">
                            #{tag.replace(/\s+/g, "")}
                            {i < allTags.length - 4 ? "," : ""}
                          </span>
                        ))}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Match Percentage Badge */}
          <div>
            {matchPercentage > 0 && (
              <div
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  matchPercentage >= 80
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : matchPercentage >= 60
                    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                    : "bg-gray-100 text-gray-600 border border-gray-200"
                }`}
              >
                {matchPercentage}% match
              </div>
            )}
          </div>
        </div>

        {/* ENGAGEMENT BAR - Like/Comment counts */}
       
       {(likeCount > 0 || commentCount > 0) && (
      <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
        <div className="flex items-center gap-1">
          {likeCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <Heart size={10} className="text-white fill-white" />
                </div>
              </div>
              <button
                onClick={() => setLikesDialogOpen(true)}
                className="hover:underline cursor-pointer"
              >
                {likeCount} {likeCount === 1 ? 'like' : 'likes'}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {commentCount > 0 && (
            <button
              onClick={() => setCommentsDialogOpen(true)}
              className="hover:underline"
            >
              {commentCount} comment{commentCount !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>
    )}

        {/* ACTION BUTTONS */}
        <div className="px-2 py-1 border-t border-gray-100 grid grid-cols-4 gap-1">
          <button
            onClick={toggleLike}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium ${
              liked ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <Heart
              size={20}
              className={liked ? "fill-blue-600" : ""}
            />
            <span className="max-sm:hidden">Like</span>
          </button>

          <button
            onClick={() => setCommentsDialogOpen(true)}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-600"
          >
            <MessageCircle size={20} />
            <span className="max-sm:hidden">Comment</span>
          </button>

          <button
            onClick={() => {
              if (!user?.id) {
                data._showPopUp?.("login_prompt");
                return;
              } else {
                setReportOpen(true);
              }
            }}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-600"
          >
            <Flag size={20} />
            <span className="max-sm:hidden">Report</span>
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShareOpen((s) => !s);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-600"
            >
              <Share2 size={20} />
              <span className="max-sm:hidden">Share</span>
            </button>
            {shareOpen && <ShareMenu />}
          </div>
        </div>

        {/* REGISTRATION SECTION - Below actions */}
      
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              {/* Price */}
              {isPaid && (
                <div className="text-sm font-semibold text-gray-900">
                  {priceText}
                </div>
              )}

              {/* Location */}
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin size={14} />
                <span>
                  {e?.city ? `${e.city}, ` : ""}
                  {e?.country || "—"}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            {!isOwner && (<div className="flex items-center gap-2 mt-3">
              {registrationStatus === "registered" ? (
                <button className="flex-1 px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium text-sm flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Registered
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!user?.id) {
                      data._showPopUp("login_prompt");
                      return;
                    }
                    setRegistrationOpen(true);
                  }}
                  className="flex-1 px-4 py-2 rounded-full bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 transition-colors"
                >
                  Register
                </button>
              )}

              {connectionStatus !== "connected" && (
                <button
                  onClick={() => {
                    if (!user?.id) {
                      data._showPopUp("login_prompt");
                      return;
                    }
                    setModalOpen(true);
                  }}
                  className={`flex-1 px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                    connectionStatus === "pending_outgoing" ||
                    connectionStatus === "outgoing_pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : connectionStatus === "pending_incoming" ||
                        connectionStatus === "incoming_pending"
                      ? "bg-brand-100 text-brand-600 hover:bg-brand-200"
                      : "border-2 border-brand-600 text-brand-600 hover:bg-brand-50"
                  }`}
                >
                  {connectionStatus === "pending_outgoing" ||
                  connectionStatus === "outgoing_pending"
                    ? "Pending"
                    : connectionStatus === "pending_incoming" ||
                      connectionStatus === "incoming_pending"
                    ? "Respond"
                    : "Connect"}
                </button>
              )}
            </div> )}
          </div>
       
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

      <LikesDialog
            open={likesDialogOpen}
            onClose={() => setLikesDialogOpen(false)}
            entityType="event"
            entityId={e?.id}
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