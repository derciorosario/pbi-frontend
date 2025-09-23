// src/components/MomentCard.jsx
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
import ConfirmDialog from "./ConfirmDialog";
import CommentsDialog from "./CommentsDialog";
import MomentDetails from "./MomentDetails";
import LogoGray from '../assets/logo.png'

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


export default function MomentCard({
  moment,
  onEdit,
  onDelete,
  type = "grid", // "grid" | "list"
  matchPercentage = 20, // show % chip
}) {
  const { user, settings } = useAuth();
  const navigate = useNavigate();
  const data = useData();

  const [isHovered, setIsHovered] = useState(false);
  const [modalOpen, setModalOpen] = useState(false); // connect modal
  const [openId, setOpenId] = useState(null); // profile modal
  const [connectionStatus, setConnectionStatus] = useState(
    moment?.connectionStatus || "none"
  );

  // Social state
  const [liked, setLiked] = useState(!!moment?.liked);
  const [likeCount, setLikeCount] = useState(Number(moment?.likes || 0));
  const [commentCount, setCommentCount] = useState(
    Array.isArray(moment?.comments) ? moment.comments.length : Number(moment?.commentsCount || 0)
  );

  // Report dialog
  const [reportOpen, setReportOpen] = useState(false);

  // Share popover
  const [shareOpen, setShareOpen] = useState(false);
  const shareMenuRef = useRef(null);
  const cardRef = useRef(null);

  // Comments dialog
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);

  // Moment details modal
  const [momentDetailsOpen, setMomentDetailsOpen] = useState(false);

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

  // Initial fetch for like & comments count (optional)
  useEffect(() => {
    if (!moment?.id) return;
    socialApi
      .getLikeStatus("moment", moment.id)
      .then(({ data }) => {
        setLiked(data.liked);
        setLikeCount(data.count);
      })
      .catch(() => {});
    socialApi
      .getComments("moment", moment.id)
      .then(({ data }) => {
        const len = Array.isArray(data) ? data.length : 0;
        setCommentCount(len);
      })
      .catch(() => {});
  }, [moment?.id]);

  const isOwner =
    user?.id && moment?.userId && user.id === moment.userId;
  const isList = type === "list";
  // Get first valid image from images or attachments arrays
  const imageUrl = useMemo(() => {
    // Check images array first (for moments) - find first valid image
    if (moment?.images?.length > 0) {
      for (const image of moment.images) {
        if (typeof image === 'string' && image.startsWith('data:image')) {
          return image;
        } else if (image?.base64url && image.base64url.startsWith('data:image')) {
          return image.base64url;
        }
      }
    }

    // Check attachments array as fallback - find first valid image
    if (moment?.attachments?.length > 0) {
      for (const attachment of moment.attachments) {
        if (attachment?.base64url && attachment.base64url.startsWith('data:image')) {
          return attachment.base64url;
        }
      }
    }

    return null;
  }, [moment?.images, moment?.attachments]);


  const locationLabel = useMemo(() => {
      const city = moment?.city?.trim();
      const country = moment?.country?.trim();
      if (city && country) return `${city}, ${country}`;
      if (country) return country;
      if (city) return city;
      return "";
  }, [moment?.city, moment?.country]);
  


  const allTags = useMemo(() => {
    const apiTags = Array.isArray(moment?.tags) ? moment.tags : [];
    const constructedTags = [
      moment?.relatedEntityType,
      moment?.type,
      moment?.categoryName,
      moment?.subcategoryName,
    ].filter(Boolean);

    // Combine with relatedEntityType first, then deduplicate
    return [...new Set([moment?.relatedEntityType, ...apiTags, ...constructedTags.slice(1)])].filter(Boolean);
  }, [moment?.tags, moment?.relatedEntityType, moment?.type, moment?.categoryName, moment?.subcategoryName]);
  const visibleTags = allTags.slice(0, 2);
  const extraCount = Math.max(0, allTags.length - visibleTags.length);

  const timeAgo = useMemo(
    () => computeTimeAgo(moment?.timeAgo, moment?.createdAt),
    [moment?.timeAgo, moment?.createdAt]
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
      const { data } = await socialApi.toggleLike("moment", moment.id);
      setLiked(data.liked);
      setLikeCount(data.count);
    } catch (error) {
      setLiked((p) => !p);
      setLikeCount((n) => (liked ? n + 1 : Math.max(0, n - 1)));
    }
  };

  /* ----------------------- Report handler ----------------------- */
  const reportMoment = async (description) => {
    try {
      await socialApi.reportContent("moment", moment.id, "other", description);
      toast.success("Report submitted. Thank you.");
    } catch (e) {
      toast.success("Report submitted. Thank you.");
    }
  };

  /* ----------------------- Share data ----------------------- */
  const shareUrl = `${window.location.origin}/moment/${moment?.id}`;
  const shareTitle = moment?.title || "Moment on 54Links";
  const shareQuote =
    (moment?.description || "").slice(0, 160) +
    ((moment?.description || "").length > 160 ? "…" : "");
  const shareHashtags = ["54Links", "Moments", "Achievements"].filter(Boolean);
  const messengerAppId =
    import.meta?.env?.VITE_FACEBOOK_APP_ID || undefined; // optional

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
        Share this moment
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

        {/* Messenger requires an appId; only show if provided */}
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

  /* -------------------------------------------------------------- */

  return (
    <>
      <div
        ref={cardRef}
        className={`${containerBase} ${containerLayout} ${
          !isList && isHovered ? "transform -translate-y-1" : ""
        }`}
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
                  <img
                    src={imageUrl}
                    alt={moment?.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {/* audience on IMAGE when there IS image */}
                  {Array.isArray(moment?.audienceCategories) &&
                    moment.audienceCategories.length > 0 && (
                      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                        {moment.audienceCategories.map((c) => (
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
                <div className="absolute inset-0 w-full h-full bg-gray-200 flex justify-center items-center">
                    <img src={LogoGray} className="w-[100px]"/>
                </div>
              )}

              {/* Quick actions on image */}
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={() => {
                    if (isOwner) navigate(`/moment/${moment.id}`);
                    else setMomentDetailsOpen(true);
                  }}
                  className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                  aria-label={isOwner ? "Edit moment" : "View moment"}
                >
                  {isOwner ? <Edit size={16} /> : <Eye size={16} />}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareOpen((s) => !s);
                  }}
                  className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                  aria-label="Share moment"
                >
                  <Share2 size={16} className="text-gray-600" />
                </button>
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
                  alt={moment?.title}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {Array.isArray(moment?.audienceCategories) &&
                  moment.audienceCategories.length > 0 && (
                    <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                      {moment.audienceCategories.map((c) => (
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
              <div className="w-full h-48 bg-gray-200 flex justify-center items-center">
                  <img src={LogoGray} className="w-[100px]"/>
              </div>
            )}

            {/* View & Share - only show when not text mode */}
            {settings?.contentType !== 'text' && (
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => {
                    if (isOwner) navigate(`/moment/${moment.id}`);
                    else setMomentDetailsOpen(true);
                  }}
                  className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                  aria-label={isOwner ? "Edit moment" : "View moment"}
                >
                  {isOwner ? <Edit size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareOpen((s) => !s);
                  }}
                  className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 group/share"
                  aria-label="Share moment"
                >
                  <Share2
                    size={16}
                    className="text-gray-600 group-hover/share:text-brand-600 transition-colors duration-200"
                  />
                </button>
              </div>
            )}
          </div>
        )}

        {/* SHARE MENU (common absolute anchor on the card) */}
        {shareOpen && <ShareMenu />}

        {/* CONTENT SIDE */}
        <div className={`${isList ? "p-4 md:p-5" : "p-5"} flex flex-col flex-1`}>
          {/* Text mode: Buttons and audience categories at top */}
          {settings?.contentType === 'text' && (
            <div className={`${!isList ? 'flex-col gap-y-2':'items-center justify-between gap-2'} flex  mb-3`}>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (isOwner) navigate(`/moment/${moment.id}`);
                    else setMomentDetailsOpen(true);
                  }}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                  aria-label={isOwner ? "Edit moment" : "View moment"}
                >
                  {isOwner ? <Edit size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareOpen((s) => !s);
                  }}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                  aria-label="Share moment"
                >
                  <Share2 size={16} className="text-gray-600" />
                </button>
              </div>
              {Array.isArray(moment?.audienceCategories) &&
                moment.audienceCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {moment.audienceCategories.map((c) => (
                      <span
                        key={c.id || c.name}
                        className="inline-flex items-center gap-1 bg-brand-50 text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-lg text-gray-900 mb-0.5 group-hover:text-brand-600 transition-colors duration-200">
            {moment?.title}
          </h3>

          {/* audienceCategories HERE ONLY when there is NO image */}
          {!imageUrl &&
            Array.isArray(moment?.audienceCategories) &&
            moment.audienceCategories.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2">
                {moment.audienceCategories.map((c) => (
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
          <p
            className={`mt-2 text-sm text-gray-600 leading-relaxed ${
              isList ? "line-clamp-2 md:line-clamp-3" : "line-clamp-2"
            }`}
          >
            {moment?.description}
          </p>

         
         
          {/* Meta */}
          <div className={`${isList ? "mb-2" : "mb-3"} space-y-2`}>
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-2 text-sm text-gray-600 _profile hover:underline cursor-pointer"
                onClick={() => {
                  if (moment?.userId) {
                    setOpenId(moment.userId);
                    data._showPopUp?.("profile");
                  }
                }}
              >
                {moment?.user?.avatarUrl || moment?.userAvatarUrl ? (
                  <img
                    src={moment.user?.avatarUrl || moment.userAvatarUrl}
                    alt={moment?.user?.name || moment?.userName || "User"}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 bg-brand-100 rounded-full grid place-items-center">
                    <UserIcon size={12} className="text-brand-600" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-medium">
                    {moment?.user?.name || moment?.userName || "User"}
                  </span>
                </div>
              </div>

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

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {timeAgo}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {locationLabel}
              </span>
            </div>
          </div>

          {/* Tags */}
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
                    aria-describedby={`moment-tags-more-${moment.id}`}
                    tabIndex={0}
                  >
                    +{extraCount} more
                  </span>

                  <div
                    id={`moment-tags-more-${moment.id}`}
                    role="tooltip"
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible transition-opacity duration-200 group-hover/tagmore:opacity-100 group-hover/tagmore:visible focus-within:opacity-100 focus-within:visible z-10 whitespace-nowrap"
                    aria-describedby={`moment-tags-more-${moment.id}`}
                  >
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {allTags.slice(2).map((tag, i) => (
                        <span key={i} className="inline-block">
                          {tag}
                          {i < allTags.length - 3 ? "," : ""}
                        </span>
                      ))}
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
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
              onClick={() => setReportOpen(true)}
              className="inline-flex items-center gap-1 hover:text-rose-700"
              title="Report this moment"
            >
              <Flag size={16} />
              <span>Report</span>
            </button>
          </div>

          {/* Actions */}
          <div
            className={`flex items-center gap-2 mt-auto pt-2 ${
              isList ? "justify-end md:justify-start" : ""
            }`}
          >
            <button
              onClick={() => {
                if (isOwner) navigate(`/moment/${moment.id}`);
                else navigate(`/moment/${moment.id}`);
              }}
              className="flex items-center hidden justify-center h-10 w-10 flex-shrink-0 rounded-xl border-2 border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200 group/view"
              aria-label={isOwner ? "Edit moment" : "View moment"}
            >
              {isOwner ? (
                <Edit size={16} className="transition-transform duration-200 group-hover/view:scale-110" />
              ) : (
                <Eye size={16} className="transition-transform duration-200 group-hover/view:scale-110" />
              )}
            </button>

            <button
              onClick={() => {
                if (!user?.id) {
                  data._showPopUp("login_prompt");
                  return;
                }
                navigate(`/messages?userId=${moment.userId}`);
                toast.success(
                  "Starting conversation with " +
                    (moment.user?.name || moment.userName || "user")
                );
              }}
              className={`${
                type === "grid" ? "flex-1" : ""
              } rounded-xl px-4 py-2.5 text-sm font-medium bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md`}
            >
              <span>Message</span>
            </button>

            {!isOwner && renderConnectButton()}
          </div>
        </div>

        {!isList && (
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50" />
        )}
      </div>

      {/* Modals */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={moment?.userId}
        toName={moment?.user?.name || moment?.userName || "User"}
        onSent={onSent}
      />

      <ProfileModal
        userId={openId}
        isOpen={!!openId}
        onClose={() => setOpenId(null)}
        onSent={onSent}
      />

      {/* Report dialog */}
      <ConfirmDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report this moment?"
        text="Tell us what's happening. Our team will review."
        confirmText="Submit report"
        cancelText="Cancel"
        withInput
        inputType="textarea"
        inputLabel="Report details"
        inputPlaceholder="Describe the issue (spam, scam, offensive, etc.)"
        requireValue
        onConfirm={reportMoment}
      />

      {/* Comments Dialog */}
      <CommentsDialog
        open={commentsDialogOpen}
        onClose={() => setCommentsDialogOpen(false)}
        entityType="moment"
        entityId={moment?.id}
        currentUser={user}
        onCountChange={(n) => setCommentCount(n)}
      />

      {/* Moment Details Modal */}
      <MomentDetails
        momentId={moment?.id}
        isOpen={momentDetailsOpen}
        onClose={() => setMomentDetailsOpen(false)}
        item={moment}
      />
    </>
  );

  function renderConnectButton() {
    const status = connectionStatus || moment?.connectionStatus || "none";

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