// src/components/ProductDetails.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  X,
  User2,
  Clock,
  MessageCircle,
  Heart,
  Share2,
  Tag,
  DollarSign,
  Layers,
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

/* ------------------------------ ProductDetails ----------------------------- */
export default function ProductDetails({ productId, isOpen, onClose, onSave }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
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

  // Clear product data when modal closes or productId changes
  useEffect(() => {
    if (!isOpen) {
      setProduct(null);
      setError("");
      return;
    }

    if (!productId) return;

    let mounted = true;

    async function fetchProductDetails() {
      setLoading(true);
      setError("");
      setProduct(null); // Clear previous product data immediately

      try {
        const { data } = await client.get(`/products/${productId}`);
        if (mounted) setProduct(data);
      } catch (err) {
        console.error("Error fetching product details:", err);
        if (mounted) setError("Failed to load product details.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProductDetails();

    return () => {
      mounted = false;
    };
  }, [isOpen, productId]);

  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
  }

  function openConnectionRequest() {
    if (!user) return data._showPopUp("login_prompt");
    setModalOpen(true);
  }

  // Handle image navigation
  function nextImage() {
    if (!product?.images?.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  }

  function prevImage() {
    if (!product?.images?.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  }

  if (!isOpen) return null;

  // Get the current image URL
  let imageUrl = product?.images?.[currentImageIndex]?.filename || 
                  product?.images?.[currentImageIndex] || 
                  null;

  imageUrl =
    imageUrl && (imageUrl?.startsWith("data:image") || imageUrl?.startsWith("http"))
      ? imageUrl
      : imageUrl
      ? `${API_URL}/uploads/${imageUrl}`
      : null;

  

  // Format seller initials
  const initials = (product?.seller?.name || product?.sellerUserName || "?")
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
          <div className="text-white font-medium">Product Details</div>
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
          ) : !product ? (
            <div className="text-sm text-gray-600">No product details available.</div>
          ) : (
            <>
              {/* Product Images */}
              <div className="relative mb-6">
                {imageUrl ? (
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt={product.title}
                      className="w-full h-64 object-contain bg-gray-50 rounded-lg"
                    />
                    
                    {/* Image navigation controls */}
                    {product.images?.length > 1 && (
                      <div className="absolute inset-x-0 bottom-0 flex justify-between p-2">
                        <button 
                          onClick={prevImage}
                          className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white"
                        >
                          &larr;
                        </button>
                        <div className="bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs">
                          {currentImageIndex + 1} / {product.images.length}
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
                ) : (
                 <></>
                )}
              </div>

              {/* Product Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{product.title}</h2>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>{timeAgo(product.createdAt)}</span>
                    {product.country && (
                      <>
                        <span className="mx-1">•</span>
                        <MapPin size={16} />
                        <span>{product.country}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-2xl font-bold text-brand-600">
                  {product.currency || "US$"} {product.price}
                </div>
              </div>

              {/* Seller Info */}
              <Section title="Posted By" icon={User2}>
                <div 
                  className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-brand-200"
                 
                >
                  {product.avatarUrl ? (
                    <img
                      src={product.avatarUrl}
                      alt={product.sellerUserName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-600 font-medium">{initials}</span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{product.seller?.name}</div>
                  </div>
                </div>
              </Section>

              {/* Description */}
              <Section title="Description" icon={MessageCircle}>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {product.description || "No description provided."}
                </p>
              </Section>

              {/* Categories */}
              {product.audienceCategories?.length > 0 && (
                <Section title="Categories" icon={Layers}>
                  <div className="flex flex-wrap gap-2">
                    {product.audienceCategories.map((category, index) => (
                      <Chip key={`cat-${index}`} tone="brand">
                        {category.name}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Tags */}
              {product.tags?.length > 0 && (
                <Section title="Tags" icon={Tag}>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <Chip key={`tag-${index}`} tone="gray">
                        {tag}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Additional Details (if available) */}
              {(product.specifications || product.condition || product.brand) && (
                <Section title="Additional Details" icon={DollarSign}>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {product.brand && (
                      <div className="flex flex-col">
                        <span className="text-gray-500">Brand</span>
                        <span className="font-medium">{product.brand}</span>
                      </div>
                    )}
                    {product.condition && (
                      <div className="flex flex-col">
                        <span className="text-gray-500">Condition</span>
                        <span className="font-medium">{product.condition}</span>
                      </div>
                    )}
                    {product.specifications && Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex flex-col">
                        <span className="text-gray-500">{key}</span>
                        <span className="font-medium">{value}</span>
                      </div>
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
                {product.sellerUserId !== user?.id && (
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
                    navigate(`/messages?userId=${product.sellerUserId}`);
                    toast.success(
                      "Starting conversation with " + (product.sellerUserName || "seller")
                    );
                  }}
                  className="flex-1 rounded-lg px-4 py-2 text-sm font-medium bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Message
                </button>

                {/* Share Menu */}
                {shareOpen && <ShareMenu product={product} shareMenuRef={shareMenuRef} setShareOpen={setShareOpen} />}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={product?.sellerUserId}
        toName={product?.sellerUserName || "Seller"}
        onSent={onSent}
      />
    </div>
  );
}

// Share data and components
const ShareMenu = ({ product, shareMenuRef, setShareOpen }) => {
  const shareUrl = `${window.location.origin}/product/${product?.id}`;
  const shareTitle = product?.title || "Product on 54Links";
  const shareQuote = (product?.description || "").slice(0, 160) + ((product?.description || "").length > 160 ? "…" : "");
  const shareHashtags = ["54Links", "Products", "Marketplace"].filter(Boolean);
  const messengerAppId = import.meta?.env?.VITE_FACEBOOK_APP_ID || undefined;

  return (
    <div
      ref={shareMenuRef}
      className="absolute bottom-14 left-0 z-30 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
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