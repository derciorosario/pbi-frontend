import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function TabSwitch() {
  const { pathname } = useLocation();
  const isLogin = pathname === "/login";

  return (
    <div className="mt-6 grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-sm">
      <Link
        to="/login"
        className={`text-center rounded-lg py-2 font-medium transition ${isLogin ? "bg-white shadow-soft text-brand-700" : "text-gray-600 hover:text-gray-900"}`}
      >
        Sign In
      </Link>
      <Link
        to="/signup"
        className={`text-center rounded-lg py-2 font-medium transition ${!isLogin ? "bg-white shadow-soft text-brand-700" : "text-gray-600 hover:text-gray-900"}`}
      >
        Sign Up
      </Link>
    </div>
  );
}
