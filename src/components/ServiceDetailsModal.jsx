import React from "react";
import { X, MapPin, User2, Clock } from "lucide-react";

export default function ServiceDetailsModal({ open, onClose, service }) {
  if (!open || !service) return null;

  const locationLabel = () => {
    const city = service?.city?.trim();
    const country = service?.country?.trim();
    if (city && country) return `${city}, ${country}`;
    if (country) return country;
    if (city) return city;
    return service?.locationType || "—";
  };

  const priceLabel = () => {
    const amount = Number(service?.priceAmount ?? 0);
    try {
      const fmt = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: service?.currency || "USD",
        minimumFractionDigits: amount % 1 ? 2 : 0,
        maximumFractionDigits: 2,
      });
      return `${fmt.format(amount)}${service?.priceType ? ` / ${service.priceType}` : ""}`;
    } catch {
      return `${amount}${service?.priceType ? ` / ${service.priceType}` : ""}`;
    }
  };

  // Include serviceType AS A TAG (no special badge near the title)
  const tags = () => {
    const arr = [
      service?.serviceType,         // e.g., Consulting
      service?.experienceLevel,     // e.g., Expert
      service?.categoryName,
      service?.subcategoryName,
      service?.deliveryTime,        // e.g., 1 Week
    ].filter(Boolean);
    return [...new Set(arr.map((t) => String(t).trim()))];
  };

  return (
    <div className="fixed z-[100] inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-brand-600">Service Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-brand-600">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {service?.avatarUrl ? (
                <img
                  src={service.avatarUrl}
                  alt={service?.providerUserName || "Provider"}
                  className="h-16 w-16 rounded-full object-cover border"
                />
              ) : (
                <div
                  className="h-16 w-16 rounded-full grid place-items-center font-semibold text-white border"
                  style={{
                    background: "linear-gradient(135deg, rgba(168,85,168,1) 0%, rgba(138,53,138,1) 100%)",
                  }}
                >
                  {(service?.providerUserName || "?")
                    .split(" ")
                    .map((s) => s[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
            </div>

            {/* Title and basic info */}
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{service?.title}</h2>
              
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <User2 size={16} /> {service?.providerUserName || "—"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={16} /> {service?.timeAgo || "—"}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={16} /> {locationLabel()}
                </span>
              </div>

              {/* Price */}
              <div className="mt-3 inline-block rounded-lg bg-gray-100 text-gray-700 px-3 py-1.5 text-sm font-semibold">
                {priceLabel()}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            {tags().map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-1 text-xs font-medium"
              >
                {t}
              </span>
            ))}
          </div>

          {/* Description */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-line">{service?.description}</p>
          </div>

          {/* Additional details if available */}
          {service?.deliveryDetails && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Delivery Details</h3>
              <p className="text-gray-700">{service.deliveryDetails}</p>
            </div>
          )}

          {service?.requirements && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Requirements</h3>
              <p className="text-gray-700">{service.requirements}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t">
          <button
            className="rounded-xl px-4 py-2 text-sm border border-gray-200 bg-white hover:bg-gray-50"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600"
            onClick={onClose}
          >
            Contact Provider
          </button>
        </div>
      </div>
    </div>
  );
}