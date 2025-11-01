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
  Play,
  Pause,
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
import LikesDialog from "./LikesDialog";
import VideoPlayer from "./VideoPlayer"; // Import VideoPlayer component
import PostDialog from "./PostDialog";

// Helper function to validate media URLs
const isValidMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://");
};

// Helper function to get file extension
const getFileExtension = (url) => {
  if (!url) return '';
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1].toLowerCase() : '';
};

// Helper function to determine media type
const getMediaType = (url) => {
  if (!url) return 'unknown';
  
  // Check data URLs
  if (url.startsWith("data:")) {
    if (url.startsWith("data:image")) return 'image';
    if (url.startsWith("data:video")) return 'video';
    return 'unknown';
  }
  
  // Check file extension
  const extension = getFileExtension(url);
  
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
  
  if (videoExtensions.includes(extension)) return 'video';
  if (imageExtensions.includes(extension)) return 'image';
  if (documentExtensions.includes(extension)) return 'document';
  
  return 'unknown';
};

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
   const [likesDialogOpen, setLikesDialogOpen] = useState(false);
  
  // Track connection status locally (for immediate UI updates)
  const [connectionStatus, setConnectionStatus] = useState(item?.connectionStatus || "none");
  
 
   const [liked, setLiked] =  useState(!!item?.isLiked);
  const [likeCount, setLikeCount] = useState(Number(item.likesCount || 0));
    const [commentCount, setCommentCount] = useState(Number(item?.commentsCount || 0));
  
  // Media slider state
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVideoControls, setShowVideoControls] = useState(false);

  // Report dialog
  const [reportOpen, setReportOpen] = useState(false);

  // Share popover
  const [shareOpen, setShareOpen] = useState(false);
  const shareMenuRef = useRef(null);
  const cardRef = useRef(null);

  // Comments dialog
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);

  // Post dialog modal
  const [postDialogOpen, setPostDialogOpen] = useState(false);

  // Options menu
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const optionsMenuRef = useRef(null);

  const [showFullDescription, setShowFullDescription] = useState(false);

  // Touch/swipe handling for mobile and PC
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  // Video control timeout ref
  const videoControlsTimeoutRef = useRef(null);

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

  // Clear video controls timeout on unmount
  useEffect(() => {
    return () => {
      if (videoControlsTimeoutRef.current) {
        clearTimeout(videoControlsTimeoutRef.current);
      }
    };
  }, []);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Handle touch start
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  // Handle touch move
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  // Handle touch end
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentMediaIndex < validMedia.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
      resetVideoState();
    }
    if (isRightSwipe && currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
      resetVideoState();
    }
  };

  // Handle mouse down for PC
  const onMouseDown = (e) => {
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  // Handle mouse move for PC
  const onMouseMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = dragStart - currentX;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0 && currentMediaIndex < validMedia.length - 1) {
        setCurrentMediaIndex(currentMediaIndex + 1);
        resetVideoState();
        setIsDragging(false);
      } else if (diff < 0 && currentMediaIndex > 0) {
        setCurrentMediaIndex(currentMediaIndex - 1);
        resetVideoState();
        setIsDragging(false);
      }
    }
  };

  // Handle mouse up for PC
  const onMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Reset video state when changing slides
  const resetVideoState = () => {
    setIsVideoPlaying(false);
    setShowVideoControls(false);
  };

  // Initial fetch for like & comments count (optional)
 /* useEffect(() => { leave this section as it is
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
  }, [item?.id]);*/

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

  // Get all valid media for slider (images and videos only, no documents)
  const getValidMedia = () => {
    const mediaItems = item?.images || [];
    const validMedia = [];

    mediaItems.forEach((mediaUrl, index) => {
      let processedUrl = mediaUrl?.filename || mediaUrl || null;
      
      // Process URL for external access
      if (processedUrl && !processedUrl.startsWith("data:") && !processedUrl.startsWith("http")) {
        processedUrl = `${API_URL}/uploads/${processedUrl}`;
      }
      
      if (isValidMediaUrl(processedUrl)) {
        const mediaType = getMediaType(processedUrl);
        // Only include images and videos in the slider
        if (mediaType === 'image' || mediaType === 'video') {
          validMedia.push({
            url: processedUrl,
            type: mediaType,
            name: `media-${index}`
          });
        }
      }
    });

    // Sort: videos first, then images
    return validMedia.sort((a, b) => {
      if (a.type === 'video' && b.type !== 'video') return -1;
      if (a.type !== 'video' && b.type === 'video') return 1;
      return 0;
    });
  };

  const validMedia = getValidMedia();
  const hasMultipleMedia = validMedia.length > 1;
  const currentMedia = validMedia[currentMediaIndex];
  const isCurrentVideo = currentMedia?.type === 'video';

  const isList = type === "list";

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

  // Video control functions
  const handleVideoPlayPause = () => {
    setIsVideoPlaying(!isVideoPlaying);
    setShowVideoControls(true);
    
    // Hide controls after 3 seconds
    if (videoControlsTimeoutRef.current) {
      clearTimeout(videoControlsTimeoutRef.current);
    }
    videoControlsTimeoutRef.current = setTimeout(() => {
      setShowVideoControls(false);
    }, 3000);
  };

  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
    setShowVideoControls(true);
    
    // Hide controls after 3 seconds
    if (videoControlsTimeoutRef.current) {
      clearTimeout(videoControlsTimeoutRef.current);
    }
    videoControlsTimeoutRef.current = setTimeout(() => {
      setShowVideoControls(false);
    }, 3000);
  };

  const handleVideoPause = () => {
    setIsVideoPlaying(false);
    setShowVideoControls(true);
    
    // Keep controls visible when paused
    if (videoControlsTimeoutRef.current) {
      clearTimeout(videoControlsTimeoutRef.current);
    }
  };

  const handleMediaClick = (e) => {
    if (isCurrentVideo) {
      // For videos, handle play/pause
      e.stopPropagation();
      handleVideoPlayPause();
    } else {
      // For images, open PostDialog
      setPostDialogOpen(true);
    }
  };

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
                    style={{ objectFit: 'cover' }}
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

        {/* MEDIA (if exists and not in text mode) */}
        {settings?.contentType !== "text" && validMedia.length > 0 && (
          <div className="relative bg-gray-900">
            {/* Media Slider */}
            <div
              onClick={handleMediaClick}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              className="relative w-full max-h-96 overflow-hidden cursor-pointer select-none"
              style={{ userSelect: 'none' }}
            >
              {hasMultipleMedia ? (
                <div
                  className="flex w-full h-full transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}
                >
                  {validMedia.map((media, index) => (
                    <div key={index} className="flex-shrink-0 w-full h-96 relative">
                      {media.type === 'video' ? (
                        <div className="relative w-full h-full bg-black">
                          <VideoPlayer
                            src={media.url}
                            className="w-full h-full object-contain"
                            controls={false}
                            autoPlay={false}
                            muted
                            isPlaying={index === currentMediaIndex && isVideoPlaying}
                            onPlay={handleVideoPlay}
                            onPause={handleVideoPause}
                          />
                        </div>
                      ) : (
                        <img
                          src={media.url}
                          alt={media.name || `Media ${index + 1}`}
                          className="w-full h-96 object-contain"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-96 relative">
                  {currentMedia.type === 'video' ? (
                    <div className="relative w-full h-full bg-black">
                      <VideoPlayer
                        src={currentMedia.url}
                        className="w-full h-full object-contain"
                        controls={false}
                        autoPlay={false}
                        muted
                        isPlaying={isVideoPlaying}
                        onPlay={handleVideoPlay}
                        onPause={handleVideoPause}
                      />
                    </div>
                  ) : (
                    <img
                      src={currentMedia.url}
                      alt={currentMedia.name || "Media"}
                      className="w-full h-96 object-contain"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Slider Dots */}
            {hasMultipleMedia && (
              <div className="absolute bottom-3 right-3 flex gap-1">
                {validMedia.map((media, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentMediaIndex(index);
                      // Reset video state when changing slides
                      if (media.type === 'video') {
                        setIsVideoPlaying(false);
                        setShowVideoControls(true);
                      } else {
                        setIsVideoPlaying(false);
                        setShowVideoControls(false);
                      }
                    }}
                    className={`w-[10px] h-[10px] rounded-full border border-gray-300 transition-colors ${
                      index === currentMediaIndex 
                        ? (media.type === 'video' ? 'bg-blue-500' : 'bg-white')
                        : 'bg-white/50'
                    }`}
                    aria-label={`Go to ${media.type} ${index + 1}`}
                  />
                ))}
              </div>
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

      <LikesDialog
        open={likesDialogOpen}
        onClose={() => setLikesDialogOpen(false)}
        entityType="product"
        entityId={item?.id}
      />

      <CommentsDialog
        open={commentsDialogOpen}
        onClose={() => setCommentsDialogOpen(false)}
        entityType="product"
        entityId={item?.id}
        currentUser={user}
        onCountChange={(n) => setCommentCount(n)}
      />

      {/* Post Dialog Modal */}
      <PostDialog
        isOpen={postDialogOpen}
        onClose={() => setPostDialogOpen(false)}
        item={item}
        type="product"
        mediaUrls={validMedia.map(media => media.url)}
        initialMediaIndex={0}
        tags={allTags}
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