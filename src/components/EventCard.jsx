// src/components/EventCard.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../lib/toast";
import styles from "../lib/styles.jsx";
import I from "../lib/icons.jsx";
import ConnectionRequestModal from "./ConnectionRequestModal";
import ProfileModal from "./ProfileModal";
import { User2 } from "lucide-react";

function formatTimeAgo(timeAgo, createdAt) {
  if (timeAgo) return timeAgo;
  if (!createdAt) return "";
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export default function EventCard({ e }) {
  const navigate = useNavigate();
  const data = useData();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [openId, setOpenId] = useState(null);
  
  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
  }
  
  const tags = [
    e.eventType || "Event",
    e.categoryName,     // mostra nome da categoria (se existir)
    e.subcategoryName,  // mostra nome da subcategoria (se existir)
  ].filter(Boolean);

  const isPaid = e.price != null && e.price !== "" && !isNaN(Number(e.price));
  const priceText = isPaid ? `${e.currency || "USD"} ${e.price}` : "Free";

  return (
    <>
      <div className="rounded-2xl bg-white border shadow-sm overflow-hidden">
        {e.coverImageBase64 ? (
          <img src={e.coverImageBase64} alt="" className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 bg-gray-100 grid place-items-center text-gray-400 text-sm">
            No image
          </div>
        )}

        <div className="p-4">
          {!!tags.length && (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="inline-block text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                  {t}
                </span>
              ))}
            </div>
          )}

          <h3 className="mt-2 font-semibold">{e.title}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-3">{e.description}</p>

          <div className="flex items-center text-xs text-gray-500 mt-2 gap-2">
            <I.pin />
            {e.city ? `${e.city}, ` : ""}
            {e.country || "—"}
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className="font-semibold">{priceText}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!user?.id) {
                    data._showPopUp("login_prompt");
                    return;
                  }
                  
                  // Navigate to messages page with the user ID
                  navigate(`/messages?userId=${e.organizerUserId}`);
                  
                  // Show a toast notification
                  toast.success("Starting conversation with " + (e.organizerUserName || "event organizer"));
                }}
                className="grid place-items-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600"
                aria-label="Message"
              >
                <I.msg />
              </button>
              <button
                onClick={() => {
                  if (!user?.id) {
                    data._showPopUp("login_prompt");
                    return;
                  }
                  setModalOpen(true);
                }}
                className={styles.primary}
              >
                Connect
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-gray-400 mt-3">
              {formatTimeAgo(e.timeAgo, e.createdAt)}
            </div>
            <div>
              {e.organizerUserName && (
                <div className="text-xs text-gray-400 flex items-center gap-x-2">
                  <User2 size={14} /><span
                    className="font-medium cursor-pointer hover:text-brand-600 hover:underline"
                    onClick={() => {
                     // data._showPopUp("profile");
                      //setOpenId(e.organizerUserId);
                    }}
                  >
                    {e.organizerUserName}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={e?.organizerUserId}
        toName={e?.organizerUserName || "Event Organizer"}
        onSent={onSent}
      />
      
      {/* Profile Modal */}
      <ProfileModal
        userId={openId}
        isOpen={!!openId}
        onClose={() => setOpenId(null)}
        onSent={onSent}
      />
    </>
  );
}
