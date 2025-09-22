import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import client, { getStoredToken, setStoredToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken());
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(true);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [ready, setReady] = useState(false); // app has checked once

  // Keep axios header in sync
  useEffect(() => {
    setStoredToken(token || null);
  }, [token]);

  const fetchMe = async (overrideToken) => {
    const currentToken = overrideToken || token;
    if (!currentToken) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Temporarily set the header for this request if overrideToken is provided
      const originalHeader = client.defaults.headers.common.Authorization;
      if (overrideToken) {
        client.defaults.headers.common.Authorization = `Bearer ${overrideToken}`;
      }
      const { data } = await client.get("/profile/me");
      // Expecting: { user, profile, counts, progress, ... }
      setUser(data?.user || null);
      setSettings(data?.settings || null)
      setProfile(data?.profile || null);
      // Restore original header if we overrode it
      if (overrideToken) {
       // client.defaults.headers.common.Authorization = originalHeader;
        
      }
    } catch (e) {
      // If unauthorized, clear token
      setToken(null);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
      setReady(true);
    }
  };

  // On boot, fetch /me if token exists
  useEffect(() => {
    fetchMe();
  }, [token]);

  // Listen for global unauthorized event from axios
  useEffect(() => {
    const onUnauthorized = () => {
      setToken(null);
      setUser(null);
      setProfile(null);
    };
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, []);

  const signInWithToken = async (jwt) => {
    setToken(jwt);
    // fetchMe will run via token effect
    return true;
  };


  const signOut = () => {
    setLoading(true)
    window.location.href="/"
    window.location.reload()
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token");
    localStorage.removeItem("activeAccountId");
  };

  const hasRole = (roles = []) => {
    if (!roles?.length) return true;
    const r = user?.role || user?.accountType; // depending on your field
    return roles.includes(r);
  };

  console.log(user?.email)

  const value = useMemo(
    () => ({
      token,
      user,
      profile,
      loading,
      ready,
      setToken: signInWithToken,
      refreshAuth: fetchMe,
      signOut,
      hasRole,
      settings,
      setSettings,
      isAuthed: Boolean(user && token),
    }),
    [token, user, profile, loading, ready, settings]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
