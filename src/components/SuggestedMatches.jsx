import React, { useState, useMemo } from "react";
import I from "../lib/icons.jsx";
import ProfileModal from "./ProfileModal.jsx";
import ConnectionRequestModal from "./ConnectionRequestModal";
import { useData } from "../contexts/DataContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { toast } from "../lib/toast";

function avatarSrc(item, idx = 0) {
  if (item?.avatarUrl) return item.avatarUrl;
  if (item?.avatar) return item.avatar;
  if (item?.email)
    return `https://i.pravatar.cc/100?u=${encodeURIComponent(item.email)}`;
  if (item?.name)
    return `https://i.pravatar.cc/100?u=${encodeURIComponent(item.name)}`;
  return `https://i.pravatar.cc/100?img=${30 + idx}`;
}

export default function SuggestedMatches({ matches = [], nearby = [] }) {
  const [openId, setOpenId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [target, setTarget] = useState({ id: null, name: "" });
  const data = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Local overlay of statuses (so we can flip to "pending" instantly)
  const initial = useMemo(() => {
    const m = {};
    [...matches, ...nearby].forEach(
      (u) => (m[u.id] = u.connectionStatus || "none")
    );
    return m;
  }, [matches, nearby]);

  const [statusById, setStatusById] = useState(initial);

  function openModal(id, name) {
    setTarget({ id, name });
    setModalOpen(true);
  }
  function onSent() {
    setStatusById((prev) => ({
      ...prev,
      [openId || target.id]: "pending_outgoing",
    }));
  }

  const renderConnectButton = (u) => {
    const s = statusById[u.id] || u.connectionStatus || "none";

    if (s === "connected") {
      return (
        <button className="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold bg-green-100 text-green-700 cursor-default">
          Connected
        </button>
      );
    }
    if (s === "pending_outgoing") {
      return (
        <button className="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold bg-yellow-100 text-yellow-700 cursor-default">
          Pending
        </button>
      );
    }
    if (s === "pending_incoming") {
      return (
        <button className="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold bg-brand-100 text-brand-600 cursor-default">
          Respond
        </button>
      );
    }
    if (s === "unauthenticated") {
      return (
        <button
          onClick={() => data._showPopUp("login_prompt")}
          className="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          title="Sign in to send a request"
        >
          Connect
        </button>
      );
    }

    return (
      <button
        onClick={() => openModal(u.id, u.name)}
        className="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      >
        Connect
      </button>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {/* Matches */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-soft p-4">
          <h3 className="font-semibold">
            Connection Suggestions ({matches.length})
          </h3>
          <div className="mt-4 space-y-3">
            {matches.map((s, idx) => (
              <div
                key={s.id || s.name || idx}
                className="rounded-xl border border-gray-100 p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      alt=""
                      className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                      src={avatarSrc(s, idx)}
                    />
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-gray-500">
                        {s.title || s.role}
                        {s.city || s.country ? (
                          <>
                            {" "}
                            • {s.city ? `${s.city}` : ""}
                            {s.city && s.country ? ", " : ""}
                            {s.country ? `${s.country}` : ""}
                          </>
                        ) : null}
                      </div>
                      {s.tag ? (
                        <div className="text-[11px] text-brand-600">
                          Looking for: {s.tag}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setOpenId(s.id);
                      data._showPopUp("profile");
                    }}
                    className="grid _profile shrink-0 place-items-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600"
                    title="View profile"
                  >
                    <I.see />
                  </button>
                </div>

                {Array.isArray(s.cats) && s.cats.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.cats
                      .filter((_, i) => i <= 2)
                      .map((c) => (
                        <span
                          key={c}
                          className="inline-block bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-full"
                        >
                          {c}
                        </span>
                      ))}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  {renderConnectButton(s)}
                  <button
                    onClick={() => {
                      if (!user?.id) {
                        data._showPopUp("login_prompt");
                        return;
                      }
                      
                      // Navigate to messages page with the user ID
                      navigate(`/messages?userId=${s.id}`);
                      
                      // Show a toast notification
                      toast.success("Starting conversation with " + s.name);
                    }}
                    className="flex-1 _login_prompt rounded-lg px-3 py-1.5 text-sm border border-gray-200 text-gray-700 bg-white hover:border-brand-500 hover:text-brand-600"
                  >
                    Message
                  </button>
                </div>
              </div>
            ))}
            {matches.length === 0 && (
              <div className="text-sm text-gray-500 border rounded-xl p-3">
                No suggestions right now.
              </div>
            )}
          </div>
          <button className="mt-3 w-full rounded-lg py-2 text-sm font-medium text-brand-600 hover:underline">
            View All Connections
          </button>
        </div>

        {/* Nearby */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-soft p-4">
          <h3 className="font-semibold">Nearby Professionals</h3>
          <div className="mt-3 space-y-3">
            {nearby.map((p, idx) => (
              <div
                key={p.id || p.name || idx}
                className="flex flex-col border-b last:border-b-0 pb-3 last:pb-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      alt=""
                      className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                      src={avatarSrc(p, idx)}
                    />
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-gray-500">
                        {p.role || p.title}
                        {p.city || p.country ? (
                          <>
                            {" "}
                            • {p.city ? `${p.city}` : ""}
                            {p.city && p.country ? ", " : ""}
                            {p.country ? `${p.country}` : ""}
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {renderConnectButton(p)}
                  </div>
                </div>

                {Array.isArray(p.cats) && p.cats.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.cats
                      .filter((_, i) => i <= 2)
                      .map((c) => (
                        <span
                          key={c}
                          className="inline-block bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-full"
                        >
                          {c}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            ))}
            {nearby.length === 0 && (
              <div className="text-sm text-gray-500 border rounded-xl p-3">
                No nearby profiles for these filters.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProfileModal
        userId={openId}
        isOpen={!!openId}
        onClose={() => setOpenId(null)}
        onSent={onSent}
      />

      <ConnectionRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        toUserId={target.id}
        toName={target.name}
        onSent={onSent}
      />
    </>
  );
}
