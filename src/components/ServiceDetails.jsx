// src/components/ServiceDetails.jsx
import React, { useState, useEffect } from "react";
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
  Briefcase,
  Clock3,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../lib/toast";
import ConnectionRequestModal from "./ConnectionRequestModal";
import client from "../api/client";

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

function formatPrice(amount, currency = "USD", priceType) {
  try {
    const fmt = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: amount % 1 ? 2 : 0,
      maximumFractionDigits: 2,
    });
    return `${fmt.format(amount)}${priceType ? ` / ${priceType}` : ""}`;
  } catch {
    return `${amount}${priceType ? ` / ${priceType}` : ""}`;
  }
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

/* ------------------------------ ServiceDetails ----------------------------- */
export default function ServiceDetails({ serviceId, isOpen, onClose }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [service, setService] = useState(null);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const data = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch service details from API
  useEffect(() => {
    if (!isOpen || !serviceId) return;
    
    let mounted = true;
    
    async function fetchServiceDetails() {
      setLoading(true);
      setError("");
      
      try {
        const { data } = await client.get(`/services/${serviceId}`);
        if (mounted) setService(data);
      } catch (err) {
        console.error("Error fetching service details:", err);
        if (mounted) setError("Failed to load service details.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    fetchServiceDetails();
    
    return () => {
      mounted = false;
    };
  }, [isOpen, serviceId]);

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
    if (!service?.attachments?.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % service.attachments.length);
  }

  function prevImage() {
    if (!service?.attachments?.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + service.attachments.length) % service.attachments.length);
  }

  if (!isOpen) return null;

  // Get the current image URL
  const imageUrl = service?.attachments?.[currentImageIndex] || null;

  // Format provider initials
  const initials = (service?.provider?.name || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed z-[99] inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white z-[99] w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-brand-500 p-4 flex justify-between items-center">
          <div className="text-white font-medium">Service Details</div>
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
            <div className="text-sm text-gray-600">Loading service details...</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : !service ? (
            <div className="text-sm text-gray-600">No service details available.</div>
          ) : (
            <>
              {/* Service Images */}
              {service.attachments?.length > 0 && (
                <div className="relative mb-6">
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt={service.title}
                      className="w-full h-64 object-contain bg-gray-50 rounded-lg"
                    />
                    
                    {/* Image navigation controls */}
                    {service.attachments.length > 1 && (
                      <div className="absolute inset-x-0 bottom-0 flex justify-between p-2">
                        <button 
                          onClick={prevImage}
                          className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white"
                        >
                          &larr;
                        </button>
                        <div className="bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs">
                          {currentImageIndex + 1} / {service.attachments.length}
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

              {/* Service Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{service.title}</h2>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <Clock size={16} />
                    <span>{timeAgo(service.createdAt)}</span>
                    {service.country && (
                      <>
                        <span className="mx-1">•</span>
                        <MapPin size={16} />
                        <span>{fmtLoc(service.city, service.country)}</span>
                      </>
                    )}
                  </div>
                </div>
                {service.priceAmount && (
                  <div className="text-2xl font-bold text-brand-600">
                    {formatPrice(service.priceAmount, service.currency, service.priceType)}
                  </div>
                )}
              </div>

              {/* Service Type & Location Type */}
              <div className="flex flex-wrap gap-2 mt-4">
                {service.serviceType && (
                  <Chip tone="brand">{service.serviceType}</Chip>
                )}
                {service.locationType && (
                  <Chip tone="blue">{service.locationType}</Chip>
                )}
                {service.experienceLevel && (
                  <Chip tone="gray">{service.experienceLevel}</Chip>
                )}
                {service.deliveryTime && (
                  <Chip tone="green">{service.deliveryTime}</Chip>
                )}
              </div>

              {/* Provider */}
              <Section title="Provider" icon={User2}>
                <div 
                  className="flex items-center gap-2 p-3 rounded-lg border border-gray-100 hover:border-brand-200 cursor-pointer"
                  onClick={() => {
                    if (service?.providerUserId) {
                      data._showPopUp("profile");
                      data._setProfileUserId?.(service.providerUserId);
                    }
                  }}
                >
                  {service.provider?.avatarUrl ? (
                    <img
                      src={service.provider.avatarUrl}
                      alt={service.provider.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-600 font-medium">{initials}</span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{service.provider?.name || "Service Provider"}</div>
                    <div className="text-xs text-gray-500">View profile</div>
                  </div>
                </div>
              </Section>

              {/* Description */}
              <Section title="Description" icon={MessageCircle}>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {service.description || "No description provided."}
                </p>
              </Section>

              {/* Skills */}
              {service.skills?.length > 0 && (
                <Section title="Skills">
                  <div className="flex flex-wrap gap-2">
                    {service.skills.map((skill, index) => (
                      <Chip key={`skill-${index}`} tone="gray">
                        {skill}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Categories */}
              {service.audienceCategories?.length > 0 && (
                <Section title="Categories" icon={Layers}>
                  <div className="flex flex-wrap gap-2">
                    {service.audienceCategories.map((category, index) => (
                      <Chip key={`cat-${index}`} tone="brand">
                        {category.name}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Subcategories */}
              {service.audienceSubcategories?.length > 0 && (
                <Section title="Subcategories" icon={Layers}>
                  <div className="flex flex-wrap gap-2">
                    {service.audienceSubcategories.map((subcategory, index) => (
                      <Chip key={`subcat-${index}`} tone="gray">
                        {subcategory.name}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Identities */}
              {service.audienceIdentities?.length > 0 && (
                <Section title="Target Audience" icon={User2}>
                  <div className="flex flex-wrap gap-2">
                    {service.audienceIdentities.map((identity, index) => (
                      <Chip key={`identity-${index}`} tone="blue">
                        {identity.name}
                      </Chip>
                    ))}
                  </div>
                </Section>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                {/* Connect */}
                {service.providerUserId !== user?.id && (
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

                {/* Share */}
                <button
                  onClick={() => {
                    // Share functionality
                    const shareUrl = `${window.location.origin}/services?=${service.id}`;
                    if (navigator.share) {
                      navigator.share({
                        title: service.title,
                        text: service.description,
                        url: shareUrl,
                      }).catch(err => console.error('Error sharing:', err));
                    } else {
                      // Fallback
                      navigator.clipboard.writeText(shareUrl);
                      toast.success("Link copied to clipboard");
                    }
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:border-brand-500 hover:text-brand-600 transition-colors"
                >
                  <Share2 size={18} />
                  Share
                </button>

                {/* Message */}
                <button
                  onClick={() => {
                    if (!user?.id) {
                      data._showPopUp("login_prompt");
                      return;
                    }
                    onClose();
                    navigate(`/messages?userId=${service.providerUserId}`);
                    toast.success(
                      "Starting conversation with " + (service.provider?.name || "service provider")
                    );
                  }}
                  className="flex-1 rounded-lg px-4 py-2 text-sm font-medium bg-brand-500 text-white hover:bg-brand-700 active:bg-brand-800 flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Message
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={service?.providerUserId}
        toName={service?.provider?.name || "Service Provider"}
        onSent={onSent}
      />
    </div>
  );
}