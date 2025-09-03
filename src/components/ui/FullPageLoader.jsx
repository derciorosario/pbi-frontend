import React from "react";

/**
 * Full screen loader with brand gradient spinner.
 * Props:
 * - message?: string (default: "Loading…")
 * - tip?: string (small helper text)
 */
export default function FullPageLoader({ message = "Loading…", tip, notFull }) {
  return (
    <div className={`${!notFull ? 'min-h-screen':'py-2'}  grid place-items-center bg-[#F7F7FB]`}>
      <div className="flex flex-col items-center gap-5">
        {/* Spinner */}
        <div
          className="relative h-14 w-14"
          role="status"
          aria-live="polite"
          aria-label={message}
        >
          <span className="absolute inset-0 rounded-full border-4 border-gray-200" />
          <span
            className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
            style={{
              borderTopColor: "#8A358A",
              borderRightColor: "#A855A8",
            }}
          />
        </div>

        {/* Message */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-800">{message}</p>
          {tip && <p className="mt-1 text-xs text-gray-500">{tip}</p>}
        </div>

        {/* Subtle shimmer bar */}
        <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full w-1/3 animate-[shimmer_1.2s_infinite]"
               style={{
                 background:
                   "linear-gradient(90deg, transparent, rgba(138,53,138,0.35), transparent)"
               }} />
        </div>
      </div>

      {/* Reduced motion support */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-spin { animation: none !important; }
          [style*="shimmer_1.2s_infinite"] { display:none; }
        }
      `}</style>
    </div>
  );
}
