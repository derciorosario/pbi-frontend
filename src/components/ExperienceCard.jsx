// src/components/ExperienceCard.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../lib/toast";
import styles from "../lib/styles.jsx";
import I from "../lib/icons.jsx";
import ConnectionRequestModal from "./ConnectionRequestModal";

export default function ExperienceCard({ item }) {
  const navigate = useNavigate();
  const data = useData();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  
  function onSent() {
    toast.success("Connection request sent");
    setModalOpen(false);
  }
  
  const imageUrl = item?.images?.[0]?.base64url || null;

  return (
    <>
      <article className="rounded-2xl bg-white border shadow-sm overflow-hidden">
        {/* Cover image */}
        {imageUrl ? (
          <img src={imageUrl} alt={item?.title} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            No Image
          </div>
        )}

        <div className="p-4">
          {/* Author + time */}
          <div className="text-xs text-gray-500">
            {item?.authorUserName} • {item?.timeAgo}
          </div>

          {/* Title */}
          <h3 className="mt-2 font-semibold text-gray-900">{item?.title}</h3>

          {/* Description */}
          <p className="text-sm text-gray-600 mt-1">{item?.description}</p>

          {/* Location & country */}
          <div className="mt-2 text-xs text-gray-500">
            📍 {item?.location} {item?.country ? `, ${item.country}` : ""}
          </div>

          {/* Tags */}
          {item?.tags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-1 text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer: actions */}
          <div className="mt-3 flex items-center gap-x-2">
           
             <div className="gap-x-1 flex">
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
             <button 
               onClick={() => {
                 if (!user?.id) {
                   data._showPopUp("login_prompt");
                   return;
                 }
                 
                 // Navigate to messages page with the user ID
                 navigate(`/messages?userId=${item.authorUserId}`);
                 
                 // Show a toast notification
                 toast.success("Starting conversation with " + (item.authorUserName || "experience author"));
               }}
               className="grid place-items-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600" 
               aria-label="Message"
             >
               <I.msg />
             </button>
          </div>
        </div>
      </article>
      
      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={item?.authorUserId}
        toName={item?.authorUserName || "Experience Author"}
        onSent={onSent}
      />
    </>
  );
}
