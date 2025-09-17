import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * ConfirmDialog
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - title?: string
 * - text?: string
 * - confirmText?: string (default: "Confirm")
 * - cancelText?: string (default: "Cancel")
 * - tone?: "default" | "danger" (affects confirm button color)
 *
 * // Optional input support (if you want to collect text from the user)
 * - withInput?: boolean (default: false)
 * - inputLabel?: string
 * - inputPlaceholder?: string
 * - inputType?: "text" | "textarea" (default: "text")
 * - initialValue?: string
 * - requireValue?: boolean (disable confirm if empty)
 *
 * // Behavior
 * - onConfirm: (value: string) => any | Promise<any>
 *      Receives the current input value ("" if withInput = false).
 *      Its return value (or resolved value) will be passed to onResult.
 * - onResult?: (result: any) => void
 */
export default function ConfirmDialog({
  open,
  onClose,
  title = "Are you sure?",
  text = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  tone = "default",

  withInput = false,
  inputLabel = "Reason (optional)",
  inputPlaceholder = "",
  inputType = "text",
  initialValue = "",
  requireValue = false,

  onConfirm,
  onResult,
}) {
  const [value, setValue] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const overlayRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSubmitting(false);
      setValue(initialValue || "");
      // focus the first interactive element quickly
      setTimeout(() => {
        if (withInput && inputRef.current) inputRef.current.focus();
      }, 0);
    }
  }, [open, initialValue, withInput]);

  useEffect(() => {
    function onKey(e) {
      if (!open) return;
      if (e.key === "Escape") onClose?.();
      if (e.key === "Enter" && !submitting) {
        // Allow Enter to confirm only when input is valid/optional
        if (!withInput || !requireValue || value.trim().length > 0) {
          handleConfirm();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, value, withInput, requireValue]); // eslint-disable-line

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose?.();
  }

  async function handleConfirm() {
    if (submitting) return;
    if (!onConfirm) {
      onClose?.();
      return;
    }

    try {
      setSubmitting(true);
      const result = await onConfirm(withInput ? value : "");
      onResult?.(result);
      onClose?.();
    } catch (err) {
      // Do not close automatically on error; caller can show a toast
      setSubmitting(false);
      console.error("ConfirmDialog onConfirm error:", err);
    }
  }

  const confirmBtnClasses =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
      : "bg-brand-600 hover:bg-brand-700 focus:ring-brand-500";

  const confirmDisabled =
    submitting || (withInput && requireValue && value.trim().length === 0);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`fixed inset-0 z-[110] transition ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      } flex items-center justify-center bg-black/40 backdrop-blur-sm`}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className={`bg-white w-[92vw] sm:w-full sm:max-w-md rounded-2xl shadow-xl overflow-hidden transform transition-all ${
          open ? "scale-100" : "scale-95"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 id="confirm-dialog-title" className="text-lg font-semibold">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {text ? <p className="text-sm text-gray-700">{text}</p> : null}

          {withInput && (
            <div className="text-left">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {inputLabel}
              </label>
              {inputType === "textarea" ? (
                <textarea
                  ref={inputRef}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  placeholder={inputPlaceholder}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              ) : (
                <input
                  ref={inputRef}
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  placeholder={inputPlaceholder}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              )}
              {requireValue && value.trim().length === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  This field is required.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:border-gray-400"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmDisabled}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 disabled:opacity-60 ${confirmBtnClasses}`}
          >
            {submitting ? "Working…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
