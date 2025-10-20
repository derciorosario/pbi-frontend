// src/components/ProductCard-1.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  MapPin,
  User as UserIcon,
  Clock,
  MessageCircle,
  Edit,
  Heart,
  Star,
  Eye,
  Share2,
  Copy as CopyIcon,
  Flag,
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
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../lib/toast";
import * as socialApi from "../api/social";
import ConnectionRequestModal from "./ConnectionRequestModal";
import ProfileModal from "./ProfileModal";
import ProductDetails from "./ProductDetails";
import ConfirmDialog from "./ConfirmDialog";
import CommentsDialog from "./CommentsDialog";
import LogoGray from '../assets/logo.png'
import client, { API_URL } from "../api/client";

export default function ProductCard({
  item,
  currency = "US$",
  featured,
  onContact,
  onSave,
  matchPercentage = 20, // match percentage prop
  type = "grid", // "grid" | "list"
}) {
  const navigate = useNavigate();
  const data = useData();
  const { user, settings } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [productDetailsOpen, setProductDetailsOpen] = useState(false);
  
  // Track connection status locally (for immediate UI updates)
  const [connectionStatus, setConnectionStatus] = useState(item?.connectionStatus || "none");
  
  // Social state
  const [liked, setLiked] = useState(!!item?.liked);
  const [likeCount, setLikeCount] = useState(Number(item?.likes || 0));
  const [commentCount, setCommentCount] = useState(
    Array.isArray(item?.comments) ? item.comments.length : Number(item?.commentsCount || 0)
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

  // Image slider state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

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
      .getLikeStatus("product", item.id)
      .then(({ data }) => {
        setLiked(data.liked);
        setLikeCount(data.count);
      })
      .catch(() => {});
    socialApi
      .getComments("product", item.id)
      .then(({ data }) => {
        const len = Array.isArray(data) ? data.length : 0;
        setCommentCount(len);
      })
      .catch(() => {});
  }, [item?.id]);

  function onSent() {
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

  const isList = type === "list";

  // Get all valid images for slider
  const getValidImages = () => {
    const images = item?.images || [];
    const validImages = [];

    images.forEach(img => {
      let imageUrl = img?.filename || img || null;
      if (imageUrl) {
        imageUrl = (imageUrl.startsWith("data:image") || imageUrl.startsWith("http"))
          ? imageUrl
          : `${API_URL}/uploads/${imageUrl}`;
        validImages.push(imageUrl);
      }
    });

    return validImages;
  };

  const validImages = getValidImages();
  const hasMultipleImages = validImages.length > 1;
  

  const initials = (item?.seller?.name || item?.sellerUserName || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const timeAgo = useMemo(() => {
    if (!item?.createdAt) return "";
    const diffMs = Date.now() - new Date(item.createdAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} hrs ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays} days ago`;
  }, [item?.createdAt]);

  const containerBase =
    "group relative rounded-[15px] border border-gray-100 bg-white shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300 ease-out";
  // grid for list (image left column), flex-col for grid
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
      const { data } = await socialApi.toggleLike("product", item.id);
      setLiked(data.liked);
      setLikeCount(data.count);
    } catch (error) {
      setLiked((p) => !p);
      setLikeCount((n) => (liked ? n + 1 : Math.max(0, n - 1)));
    }
  };

  /* ----------------------- Report handler ----------------------- */
  const reportProduct = async (description) => {
    try {
      await socialApi.reportContent("product", item.id, "other", description);
      toast.success("Report submitted. Thank you.");
    } catch (e) {
      toast.success("Report submitted. Thank you.");
    }
  };


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

     // Share data and components
  const ShareMenu = () => {
    const shareUrl = `${window.location.origin}/products?id=${item?.id}`;
    const shareTitle = item?.title || "Product on 54Links";
    const shareQuote = (item?.description || "").slice(0, 160) + ((item?.description || "").length > 160 ? "…" : "");
    const shareHashtags = ["54Links", "Products", "Shopping"].filter(Boolean);
    const messengerAppId = import.meta?.env?.VITE_FACEBOOK_APP_ID || undefined;
  
    return (
      <div
        ref={shareMenuRef}
        className="absolute bottom-0 right-3 z-30 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
        role="dialog"
        aria-label="Share options"
      >
        <div className="text-xs font-medium text-gray-500 px-1 pb-2">
          Share this product
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
  };

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
            Delete this product?
          </div>
          <button
            onClick={async () => {
              try {
                await client.delete(`/products/${item.id}`);
                toast.success("Product deleted successfully");
                setIsDeleted(true);
              } catch (error) {
                console.error("Failed to delete product:", error);
                toast.error(error?.response?.data?.message || "Failed to delete product");
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
              navigate(`/product/${item.id}`);
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

  const isOwner = user?.id && item?.sellerUserId && user.id === item.sellerUserId;

  // Use seller avatar, not post image
  const sellerAvatarUrl = item?.avatarUrl || null;

  let imageUrl = validImages.length > 0 ? validImages[0] : null;

  const allTags = [
    "Product",
    ...(Array.isArray(item?.audienceCategories)
      ? item?.audienceCategories.map((i) => i.name)
      : []),
    ...(Array.isArray(item?.tags) ? item.tags : []),
  ].filter(Boolean);

  return (
    <>
      <div
        className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${
          isDeleted ? "hidden" : ""
        }`}
      >
        {/* HEADER - Seller/User Info */}
        <div className="px-4 pt-3 pb-2 flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Avatar */}
            <div
              className="cursor-pointer flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                if (item?.sellerUserId) {
                  navigate(`/profile/${item.sellerUserId}`);
                }
              }}
            >
              {sellerAvatarUrl ? (
                <div className={`flex bg-white items-center justify-center w-20 h-20 ${
                  item?.postedBy?.accountType === "company" ? "rounded" : "rounded-full"
                } border border-gray-300 overflow-hidden`}>
                  <img
                    src={sellerAvatarUrl}
                    alt={item?.sellerUserName || "User"}
                    className="w-full h-full"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div className={`w-20 h-20 bg-gray-200 flex items-center justify-center ${
                  item?.postedBy?.accountType === "company" ? "rounded" : "rounded-full"
                } border border-gray-100`}>
                  <UserIcon size={24} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* Seller/User Name and Meta */}
            <div className="flex-1 min-w-0">
              <div
                className="font-semibold text-sm text-gray-900 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (item?.sellerUserId) {
                    navigate(`/profile/${item.sellerUserId}`);
                  }
                }}
              >
                {item?.sellerUserName || "User"}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {item?.profile?.professionalTitle || "Seller"}
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
          {/* Product Title */}
          <h3
            className="font-semibold text-base text-gray-900 mb-1 hover:text-brand-600 cursor-pointer transition-colors"
            onClick={() => {
              if (isOwner) navigate(`/product/${item.id}`);
              else setProductDetailsOpen(true);
            }}
          >
            {item?.title}
          </h3>

          {/* Description */}
          <div className="text-sm text-gray-700 mb-2">
            <div className={showFullDescription ? "" : "line-clamp-3"}>
              {cleanText(item?.description)}
            </div>
            {item?.description && cleanText(item?.description).length > 150 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-gray-500 hover:text-brand-600 font-medium mt-1"
              >
                {showFullDescription ? "Show less" : "...more"}
              </button>
            )}
          </div>

        </div>

        {/* IMAGE (if exists and not in text mode) */}
        {settings?.contentType !== "text" && imageUrl && (
          <div className="relative">
            {hasMultipleImages ? (
              <div className="relative overflow-hidden">
                <div
                  className="flex w-full max-h-96 transition-transform duration-300 ease-in-out"
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
                {/* Slider Dots */}
                <div className="absolute bottom-3 right-3 flex gap-1">
                  {validImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <img
                src={imageUrl}
                alt={item?.title}
                className="w-full max-h-96 object-cover cursor-pointer"
                onClick={() => setProductDetailsOpen(true)}
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

        {/* PRODUCT SECTION - Below actions */}
      
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              {/* Price */}
              {item?.price && (
                <div className="text-sm font-semibold text-gray-900">
                  {currency} {item.price}
                </div>
              )}

              {/* Location */}
              {item?.country && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin size={14} />
                  <span>{item?.city ? `${item.city}, ` : ""}
                  {item?.country || "—"}</span>
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
                  setProductDetailsOpen(true);
                }}
                className="flex-1 px-4 py-2 rounded-full bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 transition-colors"
              >
                View Details
              </button>

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

      {/* Modals */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={item?.sellerUserId}
        toName={item?.sellerUserName || "Seller"}
        onSent={onSent}
      />

      <ProfileModal
        userId={openId}
        isOpen={!!openId}
        onClose={() => setOpenId(null)}
        onSent={onSent}
      />

      <ProductDetails
        productId={item.id}
        isOpen={productDetailsOpen}
        onClose={() => setProductDetailsOpen(false)}
        onSave={onSave}
      />

      <ConfirmDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report this product?"
        text="Tell us what's happening. Our team will review."
        confirmText="Submit report"
        cancelText="Cancel"
        withInput
        inputType="textarea"
        inputLabel="Report details"
        inputPlaceholder="Describe the issue (spam, scam, offensive, etc.)"
        requireValue
        onConfirm={reportProduct}
      />

      <CommentsDialog
        open={commentsDialogOpen}
        onClose={() => setCommentsDialogOpen(false)}
        entityType="product"
        entityId={item?.id}
        currentUser={user}
        onCountChange={(n) => setCommentCount(n)}
      />
    </>
  );

  // Render connect button with different styles based on connection status
  function renderConnectButton() {
    const status = connectionStatus || item?.connectionStatus || "none";

    if (status === "connected") {
      return (
        <button
          className="rounded-xl px-4 py-2.5 text-sm font-medium bg-green-100 text-green-700 cursor-default"
        >
          Connected
        </button>
      );
    }

    if (status === "pending_outgoing" || status === "outgoing_pending") {
      return (
        <button
          className="rounded-xl px-4 py-2.5 text-sm font-medium bg-yellow-100 text-yellow-700 cursor-default"
        >
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
