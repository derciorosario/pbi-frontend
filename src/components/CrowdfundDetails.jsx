// src/components/CrowdfundDetails.jsx
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
  Link,
  Mail,
  Phone,
  Users,
  Award,
  Copy as CopyIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../lib/toast";
import ConnectionRequestModal from "./ConnectionRequestModal";
import PostDetailsSkeleton from "./ui/PostDetailsSkeleton";
import client from "../api/client";
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

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDaysLeft(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
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

function Progress({ value }) {
  return (
    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full bg-brand-500"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

/* ------------------------------ CrowdfundDetails ----------------------------- */
export default function CrowdfundDetails({ crowdfundId, isOpen, onClose }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [crowdfund, setCrowdfund] = useState(null);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  // Clear crowdfund data when modal closes or crowdfundId changes
  useEffect(() => {
    if (!isOpen) {
      setCrowdfund(null);
      setError("");
      return;
    }

    if (!crowdfundId) return;

    let mounted = true;

    async function fetchCrowdfundDetails() {
      setLoading(true);
      setError("");
      setCrowdfund(null); // Clear previous crowdfund data immediately

      try {
        const { data } = await client.get(`/funding/projects/${crowdfundId}`);
        if (mounted) setCrowdfund(data);
      } catch (err) {
        console.error("Error fetching crowdfund details:", err);
        if (mounted) setError("Failed to load crowdfund details.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchCrowdfundDetails();

    return () => {
      mounted = false;
    };
  }, [isOpen, crowdfundId]);

  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
  }

  // Handle image navigation
  function nextImage() {
    if (!crowdfund?.images?.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % crowdfund.images.length);
  }

  function prevImage() {
    if (!crowdfund?.images?.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + crowdfund.images.length) % crowdfund.images.length);
  }

  if (!isOpen) return null;

  // Get the current image URL (handle both string URLs and object formats)
  const currentImage = crowdfund?.images?.[currentImageIndex];
  const imageUrl = currentImage
    ? (typeof currentImage === 'string' ? currentImage : currentImage.base64url || currentImage)
    : null;

  // Calculate progress percentage
  const raised = parseFloat(crowdfund?.raised || 0);
  const goal = parseFloat(crowdfund?.goal || 0);
  const progress = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;

  // Calculate days left
  const daysLeft = getDaysLeft(crowdfund?.deadline);

  // Format creator initials
  const initials = (crowdfund?.creator?.name || "?")
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
          <div className="text-white font-medium">Crowdfunding Project Details</div>
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
          ) : !crowdfund ? (
            <div className="text-sm text-gray-600">No project details available.</div>
          ) : (
            <>
              {/* Project Images */}
              {crowdfund.images?.length > 0 && (
                <div className="relative mb-6">
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt={crowdfund.title}
                      className="w-full h-64 object-cover bg-gray-50 rounded-lg"
                    />
                    
                    {/* Image navigation controls */}
                    {crowdfund.images.length > 1 && (
                      <div className="absolute inset-x-0 bottom-0 flex justify-between p-2">
                        <button 
                          onClick={prevImage}
                          className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white"
                        >
                          &larr;
                        </button>
                        <div className="bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs">
                          {currentImageIndex + 1} / {crowdfund.images.length}
                        </div>
                        <button 
                          onClick={nextImage}
                          className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white"
                        >
                          &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Project Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{crowdfund.title}</h2>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>{timeAgo(crowdfund.createdAt)}</span>
                    {(crowdfund.city || crowdfund.country) && (
                      <>
                        <span className="mx-1">•</span>
                        <MapPin size={16} />
                        <span>
                          {crowdfund.city ? `${crowdfund.city}, ` : ""}
                          {crowdfund.country || ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Category */}
              {crowdfund.category && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <Chip tone="brand">{crowdfund.category.name}</Chip>
                </div>
              )}

              {/* Funding Progress */}
              <Section title="Funding Progress" icon={DollarSign}>
                <div className="space-y-2">
                  <Progress value={progress} />
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div>
                      <span className="font-semibold">
                        {crowdfund.currency} {Number.isFinite(raised) ? raised.toLocaleString() : "0"}
                      </span>{" "}
                      raised
                    </div>
                    <div>
                      of{" "}
                      <span className="font-semibold">
                        {crowdfund.currency} {Number.isFinite(goal) ? goal.toLocaleString() : "0"}
                      </span>{" "}
                      goal
                    </div>
                    {daysLeft !== null && <div className="text-gray-500">· {daysLeft} days left</div>}
                  </div>
                </div>
              </Section>

              {/* Creator */}
              <Section title="Creator" icon={User2}>
                <div 
                  className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-brand-200"
                  onClick={() => {
                    if (crowdfund?.creatorUserId) {
                      data._showPopUp("profile");
                      data._setProfileUserId?.(crowdfund.creatorUserId);
                    }
                  }}
                >
                  <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-brand-600 font-medium">{initials}</span>
                  </div>
                  <div>
                    <div className="font-medium">{crowdfund.creator?.name || "Project Creator"}</div>
                   </div>
                </div>
              </Section>

              {/* Description */}
              <Section title="Project Pitch" icon={MessageCircle}>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {crowdfund.pitch || "No description provided."}
                </p>
              </Section>

              {/* Deadline */}
              {crowdfund.deadline && (
                <Section title="Deadline" icon={Calendar}>
                  <p className="text-sm text-gray-700">
                    {formatDate(crowdfund.deadline)}
                    {daysLeft !== null && daysLeft > 0 && ` (${daysLeft} days left)`}
                  </p>
                </Section>
              )}

              {/* Location */}
              {(crowdfund.city || crowdfund.country) && (
                <Section title="Location" icon={MapPin}>
                  <p className="text-sm text-gray-700">
                    {crowdfund.city ? `${crowdfund.city}, ` : ""}
                    {crowdfund.country || ""}
                  </p>
                </Section>
              )}

              {/* Rewards */}
              {crowdfund.rewards && (
                <Section title="Rewards" icon={Award}>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{crowdfund.rewards}</p>
                </Section>
              )}

              {/* Team */}
              {crowdfund.team && (
                <Section title="Team" icon={Users}>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{crowdfund.team}</p>
                </Section>
              )}

              {/* Contact Information */}
              {(crowdfund.email || crowdfund.phone) && (
                <Section title="Contact Information" icon={Mail}>
                  {crowdfund.email && (
                    <p className="text-sm text-gray-700 flex items-center gap-2 mb-1">
                      <Mail size={14} className="text-gray-500" />
                      <a href={`mailto:${crowdfund.email}`} className="hover:underline text-brand-600">
                        {crowdfund.email}
                      </a>
                    </p>
                  )}
                  {crowdfund.phone && (
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      <Phone size={14} className="text-gray-500" />
                      <a href={`tel:${crowdfund.phone}`} className="hover:underline text-brand-600">
                        {crowdfund.phone}
                      </a>
                    </p>
                  )}
                </Section>
              )}

              {/* Links */}
              {crowdfund.links?.length > 0 && (
                <Section title="Links" icon={Link}>
                  <div className="space-y-1">
                    {crowdfund.links.map((link, index) => (
                      <p key={`link-${index}`} className="text-sm text-gray-700 flex items-center gap-2">
                        <Link size={14} className="text-gray-500" />
                        <a 
                          href={link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:underline text-brand-600 truncate"
                        >
                          {link}
                        </a>
                      </p>
                    ))}
                  </div>
                </Section>
              )}

              {/* Tags */}
              {crowdfund.tags?.length > 0 && (
                <Section title="Tags" icon={Tag}>
                  <div className="flex flex-wrap gap-2">
                    {crowdfund.tags.map((tag, index) => (
                      <Chip key={`tag-${index}`} tone="gray">
                        {tag}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Categories */}
              {crowdfund.audienceCategories?.length > 0 && (
                <Section title="Target Categories" icon={Layers}>
                  <div className="flex flex-wrap gap-2">
                    {crowdfund.audienceCategories.map((category, index) => (
                      <Chip key={`cat-${index}`} tone="brand">
                        {category.name}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Subcategories */}
              {crowdfund.audienceSubcategories?.length > 0 && (
                <Section title="Target Subcategories" icon={Layers}>
                  <div className="flex flex-wrap gap-2">
                    {crowdfund.audienceSubcategories.map((subcategory, index) => (
                      <Chip key={`subcat-${index}`} tone="gray">
                        {subcategory.name}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Identities */}
              {crowdfund.audienceIdentities?.length > 0 && (
                <Section title="Target Audience" icon={User2}>
                  <div className="flex flex-wrap gap-2">
                    {crowdfund.audienceIdentities.map((identity, index) => (
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
                {crowdfund.creatorUserId !== user?.id && (
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
                    navigate(`/messages?userId=${crowdfund.creatorUserId}`);
                    toast.success(
                      "Starting conversation with " + (crowdfund.creator?.name || "project creator")
                    );
                  }}
                  className="flex-1 rounded-lg px-4 py-2 text-sm font-medium bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Message
                </button>

                {/* Share Menu */}
                {shareOpen && <ShareMenu crowdfund={crowdfund} shareMenuRef={shareMenuRef} setShareOpen={setShareOpen} />}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={crowdfund?.creatorUserId}
        toName={crowdfund?.creator?.name || "Project Creator"}
        onSent={onSent}
      />
    </div>
  );
}

// Share data and components
const ShareMenu = ({ crowdfund, shareMenuRef, setShareOpen }) => {
  const shareUrl = `${window.location.origin}/funding/${crowdfund?.id}`;
  const shareTitle = crowdfund?.title || "Crowdfunding Project on 54Links";
  const shareQuote = (crowdfund?.pitch || "").slice(0, 160) + ((crowdfund?.pitch || "").length > 160 ? "…" : "");
  const shareHashtags = ["54Links", "Crowdfunding", "Startup", "Funding"].filter(Boolean);
  const messengerAppId = import.meta?.env?.VITE_FACEBOOK_APP_ID || undefined;

  return (
    <div
      ref={shareMenuRef}
      className="absolute bottom-14 left-0 z-30 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
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