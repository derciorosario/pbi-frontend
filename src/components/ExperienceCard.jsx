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
  const [openId, setOpenId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(item?.connectionStatus || "none");
  const [isHovered, setIsHovered] = useState(false);
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
  
  // Share popover
  const [shareOpen, setShareOpen] = useState(false);
  const shareMenuRef = useRef(null);
  const cardRef = useRef(null);
  
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

  const imageUrl =
    item?.images?.[0]?.base64url ||
    (typeof item?.images?.[0] === "string" ? item.images[0] : null) ||
    null;

  // Exactly 2 tags (use the provided tags array)
  const allTags = Array.isArray(item?.tags) ? item.tags.filter(Boolean) : [];
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
      <article
        ref={cardRef}
        className={`${containerBase} ${containerLayout} ${!isList && isHovered ? "transform -translate-y-1" : ""}`}
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
                  <img src={imageUrl} alt={item?.title} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {/* audience over image when image exists */}
                  {Array.isArray(item?.audienceCategories) && item.audienceCategories.length > 0 && (
                    <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                      {item.audienceCategories.map((c) => (
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


                {/* Share */}
                 <button
                onClick={() => {
                  if (isOwner) navigate(`/experience/${item.id}`);
                  else setExperienceDetailsOpen(true);
                }}
               className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                    aria-label={isOwner ? "Edit experience" : "View experience"}
              >
                {isOwner ? (
                  <Edit size={16} className="transition-transform duration-200 group-hover/view:scale-110" />
                ) : (
                  <Eye size={16} className="transition-transform duration-200 group-hover/view:scale-110" />
                )}
              </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareOpen((s) => !s);
                  }}
                  className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                  aria-label="Share experience"
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
                  alt={item?.title}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* audience over image when image exists */}
                {Array.isArray(item?.audienceCategories) && item.audienceCategories.length > 0 && (
                  <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                    {item.audienceCategories.map((c) => (
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

            {/* View & Share - only show when not text mode */}
            {settings?.contentType !== 'text' && (
              <div className="absolute top-4 right-4 flex gap-2">

                 <button
                onClick={() => {
                  if (isOwner) navigate(`/experience/${item.id}`);
                  else setExperienceDetailsOpen(true);
                }}
               className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                     aria-label={isOwner ? "Edit experience" : "View experience"}
              >
                {isOwner ? (
                  <Edit size={16} className="transition-transform duration-200 group-hover/view:scale-110" />
                ) : (
                  <Eye size={16} className="transition-transform duration-200 group-hover/view:scale-110" />
                )}
              </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareOpen((s) => !s);
                  }}
                  className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 group/share"
                  aria-label="Share experience"
                >
                  <Share2 size={16} className="text-gray-600 group-hover/share:text-brand-600 transition-colors duration-200" />
                </button>
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
                  onClick={() => {
                    if (isOwner) navigate(`/experience/${item.id}`);
                    else setExperienceDetailsOpen(true);
                  }}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                  aria-label={isOwner ? "Edit experience" : "View experience"}
                >
                  {isOwner ? <Edit size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareOpen((s) => !s);
                  }}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                  aria-label="Share experience"
                >
                  <Share2 size={16} className="text-gray-600" />
                </button>
              </div>
              {Array.isArray(item?.audienceCategories) &&
                item.audienceCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.audienceCategories.map((c) => (
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

          {/* Author + time */}
          <div className="text-xs text-gray-500">
            {item?.authorUserName} • {timeAgo}
          </div>

          {/* Title */}
          <h3 className="mt-1 font-semibold text-gray-900 text-lg">{item?.title}</h3>

          {/* audienceCategories HERE ONLY when there is NO image */}
          {!imageUrl && Array.isArray(item?.audienceCategories) && item.audienceCategories.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {item.audienceCategories.map((c) => (
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
          <p className={`text-sm text-gray-600 mt-2 leading-relaxed ${type=="list" ? "line-clamp-2 md:line-clamp-3" : "line-clamp-2"}`}>
            {item?.description}
          </p>

           {/* Meta row: author (opens profile) + match + time (duplicate time available above as author/time) */}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <div
              className="flex items-center gap-2 text-sm text-gray-600 _profile hover:underline cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (item?.authorUserId) {
                  setOpenId(item.authorUserId);
                }
              }}
            >
              {item?.avatarUrl ? (
                <img src={item.avatarUrl} alt={item?.authorUserName || "Author"} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 bg-brand-100 rounded-full grid place-items-center">
                  <UserIcon size={12} className="text-brand-600" />
                </div>
              )}
              <span className="font-medium">{item?.authorUserName || "Author"}</span>
            </div>

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

          {/* Optional fields (season / budget) */}
          <div className="mt-2 text-sm text-gray-700 space-y-1">
            {item?.season && <div><span className="font-medium">Best season:</span> {item.season}</div>}
            {item?.budgetRange && <div><span className="font-medium">Budget:</span> {item.budgetRange}</div>}
          </div>

          {/* Location & country */}
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <MapPin size={12} />
            {item?.location ? `${item.location}${item?.country ? `, ${item.country}` : ""}` : (item?.country || "—")}
          </div>

          {/* Tags — show exactly 2 + tooltip */}
          {!!visibleTags.length && (
            <div className="mt-3 mb-4 flex flex-wrap gap-2">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-50 to-brand-100 text-brand-700 px-3 py-1 text-xs font-medium border border-brand-200/50"
                >
                  {tag}
                </span>
              ))}
              {extraCount > 0 && (
                <div className="relative inline-block group/tagmore">
                  <span
                    className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs font-medium cursor-default hover:bg-gray-200 transition-colors duration-200"
                    aria-describedby={`experience-tags-more-${item.id}`}
                    tabIndex={0}
                  >
                    +{extraCount} more
                  </span>

                  <div
                    id={`experience-tags-more-${item.id}`}
                    role="tooltip"
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg
                    opacity-0 invisible transition-opacity duration-200
                    group-hover/tagmore:opacity-100 group-hover/tagmore:visible
                    focus-within:opacity-100 focus-within:visible z-10 whitespace-nowrap"
                  >
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {allTags.slice(2).map((t, i) => (
                        <span key={i} className="inline-block">
                          {t}
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
              title="Report this experience"
            >
              <Flag size={16} />
              <span>Report</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-auto pt-2">
            {/* View (Edit if owner) */}
            <button
              onClick={() => {
                if (isOwner) navigate(`/experience/${item.id}`);
                else setExperienceDetailsOpen(true);
              }}
              className="flex hidden items-center justify-center h-10 w-10 flex-shrink-0 rounded-xl border-2 border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200 group/view"
              aria-label={isOwner ? "Edit experience" : "View experience"}
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
                navigate(`/messages?userId=${item.authorUserId}`);
                toast.success("Starting conversation with " + (item.authorUserName || "experience author"));
              }}
              className="rounded-xl px-4 flex-1 py-2.5 text-sm font-medium bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Message
            </button>

            {/* Connect button with status */}
            {!isOwner && renderConnectButton()}
          </div>

         
        </div>

        {/* Subtle bottom gradient for depth (grid only) */}
        {!isList && (
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50" />
        )}

        {/* SHARE MENU - inside the card for proper positioning */}
        {shareOpen && <ShareMenu item={item} shareMenuRef={shareMenuRef} setShareOpen={setShareOpen} />}
      </article>

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={item?.authorUserId}
        toName={item?.authorUserName || "Experience Author"}
        onSent={onSent}
      />

      {/* Profile Modal */}
      <ProfileModal
        userId={openId}
        isOpen={!!openId}
        onClose={() => setOpenId(null)}
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
      className="absolute top-12 right-3 z-30 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
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
