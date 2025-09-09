// src/components/ProductCard.jsx
import React, { useMemo, useState } from "react";
import {
  MapPin,
  User2,
  Clock,
  MessageCircle,
  Edit,
  Heart,
  Star,
  Eye,
  Share2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../lib/toast";
import ConnectionRequestModal from "./ConnectionRequestModal";
import ProfileModal from "./ProfileModal";
import ProductDetails from "./ProductDetails";

export default function ProductCard({
  item,
  currency = "US$",
  featured,
  onContact,
  onSave,
  matchPercentage = 20, // match percentage prop
  type = "grid", // "grid" | "list"
}) {
  const navigate = useNavigate();
  const data = useData();
  const { user } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [productDetailsOpen, setProductDetailsOpen] = useState(false);
  
  // Track connection status locally (for immediate UI updates)
  const [connectionStatus, setConnectionStatus] = useState(item?.connectionStatus || "none");

  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
    setConnectionStatus("pending_outgoing");
  }

  const isList = type === "list";

  // pick first image if exists
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

  const containerBase =
    "group relative rounded-[15px] border border-gray-100 bg-white shadow-sm hover:shadow-xl overflow-hidden transition-all duration-300 ease-out";
  // grid for list (image left column), flex-col for grid
  const containerLayout = isList
    ? "grid grid-cols-[160px_1fr] md:grid-cols-[224px_1fr] items-stretch"
    : "flex flex-col";

  return (
    <>
      <div
        className={`${containerBase} ${containerLayout} ${
          !isList && isHovered ? "transform -translate-y-1" : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* IMAGE SIDE */}
        {isList ? (
          <div className="relative h-full min-h-[160px] md:min-h-[176px] overflow-hidden">
            {imageUrl ? (
              <>
                {/* Fill the entire left column */}
                <img
                  src={imageUrl}
                  alt={item?.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </>
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">No Image</p>
                </div>
              </div>
            )}

            {/* Featured badge */}
           
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                 {item?.audienceCategories?.map(i=>(
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r bg-brand-50 text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                           {i.name}
                        </span>
                   ))}
            </div>
            
             
            

            {/* Quick actions on image */}
            <div className="absolute top-3 right-3 flex gap-2">
             

              <button
              onClick={() => {
                if(user?.id==item.sellerUserId){
                    navigate(`/product/${item.id}/view`)
                }else{
                    setProductDetailsOpen(true);
                }
              }}
              className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 group/share"
                
                aria-label="View product"
            >
              {user?.id==item.sellerUserId ? <Edit
                className="transition-transform duration-200 group-hover/view:scale-110"
                size={16}
              /> :  <Eye
                className="transition-transform duration-200 group-hover/view:scale-110"
                size={16}
              />}
            </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: item.title,
                      text: item.description,
                      url: window.location.href,
                    }).catch(err => console.error('Error sharing:', err));
                  } else {
                    // Fallback
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard");
                  }
                }}
                className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 group/share"
                aria-label="Share product"
              >
                <Share2
                  size={16}
                  className="text-gray-600 group-hover/share:text-brand-600 transition-colors duration-200"
                />
              </button>
            </div>
          </div>
        ) : (
          // GRID IMAGE
          <div className="relative overflow-hidden">
            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={item?.title}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">No Image</p>
                </div>
              </div>
            )}

            {/* Featured badge */}
          
              <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                 {item?.audienceCategories?.map(i=>(
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r bg-brand-50 text-brand-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow-lg">
                           {i.name}
                        </span>
                   ))}
              </div>
           
            {/* View & Save */}
            <div className="absolute top-4 right-4 flex gap-2">
            

            <button
              onClick={() => {
                if(user?.id==item.sellerUserId){
                    navigate(`/product/${item.id}/view`)
                }else{
                    setProductDetailsOpen(true);
                }
              }}
              className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 group/share"
                
                aria-label="View product"
            >
              {user?.id==item.sellerUserId ? <Edit
                className="transition-transform duration-200 group-hover/view:scale-110"
                size={16}
              /> :  <Eye
                className="transition-transform duration-200 group-hover/view:scale-110"
                size={16}
              />}
            </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: item.title,
                      text: item.description,
                      url: window.location.href,
                    }).catch(err => console.error('Error sharing:', err));
                  } else {
                    // Fallback
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard");
                  }
                }}
                className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 group/share"
                aria-label="Share product"
              >
                <Share2
                  size={16}
                  className="text-gray-600 group-hover/share:text-brand-600 transition-colors duration-200"
                />
              </button>
            </div>
          </div>
        )}

        {/* CONTENT SIDE */}
        <div className={`${isList ? "p-4 md:p-5" : "p-5"} flex flex-col flex-1`}>
          {/* Title and description */}
          <div className={`${isList ? "mb-2" : "mb-3"}`}>
            <h3 className="font-semibold text-lg text-gray-900 truncate mb-1 group-hover:text-brand-600 transition-colors duration-200">
              {item?.title}
            </h3>
            <p
              className={`text-sm text-gray-600 leading-relaxed ${
                isList ? "line-clamp-2 md:line-clamp-3" : "line-clamp-2"
              }`}
            >
              {item?.description}
            </p>
          </div>

          {/* Price */}
          <div className={`${isList ? "mb-2" : "mb-3"}`}>
            <span className="text-2xl font-bold text-gray-700">
              {currency} {item?.price}
            </span>
          </div>

          {/* Meta info */}
          <div className={`${isList ? "mb-2" : "mb-3"} space-y-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div onClick={()=>{
                         setOpenId(item.sellerUserId);
                          data._showPopUp("profile");
                }} className="flex items-center _profile gap-1 hover:underline cursor-pointer">
                  

                  {item.avatarUrl ? (
                    <img
                        src={item.avatarUrl}
                        alt={item?.sellerUserName }
                        className="w-7 h-7 rounded-full object-cover"
                    />
                ) : (
                   
                  <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center">
                    <User2 size={12} className="text-brand-600" />
                  </div>
                )}

                  <div className="flex flex-col">
                    <span className="font-medium mb-0">
                      {item?.sellerUserName || initials}
                    </span>
                  </div>
                </div>
              </div>

              {/* Match percentage */}
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
                {item?.country}
              </span>
            </div>
          </div>

          {/* Tags with tooltip for "+X more" */}
          {item?.tags?.length > 0 && (
            <div className={`${isList ? "mb-3" : "mb-4"} flex flex-wrap gap-2`}>
              {item.tags.slice(0, type=="grid" ? 1 : 100).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-50 to-brand-100 text-brand-700 px-3 py-1 text-xs font-medium border border-brand-200/50"
                >
                  {t}
                </span>
              ))}

              {item.tags.length > 1 && (
                <div className={`relative inline-block group/tagmore ${type=="list" ? 'hidden':''}`}>
                  <span
                    className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs font-medium cursor-default hover:bg-gray-200 transition-colors duration-200"
                    aria-describedby={`tags-more-${item.id}`}
                    tabIndex={0}
                  >
                    +{item.tags.length - 1} more
                  </span>

                  <div
                    id={`tags-more-${item.id}`}
                    role="tooltip"
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg
                      opacity-0 invisible transition-opacity duration-200
                      group-hover/tagmore:opacity-100 group-hover/tagmore:visible
                      focus-within:opacity-100 focus-within:visible z-10 whitespace-nowrap"
                  >
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {item.tags.slice(1).map((tag, i) => (
                        <span key={i} className="inline-block">
                          {tag}
                          {i < item.tags.length - 2 ? "," : ""}
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
          <div
            className={`flex items-center gap-2 mt-auto pt-2 ${
              isList ? "justify-end md:justify-start" : ""
            }`}
          >
            {/* View */}
            <button
              onClick={() => {
                if(user?.id==item.sellerUserId){
                    navigate(`/product/${item.id}/view`)
                }else{
                    setProductDetailsOpen(true);
                }
              }}
              className="flex items-center hidden justify-center h-10 w-10 flex-shrink-0 rounded-xl border-2 border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200 group/view"
              aria-label="View product"
            >
              {user?.id==item.sellerUserId ? <Edit
                className="transition-transform duration-200 group-hover/view:scale-110"
                size={16}
              /> :  <Eye
                className="transition-transform duration-200 group-hover/view:scale-110"
                size={16}
              />}
            </button>

            {/* Message */}
            <button
              onClick={() => {
                if (!user?.id) {
                  data._showPopUp("login_prompt");
                  return;
                }
                navigate(`/messages?userId=${item.sellerUserId}`);
                toast.success(
                  "Starting conversation with " + (item.sellerUserName || "seller")
                );
              }}
              className={`${type=="grid" ? "flex-1":''} rounded-xl px-4 py-2.5 text-sm font-medium bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md`}
            >
              Message
            </button>

            {/* Connect or Edit */}
            {item.sellerUserId !== user?.id ? (
              renderConnectButton()
            ) : (
              <button
                onClick={() => {
                  if (item.sellerUserId === user?.id)
                    navigate("/product/" + item.id);
                }}
                className="flex items-center justify-center h-10 w-10 rounded-xl border-2 border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200 group/edit"
                aria-label="Edit product"
              >
                <Edit
                  size={16}
                  className="group-hover/edit:scale-110 transition-transform duration-200"
                />
              </button>
            )}
          </div>
        </div>

        {/* Subtle bottom gradient for depth (grid only) */}
        {!isList && (
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50" />
        )}
      </div>

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={item?.sellerUserId}
        toName={item?.sellerUserName || "Seller"}
        onSent={onSent}
      />

     <ProfileModal
              userId={openId}
              isOpen={!!openId}
              onClose={() => setOpenId(null)}
              onSent={onSent}
      />

      {/* Product Details Modal */}
      <ProductDetails
        productId={item.id}
        isOpen={productDetailsOpen}
        onClose={() => setProductDetailsOpen(false)}
        onSave={onSave}
      />
    </>
  );

  // Render connect button with different styles based on connection status
  function renderConnectButton() {
    const status = connectionStatus || item?.connectionStatus || "none";

    if (status === "connected") {
      return (
        <button
          className="rounded-xl px-4 py-2.5 text-sm font-medium bg-green-100 text-green-700 cursor-default"
        >
          Connected
        </button>
      );
    }
    
    if (status === "pending_outgoing" || status === "outgoing_pending") {
      return (
        <button
          className="rounded-xl px-4 py-2.5 text-sm font-medium bg-yellow-100 text-yellow-700 cursor-default"
        >
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
        onClick={() => setModalOpen(true)}
        className="rounded-xl px-4 py-2.5 text-sm font-medium border-2 border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all duration-200"
      >
        Connect
      </button>
    );
  }
}
