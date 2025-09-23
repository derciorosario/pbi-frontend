// src/components/NeedDetails.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  X,
  User2,
  Clock,
  MessageCircle,
  Share2,
  Tag,
  DollarSign,
  Layers,
  Calendar,
  Globe,
  Clock3,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Copy as CopyIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../lib/toast";
import ConnectionRequestModal from "./ConnectionRequestModal";
import client from "../api/client";
import LogoGray from '../assets/logo.png';
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

/* -------------------------------- utils --------------------------------- */
function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.floor((now - then) / 1000);
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${m > 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d > 1 ? "s" : ""} ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} month${mo > 1 ? "s" : ""} ago`;
  const y = Math.floor(mo / 12);
  return `${y} year${y > 1 ? "s" : ""} ago`;
}

function fmtLoc(city, country) {
  if (city && country) return `${city}, ${country}`;
  return city || country || "";
}

function Chip({ children, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    green: "bg-green-100 text-green-700",
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="mt-5 text-left">
      <div className="flex items-center gap-2 mb-2">
        {Icon ? <Icon size={16} className="text-brand-600" /> : null}
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ------------------------------ NeedDetails ----------------------------- */
export default function NeedDetails({ needId, isOpen, onClose, item }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [need, setNeed] = useState(null);
  const [error, setError] = useState("");

  // Share menu state
  const [shareOpen, setShareOpen] = useState(false);
  const shareMenuRef = useRef(null);
  const shareButtonRef = useRef(null);
  const modalRef = useRef(null);

  const data = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Close share menu on outside click / Esc
  useEffect(() => {
    function onDown(e) {
      if (
        shareButtonRef.current &&
        !shareButtonRef.current.contains(e.target)
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

  // Fetch need details from API
  useEffect(() => {
    if (!isOpen || !needId) return;

    let mounted = true;

    async function fetchNeedDetails() {
      setLoading(true);
      setError("");

      try {
        const { data } = await client.get(`/needs/${needId}`);
        if (mounted) setNeed(data);
      } catch (err) {
        console.error("Error fetching need details:", err);
        if (mounted) setError("Failed to load need details.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchNeedDetails();

    return () => {
      mounted = false;
    };
  }, [isOpen, needId]);

  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
  }

  function openConnectionRequest() {
    if (!user) return data._showPopUp("login_prompt");
    setModalOpen(true);
  }

  if (!isOpen) return null;

  // Format user initials
  const initials = (need?.userName || item?.userName || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Get first valid image from attachments (computed inline to avoid hooks issues)
  const getMainImageUrl = () => {
    if (need?.attachments?.length > 0) {
      for (const attachment of need.attachments) {
        if (attachment?.base64url && attachment.base64url.startsWith('data:image')) {
          return attachment.base64url;
        }
      }
    }
    return null;
  };

  // Format location label (computed inline to avoid hooks issues)
  const getLocationLabel = () => {
    const city = need?.city?.trim();
    const country = need?.country?.trim();
    if (city && country) return `${city}, ${country}`;
    if (country) return country;
    if (city) return city;
    return "";
  };

  return (
    <div className="fixed z-[99] inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div ref={modalRef} className="bg-white z-[99] w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden relative">
        {/* Header */}
        <div className="bg-brand-500 p-4 flex justify-between items-center">
          <div className="text-white font-medium">Need Details</div>
          <button
            onClick={() => {
              onClose();
              data._closeAllPopUps?.();
            }}
            className="text-white hover:text-brand-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="text-sm text-gray-600">Loading need details...</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : !need ? (
            <div className="text-sm text-gray-600">No need details available.</div>
          ) : (
            <>
              {/* Need Image */}
              {(() => {
                const mainImageUrl = getMainImageUrl();
                return mainImageUrl ? (
                  <div className="relative mb-6">
                    <img
                      src={mainImageUrl}
                      alt={need.title}
                      className="w-full h-64 object-cover bg-gray-50 rounded-lg"
                    />
                  </div>
                ) : need.attachments?.length > 0 ? (
                  <div className="relative mb-6">
                    <div className="w-full h-64 bg-gray-200 flex justify-center items-center rounded-lg">
                      <img src={LogoGray} className="w-[100px]" alt="54Links logo" />
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Need Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{need.title}</h2>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>{timeAgo(need.createdAt)}</span>
                    {getLocationLabel() && (
                      <>
                        <span className="mx-1">•</span>
                        <MapPin size={16} />
                        <span>{getLocationLabel()}</span>
                      </>
                    )}
                  </div>
                </div>
                {need.budget && (
                  <div className="text-2xl font-bold text-brand-600">
                    {need.budget}
                  </div>
                )}
              </div>

              {/* Urgency & Type */}
              <div className="flex flex-wrap gap-2 mt-4">
                {need.urgency && (
                  <Chip tone={need.urgency === "High" ? "red" : need.urgency === "Medium" ? "blue" : "gray"}>
                    {need.urgency} Priority
                  </Chip>
                )}
                {need.relatedEntityType && (
                  <Chip tone="brand">{need.relatedEntityType}</Chip>
                )}
              </div>

              {/* User */}
              <Section title="Posted by" icon={User2}>
                <div
                  className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-brand-200 cursor-pointer"
                  onClick={() => {
                    if (need?.userId) {
                      data._showPopUp("profile");
                      data._setProfileUserId?.(need.userId);
                    }
                  }}
                >
                  {need.userAvatarUrl ? (
                    <img
                      src={need.userAvatarUrl}
                      alt={need.userName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-600 font-medium">{initials}</span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{need.userName || "User"}</div>
                  </div>
                </div>
              </Section>

              {/* Description */}
              <Section title="Description" icon={MessageCircle}>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {need.description || "No description provided."}
                </p>
              </Section>

              {/* Budget & Urgency */}
              <Section title="Details" icon={DollarSign}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {need.budget && (
                    <div className="flex flex-col">
                      <span className="text-gray-500">Budget</span>
                      <span className="font-medium">{need.budget}</span>
                    </div>
                  )}
                  {need.urgency && (
                    <div className="flex flex-col">
                      <span className="text-gray-500">Urgency</span>
                      <span className="font-medium">{need.urgency}</span>
                    </div>
                  )}
                </div>
              </Section>

              {/* Location */}
              {getLocationLabel() && (
                <Section title="Location" icon={MapPin}>
                  <div className="text-sm text-gray-700">
                    {getLocationLabel()}
                  </div>
                </Section>
              )}

              {/* Categories */}
              {need.audienceCategories?.length > 0 && (
                <Section title="Categories" icon={Layers}>
                  <div className="flex flex-wrap gap-2">
                    {need.audienceCategories.map((category, index) => (
                      <Chip key={`cat-${index}`} tone="brand">
                        {category.name}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Subcategories */}
              {need.audienceSubcategories?.length > 0 && (
                <Section title="Subcategories" icon={Layers}>
                  <div className="flex flex-wrap gap-2">
                    {need.audienceSubcategories.map((subcategory, index) => (
                      <Chip key={`subcat-${index}`} tone="gray">
                        {subcategory.name}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Identities */}
              {need.audienceIdentities?.length > 0 && (
                <Section title="Target Audience" icon={User2}>
                  <div className="flex flex-wrap gap-2">
                    {need.audienceIdentities.map((identity, index) => (
                      <Chip key={`identity-${index}`} tone="blue">
                        {identity.name}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Attachments */}
              {need.attachments?.length > 0 && (
                <Section title="Attachments" icon={Tag}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {need.attachments.map((attachment, index) => {
                      const isImage = attachment.base64url && attachment.base64url.startsWith('data:image');
                      const fileName = attachment.name || `Attachment ${index + 1}`;

                      return (
                        <div key={index} className="relative">
                          {isImage ? (
                            <img
                              src={attachment.base64url}
                              alt={fileName}
                              className="w-full h-24 object-cover rounded-lg border border-gray-200"
                            />
                          ) : (
                            <a
                              href={attachment.base64url}
                              download={fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full h-24 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors group"
                              title={`Download ${fileName}`}
                            >
                              <FileText size={24} className="text-gray-400 mb-1" />
                              <span className="text-xs text-gray-600 text-center px-1 truncate max-w-full">
                                {fileName}
                              </span>
                              <ExternalLink size={12} className="text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6 relative">

                  {/* Share */}
                <button
                  ref={shareButtonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareOpen((s) => !s);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-600 transition-colors"
                >
                  <Share2 size={18} />
                  Share
                </button>


                {/* Connect */}
                {need.userId !== user?.id && (
                  <button
                    onClick={() => {
                      if (!user?.id) {
                        data._showPopUp("login_prompt");
                        return;
                      }
                      setModalOpen(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-600 transition-colors"
                  >
                    <User2 size={18} />
                    Connect
                  </button>
                )}

              

                {/* Message */}
                <button
                  onClick={() => {
                    if (!user?.id) {
                      data._showPopUp("login_prompt");
                      return;
                    }
                    onClose();
                    navigate(`/messages?userId=${need.userId}`);
                    toast.success(
                      "Starting conversation with " + (need.userName || "user")
                    );
                  }}
                  className="flex-1 rounded-lg px-4 py-2 text-sm font-medium bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Message
                </button>

                {/* Share Menu */}
                {shareOpen && <ShareMenu need={need} shareMenuRef={shareMenuRef} setShareOpen={setShareOpen} />}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={need?.userId}
        toName={need?.userName || "User"}
        onSent={onSent}
      />
    </div>
  );
}

// Share data and components
const ShareMenu = ({ need, shareMenuRef, setShareOpen }) => {
  const shareUrl = `${window.location.origin}/need/${need?.id}`;
  const shareTitle = need?.title || "Need on 54Links";
  const shareQuote = (need?.description || "").slice(0, 160) + ((need?.description || "").length > 160 ? "…" : "");
  const shareHashtags = ["54Links", "Needs", "Community"].filter(Boolean);
  const messengerAppId = import.meta?.env?.VITE_FACEBOOK_APP_ID || undefined;

  return (
    <div
      ref={shareMenuRef}
      className="absolute bottom-14 left-0 z-30 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
      role="dialog"
      aria-label="Share options"
    >
      <div className="text-xs font-medium text-gray-500 px-1 pb-2">
        Share this need
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