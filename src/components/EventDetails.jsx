// src/components/EventDetails.jsx
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
  Copy as CopyIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../lib/toast";
import ConnectionRequestModal from "./ConnectionRequestModal";
import PostDetailsSkeleton from "./ui/PostDetailsSkeleton";
import client, { API_URL } from "../api/client";
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

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(startDate, endDate, timezone) {
  if (!startDate) return "";
  
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit' };
  
  let formatted = start.toLocaleDateString(undefined, dateOptions);
  formatted += ' at ' + start.toLocaleTimeString(undefined, timeOptions);
  
  if (end) {
    // If same day, just add end time
    if (start.toDateString() === end.toDateString()) {
      formatted += ' - ' + end.toLocaleTimeString(undefined, timeOptions);
    } else {
      formatted += ' - ' + end.toLocaleDateString(undefined, dateOptions);
      formatted += ' at ' + end.toLocaleTimeString(undefined, timeOptions);
    }
  }
  
  if (timezone) {
    formatted += ` (${timezone})`;
  }
  
  return formatted;
}

function Chip({ children, tone = "brand" }) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    green: "bg-green-100 text-green-700",
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
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

/* ------------------------------ EventDetails ----------------------------- */
export default function EventDetails({ eventId, isOpen, onClose, item }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState(null);
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
        shareMenuRef.current &&
        !shareButtonRef.current.contains(e.target) &&
        !shareMenuRef.current.contains(e.target)
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

  // Clear event data when modal closes or eventId changes
  useEffect(() => {
    if (!isOpen) {
      setEvent(null);
      setError("");
      return;
    }

    if (!eventId) return;

    let mounted = true;

    async function fetchEventDetails() {
      setLoading(true);
      setError("");
      setEvent(null); // Clear previous event data immediately

      try {
        const { data } = await client.get(`/events/${eventId}`);
        if (mounted) setEvent(data);
      } catch (err) {
        console.error("Error fetching event details:", err);
        if (mounted) setError("Failed to load event details.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchEventDetails();

    return () => {
      mounted = false;
    };
  }, [isOpen, eventId]);

  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
  }

  function openConnectionRequest() {
    if (!user) return data._showPopUp("login_prompt");
    setModalOpen(true);
  }

  if (!isOpen) return null;

   let imageUrl = event?.coverImageUrl || event?.coverImage || null;
    
      imageUrl =
      imageUrl && (imageUrl?.startsWith("data:image") || imageUrl?.startsWith("http"))
        ? imageUrl
        : imageUrl
        ? `${API_URL}/uploads/${imageUrl}`
        : null; 

  // Format organizer initials
  const initials = (event?.organizerUserName || item?.organizerUserName || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed z-[99] inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div ref={modalRef} className="bg-white z-[99] w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden relative">
        {/* Header */}
        <div className="bg-brand-500 p-4 flex justify-between items-center">
          <div className="text-white font-medium">Event Details</div>
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
            <PostDetailsSkeleton />
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : !event ? (
            <div className="text-sm text-gray-600">No event details available.</div>
          ) : (
            <>
              {/* Event Image */}
              {event.coverImageUrl && (
                <div className="relative mb-6">
                  <img
                    src={imageUrl}
                    alt={event.title}
                    className="w-full h-64 object-cover bg-gray-50 rounded-lg"
                  />
                </div>
              )}

              {/* Event Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{event.title}</h2>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>{timeAgo(event.createdAt)}</span>
                    {event.country && (
                      <>
                        <span className="mx-1">•</span>
                        <MapPin size={16} />
                        <span>{fmtLoc(event.city, event.country)}</span>
                      </>
                    )}
                  </div>
                </div>
                {event.registrationType === "Paid" && event.price && (
                  <div className="text-2xl font-bold text-brand-600">
                    {event.currency || "USD"} {event.price}
                  </div>
                )}
              </div>

              {/* Event Type & Registration Type */}
              <div className="flex flex-wrap gap-2 mt-4">
                {event.eventType && (
                  <Chip tone="brand">{event.eventType}</Chip>
                )}
                {event.locationType && (
                  <Chip tone="blue">{event.locationType}</Chip>
                )}
                {event.registrationType && (
                  <Chip tone={event.registrationType === "Free" ? "green" : "gray"}>
                    {event.registrationType}
                  </Chip>
                )}
              </div>

              {/* Organizer */}
              <Section title="Organizer" icon={User2}>
                <div 
                  className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-brand-200 cursor-pointer"
                  onClick={() => {
                    if (event?.organizerUserId) {
                      data._showPopUp("profile");
                      data._setProfileUserId?.(event.organizerUserId);
                    }
                  }}
                >
                  {event.organizerUserAvatarUrl ? (
                    <img
                      src={event.organizerUserAvatarUrl || item?.organizerUserName}
                      alt={event.organizerUserName || item?.organizerUserName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-600 font-medium">{initials}</span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{event.organizerUserName || item?.organizerUserName || "Event Organizer"}</div>
                  </div>
                </div>
              </Section>

              {/* Description */}
              <Section title="Description" icon={MessageCircle}>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {event.description || "No description provided."}
                </p>
              </Section>

              {/* Date & Time */}
              <Section title="Date & Time" icon={Calendar}>
                <div className="text-sm text-gray-700">
                  {formatDateTime(event.startAt, event.endAt, event.timezone)}
                </div>
              </Section>

              {/* Location */}
              <Section title="Location" icon={MapPin}>
                <div className="text-sm text-gray-700">
                  {event.locationType === "Virtual" ? (
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-brand-600" />
                      <span>Virtual Event</span>
                      {event.onlineUrl && (
                        <a 
                          href={event.onlineUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline"
                        >
                          Join Link
                        </a>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p>{event.address}</p>
                      <p>{fmtLoc(event.city, event.country)}</p>
                    </div>
                  )}
                </div>
              </Section>

              {/* Registration Details */}
              <Section title="Registration" icon={DollarSign}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-500">Registration Type</span>
                    <span className="font-medium">{event.registrationType || "Free"}</span>
                  </div>
                  {event.registrationType === "Paid" && event.price && (
                    <div className="flex flex-col">
                      <span className="text-gray-500">Price</span>
                      <span className="font-medium">{event.currency || "USD"} {event.price}</span>
                    </div>
                  )}
                  {event.capacity && (
                    <div className="flex flex-col">
                      <span className="text-gray-500">Capacity</span>
                      <span className="font-medium">{event.capacity} attendees</span>
                    </div>
                  )}
                  {event.registrationDeadline && (
                    <div className="flex flex-col">
                      <span className="text-gray-500">Registration Deadline</span>
                      <span className="font-medium">{formatDate(event.registrationDeadline)}</span>
                    </div>
                  )}
                </div>
              </Section>

              {/* Categories */}
              {event.audienceCategories?.length > 0 && (
                <Section title="Categories" icon={Layers}>
                  <div className="flex flex-wrap gap-2">
                    {event.audienceCategories.map((category, index) => (
                      <Chip key={`cat-${index}`} tone="brand">
                        {category.name}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Subcategories */}
              {event.audienceSubcategories?.length > 0 && (
                <Section title="Subcategories" icon={Layers}>
                  <div className="flex flex-wrap gap-2">
                    {event.audienceSubcategories.map((subcategory, index) => (
                      <Chip key={`subcat-${index}`} tone="gray">
                        {subcategory.name}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Identities */}
              {event.audienceIdentities?.length > 0 && (
                <Section title="Target Audience" icon={User2}>
                  <div className="flex flex-wrap gap-2">
                    {event.audienceIdentities.map((identity, index) => (
                      <Chip key={`identity-${index}`} tone="blue">
                        {identity.name}
                      </Chip>
                    ))}
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
                {event.organizerUserId !== user?.id && (
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
                    navigate(`/messages?userId=${event.organizerUserId}`);
                    toast.success(
                      "Starting conversation with " + (event.organizerUserName || item?.organizerUserName || "event organizer")
                    );
                  }}
                  className="flex-1 rounded-lg px-4 py-2 text-sm font-medium bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Message
                </button>

                {/* Share Menu */}
                {shareOpen && <ShareMenu event={event} shareMenuRef={shareMenuRef} setShareOpen={setShareOpen} />}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={event?.organizerUserId}
        toName={event?.organizerUserName || "Event Organizer"}
        onSent={onSent}
      />
    </div>
  );
}

// Share data and components
const ShareMenu = ({ event, shareMenuRef, setShareOpen }) => {
  const shareUrl = `${window.location.origin}/event/${event?.id}`;
  const shareTitle = event?.title || "Event on 54Links";
  const shareQuote = (event?.description || "").slice(0, 160) + ((event?.description || "").length > 160 ? "…" : "");
  const shareHashtags = ["54Links", "Events", "Networking", "Community"].filter(Boolean);
  const messengerAppId = import.meta?.env?.VITE_FACEBOOK_APP_ID || undefined;

  return (
    <div
      ref={shareMenuRef}
      className="absolute bottom-14 left-0 z-30 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
      role="dialog"
      aria-label="Share options"
    >
      <div className="text-xs font-medium text-gray-500 px-1 pb-2">
        Share this event
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