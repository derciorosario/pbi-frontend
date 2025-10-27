// src/contexts/SocketContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [onlineConnections, setOnlineConnections] = useState([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const { token, isAuthed, user } = useAuth();

  const env = "dev";
  const API_URL = env === "dev" ? "http://localhost:5000" : "https://api.54links.com";

  useEffect(() => {
    if (!isAuthed || !token) return;

    const s = io(API_URL, {
      auth: { userId: user.id },
    });

    s.on("connect", () => {
      setConnected(true);
      setError(null);

      // initial fetches via socket
      s.emit("get_unread_count", (res) => {
        if (res?.ok) setTotalUnreadCount(res.data.count || 0);
      });
      s.emit("get_online_connections"); // server will emit 'online_connections'
    });

    s.on("connect_error", (err) => {
      setConnected(false);
      setError(err.message);
    });

    s.on("disconnect", () => {
      setConnected(false);
    });

    s.on("error", (err) => {
      setError(typeof err === "string" ? err : err?.message);
    });

    s.on("online_connections", (list) => {
      setOnlineConnections(Array.isArray(list) ? list : []);
    });

    s.on("user_status_change", () => {
      s.emit("get_online_connections");
    });

    s.on("unread_count_update", ({ count }) => {
      if (Number.isFinite(count)) setTotalUnreadCount(count);
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [isAuthed, token, user?.id]);

  // ---- RPC helpers over socket ----

  const rpc = useCallback(
    (event, payload = {}) =>
      new Promise((resolve, reject) => {
        if (!socket || !connected) return reject(new Error("Socket not connected"));
        socket.emit(event, payload, (res) => {
          if (res?.ok) resolve(res.data);
          else reject(new Error(res?.error || `Socket call failed: ${event}`));
        });
      }),
    [socket, connected]
  );

  const fetchConversations = useCallback(() => rpc("fetch_conversations"), [rpc]);

  const fetchMessages = useCallback(
    (conversationId, opts) => rpc("fetch_messages", { conversationId, ...(opts || {}) }),
    [rpc]
  );

  const openConversationWithUser = useCallback(
    (otherUserId, opts) => rpc("open_conversation_with_user", { otherUserId, ...(opts || {}) }),
    [rpc]
  );

  const searchUsers = useCallback((q) => rpc("search_users", { q }), [rpc]);

  const getOnlineConnections = useCallback(
    () =>
      new Promise((resolve, reject) => {
        if (!socket || !connected) return reject(new Error("Socket not connected"));
        socket.emit("get_online_connections", (res) => {
          if (res?.ok) {
            setOnlineConnections(res.data || []);
            resolve(res.data || []);
          } else {
            reject(new Error(res?.error || "Failed to get online connections"));
          }
        });
      }),
    [socket, connected]
  );

  const sendPrivateMessage = useCallback(
    (receiverId, content, attachments = []) =>
      new Promise((resolve, reject) => {
        if (!socket || !connected) return reject(new Error("Socket not connected"));
        socket.emit("private_message", { receiverId, content, attachments }, (res) => {
          if (res?.ok) resolve(res.data);
          else reject(new Error(res?.error || "Failed to send message"));
        });
      }),
    [socket, connected]
  );

  const markMessagesAsRead = useCallback(
    (conversationId) =>
      new Promise((resolve, reject) => {
        if (!socket || !connected) return reject(new Error("Socket not connected"));
        socket.emit("mark_read", { conversationId }, (res) => {
          if (res?.ok) {
            resolve(res.data);
          } else {
            reject(new Error(res?.error || "Failed to mark as read"));
          }
        });
      }),
    [socket, connected]
  );

  const onPrivateMessage = useCallback(
    (callback) => {
      if (!socket || !connected) return () => {};
      const handler = (data) => callback?.(data);
      socket.on("private_message", handler);
      return () => socket.off("private_message", handler);
    },
    [socket, connected]
  );

  const value = useMemo(
    () => ({
      socket,
      connected,
      error,
      onlineConnections,
      totalUnreadCount,
      // socket RPCs
      fetchConversations,
      fetchMessages,
      openConversationWithUser,
      searchUsers,
      sendPrivateMessage,
      markMessagesAsRead,
      onPrivateMessage,
      getOnlineConnections,
    }),
    [
      socket,
      connected,
      error,
      onlineConnections,
      totalUnreadCount,
      fetchConversations,
      fetchMessages,
      openConversationWithUser,
      searchUsers,
      sendPrivateMessage,
      markMessagesAsRead,
      onPrivateMessage,
      getOnlineConnections,
    ]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
};
