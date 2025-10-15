// src/components/NeedCard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { toast } from "../lib/toast";
import * as socialApi from "../api/social";
import {
  Edit,
  Eye,
  Share2,
  MapPin,
  Clock,
  Heart,
  MessageCircle,
  Flag,
  User as UserIcon,
  Copy as CopyIcon,
  MoreVertical,
  Trash2,
  Globe,
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
  FacebookMessengerShareButton,
  FacebookMessengerIcon,
} from "react-share";
import ConnectionRequestModal from "./ConnectionRequestModal";
import ProfileModal from "./ProfileModal";
import NeedDetails from "./NeedDetails";
import ConfirmDialog from "./ConfirmDialog";
import CommentsDialog from "./CommentsDialog";
import LogoGray from '../assets/logo.png';

function computeTimeAgo(explicit, createdAt) {
  if (explicit) return explicit;
  if (!createdAt) return "";
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export default function NeedCard({
  need,
  onEdit,
  onDelete,
  type = "grid",
  matchPercentage = 0,
}) {
  const { user, settings } = useAuth();
  const navigate = useNavigate();
  const data = useData();

  const [modalOpen, setModalOpen] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(
    need?.connectionStatus || "none"
  );
  const [needDetailsOpen, setNeedDetailsOpen] = useState(false);

  // Social state
  const [liked, setLiked] = useState(!!need?.liked);
  const [likeCount, setLikeCount] = useState(Number(need?.likes || 0));
  const [commentCount, setCommentCount] = useState(
    Array.isArray(need?.comments) ? need.comments.length : Number(need?.commentsCount || 0)
  );

  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const shareMenuRef = useRef(null);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const optionsMenuRef = useRef(null);

  useEffect(() => {
    function onDown(e) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target)) {
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

  useEffect(() => {
    if (!need?.id) return;
    socialApi
      .getLikeStatus("need", need.id)
      .then(({ data }) => {
        setLiked(data.liked);
        setLikeCount(data.count);
      })
      .catch(() => {});
    socialApi
      .getComments("need", need.id)
      .then(({ data }) => {
        const len = Array.isArray(data) ? data.length : 0;
        setCommentCount(len);
      })
      .catch(() => {});
  }, [need?.id]);

  const isOwner =
    user?.id && need?.userId && user.id === need.userId;

  // Get all valid images for slider
  const getValidImages = () => {
    const validImages = [];

    if (need?.attachments?.length > 0) {
      for (const attachment of need.attachments) {
        if (attachment?.base64url &&
            (attachment.base64url.startsWith('data:image') ||
             attachment.base64url.startsWith("http://") ||
             attachment.base64url.startsWith("https://"))) {
          validImages.push(attachment.base64url);
        }
      }
    }

    return validImages;
  };

  const validImages = getValidImages();
  const hasMultipleImages = validImages.length > 1;

  const allTags = useMemo(() => {
    const apiTags = Array.isArray(need?.tags) ? need.tags : [];
    const constructedTags = [
      need?.relatedEntityType,
      need?.urgency,
      need?.categoryName,
      need?.subcategoryName,
    ].filter(Boolean);

    // Combine with audienceCategories first, then relatedEntityType, then deduplicate
    return [...new Set([
      (need?.relatedEntityType == "job" ? 'Job Seeker':''),
      ...(Array.isArray(need?.audienceCategories) ? need?.audienceCategories.map(i=>i.name) : []),
      need?.relatedEntityType,
      ...apiTags,
      ...constructedTags.slice(1)
    ])].filter(Boolean);
  }, [need?.audienceCategories, need?.tags, need?.relatedEntityType, need?.urgency, need?.categoryName, need?.subcategoryName]);

  const timeAgo = useMemo(
    () => computeTimeAgo(need?.timeAgo, need?.createdAt),
    [need?.timeAgo, need?.createdAt]
  );

  const locationLabel = useMemo(() => {
    const city = need?.city?.trim();
    const country = need?.country?.trim();
    if (city && country) return `${city}, ${country}`;
    if (country) return country;
    if (city) return city;
    return "";
  }, [need?.city, need?.country]);

  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
    setConnectionStatus("pending_outgoing");
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

  const toggleLike = async () => {
    if (!user?.id) {
      data._showPopUp?.("login_prompt");
      return;
    }
    setLiked((p) => !p);
    setLikeCount((n) => (liked ? Math.max(0, n - 1) : n + 1));
    try {
      const { data } = await socialApi.toggleLike("need", need.id);
      setLiked(data.liked);
      setLikeCount(data.count);
    } catch (error) {
      setLiked((p) => !p);
      setLikeCount((n) => (liked ? n + 1 : Math.max(0, n - 1)));
    }
  };

  const reportNeed = async (description) => {
    try {
      await socialApi.reportContent("need", need.id, "other", description);
      toast.success("Report submitted. Thank you.");
    } catch (e) {
      toast.success("Report submitted. Thank you.");
    }
  };

  const shareUrl = `${window.location.origin}/need/${need?.id}`;
  const shareTitle = need?.title || "Need on 54Links";
  const shareQuote =
    (need?.description || "").slice(0, 160) +
    ((need?.description || "").length > 160 ? "…" : "");
  const shareHashtags = ["54Links", "Needs", "Help"].filter(Boolean);
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
      className="absolute z-30 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl bottom-0 right-3"
      role="dialog"
      aria-label="Share options"
    >
      <div className="text-xs font-medium text-gray-500 px-1 pb-2">
        Share this need
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
        <>
          <div className="px-3 py-2 text-sm font-medium text-gray-900 border-b border-gray-200 mb-2">
            Delete this need?
          </div>
          <button
            onClick={async () => {
              try {
                await socialApi.deleteNeed(need.id);
                toast.success("Need deleted successfully");
                setIsDeleted(true);
                if (onDelete) {
                  onDelete(need);
                }
              } catch (error) {
                console.error("Failed to delete need:", error);
                toast.error(
                  error?.response?.data?.message || "Failed to delete need"
                );
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
              navigate(`/need/${need.id}`);
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

  return (
    <>
      <div
        className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${
          isDeleted ? "hidden" : ""
        }`}
      >
        {/* HEADER - User Info */}
        <div className="px-4 pt-3 pb-2 flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Avatar */}
            <div
              className="cursor-pointer flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                if (need?.userId) {
                  navigate(`/profile/${need.userId}`);
                }
              }}
            >
              {need?.userAvatarUrl ? (
                <div className="flex bg-white items-center justify-center w-20 h-20 rounded-full border border-gray-300 overflow-hidden">
                  <img
                    src={need.userAvatarUrl}
                    alt={need?.userName || "User"}
                    className="w-full h-full"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div className="w-20 h-20 bg-gray-200 flex items-center justify-center rounded-full border border-gray-100">
                  <UserIcon size={24} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* User Name and Meta */}
            <div className="flex-1 min-w-0">
              <div
                className="font-semibold text-sm text-gray-900 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (need?.userId) {
                    navigate(`/profile/${need.userId}`);
                  }
                }}
              >
                {need?.userName || "User"}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {need?.profile?.professionalTitle || "Need Poster"}
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
          {/* Need Title */}
         
         {/** <h3
            className="font-semibold text-base text-gray-900 mb-1 hover:text-brand-600 cursor-pointer transition-colors"
            onClick={() => {
              if (isOwner) navigate(`/need/${need.id}`);
              else setNeedDetailsOpen(true);
            }}
          >
            {need?.title}
          </h3> */}

          {/* Description */}
          <div className="text-sm text-gray-700 mb-2">
            <div className={showFullDescription ? "" : "line-clamp-3"}>
              {cleanText(need?.description)}
            </div>
            {need?.description && cleanText(need?.description).length > 250 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-gray-500 hover:text-brand-600 font-medium mt-1"
              >
                {showFullDescription ? "Show less" : "...more"}
              </button>
            )}
          </div>

          {/* Budget */}
          {need?.budget && (
            <div className="text-sm font-semibold text-gray-900 mb-2">
              {need.budget}
            </div>
          )}

        </div>

        {/* IMAGE (if exists and not in text mode) */}
        {settings?.contentType !== "text" && validImages.length > 0 && (
          <div className="relative">
            <img
              src={validImages[0]}
              alt={need?.title}
              className="w-full max-h-96 object-cover cursor-pointer"
              onClick={() => setNeedDetailsOpen(true)}
            />
          </div>
        )}

        {/* Tags and Match Percentage */}
        <div className="flex justify-between px-4 pt-3 pb-3">
          {(allTags.length > 0 || true) && (
            <div className="flex-1">
              <div className="flex flex-wrap gap-1.5 flex-1">
                {/* "Looking for" badge */}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200">
                  Looking for
                </span>
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
                  <span>
                   {likeCount}
                  </span>
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

        {/* BOTTOM SECTION - Message and Connect */}
       
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              {/* Location */}
              {locationLabel && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin size={14} />
                  <span>{locationLabel}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
             {!isOwner && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => {
                  if (!user?.id) {
                    data._showPopUp("login_prompt");
                    return;
                  }
                  navigate(`/messages?userId=${need.userId}`);
                  toast.success(
                    "Starting conversation with " +
                      (need.userName || "user")
                  );
                }}
                className="flex-1 px-4 py-2 rounded-full bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 transition-colors"
              >
                Message
              </button>

              {connectionStatus !== "connected" && renderConnectButton()}
            </div> )}

          </div>
       
      </div>

      {/* Modals */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={need?.userId}
        toName={need?.userName || "User"}
        onSent={onSent}
      />

      <ProfileModal
        userId={openId}
        isOpen={!!openId}
        onClose={() => setOpenId(null)}
        onSent={onSent}
      />

      <NeedDetails needId={need?.id} isOpen={needDetailsOpen} onClose={() => setNeedDetailsOpen(false)} />

      <ConfirmDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report this need?"
        text="Tell us what's happening. Our team will review."
        confirmText="Submit report"
        cancelText="Cancel"
        withInput
        inputType="textarea"
        inputLabel="Report details"
        inputPlaceholder="Describe the issue (spam, scam, offensive, etc.)"
        requireValue
        onConfirm={reportNeed}
      />

      <CommentsDialog
        open={commentsDialogOpen}
        onClose={() => setCommentsDialogOpen(false)}
        entityType="need"
        entityId={need?.id}
        currentUser={user}
        onCountChange={(n) => setCommentCount(n)}
      />
    </>
  );

  function renderConnectButton() {
    const status = connectionStatus || need?.connectionStatus || "none";

    if (status === "connected") {
      return (
        <button className="flex-1 px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium text-sm">
          Connected
        </button>
      );
    }
    if (status === "pending_outgoing" || status === "outgoing_pending") {
      return (
        <button className="flex-1 px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 font-medium text-sm">
          Pending
        </button>
      );
    }
    if (status === "pending_incoming" || status === "incoming_pending") {
      return (
        <button
          onClick={() => navigate("/notifications")}
          className="flex-1 px-4 py-2 rounded-full bg-brand-100 text-brand-600 hover:bg-brand-200 font-medium text-sm transition-colors"
        >
          Respond
        </button>
      );
    }
    if (!user?.id) {
      return (
        <button
          onClick={() => data._showPopUp("login_prompt")}
          className="flex-1 px-4 py-2 rounded-full font-medium text-sm transition-colors border-2 border-brand-600 text-brand-600 hover:bg-brand-50"
        >
          Connect
        </button>
      );
    }
    return (
      <button
        onClick={() => setModalOpen(true)}
        className="flex-1 px-4 py-2 rounded-full font-medium text-sm transition-colors border-2 border-brand-600 text-brand-600 hover:bg-brand-50"
      >
        Connect
      </button>
    );
  }
}