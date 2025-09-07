// src/components/ProductCard.jsx
import React, { useMemo, useState } from "react";
import { MapPin, User2, Clock, MessageCircle, Edit } from "lucide-react";
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
}) {
  const navigate = useNavigate();
  const data = useData();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  
  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
  }

  // pick first image if exists
  const imageUrl = item?.images?.[0]?.base64url || item?.images?.[0] || null;
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

  return (
    <>
      <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
        {/* Product image */}
        <div className="relative">
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

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-900 truncate">{item?.title}</h3>
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

          {/* Tags */}
          {item?.tags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {item.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-1 text-xs font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Action button */}
          <div className="flex items-center justify-between mt-4 gap-x-2">
            <button
              onClick={() => {
                if (!user?.id) {
                  data._showPopUp("login_prompt");
                  return;
                }
                
                // Navigate to messages page with the user ID
                navigate(`/messages?userId=${item.sellerUserId}`);
                
                // Show a toast notification
                toast.success("Starting conversation with " + (item.sellerUserName || "seller"));
              }}
              className="rounded-lg px-3 py-2 text-sm border border-gray-200 bg-white text-gray-700 flex items-center gap-1"
            >
              <MessageCircle size={16} />
              Message
            </button>

            {item.sellerUserId!=user?.id && <button 
              onClick={() => {
                if (!user?.id) {
                  data._showPopUp("login_prompt");
                  return;
                }
                setModalOpen(true);
              }}
              className="rounded-lg px-3 py-2 text-sm border border-gray-200 bg-white text-gray-700"
            >
              Connect
            </button>}
             {item.sellerUserId==user?.id &&  <button
                onClick={() => {
                 if(item.sellerUserId==user?.id) navigate('/product/'+item.id)
                }}
                className="grid place-items-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600"
                aria-label="Edit"
              >
                <Edit size={19}/>
              </button>}
          </div>
        </div>
      </div>
      
      {/* Connection Request Modal */}
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
