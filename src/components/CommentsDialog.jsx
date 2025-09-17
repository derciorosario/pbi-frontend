// src/components/CommentsDialog.jsx
import React, { useEffect, useRef, useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { toast } from "../lib/toast";
import * as socialApi from "../api/social";
import { useData } from "../contexts/DataContext";

function computeTimeAgo(explicit, createdAt) {
  if (explicit) return explicit;
  if (!createdAt) return "";
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

/**
 * Reusable Comments Dialog
 * Props:
 * - open: boolean
 * - onClose: fn
 * - entityType: "job" | "event" | ...
 * - entityId: string
 * - currentUser: { id, name, avatarUrl } | null
 * - onCountChange?: (n:number) => void
 */
export default function CommentsDialog({
  open,
  onClose,
  entityType = "job",
  entityId,
  currentUser,
  onCountChange,
}) {
  const data = useData();
  const [loading, setLoading] = useState(false); // initial load (keeps list area visible)
  const [sending, setSending] = useState(false); // only the Send button uses this
  const [comments, setComments] = useState([]);
  const [newText, setNewText] = useState("");
  const panelRef = useRef(null);

  // Close on outside click and Esc
  useEffect(() => {
    function handleDown(e) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose?.();
      }
    }
    function handleEsc(e) {
      if (!open) return;
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  // Load comments when opened
  useEffect(() => {
    if (!open || !entityId) return;
    setLoading(true);
    socialApi
      .getComments(entityType, entityId)
      .then(({ data }) => {
        const arr = Array.isArray(data) ? data : [];
        const formatted = arr.map((c) => ({
          id: c.id,
          userName: c.user?.name || "User",
          avatar:
            c.user?.avatarUrl ||
            `https://i.pravatar.cc/60?u=${encodeURIComponent(c.userId)}`,
          text: c.text,
          createdAt: c.createdAt,
        }));
        setComments(formatted);
        onCountChange?.(formatted.length);
      })
      .catch(() => {
        toast.error("Couldn't load comments.");
      })
      .finally(() => setLoading(false));
  }, [open, entityId, entityType, onCountChange]);

  async function send() {
    const text = newText.trim();
    if (!text) return;
    if (!currentUser?.id) {
      data._showPopUp?.("login_prompt");
      return;
    }
    setSending(true);

    const optimistic = {
      id: "local-" + Math.random().toString(36).slice(2),
      userName: currentUser.name || "You",
      avatar:
        currentUser.avatarUrl ||
        `https://i.pravatar.cc/60?u=${encodeURIComponent(currentUser.id)}`,
      text,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [optimistic, ...prev]);
    onCountChange?.(comments.length + 1);
    setNewText("");

    try {
      const { data: saved } = await socialApi.createComment(
        entityType,
        entityId,
        text
      );
      if (saved?.id) {
        setComments((arr) =>
          arr.map((c) =>
            c.id === optimistic.id
              ? {
                  id: saved.id,
                  userName: saved.user?.name || "User",
                  avatar:
                    saved.user?.avatarUrl ||
                    `https://i.pravatar.cc/60?u=${encodeURIComponent(
                      saved.userId
                    )}`,
                  text: saved.text,
                  createdAt: saved.createdAt,
                }
              : c
          )
        );
      }
    } catch (e) {
      // Revert optimistic insert
      setComments((arr) => arr.filter((c) => c.id !== optimistic.id));
      onCountChange?.(Math.max(0, comments.length - 1));
      toast.error("Couldn't add comment. Try again.");
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-label="Comments"
    >
      <div
        ref={panelRef}
        className="w-full sm:max-w-2xl h-[80vh] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-5">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Comments
            </h3>
            <p className="text-xs text-gray-500">
              Share your feedback and questions. Be respectful.
            </p>
          </div>
          <button
            className="p-2 rounded-lg hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Composer */}
        <div className="px-4 sm:px-5 pt-3">
          <div className="flex items-start gap-3">
            <img
              src={
                currentUser?.avatarUrl ||
                (currentUser?.id
                  ? `https://i.pravatar.cc/60?u=${encodeURIComponent(
                      currentUser.id
                    )}`
                  : "https://i.pravatar.cc/60?u=guest")
              }
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
            <div className="flex-1">
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={3}
                placeholder="Write a comment… (Ctrl/⌘+Enter to send)"
                className="w-full resize-y min-h-[84px] rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-200"
              />
              <div className="mt-2 flex items-center justify-end">
                <button
                  onClick={send}
                  disabled={sending || !newText.trim()}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60"
                >
                  {sending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* List (fills remaining space, scrollable) */}
        <div className="px-4 sm:px-5 pb-5 flex-1 overflow-auto">
          <div className="mt-4">
            {loading ? (
              <div className="text-sm text-gray-500">Loading comments…</div>
            ) : comments.length === 0 ? (
              <div className="text-sm text-gray-500">No comments yet.</div>
            ) : (
              <ul className="space-y-4 pr-1">
                {comments.map((c) => (
                  <li key={c.id} className="flex items-start gap-3">
                    <img
                      src={c.avatar || "https://i.pravatar.cc/60"}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">
                        <span className="font-medium text-gray-800">
                          {c.userName || "User"}
                        </span>{" "}
                        • {computeTimeAgo(null, c.createdAt)}
                      </div>
                      <div className="text-sm text-gray-800 whitespace-pre-line">
                        {c.text}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
