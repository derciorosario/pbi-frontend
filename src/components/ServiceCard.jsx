// src/components/ServiceCard.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import { MapPin, User2, Clock, MoreHorizontal, MessageCircle, Pencil, Trash2, Edit } from "lucide-react";
import ConnectionRequestModal from "./ConnectionRequestModal";
import ServiceDetailsModal from "./ServiceDetailsModal";
import { useData } from "../contexts/DataContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function ServiceCard({
  item,
  currentUserId,
  currency = "USD",
  onDetails,
  onContact,
  onConnect,
  onEdit,
  onDelete,
}) {
  const isOwner = currentUserId && item?.providerUserId && currentUserId === item.providerUserId;
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(item?.connectionStatus || "none");
  const menuRef = useRef(null);
  const data = useData();
  const { user } = useAuth();

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

  // Include serviceType AS A TAG (no special badge near the title)
  const tags = useMemo(() => {
    const arr = [
      item?.serviceType,         // e.g., Consulting
      item?.experienceLevel,     // e.g., Expert
      item?.categoryName,
      item?.subcategoryName,
      item?.deliveryTime,        // e.g., 1 Week
    ].filter(Boolean);
    return [...new Set(arr.map((t) => String(t).trim()))];
  }, [
    item?.serviceType,
    item?.experienceLevel,
    item?.categoryName,
    item?.subcategoryName,
    item?.deliveryTime,
  ]);

  const primaryAction = useMemo(() => {
    if (isOwner) return { label: "Manage", intent: "manage" };
    switch ((connectionStatus || "none").toLowerCase()) {
      case "connected":
        return { label: "Message", intent: "message" };
      case "pending":
        return { label: "Request Sent", intent: "pending", disabled: true };
      default:
        return { label: "Connect", intent: "connect" };
    }
  }, [connectionStatus, isOwner]);

  const initials = (item?.providerUserName || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handlePrimary() {
    if (isOwner) { onEdit?.(item); return; }
    if (primaryAction.intent === "message") onContact?.(item);
    else if (primaryAction.intent === "connect") {
      if (!user?.id) {
        data._showPopUp("login_prompt");
      } else {
        setModalOpen(true);
      }
    }
  }

  return (
    <>
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 flex flex-col md:flex-row md:items-center gap-5 hover:shadow-md transition-shadow">
      {/* Left: Avatar */}
      <div className="flex-shrink-0 hidden">
        {item?.avatarUrl ? (
          <img
            src={item.avatarUrl}
            alt={item?.providerUserName || "Provider"}
            className="h-14 w-14 rounded-full object-cover border"
          />
        ) : (
          <div
            className="h-14 w-14 rounded-full grid place-items-center font-semibold text-white border"
            style={{
              background: "linear-gradient(135deg, rgba(168,85,168,1) 0%, rgba(138,53,138,1) 100%)",
            }}
            aria-label={item?.providerUserName}
            title={item?.providerUserName}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Middle: Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-gray-900 truncate">{item?.title}</h3>
              {/* Removed the special serviceType badge here */}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <User2 size={14} /> {item?.providerUserName || "—"}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} /> {item?.timeAgo || "—"}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {locationLabel}
              </span>
            </div>
          </div>

          {/* Owner menu (top-right) */}
          {isOwner && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                aria-label="More"
              >
                <MoreHorizontal size={18} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-10">
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit?.(item);
                    }}
                  >
                    <Pencil size={16} /> Edit
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete?.(item);
                    }}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="mt-2 text-sm text-gray-700 line-clamp-2">{item?.description}</p>

        {/* Bottom row — ALWAYS shows price first, then tags */}
        <div className="mt-2 flex flex-wrap gap-2 items-center">
          {/* Price pill (always in bottom row) */}
          <div className="rounded-lg flex-1 bg-gray-100 text-gray-700 px-3 py-1.5 text-sm font-semibold whitespace-nowrap">
            {priceLabel}
          </div>

          {/* Tags (serviceType included here as a normal tag) */}
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-1 text-xs font-medium"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-col gap-2 min-w-[160px]">
        {item.providerUserId==user?.id &&  <button
                        onClick={() => {
                         if(item.providerUserId==user?.id) navigate('/service/'+item.id)
                        }}
                        className="grid place-items-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600"
                        aria-label="Edit"
                      >
                        <Edit size={19}/>
        </button>}
        <button
          onClick={() => setDetailsModalOpen(true)}
          className="rounded-lg border border-brand-500 text-brand-500 px-3 py-1.5 text-sm font-medium hover:bg-brand-50"
        >
          View Details
        </button>

        <button
          disabled={primaryAction.disabled}
          onClick={handlePrimary}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium flex items-center justify-center gap-1.5
            ${
              primaryAction.intent === "pending"
                ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                : "bg-brand-500 text-white hover:bg-brand-500"
            }`}
        >
          {primaryAction.intent === "message" && <MessageCircle size={16} />}
          {primaryAction.label}
        </button>
      </div>
    </div>
    
    {/* Connection Request Modal */}
    <ConnectionRequestModal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      toUserId={item?.providerUserId}
      toName={item?.providerUserName || "this service provider"}
      onSent={() => {
        setConnectionStatus("pending");
      }}
    />
    
    {/* Service Details Modal */}
    <ServiceDetailsModal
      open={detailsModalOpen}
      onClose={() => setDetailsModalOpen(false)}
      service={item}
    />
    </>
  );
}
