import React, { useRef, useEffect, useState, useMemo } from "react";

export default function MultiSelectDropdown({
  value,
  onChange,
  options = [],
  label = "Select Options",
  placeholder = "Any",
}) {
  const wrapRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const selectedValues = useMemo(
    () =>
      (value || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [value]
  );

  const toggleValue = (option) => {
    const set = new Set(selectedValues);
    if (set.has(option)) set.delete(option);
    else set.add(option);
    const next = Array.from(set);
    onChange?.(next.length ? next.join(",") : "");
  };

  const summary = useMemo(() => {
    if (!selectedValues.length) return placeholder;
    if (selectedValues.length <= 2) return selectedValues.join(", ");
    return `${selectedValues.length} selected`;
  }, [selectedValues, placeholder]);

  // Close on outside click or Esc
  useEffect(() => {
    const onClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setIsOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  return (
    <div className="mt-4" ref={wrapRef}>
      <label className="text-xs text-gray-500 mb-2 block">{label}</label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
      >
        <span className="truncate">{summary}</span>
        <svg
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Floating list */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 mt-1 w-[calc(100%-2rem)] bg-white border border-gray-200 rounded-xl shadow-lg p-1 max-h-56 overflow-auto"
          style={{ minWidth: "12rem" }}
        >
          {options.map((option) => {
            const checked = selectedValues.includes(option);
            return (
              <label
                key={option}
                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-600"
                  checked={checked}
                  onChange={() => toggleValue(option)}
                />
                <span>{option}</span>
              </label>
            );
          })}
          <div className="flex items-center justify-between gap-2 px-2 py-2">
            <button
              type="button"
              onClick={() => {
                onChange?.("");
                setIsOpen(false);
              }}
              className="text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs px-2 py-1 rounded-lg bg-gray-900 text-white hover:bg-black"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}