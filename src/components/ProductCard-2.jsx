// src/components/ProductCard.jsx
import React, { useMemo, useState } from "react";
import { MapPin, User2, Clock, MessageCircle, Edit, Eye, Link, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../lib/toast";
import ConnectionRequestModal from "./ConnectionRequestModal";

export default function ProductCard({
  item,
  currency = "US$",
  featured,
  onContact,
  onSave,
  matchPercentage = 0,
  /** Switch layout: "grid" | "list" */
  type = "list",
}) {
  const navigate = useNavigate();
  const data = useData();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const isList = type === "list";

  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
  }

  const imageUrl = item?.images?.[0]?.base64url || item?.images?.[0] || null;

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

  const priceLabel = useMemo(() => {
    if (item?.price == null) return null;
    const cur = item?.currency || currency || "";
    try {
      const n = Number(item.price);
      if (!Number.isNaN(n)) return `${cur} ${n.toLocaleString()}`;
    } catch {}
    return `${cur} ${item.price}`;
  }, [item?.price, item?.currency, currency]);

  const clampedMatch = Math.max(0, Math.min(100, Math.round(matchPercentage)));
  const isOwner = item?.sellerUserId === user?.id;

  const goToDetail = () => navigate(`/product/${item?.id}`);

  const startMessage = () => {
    if (!user?.id) {
      data._showPopUp("login_prompt");
      return;
    }
    navigate(`/messages?userId=${item.sellerUserId}`);
    toast.success("Starting conversation with " + (item.sellerUserName || "seller"));
    if (onContact) onContact(item);
  };


  // helper: circular icon holder (same style as your initials)
  const IconBubble = ({ children }) => (
    <span className="inline-grid place-items-center h-5 w-5 rounded-full bg-gray-200 text-gray-700 flex-shrink-0">
      {children}
    </span>
  );

  /** ---------- GRID CARD ---------- */
  if (!isList) {
    return (
      <>
        <div className="group relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col transition hover:shadow-md">
          {/* Media */}
          <div className="relative">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={item?.title || "Product image"}
                className="w-full h-44 object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-44 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                No Image
              </div>
            )}

            {featured && (
              <span className="absolute top-3 left-3 bg-brand-600 text-white text-xs font-medium px-2 py-1 rounded-full shadow">
                Featured
              </span>
            )}

            {/* Match % + Save */}
            <div className="absolute top-3 right-3 flex items-center gap-x-1">
              <div className="rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-xs font-semibold text-brand-700 border border-gray-200 shadow-sm">
                Match {clampedMatch}%
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSave) onSave(item);
                }}
                className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 group/heart"
                aria-label="Save product"
              >
                <Heart size={12} className="text-gray-600 group-hover/heart:text-red-500 transition-colors duration-200" />
              </button>
            </div>

            <div>
              {item?.tags?.length > 0 && <div className="absolute bottom-1 left-3">
                <span className="inline-flex items-center gap-1 bg-gradient-to-r bg-brand-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                   {item?.tags[0]}
                </span>
              </div>}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{item?.title}</h3>

            {item?.description && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">{item.description}</p>
            )}

            {priceLabel && <div className="mt-2 font-semibold text-brand-600">{priceLabel}</div>}

            {/* Meta */}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
              {/* Seller */}
              <span className="flex items-center gap-2">
                <span
                  className="inline-grid place-items-center h-5 w-5 rounded-full bg-gray-200 text-[10px] font-bold text-gray-700"
                  aria-hidden="true"
                  title={item?.sellerUserName || "Seller"}
                >
                  {initials}
                </span>
                <span className="sr-only">Seller</span>
                {item?.sellerUserName} &bull; Product Manager
              </span> 

              <span className="flex items-center gap-2">
                <IconBubble>
                  <Clock size={12} aria-hidden="true" />
                </IconBubble>
                <span>{timeAgo}</span>
              </span>

              {(item?.city || item?.country) && (
                <span className="flex items-center gap-2">
                  <IconBubble>
                    <MapPin size={12} aria-hidden="true" />
                  </IconBubble>
                  <span>{[item?.city, item?.country].filter(Boolean).join(", ")}</span>
                </span>
              )}
            </div>

            {/* Tags */}
            {item?.tags?.length > 0 && (
              <div className="mt-3 -mx-4 px-4 relative">
                <div
                  className="overflow-x-auto whitespace-nowrap pr-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  role="list"
                  aria-label="Tags"
                >
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      className="mr-2 inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-1 text-xs font-medium align-middle"
                      title={t}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent" />
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-stretch gap-2">
              <button
                onClick={startMessage}
                className="h-10 flex-1 inline-flex items-center justify-center rounded-lg px-3 text-sm border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              >
                <MessageCircle size={16} className="mr-1" />
                Message
              </button>

              <div className="flex items-stretch gap-2 shrink-0">
                <button
                  onClick={goToDetail}
                  className="h-10 px-3 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                  aria-label="View"
                  title="View"
                >
                  <Eye size={15} />
                </button>

                {!isOwner ? (
                  <button
                    onClick={() => {
                      if (!user?.id) {
                        data._showPopUp("login_prompt");
                        return;
                      }
                      setModalOpen(true);
                    }}
                    className="h-10 px-3 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    <Link size={15} className="mr-1" />
                    Connect
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/product/${item?.id}`)}
                    className="h-10 px-3 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    aria-label="Edit"
                    title="Edit"
                  >
                    <Edit size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <ConnectionRequestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          toUserId={item?.sellerUserId}
          toName={item?.sellerUserName || "Seller"}
          onSent={onSent}
        />
      </>
    );
  }

  /** ---------- LIST CARD (image left) ---------- */
  return (
    <>
      <div className="group relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col transition hover:shadow-md sm:flex-row">
        {/* Media (left) */}
        <div className="relative w-full sm:w-48 md:w-56 flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item?.title || "Product image"}
              className="w-full h-44 sm:h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-44 sm:h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
              No Image
            </div>
          )}

          {featured && (
            <span className="absolute top-3 left-3 bg-brand-600 text-white text-xs font-medium px-2 py-1 rounded-full shadow">
              Featured
            </span>
          )}
        </div>

        {/* Right side content */}
        <div className="relative flex-1 p-4">
          {/* Match % + Save (stick to top-right of the whole card) */}
          <div className="absolute top-3 right-3 flex items-center gap-x-1">
            <div className="rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-xs font-semibold text-brand-700 border border-gray-200 shadow-sm">
              Match {clampedMatch}%
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onSave) onSave(item);
              }}
              className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 group/heart"
              aria-label="Save product"
            >
              <Heart size={12} className="text-gray-600 group-hover/heart:text-red-500 transition-colors duration-200" />
            </button>
          </div>

          {/* Title / Description / Price */}
          <h3 className="pr-24 font-semibold text-gray-900 truncate">{item?.title}</h3>

          {item?.description && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2 sm:line-clamp-3">
              {item.description}
            </p>
          )}

          {priceLabel && <div className="mt-2 font-semibold text-brand-600">{priceLabel}</div>}

          {/* Meta */}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-2">
              <span
                className="inline-grid place-items-center h-5 w-5 rounded-full bg-gray-200 text-[10px] font-bold text-gray-700"
                aria-hidden="true"
                title={item?.sellerUserName || "Seller"}
              >
                {initials}
              </span>
              <span className="sr-only">Seller</span>
              {item?.sellerUserName} &bull; Product Manager
            </span>

            <span className="flex items-center gap-2">
              <IconBubble>
                <Clock size={12} aria-hidden="true" />
              </IconBubble>
              <span>{timeAgo}</span>
            </span>

            {(item?.city || item?.country) && (
              <span className="flex items-center gap-2">
                <IconBubble>
                  <MapPin size={12} aria-hidden="true" />
                </IconBubble>
                <span>{[item?.city, item?.country].filter(Boolean).join(", ")}</span>
              </span>
            )}
          </div>

          {/* Tags */}
          {item?.tags?.length > 0 && (
            <div className="mt-3 -mx-4 sm:mx-0 sm:-mr-24 px-4 sm:px-0 relative">
              <div
                className="overflow-x-auto whitespace-nowrap pr-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                role="list"
                aria-label="Tags"
              >
                {item.tags.map((t) => (
                  <span
                    key={t}
                    className="mr-2 inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-1 text-xs font-medium align-middle"
                    title={t}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent" />
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap items-stretch gap-2">
            <button
              onClick={startMessage}
              className="h-10 flex-1 sm:flex-none sm:min-w-[140px] inline-flex items-center justify-center rounded-lg px-3 text-sm border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            >
              <MessageCircle size={16} className="mr-1" />
              Message
            </button>

            <button
              onClick={goToDetail}
              className="h-10 px-3 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              aria-label="View"
              title="View"
            >
              <Eye size={15} />
            </button>

            {!isOwner ? (
              <button
                onClick={() => {
                  if (!user?.id) {
                    data._showPopUp("login_prompt");
                    return;
                  }
                  setModalOpen(true);
                }}
                className="h-10 px-3 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-sm"
              >
                <Link size={15} className="mr-1" />
                Connect
              </button>
            ) : (
              <button
                onClick={() => navigate(`/product/${item?.id}`)}
                className="h-10 px-3 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                aria-label="Edit"
                title="Edit"
              >
                <Edit size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={item?.sellerUserId}
        toName={item?.sellerUserName || "Seller"}
        onSent={onSent}
      />
    </>
  );
}
