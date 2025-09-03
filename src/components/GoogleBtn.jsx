import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import client from "../api/client";
import { toast } from "../lib/toast";

/**
 * Props:
 *   page: "signup" | "signin" (controls button text)
 *   showProfile?: boolean
 */
export default function GoogleCustomBtn({ page = "signin", showProfile = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState(null);
  const [error, setError] = useState(null);

  const label =
    page === "signup" ? "Sign up with Google" : "Sign in with Google";

  const login = useGoogleLogin({
    scope: "openid profile email",
    onSuccess: async (tokenResponse) => {

      setError(null);
      setLoading(true);
      try {
        const profile = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );
        setMe(profile.data);

        const exchangePromise = client.post("/auth/google", {
          accessToken: tokenResponse.access_token
        });

        const res = await toast.promise(
          exchangePromise,
          {
            loading: "Connecting to Google…",
            success: "Welcome! 🎉",
            error: (err) => err?.response?.data?.message || "Google sign-in failed."
          },
          { id: "google-login" }
        );

        const token = res?.data?.token;
        if (token) localStorage.setItem("auth_token", token);
        //navigate("/dashboard");
        window.location.href="/"
      } catch (err) {
        console.error(err);
        setError("Login failed");
        toast.error("Login failed");
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError("Google login failed");
      toast.error("Google login failed");
    }
  });

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => login()}
        disabled={loading}
        aria-busy={loading}
        className="w-full rounded-xl border border-gray-200 bg-white py-3 font-medium text-gray-700 hover:bg-gray-50"
      >
        <span className="inline-flex items-center gap-3 justify-center">
          {loading ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 48 48" className="h-5 w-5">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.5 31.9 29.2 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1.1 7.2 2.8l5.7-5.7C33.6 7 29.1 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.7z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.3 18.9 13 24 13c2.8 0 5.3 1.1 7.2 2.8l5.7-5.7C33.6 7 29.1 5 24 5 16.2 5 9.6 9.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 45c5 0 9.5-1.9 12.9-5.1l-6-4.9C29 36.5 26.6 37.5 24 37.5c-5.2 0-9.5-3.5-11.1-8.2l-6.6 5.1C9.6 40.7 16.2 45 24 45z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.4-5.3 5.5-11.3 5.5-5.2 0-9.5-3.5-11.1-8.2l-6.6 5.1C9.6 40.7 16.2 45 24 45c11.1 0 20-8.9 20-20 0-1.3-.1-2.5-.4-3.7z"/>
            </svg>
          )}
          {loading ? (page === "signup" ? "Signing up…" : "Signing in…") : label}
        </span>
      </button>

      {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}

      {showProfile && me && (
        <div className="mt-6 flex items-center gap-3">
          <img src={me.picture} alt="profile" className="w-10 h-10 rounded-full" />
          <div className="text-left">
            <p className="font-semibold">{me.name}</p>
            <p className="text-sm text-gray-500">{me.email}</p>
          </div>
        </div>
      )}
    </div>
  );
}
