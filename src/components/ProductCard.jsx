// src/components/ProductCard.jsx
import React, { useMemo, useState } from "react";
import { MapPin, User2, Clock, MessageCircle, Edit, Heart, Flag, Share2, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../lib/toast";
import ConnectionRequestModal from "./ConnectionRequestModal";
import PostDialog from "./PostDialog";
import { API_URL } from "../api/client";
import * as socialApi from "../api/social";
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
import { Copy as CopyIcon } from "lucide-react";

export default function ProductCard({
  item,
  currency = "US$",
  featured,
  onContact,
  onSave,
  matchPercentage = 20, // show % chip
}) {
  const navigate = useNavigate();
  const data = useData();
  const { user, settings } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  // Social state
  const [liked, setLiked] = useState(!!item?.isLiked);
  const [likeCount, setLikeCount] = useState(Number(item?.likesCount || 0));
  const [commentCount, setCommentCount] = useState(Number(item?.commentsCount || 0));

  // Connection state
  const [connectionStatus, setConnectionStatus] = useState(item?.connectionStatus || "none");

  // Report dialog
  const [reportOpen, setReportOpen] = useState(false);

  // Share popover
  const [shareOpen, setShareOpen] = useState(false);

  // Comments and likes dialogs
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);

  // Post dialog modal
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  
  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
  }

  // Like handler
  const toggleLike = async () => {
    if (!user?.id) {
      data._showPopUp?.("login_prompt");
      return;
    }
    setLiked((p) => !p);
    setLikeCount((n) => (liked ? Math.max(0, n - 1) : n + 1));
    try {
      const { data: response } = await socialApi.toggleLike("product", item.id);
      setLiked(response.liked);
      setLikeCount(response.count);
    } catch (error) {
      setLiked((p) => !p);
      setLikeCount((n) => (liked ? n + 1 : Math.max(0, n - 1)));
    }
  };

  // Report handler
  const reportItem = async (description) => {
    try {
      await socialApi.reportContent("product", item.id, "other", description);
      toast.success("Report submitted. Thank you.");
    } catch (e) {
      toast.success("Report submitted. Thank you.");
    }
  };

  // Share data
  const shareUrl = `${window.location.origin}/product/${item?.id}`;
  const shareTitle = item?.title || "Product on 54Links";
  const shareQuote = (item?.description || "").slice(0, 160) + ((item?.description || "").length > 160 ? "…" : "");
  const shareHashtags = ["54Links", "Product", "Marketplace"].filter(Boolean);
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

  // Get all valid media items
  const getValidMedia = () => {
    const validMedia = [];
    if (item?.images?.length > 0) {
      for (const image of item.images) {
        const url = image?.filename || image;
        if (url && (url.startsWith("data:image") || url.startsWith("http"))) {
          validMedia.push({
            url: url.startsWith("http") ? url : `${API_URL}/uploads/${url}`,
            type: 'image',
            name: `product-image-${validMedia.length}`
          });
        }
      }
    }
    return validMedia;
  };

  const validMedia = getValidMedia();

  // Tags logic for ProductCard
  const allTags = useMemo(() => {
    const apiTags = Array.isArray(item?.tags) ? item.tags : [];
    const constructedTags = [
      item?.categoryName,
      item?.subcategoryName,
    ].filter(Boolean);

    return [...new Set([
      ...(Array.isArray(item?.audienceCategories) ? item?.audienceCategories.map(c => c.name) : []),
      ...apiTags,
      ...constructedTags
    ])].filter(Boolean);
  }, [item?.audienceCategories, item?.tags, item?.categoryName, item?.subcategoryName]);

  const visibleTags = allTags.slice(0, 2);
  const extraCount = Math.max(0, allTags.length - visibleTags.length);

  // pick first image if exists
  let imageUrl = item?.images?.[0]?.filename || item?.images?.[0] || null;
  console.log({imageUrl})
  imageUrl =
  imageUrl && (imageUrl?.startsWith("data:image") || imageUrl?.startsWith("http"))
    ? imageUrl
    : imageUrl
    ? `${API_URL}/uploads/${imageUrl}`
    : null;

  const initials = (item?.seller?.name || "?")
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

  const ShareMenu = () => (
    <div
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

  return (
    <>
      <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col group">
        {/* Product image - hide in text mode */}
        {settings?.contentType !== 'text' && (
          <div className="relative cursor-pointer" onClick={() => setPostDialogOpen(true)}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item?.title}
                className="w-full h-44 object-cover"
              />
            ) : (
              <div className="w-full h-44 bg-gray-100 flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}


            {/* Featured badge */}
            {featured && (
              <span className="absolute top-3 left-3 bg-brand-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                Featured
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Text mode: Buttons and audience categories at top */}
          {settings?.contentType === 'text' && (
            <div className="flex flex-col gap-y-2 mb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (item.sellerUserId == user?.id) navigate('/product/' + item.id);
                    else navigate('/product/' + item.id); // View product
                  }}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                  aria-label={item.sellerUserId == user?.id ? "Edit product" : "View product"}
                >
                  {item.sellerUserId == user?.id ? <Edit size={16} /> : <MessageCircle size={16} />}
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

          <h3 className="font-semibold text-gray-900">{item?.title}</h3>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {item?.description}
          </p>

          {/* Price */}
          <div className="mt-2 font-semibold text-brand-600">
            {currency} {item?.price}
          </div>

          {/* Meta info */}
          <div className="mt-2 flex flex-col gap-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <User2 size={14} /> {item?.sellerUserName}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} /> {timeAgo}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {item?.country}
            </span>
          </div>

          {/* Tags and Match Percentage */}
          <div className="flex justify-between mt-2">
            {/* Tags */}
            {visibleTags.length > 0 && (
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
                    className="hover:underline cursor-pointer"
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
          {!user || item.sellerUserId !== user.id ? (
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                {/* Location */}
                {item.country && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin size={14} />
                    <span>{item.country}</span>
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
                    navigate(`/messages?userId=${item.sellerUserId}`);
                    toast.success(`Starting conversation with ${item.sellerUserName || "seller"}`);
                  }}
                  className="flex-1 px-4 py-2 rounded-full bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 transition-colors"
                >
                  Message
                </button>

                {connectionStatus !== "connected" && (
                  <button
                    onClick={() => {
                      if (!user?.id) {
                        data._showPopUp("login_prompt");
                        return;
                      }
                      if (connectionStatus === "pending_incoming" || connectionStatus === "incoming_pending") {
                        window.location.href = "/notifications";
                      } else {
                        setModalOpen(true);
                      }
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
                    {connectionStatus === "connected"
                      ? "Connected"
                      : connectionStatus === "pending_outgoing" ||
                        connectionStatus === "outgoing_pending"
                      ? "Pending"
                      : connectionStatus === "pending_incoming" ||
                        connectionStatus === "incoming_pending"
                      ? "Respond"
                      : "Connect"}
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      
      {/* Comments Dialog */}
      <CommentsDialog
        open={commentsDialogOpen}
        onClose={() => setCommentsDialogOpen(false)}
        entityType="product"
        entityId={item?.id}
        currentUser={user}
        onCountChange={(n) => setCommentCount(n)}
      />

      {/* Likes Dialog */}
      <LikesDialog
        open={likesDialogOpen}
        onClose={() => setLikesDialogOpen(false)}
        entityType="product"
        entityId={item?.id}
      />

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={item?.sellerUserId}
        toName={item?.sellerUserName || "Seller"}
        onSent={onSent}
      />

      {/* Report dialog */}
      <div className={`fixed inset-0 z-50 ${reportOpen ? 'flex' : 'hidden'} items-center justify-center bg-black bg-opacity-50`}>
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Report this product?</h3>
          <p className="text-gray-600 mb-4">Tell us what's happening. Our team will review.</p>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg mb-4"
            rows={3}
            placeholder="Describe the issue (spam, scam, offensive, etc.)"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setReportOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                reportItem("Reported via dialog");
                setReportOpen(false);
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Submit Report
            </button>
          </div>
        </div>
      </div>

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
}
