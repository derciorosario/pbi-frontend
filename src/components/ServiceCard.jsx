
// src/components/ServiceCard.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  User as UserIcon,
  Clock,
  Eye,
  Edit,
  Heart,
  Flag,
  MessageCircle,
  Share2,
  Copy as CopyIcon,
  MoreVertical,
  Trash2,
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
import ServiceDetails from "./ServiceDetails";
import ProfileModal from "./ProfileModal";
import { useData } from "../contexts/DataContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { toast } from "../lib/toast";
import * as socialApi from "../api/social";
import ConfirmDialog from "./ConfirmDialog";
import CommentsDialog from "./CommentsDialog";

export default function ServiceCard({
  item,
  currentUserId,
  currency = "USD",
  onDetails,
  onContact,
  onConnect,
  onEdit,
  onDelete, // kept for API parity (not shown in UI here)
  type = "grid",          // kept for API parity
  matchPercentage = 20,   // optional % chip
}) {
  const navigate = useNavigate();
  const data = useData();
  const { user, settings } = useAuth();

  const isOwner =
    (currentUserId && item?.providerUserId && currentUserId === item.providerUserId) ||
    (!!user?.id && item?.providerUserId === user.id);

  const [modalOpen, setModalOpen] = useState(false);        // Connect modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(item?.connectionStatus || "none");
  const [openId, setOpenId] = useState(null);               // Profile modal

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

  // Options menu
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const optionsMenuRef = useRef(null);
  
  // Share popover
  const [shareOpen, setShareOpen] = useState(false);
  const shareMenuRef = useRef(null);
  const cardRef = useRef(null);

  // Image slider state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
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
    if (!item?.id) return;
    socialApi
      .getLikeStatus("service", item.id)
      .then(({ data }) => {
        setLiked(data.liked);
        setLikeCount(data.count);
      })
      .catch(() => {});
    socialApi
      .getComments("service", item.id)
      .then(({ data }) => {
        const len = Array.isArray(data) ? data.length : 0;
        setCommentCount(len);
      })
      .catch(() => {});
  }, [item?.id]);


  

  // Get all valid images for slider
  const getValidImages = () => {
    const attachments = item?.images || [];
    const validImages = [];

    // Add base64 images
    attachments.forEach(att => {
      if (att?.startsWith("data:image")) {
        validImages.push(att);
      }
    });

    // Add URL images
    attachments.forEach(att => {
      if (typeof att === "string" &&
          (/\.(jpe?g|png|gif|webp|svg)$/i.test(att) || att.startsWith("http://") || att.startsWith("https://"))) {
        if (!validImages.includes(att)) validImages.push(att);
      }
    });

    // Fallback to item.images[0] if valid
    if (validImages.length === 0 && item?.images?.[0] &&
        (item.images[0].startsWith("http://") || item.images[0].startsWith("https://")) &&
        /\.(jpe?g|png|gif|webp|svg)$/i.test(item.images[0])) {
      validImages.push(item.images[0]);
    }

    return validImages;
  };

  const validImages = getValidImages();
  const hasMultipleImages = validImages.length > 1;


  const priceLabel = useMemo(() => {
    const amount = Number(item?.priceAmount ?? 0);
    try {
      const fmt = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: amount % 1 ? 2 : 0,
        maximumFractionDigits: 2,
      });
      return `${fmt.format(amount)}${item?.priceType ? ` / ${item.priceType}` : ""}`;
    } catch {
      return `${amount}${item?.priceType ? ` / ${item.priceType}` : ""}`;
    }
  }, [item?.priceAmount, item?.priceType, currency]);

  const locationLabel = useMemo(() => {
    const city = item?.city?.trim();
    const country = item?.country?.trim();
    if (city && country) return `${city}, ${country}`;
    if (country) return country;
    if (city) return city;
    return item?.locationType || "—";
  }, [item?.city, item?.country, item?.locationType]);

  // Tags (exactly 2 visible)
  const allTags = useMemo(() => {
    const arr = [
      ...(Array.isArray(item?.audienceCategories) ? item?.audienceCategories.map(i=>i.name) : []),
      item?.serviceType,
      item?.experienceLevel,
      item?.categoryName,
      item?.subcategoryName,
      item?.deliveryTime,
    ].filter(Boolean);
    return [...new Set(arr.map((t) => String(t).trim()))];
  }, [item?.audienceCategories, item?.serviceType, item?.experienceLevel, item?.categoryName, item?.subcategoryName, item?.deliveryTime]);

  const visibleTags = allTags.slice(0, 2);
  const extraCount = Math.max(0, allTags.length - visibleTags.length);

  const timeAgo = useMemo(() => {
    if (item?.timeAgo) return item.timeAgo;
    if (!item?.createdAt) return "";
    const diff = Date.now() - new Date(item.createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  }, [item?.timeAgo, item?.createdAt]);

  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
    setConnectionStatus("pending_outgoing");
    onConnect?.(item);
  }

  function handleMessage() {
    if (!user?.id) {
      data._showPopUp("login_prompt");
      return;
    }
    navigate(`/messages?userId=${item.providerUserId}`);
    toast.success("Starting conversation with " + (item?.providerUserName || "provider"));
  }

  // Determine if we're in list mode
  const isList = type === "list";

  // Container classes based on layout type
  const containerBase = "group relative rounded-[15px] border border-gray-100 bg-white shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300 ease-out h-full";
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
      const { data } = await socialApi.toggleLike("service", item.id);
      setLiked(data.liked);
      setLikeCount(data.count);
    } catch (error) {
      setLiked((p) => !p);
      setLikeCount((n) => (liked ? n + 1 : Math.max(0, n - 1)));
    }
  };

  /* ----------------------- Report handler ----------------------- */
  const reportService = async (description) => {
    try {
      await socialApi.reportContent("service", item.id, "other", description);
      toast.success("Report submitted. Thank you.");
    } catch (e) {
      toast.success("Report submitted. Thank you.");
    }
  };

  return (
    <>
      <div ref={cardRef} className={`${containerBase} ${containerLayout} ${isDeleted ? "hidden" : ""}`}>
        {/* IMAGE */}
        {isList ? (
          // Only show image side in list view if not text mode
          settings?.contentType !== 'text' && (
            <div className="relative h-full min-h-[160px] md:min-h-[176px] overflow-hidden">
              {validImages.length > 0 ? (
                <>
                  {/* Image Slider */}
                  <div className="relative w-full h-full overflow-hidden">
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
                            className="flex-shrink-0 w-full h-full object-cover"
                          />
                        ))}
                      </div>
                    ) : (
                      <img src={validImages[0]} alt={item?.title} className="absolute inset-0 w-full h-full object-cover" />
                    )}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Provider name and logo on image */}
                  <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                    <div
                      className="flex items-center gap-2 text-sm text-gray-600 _profile hover:underline cursor-pointer"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        if (item?.providerUserId) {
                          setOpenId(item.providerUserId);
                          data._showPopUp?.("profile");
                        }
                      }}
                    >
                      {item?.avatarUrl ? (
                        <img
                          src={item.avatarUrl}
                          alt={item?.providerUserName || "User"}
                          className="w-7 h-7 rounded-full shadow-lg object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 bg-white shadow-lg rounded-full grid place-items-center">
                          <UserIcon size={12} className="text-brand-600" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="inline-flex items-center gap-1 bg-white text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                          {item?.providerUserName || "User"}
                        </span>
                      </div>
                    </div>
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
                </>
              ) : (
                // clean placeholder (no text)
                <div className="absolute inset-0 w-full h-full bg-gray-100" />
              )}

              {/* Quick actions on image */}
              <div className="absolute top-3 right-3 flex gap-2">

                    <button
                onClick={() => {
                  if (isOwner) {
                    if (onEdit) onEdit(item);
                    else navigate(`/service/${item.id}`);
                  } else {
                    setDetailsModalOpen(true);
                    onDetails?.(item);
                  }
                }}
                 className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                 aria-label={isOwner ? "Edit service" : "View service"}
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
                  aria-label="Share"
                >
                  <Share2 size={16} className="text-gray-600" />
                </button>


              </div>
            </div>
          )
        ) : (
          <div className="relative overflow-hidden">
            {settings?.contentType === 'text' ? null : validImages.length > 0 ? (
              <div className="relative">
                {/* Image Slider */}
                <div className="relative w-full h-48 overflow-hidden">
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
                          className="flex-shrink-0 w-full h-full object-cover transition-transform duration-500 "
                        />
                      ))}
                    </div>
                  ) : (
                    <img
                      src={validImages[0]}
                      alt={item?.title}
                      className="w-full h-48 object-cover transition-transform duration-500 "
                    />
                  )}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Provider name and logo on image */}
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                  <div
                    className="flex items-center gap-2 text-sm text-gray-600 _profile hover:underline cursor-pointer"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      if (item?.providerUserId) {
                        setOpenId(item.providerUserId);
                        data._showPopUp?.("profile");
                      }
                    }}
                  >
                    {item?.avatarUrl ? (
                      <img
                        src={item.avatarUrl}
                        alt={item?.providerUserName || "User"}
                        className="w-7 h-7 rounded-full shadow-lg object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-white shadow-lg rounded-full grid place-items-center">
                        <UserIcon size={12} className="text-brand-600" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1 bg-white text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                        {item?.providerUserName || "User"}
                      </span>
                    </div>
                  </div>
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
            ) : (
              // clean placeholder (no text)
              <div className="w-full h-48 bg-gray-100" />
            )}

            {/* Quick actions on image - only show when not text mode */}
            {settings?.contentType !== 'text' && (
              <div className="absolute top-4 right-4 flex gap-2">


                 <button
            onClick={() => {
              if (isOwner) {
                if (onEdit) onEdit(item);
                else navigate(`/service/${item.id}`);
              } else {
                setDetailsModalOpen(true);
                onDetails?.(item);
              }
            }}
             className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
             aria-label={isOwner ? "Edit service" : "View service"}
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
              aria-label="Share"
            >
              <Share2 size={16} className="text-gray-600" />
            </button>

          
            {/* Options (Delete) - only for owner */}
            {isOwner && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOptionsMenuOpen((s) => !s);
                }}
                className="p-2 rounded-full hidden bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                aria-label="More options"
              >
                <MoreVertical size={16} className="text-gray-600" />
              </button>
            )}
              </div>
            )}
          </div>
        )}

        {/* CONTENT */}
        <div className={`${isList ? "p-4 md:p-5" : "p-5"} flex flex-col flex-1`}>
          {/* Text mode: Buttons and audience categories at top */}
          {settings?.contentType === 'text' && (
            <div className={`${!isList ? 'flex-col gap-y-2':'items-center justify-between gap-2'} flex  mb-3`}>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (isOwner) {
                      if (onEdit) onEdit(item);
                      else navigate(`/service/${item.id}`);
                    } else {
                      setDetailsModalOpen(true);
                      onDetails?.(item);
                    }
                  }}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                  aria-label={isOwner ? "Edit service" : "View service"}
                >
                  {isOwner ? <Edit size={16} /> : <Eye size={16} />}
                </button>

                {/* Options (Delete) - only for owner */}
                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOptionsMenuOpen((s) => !s);
                    }}
                    className="p-2 rounded-full hidden bg-gray-100 hover:bg-gray-200 transition-all duration-200"
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
                  if (item?.providerUserId) {
                    setOpenId(item.providerUserId);
                    data._showPopUp?.("profile");
                  }
                }}
              >
                {item?.avatarUrl ? (
                  <img
                    src={item.avatarUrl}
                    alt={item?.providerUserName || "User"}
                    className="w-7 h-7 rounded-full shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 bg-white shadow-lg rounded-full grid place-items-center">
                    <UserIcon size={12} className="text-brand-600" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="inline-flex items-center gap-1 bg-white text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                    {item?.providerUserName || "User"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-lg text-gray-900  mb-0.5 group-hover:text-brand-600 transition-colors duration-200">
            {item?.title}
          </h3>

          {/* Provider display when there's no image */}
          {validImages.length === 0 && (
            <div
              className="flex items-center gap-2 text-sm text-gray-600 _profile hover:underline cursor-pointer mt-2"
              onClick={(ev) => {
                ev.stopPropagation();
                if (item?.providerUserId) {
                  setOpenId(item.providerUserId);
                  data._showPopUp?.("profile");
                }
              }}
            >
              {item?.avatarUrl ? (
                <img
                  src={item.avatarUrl}
                  alt={item?.providerUserName || "User"}
                  className="w-7 h-7 rounded-full shadow-lg object-cover"
                />
              ) : (
                <div className="w-7 h-7 bg-white shadow-lg rounded-full grid place-items-center">
                  <UserIcon size={12} className="text-brand-600" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="inline-flex items-center gap-1 bg-white text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                  {item?.providerUserName || "User"}
                </span>
              </div>
            </div>
          )}

          {/* Description */}
          <p className={`mt-2 text-sm text-gray-600 leading-relaxed ${isList ? "line-clamp-2 md:line-clamp-3" : "line-clamp-2"}`}>
            {item?.description}
          </p>

          {/* Price */}
          <div className="mt-2 mb-3">
            <span className="text-sm font-bold text-gray-700">{priceLabel}</span>
          </div>

          {/* Meta (provider + match + time + location) */}
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between pb-1">
              {/* Provider display removed - now shown prominently above */}
            

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

          {/* Tags (show 2) with "+X more" tooltip if applicable */}
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
                    aria-describedby={`service-tags-more-${item.id}`}
                    tabIndex={0}
                  >
                    +{extraCount} more
                  </span>

                  <div
                    id={`service-tags-more-${item.id}`}
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
              title="Report this service"
            >
              <Flag size={16} />
              <span>Report</span>
            </button>
          </div>

          {/* Actions (View + Message + Connect / or Edit if owner) */}
          <div className={`flex items-center gap-2 mt-auto pt-2 ${isList ? "justify-end md:justify-start" : ""}`}>
            {/* View (Edit if owner) */}
            <button
              onClick={() => {
                if (isOwner) {
                  if (onEdit) onEdit(item);
                  else navigate(`/service/${item.id}`);
                } else {
                  setDetailsModalOpen(true);
                  onDetails?.(item);
                }
              }}
              className="flex items-center hidden justify-center h-10 w-10 flex-shrink-0 rounded-xl border-2 border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200 group/view"
              aria-label={isOwner ? "Edit service" : "View service"}
            >
              {isOwner ? (
                <Edit size={16} className="transition-transform duration-200 group-hover/view:scale-110" />
              ) : (
                <Eye size={16} className="transition-transform duration-200 group-hover/view:scale-110" />
              )}
            </button>

            {/* Message */}
           {!isOwner && <button
              onClick={handleMessage}
              className={`${
                type === "grid" ? "flex-1" : ""
              } rounded-xl px-4 py-2.5 _login_prompt text-sm font-medium bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md`}
            >
              Message
            </button>}

            {/* Connect button like the others */}
            {(!isOwner && connectionStatus!="connected") &&  <div className="_login_prompt">
              {renderConnectButton()}
          </div>}
          </div>
        </div>

        {/* SHARE MENU - inside the card for proper positioning */}
        {shareOpen && <ShareMenu item={item} shareMenuRef={shareMenuRef} setShareOpen={setShareOpen} />}

        {/* OPTIONS MENU */}
        {optionsMenuOpen && (
          <OptionsMenu
            item={item}
            optionsMenuRef={optionsMenuRef}
            setOptionsMenuOpen={setOptionsMenuOpen}
            setShowDeleteConfirm={setShowDeleteConfirm}
            showDeleteConfirm={showDeleteConfirm}
            setIsDeleted={setIsDeleted}
          />
        )}
      </div>

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={item?.providerUserId}
        toName={item?.providerUserName || "Service Provider"}
        onSent={onSent}
      />

      {/* Profile Modal */}
      <ProfileModal
        userId={openId}
        isOpen={!!openId}
        onClose={() => setOpenId(null)}
        onSent={onSent}
      />

      {/* Details Modal */}
      <ServiceDetails
        serviceId={item?.id}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
      />

      {/* Report dialog */}
      <ConfirmDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report this service?"
        text="Tell us what's happening. Our team will review."
        confirmText="Submit report"
        cancelText="Cancel"
        withInput
        inputType="textarea"
        inputLabel="Report details"
        inputPlaceholder="Describe the issue (spam, scam, offensive, etc.)"
        requireValue
        onConfirm={reportService}
      />

      {/* Comments Dialog */}
      <CommentsDialog
        open={commentsDialogOpen}
        onClose={() => setCommentsDialogOpen(false)}
        entityType="service"
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
        onClick={() => {
          onConnect?.(item);
          setModalOpen(true);
        }}
        className="rounded-xl px-4 py-2.5 text-sm font-medium border-2 border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200"
      >
        Connect
      </button>
    );
  }
}

// Options menu
const OptionsMenu = ({ item, optionsMenuRef, setOptionsMenuOpen, setShowDeleteConfirm, showDeleteConfirm, setIsDeleted }) => (
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
          Delete this service?
        </div>
        <button
          onClick={async () => {
            try {
              await client.delete(`/services/${item.id}`);
              toast.success("Service deleted successfully");
              setIsDeleted(true); // Hide the card
            } catch (error) {
              console.error("Failed to delete service:", error);
              toast.error(error?.response?.data?.message || "Failed to delete service");
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

// Share data and components
const ShareMenu = ({ item, shareMenuRef, setShareOpen }) => {
  const shareUrl = `${window.location.origin}/service/${item?.id}`;
  const shareTitle = item?.title || "Service on 54Links";
  const shareQuote = (item?.description || "").slice(0, 160) + ((item?.description || "").length > 160 ? "…" : "");
  const shareHashtags = ["54Links", "Services", "Professionals"].filter(Boolean);
  const messengerAppId = import.meta?.env?.VITE_FACEBOOK_APP_ID || undefined;

  return (
    <div
      ref={shareMenuRef}
      className="absolute top-12 right-3 z-30 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
      role="dialog"
      aria-label="Share options"
    >
      <div className="text-xs font-medium text-gray-500 px-1 pb-2">
        Share this service
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
