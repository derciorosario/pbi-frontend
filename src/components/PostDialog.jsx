import React, { useState, useEffect } from "react";
import { X, Heart, MessageCircle, Flag, Share2, User, Send, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FormMediaViewer from "./FormMediaViewer";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import * as socialApi from "../api/social";
import { toast } from "../lib/toast";
import ConnectionRequestModal from "./ConnectionRequestModal";
import CommentsDialog from "./CommentsDialog";
import LikesDialog from "./LikesDialog";
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

const PostDialog = ({
  isOpen,
  onClose,
  item,
  type = "event", // "event", "job", "moment", etc.
  mediaUrls = [],
  initialMediaIndex = 0,
  tags = []
}) => {
  const { user } = useAuth();
  const data = useData();
  const navigate = useNavigate();

  // Social state
  const [liked, setLiked] = useState(!!item?.isLiked);
  const [likeCount, setLikeCount] = useState(Number(item?.likesCount || 0));
  const [commentCount, setCommentCount] = useState(Number(item?.commentsCount || 0));

  // Connection state
  const [connectionStatus, setConnectionStatus] = useState(item?.connectionStatus || "none");
  const [modalOpen, setModalOpen] = useState(false);

  // Report dialog
  const [reportOpen, setReportOpen] = useState(false);

  // Share popover
  const [shareOpen, setShareOpen] = useState(false);

  // Comments and likes dialogs
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Initialize social state when item changes
  useEffect(() => {
    if (item?.id) {
      setLiked(!!item.isLiked);
      setLikeCount(Number(item.likesCount || 0));
      setCommentCount(Number(item.commentsCount || 0));
      setConnectionStatus(item.connectionStatus || "none");
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const toggleLike = async () => {
    if (!user?.id) {
      data._showPopUp?.("login_prompt");
      return;
    }
    setLiked((p) => !p);
    setLikeCount((n) => (liked ? Math.max(0, n - 1) : n + 1));
    try {
      const { data: response } = await socialApi.toggleLike(type, item.id);
      setLiked(response.liked);
      setLikeCount(response.count);
    } catch (error) {
      setLiked((p) => !p);
      setLikeCount((n) => (liked ? n + 1 : Math.max(0, n - 1)));
    }
  };

  const reportItem = async (description) => {
    try {
      await socialApi.reportContent(type, item.id, "other", description);
      toast.success("Report submitted. Thank you.");
    } catch (e) {
      toast.success("Report submitted. Thank you.");
    }
  };

  const onSent = () => {
    setModalOpen(false);
    setConnectionStatus("pending_outgoing");
  };

  // Share data
  const shareUrl = `${window.location.origin}/${type}/${item?.id}`;
  const shareTitle = item?.title || `${type.charAt(0).toUpperCase() + type.slice(1)} on 54Links`;
  const shareQuote = (item?.description || "").slice(0, 160) + ((item?.description || "").length > 160 ? "…" : "");
  const shareHashtags = ["54Links", type.charAt(0).toUpperCase() + type.slice(1), "Networking"].filter(Boolean);
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

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full h-[90vh] overflow-hidden flex flex-col md:flex-row">
        {/* Left Media Section */}
        <div className="md:w-1/2 w-full relative bg-black h-full max-md:h-[350px]">
          {mediaUrls.length > 0 ? (
            <FormMediaViewer
              urls={mediaUrls}
              initialIndex={initialMediaIndex}
              onClose={onClose}
              hideClose={true}
              notFixed={true}
              isFromCard={true}
            />
          ) : (
            <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">No media available</span>
            </div>
          )}
        </div>

        {/* Right Content Section */}
        <div className="md:w-1/2 w-full flex flex-col max-h-[90vh] max-md:h-auto overflow-y-auto h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between max-md:hidden hidden">
            <h2 className="text-lg font-semibold text-gray-900">
              {/*type === 'event' ? 'Event Details' :
               type === 'job' ? 'Job Details' :
               type === 'moment' ? 'Moment Details' :
               'Post Details'*/}
               Post Details
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-4">
            {/* User Info */}
            <div className="flex gap-2 justify-between border-b border-gray-200">
               <div className="flex items-center space-x-3 mb-4">
              <img
                src={item.avatarUrl || item.user?.avatarUrl || "https://randomuser.me/api/portraits/men/45.jpg"}
                alt="User"
                className="w-12 h-12 border border-gray-300 rounded-full object-cover cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  const userId = item?.userId || item?.organizerUserId || item?.postedByUserId || item?.creatorUserId;
                  if (userId) {
                    navigate(`/profile/${userId}`);
                  }
                }}
              />
              <div>
                <h2
                  className="font-semibold text-gray-900 cursor-pointer hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    const userId = item?.userId || item?.organizerUserId || item?.postedByUserId || item?.creatorUserId;
                    if (userId) {
                      navigate(`/profile/${userId}`);
                    }
                  }}
                >
                  {item.userName || item.user?.name || item.organizerUserName || item.postedByUserName || "User"}
                </h2>
                <p className="text-sm text-gray-500 flex items-center gap-x-2">
                  {item.timeAgo || "2 d"} •  <Globe size={12} />
                </p>
              </div>
            </div>

            <div>
               <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors max-md:hidden"
            >
              <X size={20} />
            </button>
            </div>

            </div>

            {/* Title */}
            {item.title && (
              <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
            )}

            {/* Description */}
            {item.description && (
              <div className="text-gray-700 leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: item.description }} />
              </div>
            )}

            {/* Additional content based on type */}
            {type === 'event' && (
              <div className="space-y-2">
                {item.date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Date:</span>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                )}
                {item.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Location:</span>
                    <span>{item.location}</span>
                  </div>
                )}
              </div>
            )}

            {type === 'job' && (
              <div className="space-y-2">
                {item.companyName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Company:</span>
                    <span>{item.companyName}</span>
                  </div>
                )}
                {item.salaryMin && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">Salary:</span>
                    <span>{item.currency || 'USD'} {item.salaryMin}{item.salaryMax ? ` - ${item.salaryMax}` : ''}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

         
          {/* Tags and Match Percentage */}
          <div className="px-4 pt-3 pb-3">
            <div className="flex justify-between">
              {/* Tags */}
              {tags && tags.length > 0 && (
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-brand-500"
                      >
                        #{tag.replace(/\s+/g, "")}
                      </span>
                    ))}
                    {tags.length > 3 && (
                      <div className="relative inline-block group/tags">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-gray-600 bg-gray-100 cursor-help">
                          +{tags.length - 3} more
                        </span>
                        {/* Tooltip with remaining tags */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible transition-opacity duration-200 group-hover/tags:opacity-100 group-hover/tags:visible z-10 whitespace-nowrap max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {tags.slice(3).map((tag, i) => (
                              <span key={i} className="inline-block">
                                #{tag.replace(/\s+/g, "")}
                                {i < tags.length - 4 ? "," : ""}
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
                {item.matchPercentage > 0 && (
                  <div
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      item.matchPercentage >= 80
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : item.matchPercentage >= 60
                        ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}
                  >
                    {item.matchPercentage}% match
                  </div>
                )}
              </div>
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
              {shareOpen && (
                <div
                  className="absolute bottom-0 right-3 z-30 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
                  role="dialog"
                  aria-label="Share options"
                >
                  <div className="text-xs font-medium text-gray-500 px-1 pb-2">
                    Share this {type}
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
              )}
            </div>
          </div>

          {/* BOTTOM SECTION - Message and Connect */}
          {!user || (item.userId !== user.id && item.organizerUserId !== user.id && item.postedByUserId !== user.id) ? (
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                {/* Location (if available) */}
                {item.location && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <span>📍</span>
                    <span>{item.location}</span>
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
                    const userId = item?.userId || item?.organizerUserId || item?.postedByUserId;
                    const userName = item?.user?.name || item?.userName || item?.organizerUserName || item?.postedByUserName || "User";
                    if (userId) {
                      window.location.href = `/messages?userId=${userId}`;
                      toast.success(`Starting conversation with ${userName}`);
                    }
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
        entityType={type}
        entityId={item?.id}
        currentUser={user}
        onCountChange={(n) => setCommentCount(n)}
      />

      {/* Likes Dialog */}
      <LikesDialog
        open={likesDialogOpen}
        onClose={() => setLikesDialogOpen(false)}
        entityType={type}
        entityId={item?.id}
      />

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={item?.userId || item?.organizerUserId || item?.postedByUserId}
        toName={item?.user?.name || item?.userName || item?.organizerUserName || item?.postedByUserName || "User"}
        onSent={onSent}
      />

      {/* Report dialog */}
      <div className={`fixed inset-0 z-50 ${reportOpen ? 'flex' : 'hidden'} items-center justify-center bg-black bg-opacity-50`}>
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Report this {type}?</h3>
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
    </div>
  );
};

PostDialog.displayName = 'PostDialog';
export default PostDialog; 