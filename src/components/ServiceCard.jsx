
// src/components/ServiceCard.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  User as UserIcon,
  Clock,
  Eye,
  Edit,
  MessageCircle,
  Share2,
} from "lucide-react";
import ConnectionRequestModal from "./ConnectionRequestModal";
import ServiceDetails from "./ServiceDetails";
import ProfileModal from "./ProfileModal";
import { useData } from "../contexts/DataContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { toast } from "../lib/toast";

export default function ServiceCard({
  item,
  currentUserId,
  currency = "USD",
  onDetails,
  onContact,
  onConnect,
  onEdit,
  onDelete, // kept for API parity (not shown in UI here)
  type = "grid",          // kept for API parity
  matchPercentage = 20,   // optional % chip
}) {
  const navigate = useNavigate();
  const data = useData();
  const { user } = useAuth();

  const isOwner =
    (currentUserId && item?.providerUserId && currentUserId === item.providerUserId) ||
    (!!user?.id && item?.providerUserId === user.id);

  const [modalOpen, setModalOpen] = useState(false);        // Connect modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(item?.connectionStatus || "none");
  const [openId, setOpenId] = useState(null);               // Profile modal
  
  // First image (supports base64url or string URL)
  const imageUrl =
    item?.images?.[0]?.base64url ||
    (typeof item?.images?.[0] === "string" ? item.images[0] : null) ||
    null;

  const priceLabel = useMemo(() => {
    const amount = Number(item?.priceAmount ?? 0);
    try {
      const fmt = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: amount % 1 ? 2 : 0,
        maximumFractionDigits: 2,
      });
      return `${fmt.format(amount)}${item?.priceType ? ` / ${item.priceType}` : ""}`;
    } catch {
      return `${amount}${item?.priceType ? ` / ${item.priceType}` : ""}`;
    }
  }, [item?.priceAmount, item?.priceType, currency]);

  const locationLabel = useMemo(() => {
    const city = item?.city?.trim();
    const country = item?.country?.trim();
    if (city && country) return `${city}, ${country}`;
    if (country) return country;
    if (city) return city;
    return item?.locationType || "—";
  }, [item?.city, item?.country, item?.locationType]);

  // Tags (exactly 2 visible)
  const allTags = useMemo(() => {
    const arr = [
      item?.serviceType,
      item?.experienceLevel,
      item?.categoryName,
      item?.subcategoryName,
      item?.deliveryTime,
    ].filter(Boolean);
    return [...new Set(arr.map((t) => String(t).trim()))];
  }, [item?.serviceType, item?.experienceLevel, item?.categoryName, item?.subcategoryName, item?.deliveryTime]);

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

  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
    setConnectionStatus("pending_outgoing");
    onConnect?.(item);
  }

  function handleMessage() {
    if (onContact) return onContact(item);
    if (!user?.id) {
      data._showPopUp("login_prompt");
      return;
    }
    navigate(`/messages?userId=${item.providerUserId}`);
    toast.success("Starting conversation with " + (item?.providerUserName || "provider"));
  }

  return (
    <>
      <div className="group relative rounded-[15px] border border-gray-100 bg-white shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300 ease-out flex flex-col h-full">
        {/* IMAGE */}
        {imageUrl && (
          <div className="relative overflow-hidden">
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

            {/* Quick actions on image */}
            <div className="absolute top-4 right-4 flex gap-2">
            

              <button
                onClick={() => {
                  const shareUrl = `${window.location.origin}/service/${item.id}`;
                  if (navigator.share) {
                    navigator.share({ title: item.title, text: item.description, url: shareUrl }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied to clipboard");
                  }
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
        <div className="p-5 flex flex-col flex-1">
          {/* Title */}
          <h3 className="font-semibold text-lg text-gray-900 truncate mb-0.5 group-hover:text-brand-600 transition-colors duration-200">
            {item?.title}
          </h3>

          {/* audienceCategories UNDER title (only when there is NO image) */}
          {!imageUrl && Array.isArray(item?.audienceCategories) && item.audienceCategories.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
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

          {/* Description */}
          <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-2">
            {item?.description}
          </p>

          {/* Price */}
          <div className="mt-2 mb-3">
            <span className="text-2xl font-bold text-gray-700">{priceLabel}</span>
          </div>

          {/* Meta (provider + match + time + location) */}
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between">
              {/* Provider inline profile (opens ProfileModal) */}
              <div
                className="flex items-center gap-2 text-sm text-gray-600 _profile hover:underline cursor-pointer"
                onClick={() => {
                  if (item?.providerUserId) {
                    setOpenId(item.providerUserId);
                    data._showPopUp?.("profile");
                  }
                }}
              >
                {item?.avatarUrl ? (
                  <img
                    src={item.avatarUrl}
                    alt={item?.providerUserName || "Provider"}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 bg-brand-100 rounded-full grid place-items-center">
                    <UserIcon size={12} className="text-brand-600" />
                  </div>
                )}
                <span className="font-medium">{item?.providerUserName || "Provider"}</span>
              </div>

              {/* Match % chip */}
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
                {locationLabel}
              </span>
            </div>
          </div>

          {/* Tags (show 2) with "+X more" tooltip if applicable */}
          {!!visibleTags.length && (
            <div className="mb-4 flex flex-wrap gap-2">
              {visibleTags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-50 to-brand-100 text-brand-700 px-3 py-1 text-xs font-medium border border-brand-200/50"
                >
                  {t}
                </span>
              ))}

              {extraCount > 0 && (
                <div className="relative inline-block group/tagmore">
                  <span
                    className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs font-medium cursor-default hover:bg-gray-200 transition-colors duration-200"
                    aria-describedby={`service-tags-more-${item.id}`}
                    tabIndex={0}
                  >
                    +{extraCount} more
                  </span>

                  <div
                    id={`service-tags-more-${item.id}`}
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

          {/* Actions (View + Message + Connect / or Edit if owner) */}
          <div className="flex items-center gap-2 mt-auto pt-2">
            {/* View (Edit if owner) */}
            <button
              onClick={() => {
                if (isOwner) {
                  if (onEdit) onEdit(item);
                  else navigate(`/service/${item.id}`);
                } else {
                  setDetailsModalOpen(true);
                  onDetails?.(item);
                }
              }}
              className="flex items-center justify-center h-10 w-10 flex-shrink-0 rounded-xl border-2 border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200 group/view"
              aria-label={isOwner ? "Edit service" : "View service"}
            >
              {isOwner ? (
                <Edit size={16} className="transition-transform duration-200 group-hover/view:scale-110" />
              ) : (
                <Eye size={16} className="transition-transform duration-200 group-hover/view:scale-110" />
              )}
            </button>

            {/* Message */}
            <button
              onClick={handleMessage}
              className="rounded-xl px-4 py-2.5 flex-1 text-sm font-medium bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Message
            </button>

            {/* Connect button like the others */}
            {!isOwner && renderConnectButton()}
          </div>
        </div>
      </div>

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={item?.providerUserId}
        toName={item?.providerUserName || "Service Provider"}
        onSent={onSent}
      />

      {/* Profile Modal */}
      <ProfileModal
        userId={openId}
        isOpen={!!openId}
        onClose={() => setOpenId(null)}
        onSent={onSent}
      />

      {/* Details Modal */}
      <ServiceDetails
        serviceId={item?.id}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
      />
    </>
  );

  // --- helpers ---
  function renderConnectButton() {
    const status = (connectionStatus || item?.connectionStatus || "none")?.toLowerCase();

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
        >
          Connect
        </button>
      );
    }
    return (
      <button
        onClick={() => {
          onConnect?.(item);
          setModalOpen(true);
        }}
        className="rounded-xl px-4 py-2.5 text-sm font-medium border-2 border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200"
      >
        Connect
      </button>
    );
  }
}
