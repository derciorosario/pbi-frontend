// src/components/ProductCard-1.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  MapPin,
  User2,
  Clock,
  MessageCircle,
  Edit,
  Heart,
  Star,
  Eye,
  Share2,
  Copy as CopyIcon,
  Flag,
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
import { API_URL } from "../api/client";

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

  // Image slider state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
    toast.success("Connection request sent");
    setModalOpen(false);
    setConnectionStatus("pending_outgoing");
  }

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
        className="absolute top-12 right-3 z-30 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
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
          settings?.contentType !== 'text' ? (
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

              <div className="w-full h-full bg-gray-200 flex justify-center items-center">
                              <img src={LogoGray} className="w-[100px]" alt="54Links logo" />
                            </div>
            )}

            {/* User name and logo on image */}
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
              <div
                className="flex items-center gap-2 text-sm text-gray-600 _profile hover:underline cursor-pointer"
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (item?.sellerUserId) {
                    setOpenId(item.sellerUserId);
                    data._showPopUp?.("profile");
                  }
                }}
              >
                {item.avatarUrl ? (
                  <img
                    src={item.avatarUrl}
                    alt={item?.sellerUserName || "User"}
                    className="w-7 h-7 rounded-full shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 bg-white shadow-lg rounded-full grid place-items-center">
                    <User2 size={12} className="text-brand-600" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="inline-flex items-center gap-1 bg-white text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                    {item?.sellerUserName || "User"}
                  </span>
                </div>
              </div>
            </div>
            
             
            

            {/* Quick actions on image */}
            <div className="absolute top-3 right-3 flex gap-2">
             

              <button
              onClick={() => {
                if(user?.id==item.sellerUserId){
                    navigate(`/product/${item.id}`)
                }else{
                    setProductDetailsOpen(true);
                }
              }}
              className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 group/share"
                
                aria-label="View product"
            >
              {user?.id==item.sellerUserId ? <Edit
                className="transition-transform duration-200 group-hover/view:scale-110"
                size={16}
              /> :  <Eye
                className="transition-transform duration-200 group-hover/view:scale-110"
                size={16}
              />}
            </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShareOpen((s) => !s);
                }}
                className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 group/share"
                aria-label="Share product"
              >
                <Share2
                  size={16}
                  className="text-gray-600 group-hover/share:text-brand-600 transition-colors duration-200"
                />
              </button>
            </div>
          </div>
        ) : null
      ) : (
        // GRID IMAGE
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
            <div className="relative h-48">
              <div className="absolute inset-0 w-full h-full bg-gray-200 flex justify-center items-center">
                                <img src={LogoGray} className="w-[100px]" alt="54Links logo" />
              </div>
            </div>
          )}

            {/* User name and logo on image */}
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
              <div
                className="flex items-center gap-2 text-sm text-gray-600 _profile hover:underline cursor-pointer"
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (item?.sellerUserId) {
                    setOpenId(item.sellerUserId);
                    data._showPopUp?.("profile");
                  }
                }}
              >
                {item.avatarUrl ? (
                  <img
                    src={item.avatarUrl}
                    alt={item?.sellerUserName || "User"}
                    className="w-7 h-7 rounded-full shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 bg-white shadow-lg rounded-full grid place-items-center">
                    <User2 size={12} className="text-brand-600" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="inline-flex items-center gap-1 bg-white text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                    {item?.sellerUserName || "User"}
                  </span>
                </div>
              </div>
            </div>
           
            {/* View & Save - only show when not text mode */}
            {settings?.contentType !== 'text' && (
              <div className="absolute top-4 right-4 flex gap-2">
            

            <button
              onClick={() => {
                if(user?.id==item.sellerUserId){
                    navigate(`/product/${item.id}`)
                }else{
                    setProductDetailsOpen(true);
                }
              }}
              className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 group/share"
                
                aria-label="View product"
            >
              {user?.id==item.sellerUserId ? <Edit
                className="transition-transform duration-200 group-hover/view:scale-110"
                size={16}
              /> :  <Eye
                className="transition-transform duration-200 group-hover/view:scale-110"
                size={16}
              />}
            </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShareOpen((s) => !s);
                }}
                className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 group/share"
                aria-label="Share product"
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

        {/* CONTENT SIDE */}
        <div className={`${isList ? "p-4 md:p-5" : "p-5"} flex flex-col flex-1`}>
          {/* Text mode: Buttons and audience categories at top */}
          {settings?.contentType === 'text' && (
            <div className={`${!isList ? 'flex-col gap-y-2':'items-center justify-between gap-2'} flex  mb-3`}>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if(user?.id==item.sellerUserId){
                        navigate(`/product/${item.id}`)
                    }else{
                        setProductDetailsOpen(true);
                    }
                  }}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                  aria-label="View product"
                >
                  {user?.id==item.sellerUserId ? <Edit size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareOpen((s) => !s);
                  }}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                  aria-label="Share product"
                >
                  <Share2 size={16} className="text-gray-600" />
                </button>
              </div>
              <div
                className="flex items-center gap-2 text-sm text-gray-600 _profile hover:underline cursor-pointer"
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (item?.sellerUserId) {
                    setOpenId(item.sellerUserId);
                    data._showPopUp?.("profile");
                  }
                }}
              >
                {item.avatarUrl ? (
                  <img
                    src={item.avatarUrl}
                    alt={item?.sellerUserName || "User"}
                    className="w-7 h-7 rounded-full shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 bg-white shadow-lg rounded-full grid place-items-center">
                    <User2 size={12} className="text-brand-600" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="inline-flex items-center gap-1 bg-white text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                    {item?.sellerUserName || "User"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Title and description */}
          <div className={`${isList ? "mb-2" : "mb-3"}`}>
            <h3 className="font-semibold text-lg text-gray-900  mb-1 group-hover:text-brand-600 transition-colors duration-200">
              {item?.title}
            </h3>
            <p
              className={`text-sm text-gray-600 leading-relaxed ${
                isList ? "line-clamp-2 md:line-clamp-3" : "line-clamp-2"
              }`}
            >
              {item?.description}
            </p>
          </div>

          {/* Price */}
          <div className={`${isList ? "mb-2" : "mb-3"}`}>
            <span className="text-sm font-bold text-gray-700">
              {currency} {item?.price}
            </span>
          </div>

          {/* Meta info */}
          <div className={`${isList ? "mb-2" : "mb-3"} space-y-2`}>
            <div className="flex items-center justify-between pb-1">
              {/* User display removed - now shown prominently above */}
             

              {/* Match percentage */}
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
                {item?.country}
              </span>
            </div>
          </div>

          {/* Tags with tooltip for "+X more" */}
          {((item?.audienceCategories?.length > 0) || (item?.tags?.length > 0)) && (
            <div className={`${isList ? "mb-3" : "mb-4"} flex flex-wrap gap-2`}>
              {/* Show audienceCategories first */}
              {item?.audienceCategories?.slice(0, type=="grid" ? 1 : 100).map((c) => (
                <span
                  key={`audience-${c.id || c.name}`}
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-50 to-brand-100 text-brand-700 px-3 py-1 text-xs font-medium border border-brand-200/50"
                >
                  {c.name}
                </span>
              ))}

              {/* Then show regular tags */}
              {item.tags?.slice(0, type=="grid" ? Math.max(0, 1 - (item?.audienceCategories?.length || 0)) : 100).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-50 to-brand-100 text-brand-700 px-3 py-1 text-xs font-medium border border-brand-200/50"
                >
                  {t}
                </span>
              ))}

              {/* Calculate total count for "more" tooltip */}
              {((item?.audienceCategories?.length || 0) + (item?.tags?.length || 0)) > (type=="grid" ? 1 : 100) && (
                <div className={`relative inline-block group/tagmore ${type=="list" ? 'hidden':''}`}>
                  <span
                    className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs font-medium cursor-default hover:bg-gray-200 transition-colors duration-200"
                    aria-describedby={`tags-more-${item.id}`}
                    tabIndex={0}
                  >
                    +{((item?.audienceCategories?.length || 0) + (item?.tags?.length || 0)) - (type=="grid" ? 1 : 100)} more
                  </span>

                  <div
                    id={`tags-more-${item.id}`}
                    role="tooltip"
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg
                      opacity-0 invisible transition-opacity duration-200
                      group-hover/tagmore:opacity-100 group-hover/tagmore:visible
                      focus-within:opacity-100 focus-within:visible z-10 whitespace-nowrap"
                  >
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {/* Show remaining audienceCategories first */}
                      {item?.audienceCategories?.slice(type=="grid" ? 1 : 100).map((c, i) => (
                        <span key={`audience-more-${i}`} className="inline-block">
                          {c.name}
                          {i < ((item?.audienceCategories?.length || 0) - (type=="grid" ? 1 : 100) + (item?.tags?.length || 0) - 1) ? "," : ""}
                        </span>
                      ))}
                      {/* Then show remaining tags */}
                      {item.tags?.slice(type=="grid" ? Math.max(0, 1 - (item?.audienceCategories?.length || 0)) : 100).map((tag, i) => (
                        <span key={`tag-more-${i}`} className="inline-block">
                          {tag}
                          {i < (item.tags?.length || 0) - (type=="grid" ? Math.max(0, 1 - (item?.audienceCategories?.length || 0)) : 100) - 1 ? "," : ""}
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
              title="Report this product"
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
            {/* View */}
            <button
              onClick={() => {
                if(user?.id==item.sellerUserId){
                    navigate(`/product/${item.id}`)
                }else{
                    setProductDetailsOpen(true);
                }
              }}
              className="flex items-center hidden justify-center h-10 w-10 flex-shrink-0 rounded-xl border-2 border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200 group/view"
              aria-label="View product"
            >
              {user?.id==item.sellerUserId ? <Edit
                className="transition-transform duration-200 group-hover/view:scale-110"
                size={16}
              /> :  <Eye
                className="transition-transform duration-200 group-hover/view:scale-110"
                size={16}
              />}
            </button>

            {/* Message */}
           {item?.sellerUserId!=user?.id && <button
              onClick={() => {
                if (!user?.id) {
                  data._showPopUp("login_prompt");
                  return;
                }
                navigate(`/messages?userId=${item.sellerUserId}`);
                toast.success(
                  "Starting conversation with " + (item.sellerUserName || "seller")
                );
              }}
              className={`${type=="grid" ? "flex-1":''} _login_prompt rounded-xl px-4 py-2.5 text-sm font-medium bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md`}
            >
              Message
            </button>}

            {/* Connect or Edit */}
            {(item.sellerUserId !== user?.id && connectionStatus!="connected") ? (
                       <div className="_login_prompt">
                          {renderConnectButton()}
                      </div>
            ) : (
              <button
                onClick={() => {
                  if (item.sellerUserId === user?.id)
                    navigate("/product/" + item.id);
                }}
                className="flex items-center justify-center h-10 w-10 rounded-xl border-2 border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200 group/edit"
                aria-label="Edit product"
              >
                <Edit
                  size={16}
                  className="group-hover/edit:scale-110 transition-transform duration-200"
                />
              </button>
            )}
          </div>
        </div>

        {/* Subtle bottom gradient for depth (grid only) */}
        {!isList && (
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50" />
        )}

        {/* SHARE MENU - inside the card for proper positioning */}
        {shareOpen && <ShareMenu />}
      </div>

      {/* Connection Request Modal */}
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

      {/* Product Details Modal */}
      <ProductDetails
        productId={item.id}
        isOpen={productDetailsOpen}
        onClose={() => setProductDetailsOpen(false)}
        onSave={onSave}
      />

      {/* Report dialog */}
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

      {/* Comments Dialog */}
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
