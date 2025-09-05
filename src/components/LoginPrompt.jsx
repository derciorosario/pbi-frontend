// src/components/LoginPrompt.jsx
import React from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";

export default function LoginPrompt() {
  const navigate = useNavigate();
  const data = useData();

  return (
    <div
      className={`fixed inset-0 ${
        !data._openPopUps.login_prompt ? "opacity-0 pointer-events-none" : ""
      } transition-all z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm`}
    >
      <div className="bg-white _login_prompt w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Sign in to continue</h3>
          <button
            onClick={() => {
              data._closeAllPopUps();
            }}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-full bg-brand-600/10 flex items-center justify-center">
            <svg
              className="h-7 w-7 text-brand-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 1a5 5 0 0 0-5 5v4H6a2 2 
              0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 
              0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 
              5 0 0 0-5-5Zm-3 9V6a3 3 0 0 1 6 0v4H9Z" />
            </svg>
          </div>

          <p className="text-sm text-gray-600">
            Join the Pan-African Business Initiative to explore{" "}
            <span className="font-medium text-brand-600">connections</span>,{" "}
            <span className="font-medium text-brand-600">opportunities</span>,{" "}
            <span className="font-medium text-brand-600">jobs</span>, and{" "}
            <span className="font-medium text-brand-600">events</span> across
            Africa.
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 border-t space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/login")}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition transform hover:scale-[1.02]"
            >
              Log in
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition"
            >
              Join now
            </button>
          </div>

          {/* Continue without login */}
          <button
            onClick={() => data._closeAllPopUps()}
            className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
          >
            Continue without login →
          </button>
        </div>
      </div>
    </div>
  );
}
