// src/components/fundingCard.jsx
import React, { useMemo, useState } from "react";
import { useData } from "../contexts/DataContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import ConnectionRequestModal from "./ConnectionRequestModal";
import ProfileModal from "./ProfileModal";
import { toast } from "../lib/toast";
import {
  Eye,
  Edit,
  Share2,
  MapPin,
  Clock,
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
import CrowdfundDetails from "./CrowdfundDetails.jsx";

const BRAND = "#034ea2";

const Progress = ({ value }) => (
  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
    <div
      className="h-full rounded-full"
      style={{ width: `${Math.min(100, value)}%`, background: BRAND }}
    />
  </div>
);

const Tag = ({ children }) => (
  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-50 to-brand-100 text-brand-700 px-3 py-1 text-xs font-medium border border-brand-200/50">
    {children}
  </span>
);

export default function CrowdfundCard({
  item,
  matchPercentage = 20, // optional match chip
  type = "grid", // "grid" | "list"
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(item?.connectionStatus || "none");
  const [openId, setOpenId] = useState(null);
  const [crowdfundDetailsOpen, setCrowdfundDetailsOpen] = useState(false);

  // Share popover
  const [shareOpen, setShareOpen] = useState(false);
  const { user } = useAuth();
  const data = useData();
  const navigate = useNavigate();

  // First image (supports base64url or string URL)
  const imageUrl =
    item?.images?.[0]?.base64url ||
    (typeof item?.images?.[0] === "string" ? item.images[0] : null) ||
    null;

  // Raised/goal/progress
  const raised = parseFloat(item?.raised || 0);
  const goal = parseFloat(item?.goal || 0);
  const progress = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;

  const daysLeft = useMemo(() => {
    if (!item?.deadline) return null;
    const now = new Date();
    const deadline = new Date(item.deadline);
    const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [item?.deadline]);

  // Tags (exactly 2)
  const allTags = Array.isArray(item?.tags) ? item.tags.filter(Boolean) : [];
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

  const isOwner = !!user?.id && user.id === item?.creatorUserId;

  // Share data
  const shareUrl = `${window.location.origin}/funding/${item?.id}`;
  const shareTitle = item?.title || "Crowdfunding project on 54Links";
  const shareQuote = (item?.pitch || "").slice(0, 160) + ((item?.pitch || "").length > 160 ? "…" : "");
  const shareHashtags = ["54Links", "Crowdfunding", "Support"].filter(Boolean);
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
      className="absolute top-12 right-3 z-30 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
      role="dialog"
      aria-label="Share options"
    >
      <div className="text-xs font-medium text-gray-500 px-1 pb-2">
        Share this project
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

  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
    setConnectionStatus("pending_outgoing");
  }

  // Determine if we're in list mode
  const isList = type === "list";

  // Container classes based on layout type
  const containerBase = "group relative rounded-[15px] border border-gray-100 bg-white shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300 ease-out";
  const containerLayout = isList
    ? "grid grid-cols-[160px_1fr] md:grid-cols-[224px_1fr] items-stretch"
    : "flex flex-col";

  return (
    <>
      <div className={`${containerBase} ${containerLayout}`}>
        {/* IMAGE */}
        {isList ? (
          <div className="relative h-full min-h-[160px] md:min-h-[176px] overflow-hidden">
            {imageUrl ? (
              <>
                <img src={imageUrl} alt={item?.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* audienceCategories overlay when image exists */}
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
              // clean placeholder (no text)
              <div className="absolute inset-0 w-full h-full bg-gray-100" />
            )}

            {/* Quick actions on image */}
            <div className="absolute top-3 right-3 flex gap-2">

              <button
              onClick={() => {
                if (isOwner) navigate(`/funding/${item.id}`);
                else setCrowdfundDetailsOpen(true);
              }}
             className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                aria-label={isOwner ? "Edit" : "View"}
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
        ) : (
          <div className="relative overflow-hidden">
            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={item?.title}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {/* audienceCategories overlay when image exists */}
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
              // clean placeholder (no text)
              <div className="w-full h-48 bg-gray-100" />
            )}

            {/* Quick actions on image */}
            <div className="absolute top-4 right-4 flex gap-2">

                 <button
              onClick={() => {
                if (isOwner) navigate(`/funding/${item.id}`);
                else setCrowdfundDetailsOpen(true);
              }}
             className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200"
                aria-label={isOwner ? "Edit" : "View"}
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
        )}

        {/* CONTENT */}
        <div className={`${isList ? "p-4 md:p-5" : "p-5"} flex flex-col flex-1`}>
          {/* Title */}
          <h3 className="text-[17px] font-semibold text-gray-900 group-hover:text-brand-600 transition-colors duration-200">
            {item?.title}
          </h3>

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

          {/* Pitch */}
          <p className="mt-2 text-[15px] text-gray-700 line-clamp-3">{item?.pitch}</p>

          {/* Meta row (creator + match + time + location) */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              {/* Creator quick profile (opens ProfileModal) */}
              <div
                className="flex items-center gap-2 text-sm text-gray-600 _profile hover:underline cursor-pointer"
                onClick={() => {
                  if (item?.creatorUserId) {
                    setOpenId(item.creatorUserId);
                    data._showPopUp?.("profile");
                  }
                }}
              >
                {item?.avatarUrl ? (
                  <img
                    src={item.avatarUrl}
                    alt={item?.creatorUserName || "Creator"}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 bg-brand-100 rounded-full grid place-items-center">
                    <UserIcon size={12} className="text-brand-600" />
                  </div>
                )}
                <span className="font-medium">{item?.creatorUserName || item?.creatorName || "Creator"}</span>
              </div>

              {/* Match % chip */}
              {matchPercentage !== undefined && matchPercentage !== null && (
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
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {timeAgo}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {item?.city ? `${item.city}, ` : ""}
                {item?.country || "—"}
              </span>
            </div>
          </div>

          {/* Funding progress */}
          <div className="mt-4 space-y-2">
            <Progress value={progress} />
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div>
                <span className="font-semibold">
                  {item?.currency} {Number.isFinite(raised) ? raised.toLocaleString() : "0"}
                </span>{" "}
                raised
              </div>
              <div>
                of{" "}
                <span className="font-semibold">
                  {item?.currency} {Number.isFinite(goal) ? goal.toLocaleString() : "0"}
                </span>{" "}
                goal
              </div>
              {daysLeft !== null && <div className="text-gray-500">· {daysLeft} days left</div>}
            </div>
          </div>

          {/* Tags — show 2 + tooltip for extras */}
          {!!visibleTags.length && (
            <div className="mt-4 flex flex-wrap gap-2">
              {visibleTags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
              {extraCount > 0 && (
                <div className="relative inline-block group/tagmore">
                  <span
                    className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs font-medium cursor-default hover:bg-gray-200 transition-colors duration-200"
                    aria-describedby={`fund-tags-more-${item.id}`}
                    tabIndex={0}
                  >
                    +{extraCount} more
                  </span>

                  <div
                    id={`fund-tags-more-${item.id}`}
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

          {/* Actions */}
          <div className={`${isList ? "mt-3" : "mt-5"} flex items-center gap-2 ${isList ? "justify-end md:justify-start" : ""}`}>
            {/* Keep your Support button logic as-is (owner-only per your original code) */}
            {item.creatorUserId == user?.id && (
              <button
                onClick={() => {
                  if (!user) {
                    data._showPopUp("login_prompt");
                    return;
                  }
                  navigate(`/messages?userId=${item.creatorUserId}`);
                }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: BRAND }}
              >
                Support Project
              </button>
            )}

            {/* View/Edit (mirrors the image quick action) */}
            <button
              onClick={() => {
                if (isOwner) navigate(`/funding/${item.id}`);
                else setCrowdfundDetailsOpen(true);
              }}
              className="flex items-center hidden justify-center h-10 w-10 flex-shrink-0 rounded-xl border-2 border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200 group/view"
              aria-label={isOwner ? "Edit" : "View"}
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
                navigate(`/messages?userId=${item.creatorUserId}`);
                toast.success("Starting conversation with " + (item.creatorUserName || "project creator"));
              }}
              className={`${
                type === "grid" ? "flex-1" : ""
              } rounded-xl px-4 py-2.5 text-sm font-medium bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800 transition-all duration-200 shadow-sm hover:shadow-md`}
            >
              Message
            </button>

            {/* Connect like the others */}
            {renderConnectButton()}
          </div>
        </div>
      </div>

      {/* SHARE MENU */}
      {shareOpen && <ShareMenu />}

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={item?.creatorUserId}
        toName={item?.creatorUserName || item?.creatorName || "Project Creator"}
        onSent={onSent}
      />

      {/* Profile Modal */}
      <ProfileModal
        userId={openId}
        isOpen={!!openId}
        onClose={() => setOpenId(null)}
        onSent={onSent}
      />

      {/* Crowdfund Details Modal */}
      <CrowdfundDetails
        crowdfundId={item?.id}
        isOpen={crowdfundDetailsOpen}
        onClose={() => setCrowdfundDetailsOpen(false)}
      />
    </>
  );

  // --- helpers ---
  function renderConnectButton() {
    if (item.creatorUserId == user?.id) return null;

    const status = (connectionStatus || "none").toLowerCase();

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
          title="Sign in to send a request"
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
