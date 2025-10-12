// src/components/ExperienceCard.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../lib/toast";
import * as socialApi from "../api/social";
import ConfirmDialog from "./ConfirmDialog";
import CommentsDialog from "./CommentsDialog";
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
import ExperienceDetails from "./ExperienceDetails";

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

export default function ExperienceCard({
  item,
  type = "grid",        // "grid" | "list"
  matchPercentage = 20,  // optional % chip
}) {
  const navigate = useNavigate();
  const data = useData();
  const { user, settings } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(item?.connectionStatus || "none");
  const [experienceDetailsOpen, setExperienceDetailsOpen] = useState(false);

  // Social state
  const [liked, setLiked] = useState(!!item?.liked);
  const [likeCount, setLikeCount] = useState(Number(item?.likes || 0));
  const [commentCount, setCommentCount] = useState(
    Array.isArray(item?.comments) ? item.comments.length : Number(item?.commentsCount || 0)
  );

  // Report dialog
  const [reportOpen, setReportOpen] = useState(false);

  // Comments dialog
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);

  // Image slider state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Share popover
  const [shareOpen, setShareOpen] = useState(false);
  const shareMenuRef = useRef(null);
  const cardRef = useRef(null);

  // Options menu
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const optionsMenuRef = useRef(null);
  
  // Close share menu and options menu on outside click / Esc
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
      }
    }
    function onEsc(e) {
      if (e.key === "Escape") {
        setShareOpen(false);
        setOptionsMenuOpen(false);
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
    if (!item?.id) return;
    socialApi
      .getLikeStatus("experience", item.id)
      .then(({ data }) => {
        setLiked(data.liked);
        setLikeCount(data.count);
      })
      .catch(() => {});
    socialApi
      .getComments("experience", item.id)
      .then(({ data }) => {
        const len = Array.isArray(data) ? data.length : 0;
        setCommentCount(len);
      })
      .catch(() => {});
  }, [item?.id]);

  const isOwner = !!user?.id && item?.authorUserId === user.id;
  const isList = type === "list";

  // Get all valid images for slider
  const getValidImages = () => {
    const images = item?.images || [];
    const validImages = [];

    images.forEach(img => {
      let imageUrl = img?.base64url || (typeof img === "string" ? img : null);
      if (imageUrl) {
        validImages.push(imageUrl);
      }
    });

    return validImages;
  };

  const validImages = getValidImages();
  const hasMultipleImages = validImages.length > 1;

  // Exactly 2 tags (use the provided tags array)
  const allTags = [
    "Tourism",
    ...(Array.isArray(item?.audienceCategories) ? item?.audienceCategories.map(i=>i.name) : []),
    ...(Array.isArray(item?.tags) ? item.tags.filter(Boolean) : [])
  ];
  const visibleTags = allTags.slice(0, 2);
  const extraCount = Math.max(0, allTags.length - visibleTags.length);

  const timeAgo = useMemo(
    () => computeTimeAgo(item?.timeAgo, item?.createdAt),
    [item?.timeAgo, item?.createdAt]
  );

  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
    setConnectionStatus("pending_outgoing");
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
      const { data } = await socialApi.toggleLike("experience", item.id);
      setLiked(data.liked);
      setLikeCount(data.count);
    } catch (error) {
      setLiked((p) => !p);
      setLikeCount((n) => (liked ? n + 1 : Math.max(0, n - 1)));
    }
  };

  /* ----------------------- Report handler ----------------------- */
  const reportExperience = async (description) => {
    try {
      await socialApi.reportContent("experience", item.id, "other", description);
      toast.success("Report submitted. Thank you.");
    } catch (e) {
      toast.success("Report submitted. Thank you.");
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* HEADER - Author/User Info */}
        <div className="px-4 pt-3 pb-2 flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Avatar */}
            <div
              className="cursor-pointer flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                if (item?.authorUserId) {
                  navigate(`/profile/${item.authorUserId}`);
                }
              }}
            >
              {item?.avatarUrl ? (
                <div className={`flex bg-white items-center justify-center w-20 h-20 ${
                  item?.author?.accountType === "company" ? "rounded" : "rounded-full"
                } border border-gray-300 overflow-hidden`}>
                  <img
                    src={item.avatarUrl}
                    alt={item?.authorUserName || "User"}
                    className="w-full h-full"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div className={`w-20 h-20 bg-gray-200 flex items-center justify-center ${
                  item?.author?.accountType === "company" ? "rounded" : "rounded-full"
                } border border-gray-100`}>
                  <UserIcon size={24} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* Author/User Name and Meta */}
            <div className="flex-1 min-w-0">
              <div
                className="font-semibold text-sm text-gray-900 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (item?.authorUserId) {
                    navigate(`/profile/${item.authorUserId}`);
                  }
                }}
              >
                {item?.authorUserName || "User"}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {item?.profile?.professionalTitle || "Experience Author"}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <span>{timeAgo}</span>
                <span>•</span>
                <Globe size={12} />
              </div>
            </div>
          </div>
        </div>

        {/* POST CONTENT */}
        <div className="px-4 pb-3">
          {/* Experience Title */}
          <h3
            className="font-semibold text-base text-gray-900 mb-1 hover:text-brand-600 cursor-pointer transition-colors"
            onClick={() => {
              if (isOwner) navigate(`/experience/${item.id}`);
              else setExperienceDetailsOpen(true);
            }}
          >
            {item?.title}
          </h3>

          {/* Description */}
          <div className="text-sm text-gray-700 mb-2">
            <div className="line-clamp-3">
              {item?.description}
            </div>
          </div>

        </div>

        {/* IMAGE (if exists and not in text mode) */}
        {settings?.contentType !== "text" && validImages.length > 0 && (
          <div className="relative">
            {/* Image Slider */}
            <div className="relative w-full max-h-96 overflow-hidden">
              {hasMultipleImages ? (
                <div
                  className="flex w-full h-full transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                >
                  {validImages.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${item?.title} - ${index + 1}`}
                      className="flex-shrink-0 w-full max-h-96 object-cover"
                    />
                  ))}
                </div>
              ) : (
                <img
                  src={validImages[0]}
                  alt={item?.title}
                  className="w-full max-h-96 object-cover"
                />
              )}
            </div>

            {/* Slider Dots */}
            {hasMultipleImages && (
              <div className="absolute bottom-3 right-3 flex gap-1">
                {validImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-[10px] h-[10px] rounded-full border border-gray-300 transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tags and Match Percentage */}
        <div className="flex justify-between px-4 pt-3 pb-3">
          {!!visibleTags.length && (
            <div className="flex-1">
              <div className="flex flex-wrap gap-1.5 flex-1">
                {visibleTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-brand-500"
                  >
                    #{tag.replace(/\s+/g, "")}
                  </span>
                ))}
                {extraCount > 0 && (
                  <div className="relative inline-block group/tags">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-gray-600 bg-gray-100 cursor-help">
                      +{extraCount} more
                    </span>

                    {/* Tooltip with remaining tags */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible transition-opacity duration-200 group-hover/tags:opacity-100 group-hover/tags:visible z-10 whitespace-nowrap max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {allTags.slice(2).map((tag, i) => (
                          <span key={i} className="inline-block">
                            #{tag.replace(/\s+/g, "")}
                            {i < allTags.length - 3 ? "," : ""}
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
            {shareOpen && <ShareMenu item={item} shareMenuRef={shareMenuRef} setShareOpen={setShareOpen} />}
          </div>
        </div>

        {/* BOTTOM SECTION - Message and Connect */}
        {!isOwner && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              {/* Location */}
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin size={14} />
                <span>
                  {item?.location ? `${item.location}${item?.country ? `, ${item.country}` : ""}` : (item?.country || "—")}
                </span>
              </div>

              {/* Optional fields (season / budget) */}
              {item?.season && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Best season:</span> {item.season}
                </div>
              )}
              {item?.budgetRange && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Budget:</span> {item.budgetRange}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => {
                  if (!user?.id) {
                    data._showPopUp("login_prompt");
                    return;
                  }
                  navigate(`/messages?userId=${item.authorUserId}`);
                  toast.success("Starting conversation with " + (item.authorUserName || "experience author"));
                }}
                className="flex-1 px-4 py-2 rounded-full bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 transition-colors"
              >
                Message
              </button>

              {connectionStatus !== "connected" && renderConnectButton()}
            </div>
          </div>
        )}
      </div>

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={item?.authorUserId}
        toName={item?.authorUserName || "Experience Author"}
        onSent={onSent}
      />

      {/* Experience Details Modal */}
      <ExperienceDetails
        experienceId={item?.id}
        isOpen={experienceDetailsOpen}
        onClose={() => setExperienceDetailsOpen(false)}
      />

      {/* Report dialog */}
      <ConfirmDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report this experience?"
        text="Tell us what's happening. Our team will review."
        confirmText="Submit report"
        cancelText="Cancel"
        withInput
        inputType="textarea"
        inputLabel="Report details"
        inputPlaceholder="Describe the issue (spam, scam, offensive, etc.)"
        requireValue
        onConfirm={reportExperience}
      />

      {/* Comments Dialog */}
      <CommentsDialog
        open={commentsDialogOpen}
        onClose={() => setCommentsDialogOpen(false)}
        entityType="experience"
        entityId={item?.id}
        currentUser={user}
        onCountChange={(n) => setCommentCount(n)}
      />
    </>
  );

  // --- helpers ---
  function renderConnectButton() {
    const status = (connectionStatus || item?.connectionStatus || "none")?.toLowerCase();

    if (status === "connected") {
      return (
        <button className="flex-1 px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium text-sm">
          Connected
        </button>
      );
    }
    if (status === "pending_outgoing" || status === "outgoing_pending" || status === "pending") {
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

  const OptionsMenu = () => (
    <div
      ref={optionsMenuRef}
      className="absolute z-30 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-xl top-12 right-3"
      role="dialog"
      aria-label="Options menu"
    >
      <button
        onClick={() => {
          navigate(`/experience/${item.id}`);
          setOptionsMenuOpen(false);
        }}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors mb-1"
      >
        <Edit size={16} />
        Edit
      </button>
    </div>
  );
};

// Share data and components
const ShareMenu = ({ item, shareMenuRef, setShareOpen }) => {
  const shareUrl = `${window.location.origin}/experience/${item?.id}`;
  const shareTitle = item?.title || "Experience on 54Links";
  const shareQuote = (item?.description || "").slice(0, 160) + ((item?.description || "").length > 160 ? "…" : "");
  const shareHashtags = ["54Links", "Tourism", "Travel", "Experience"].filter(Boolean);
  const messengerAppId = import.meta?.env?.VITE_FACEBOOK_APP_ID || undefined;

  return (
    <div
      ref={shareMenuRef}
      className="absolute bottom-0 right-3 z-30 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
      role="dialog"
      aria-label="Share options"
    >
      <div className="text-xs font-medium text-gray-500 px-1 pb-2">
        Share this experience
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
