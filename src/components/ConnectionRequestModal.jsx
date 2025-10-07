import React, { useState, useEffect } from "react";
import { X, Send } from "lucide-react";
import client from "../api/client";
import { toast } from "../lib/toast";
import { useAuth } from "../contexts/AuthContext";

const REASONS = [
  "Partnership / Collaboration",
  "Investment Opportunities",
  "Hiring / Job Offer",
  "Seeking Mentorship",
  "Offering Mentorship",
  "Networking & Professional Growth",
  "Exploring Business Opportunities",
  "Project Collaboration",
  "Advisory / Consulting",
  "Knowledge Sharing",
  "Market Expansion",
  "Technology / Innovation Exchange",
  "Event Invitation",
  "Career Guidance",
  "Other",
];


export default function ConnectionRequestModal({ open, onClose, toUserId, toName, onSent }) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const {user} = useAuth()

  useEffect(() => {
    setMessage("");
    setReason("");
    setError("");
  }, [open]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await client.post("/connections/requests", {
        toUserId,
        reason: reason || null,
        message: message || null,
      });
      if (onSent) onSent();
      toast.success("Your request has been sent!");
      onClose();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to send request");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed z-[100] inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-brand-600">Connection Request</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-brand-600">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-600">
            {toName
              ? `Send a connection request to ${toName}.`
              : "Please select the reason and optionally write a message."}
          </p>

          {user?.accountType != "company" && <div>
            <label className="text-xs text-gray-500">Reason (optional)</label>
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">Select reason</option>
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>}

          <div>
            <label className="text-xs text-gray-500">Message (optional)</label>
            <textarea
              rows={4}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="Write a short note…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t">
          <button
            className="rounded-xl px-4 py-2 text-sm border bg-white hover:bg-brand-50 hover:text-brand-600 transition-colors"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-colors"
            onClick={handleSave}
            disabled={saving}
          >
            <Send size={16} />
            {saving ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
