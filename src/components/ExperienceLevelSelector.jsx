import React, { useRef, useEffect, useState, useMemo } from "react";

export default function ExperienceLevelSelector({
  value,
  onChange,
  options = [
    "Junior",
    "Mid",
    "Senior",
    "Lead",
    "Director",
    "C-level",
  ],
  label = "Experience Level",
  placeholder = "Any",
}) {
  const wrapRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedLevels = useMemo(
    () =>
      (value || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [value]
  );

  const toggleLevel = (level) => {
    const set = new Set(selectedLevels);
    if (set.has(level)) set.delete(level);
    else set.add(level);
    const next = Array.from(set);
    onChange?.(next.length ? next.join(",") : "");
  };

  const summary = useMemo(() => {
    if (!selectedLevels.length) return placeholder;
    if (selectedLevels.length <= 2) return selectedLevels.join(", ");
    return `${selectedLevels.length} selected`;
  }, [selectedLevels, placeholder]);

  // Filtered options
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter((opt) =>
      opt.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

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
    <div className="mt-4 relative" ref={wrapRef}>
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
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-auto"
        >
          {/* Sticky search bar */}
          <div className="sticky top-0 z-10 bg-white p-2 border-b border-gray-100">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm pr-6"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((level) => {
              const checked = selectedLevels.includes(level);
              return (
                <label
                  key={level}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-600"
                    checked={checked}
                    onChange={() => toggleLevel(level)}
                  />
                  <span>{level}</span>
                </label>
              );
            })
          ) : (
            <div className="px-2 py-3 text-sm text-gray-400">
              No results found
            </div>
          )}

          {/* Footer buttons */}
          <div className="sticky bottom-0 bg-white flex items-center justify-between gap-2 px-2 py-2 border-t border-gray-100">
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
