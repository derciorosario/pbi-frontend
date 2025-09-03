import React from "react";
import EasyAccess from "./EasyAccess";

export default function QuickActions({ title = "Quick Actions", items = [] }) {
  return (
    <>
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-gray-700">
        {items.map(({ label, Icon, onClick, disabled }, idx) => (
          <li key={idx}>
            <button
              type="button"
              onClick={onClick}
              disabled={disabled}
              className={`w-full text-left rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-gray-50 ${
                disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {Icon ? <Icon size={16} className="text-[#8a358a]" /> : null}
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
    <EasyAccess/>
    </>
  );
}
