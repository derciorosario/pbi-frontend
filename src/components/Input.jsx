import React from "react";

export default function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  rightIcon,
  name,
  error
}) {
  const base =
    "w-full rounded-xl border px-4 py-3 pr-11 text-sm outline-none ring-brand-500 focus:ring-2 bg-white";
  const ok = "border-gray-200";
  const bad = "border-red-400 focus:ring-red-400";

  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`${base} ${error ? bad : ok}`}
        />
        {rightIcon && (
          <span className="absolute inset-y-0 right-0 grid w-10 place-items-center text-gray-400">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
