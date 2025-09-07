// src/components/CrowdfundCard.jsx
import React, { useMemo, useState } from "react";
import { useData } from "../contexts/DataContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import ConnectionRequestModal from "./ConnectionRequestModal";
import { useNavigate } from "react-router-dom";
import styles from "../lib/styles.jsx";
import I from "../lib/icons.jsx";

const BRAND = "#034ea2";

const Progress = ({ value }) => (
  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
    <div
      className="h-full rounded-full"
      style={{ width: `${Math.min(100, value)}%`, background: BRAND }}
    />
  </div>
);

const Tag = ({ children }) => (
  <span className="inline-flex items-center rounded-full bg-purple-100/70 text-[#8A358A] px-3 py-1 text-xs font-medium">
    {children}
  </span>
);

export default function CrowdfundCard({ item }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(item?.connectionStatus || "none");
  const data = useData();
  const { user } = useAuth();
  const navigate=useNavigate()
  const imageUrl = item?.images?.[0]?.base64url || null;

  // Get the raised amount from the API
  const raised = parseFloat(item?.raised || 0);
  const goal = parseFloat(item?.goal || 0);
  const progress = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;

  const daysLeft = useMemo(() => {
    if (!item?.deadline) return null;
    const now = new Date();
    const deadline = new Date(item.deadline);
    const diff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [item?.deadline]);

  return (
    <div className={`rounded-2xl ${user?.id==item.creatorUserId ? ' hover:border-blue-300 cursor-pointer':''} border border-gray-100 bg-white shadow-sm p-5 md:p-6`}>
      {/* Header */}
      <div className="flex items-start gap-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item?.title}
            className="h-20 w-28 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-20 w-28 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
            No Image
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[17px] font-semibold text-gray-900">
              {item?.title}
            </h3>
            {item?.categoryName && <Tag>{item.categoryName}</Tag>}
          </div>
          <div className="mt-0.5 text-xs text-gray-500">
            {item?.city}, {item?.country} • {item?.timeAgo}
          </div>
          <p className="mt-2 text-[15px] text-gray-700 line-clamp-3">
            {item?.pitch}
          </p>
        </div>
      </div>

      {/* Funding progress */}
      <div className="mt-4 space-y-2">
        <Progress value={progress} />
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div>
            <span className="font-semibold">
              {item?.currency} {raised.toLocaleString()}
            </span>{" "}
            raised
          </div>
          <div>
            of{" "}
            <span className="font-semibold">
              {item?.currency} {goal.toLocaleString()}
            </span>{" "}
            goal
          </div>
          {daysLeft !== null && (
            <div className="text-gray-500">· {daysLeft} days left</div>
          )}
        </div>
      </div>

      {/* Tags */}
      {item?.tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {item.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex gap-3">
        {item.creatorUserId==user?.id && <button
         onClick={() => {
            if (!user) {
              data._showPopUp("login_prompt");
              return;
            }
            
            // Navigate to messages page with the user ID
            navigate(`/messages?userId=${item.creatorUserId}`);
          }}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ background: BRAND }}
        >
          Support Project
        </button>}
        <button className="rounded-xl hidden px-4 py-2 text-sm border border-gray-200 bg-white text-gray-700">
          View Details
        </button>
        


          
        
        {renderConnectButton()}

        {/** <div className="flex items-center gap-2">
            <button className="grid place-items-center h-[38px] w-[38px] rounded-lg border border-gray-200 text-gray-600" aria-label="Message">
              <I.msg />
            </button>
           
        </div> */}

      </div>
      
      {/* Connection Request Modal */}
      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={item?.creatorUserId}
        toName={item?.creatorName || "this creator"}
        onSent={() => {
          setConnectionStatus("pending_outgoing");
        }}
      />
    </div>
  );
  
  // Render connect button based on connection status
  function renderConnectButton() {

    if(item.creatorUserId==user?.id) return

    const status = connectionStatus;
    
    if (status === "connected") {
      return (
        <button className="rounded-xl px-4 py-2 text-sm font-semibold bg-green-100 text-green-700 cursor-default">
          Connected
        </button>
      );
    }
    
    if (status === "pending_outgoing") {
      return (
        <button className="rounded-xl px-4 py-2 text-sm font-semibold bg-yellow-100 text-yellow-700 cursor-default">
          Pending
        </button>
      );
    }
    
    if (status === "pending_incoming") {
      return (
        <button className="rounded-xl px-4 py-2 text-sm font-semibold bg-brand-100 text-brand-600 cursor-default">
          Respond
        </button>
      );
    }
    
    if (!user?.id) {
      return (
        <button
          onClick={() => data._showPopUp("login_prompt")}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          title="Sign in to send a request"
        >
          Connect
        </button>
      );
    }
    
    return (
      <button
        onClick={() => setModalOpen(true)}
        className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      >
        Connect
      </button>
    );
  }
}
