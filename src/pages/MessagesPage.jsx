// src/pages/MessagesPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Send, User, Check, CheckCheck, ArrowLeft, Plus, X, Paperclip, File, Image, Download, Smile } from "lucide-react";

// Emoji picker
import EmojiPicker from 'emoji-picker-react';
import Header from "../components/Header";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
import * as messageApi from "../api/messages";
import client from "../api/client";
import { toast } from "../lib/toast";
import DefaultLayout from "../layout/DefaultLayout";
import FullPageLoader from "../components/ui/FullPageLoader";

export default function MessagesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    connected,
    sendPrivateMessage,
    onPrivateMessage,
    markMessagesAsRead,
    onlineConnections,
    getOnlineConnections,
    refreshUnreadCount,
  } = useSocket();

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);
  const fileInputRef = useRef(null);

  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [messageFilter, setMessageFilter] = useState('all'); // 'all' or 'unread'
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Image loading states
  const [imageLoadingStates, setImageLoadingStates] = useState({});

  const searchUsers = async (query) => {
    if (!query || query.length < 3) {
      setUserSearchResults([]);
      return;
    }
    try {
      setUserSearchLoading(true);
      const { data } = await messageApi.searchUsers(query);
      setUserSearchResults(data);
    } catch (error) {
      console.error("Failed to search users:", error);
      toast.error("Failed to search users");
      setUserSearchResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get("userId");
    if (userId) {
      setSelectedUserId(userId);
      navigate("/messages", { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    if (connected) {
      getOnlineConnections();
      const interval = setInterval(() => getOnlineConnections(), 30000);
      return () => clearInterval(interval);
    }
  }, [connected, getOnlineConnections]);

  useEffect(() => {
    async function loadConversations() {
      try {
        setLoading(true);
        const { data } = await messageApi.getConversations();
        setConversations(data);
      } catch (error) {
        console.error("Failed to load conversations:", error);
        toast.error("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, []);

  useEffect(() => {
    async function loadMessages() {
      if (!activeConversation) return;
      try {
        setLoading(true);
        const { data } = await messageApi.getMessages(activeConversation.id);
        setMessages((prev) => mergeMessages(prev, data));

        if (connected) {
          markMessagesAsRead(activeConversation.id).then(refreshUnreadCount).catch(console.error);
        } else {
          messageApi.markAsRead(activeConversation.id).then(refreshUnreadCount).catch(console.error);
        }

        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversation.id ? { ...c, unreadCount: 0 } : c))
        );

        // Scroll to bottom when first loading messages
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } catch (error) {
        console.error("Failed to load messages:", error);
        toast.error("Failed to load messages");
      } finally {
        setLoading(false);
      }
    }

    loadMessages();

    const pollInterval = setInterval(async () => {
      if (!activeConversation || isSendingMessage) return; // Skip polling while sending
      try {
        const { data } = await messageApi.getMessages(activeConversation.id);
        // Always merge, never drop pending optimistic messages
        setMessages((prev) => mergeMessages(prev, data));
        if (connected) {
          markMessagesAsRead(activeConversation.id).then(refreshUnreadCount).catch(console.error);
        } else {
          messageApi.markAsRead(activeConversation.id).then(refreshUnreadCount).catch(console.error);
        }
      } catch (error) {
        console.error("Error polling messages:", error);
      }
    }, 5000); // Increased from 2000ms to 5000ms to reduce race conditions

    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation, connected, markMessagesAsRead, messages.length]);

  useEffect(() => {
    async function loadMessagesWithUser() {
      if (!selectedUserId) return;
      try {
        setLoading(true);
        const { data } = await messageApi.getMessagesWithUser(selectedUserId);

        let userName = data.conversation.otherUser?.name;
        let avatarUrl
        if (!userName || userName === "User") {
          try {
            const { data: userData } = await client.get(`/users/${selectedUserId}/public/basic`);
            userName = userData.name || "User";
            avatarUrl=userData.avatarUrl
          } catch {}
        }

        setActiveConversation({
          id: data.conversation.id,
          otherUser: {
            id: selectedUserId,
            name: userName || "User",
            avatarUrl,
          },
        });

        setMessages((prev) => mergeMessages(prev, data.messages));
        setSelectedUserId(null);
        // Scroll to bottom when loading messages for a new conversation
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } catch (error) {
        console.error("Failed to load messages with user:", error);
        toast.error("Failed to load conversation");
        setSelectedUserId(null);
      } finally {
        setLoading(false);
      }
    }
    loadMessagesWithUser();
  }, [selectedUserId]);

  const handleNewMessage = (data) => {
    const { message } = data || {};
    if (!message) return;

    if (message.senderId === user?.id) {
      // Replace optimistic message with confirmed message
      setMessages((prev) => {
        const idx = prev.findIndex(
          (m) =>
            m.pending &&
            m.senderId === user.id &&
            m.receiverId === message.receiverId &&
            m.content === message.content &&
            // For attachments, also check attachment count matches
            (!m.attachments || m.attachments.length === (message.attachments?.length || 0))
        );
        if (idx === -1) return prev;
        const next = prev.slice();
        next[idx] = { ...message, pending: false };
        return next;
      });
      return;
    }

    if (
      activeConversation &&
      ((message.senderId === activeConversation.otherUser.id && message.receiverId === user.id) ||
        (message.senderId === user.id && message.receiverId === activeConversation.otherUser.id))
    ) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });

      if (connected) {
        markMessagesAsRead(activeConversation.id).then(refreshUnreadCount).catch(console.error);
      }
    }

    setConversations((prev) => {
      const updated = [...prev];
      let idx = updated.findIndex((c) => c.id === message.conversationId);
      if (idx < 0) {
        idx = updated.findIndex(
          (c) =>
            (c.otherUser.id === message.senderId && message.receiverId === user.id) ||
            (c.otherUser.id === message.receiverId && message.senderId === user.id)
        );
      }

      if (idx >= 0) {
        const conv = { ...updated[idx] };
        conv.lastMessage = message.content;
        conv.lastMessageTime = message.createdAt;

        if (!activeConversation || (activeConversation.id !== conv.id && message.senderId !== user.id)) {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }
        updated.splice(idx, 1);
        updated.unshift(conv);
        return updated;
      } else if (message.conversationId) {
        updated.unshift({
          id: message.conversationId,
          otherUser:
            message.senderId === user.id
              ? { id: message.receiverId, name: "User" }
              : message.sender || { id: message.senderId, name: "User" },
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount: message.senderId === user.id ? 0 : 1,
        });
        return updated;
      }
      return updated;
    });
  };

  useEffect(() => {
    const cleanup = onPrivateMessage(handleNewMessage);
    return () => cleanup && cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onPrivateMessage, activeConversation?.id, user?.id, connected]);

  // Track scroll position to determine if user is near bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setIsUserNearBottom(distanceFromBottom < 100); // Within 100px of bottom
    };

    container.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeConversation]);

  // Auto-scroll only when user is near bottom
  useEffect(() => {
    if (isUserNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isUserNearBottom]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        const { data } = await messageApi.getConversations();
        setConversations(data);
      } catch (error) {
        console.error("Failed to refresh conversations:", error);
      }
    }, 3000);
    return () => clearInterval(refreshInterval);
  }, []);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      return file.size <= maxSize;
    });

    if (validFiles.length !== files.length) {
      toast.error("Some files exceed the 5MB limit");
    }

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const isImageFile = (filename) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  // Also detect by mimetype when available (server returns mimetype)
  const isImageAttachment = (att) => {
    if (!att) return false;
    if (att.mimetype && typeof att.mimetype === 'string' && att.mimetype.startsWith('image/')) return true;
    return isImageFile(String(att.filename || ''));
  };

  // Image loading handlers
  const handleImageLoad = (imageKey) => {
    setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }));
  };

  const handleImageError = (imageKey) => {
    setImageLoadingStates(prev => ({ ...prev, [imageKey]: 'error' }));
  };

  const getImageLoadingState = (imageKey) => {
    return imageLoadingStates[imageKey];
  };

  const setImageLoading = (imageKey) => {
    setImageLoadingStates(prev => ({ ...prev, [imageKey]: true }));
  };

  // Skeleton loader component with image icon
  const ImageSkeleton = ({ className = "", showIcon = false }) => (
    <div className={`animate-pulse bg-gray-200 relative ${className}`}>
      {showIcon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Image size={24} className="text-gray-400" />
        </div>
      )}
    </div>
  );

  // Merge fetched server messages with any optimistic pending messages so they never disappear
  // Also de-duplicate: if a server message matches a pending one (same sender, receiver, content),
  // drop the pending copy to avoid duplicates and flicker. Finally, keep a stable chronological order.
  const mergeMessages = (prev, server) => {
    if (!Array.isArray(server)) return prev || [];
    const prevList = Array.isArray(prev) ? prev : [];

    // signature for matching a "same" message without id (more specific for attachments)
    const sig = (m) => {
      const content = m?.content || "";
      const hasAttachments = Array.isArray(m?.attachments) && m.attachments.length > 0;
      const attachmentCount = hasAttachments ? m.attachments.length : 0;
      const firstAttachmentName = hasAttachments ? m.attachments[0]?.filename || "" : "";
      return `${m?.senderId || ""}|${m?.receiverId || ""}|${content}|${attachmentCount}|${firstAttachmentName}`;
    };

    const serverById = new Set(server.map((m) => m.id));
    const serverSig = new Set(server.map((m) => sig(m)));

    const merged = [...server];

    // Append still-pending local messages not yet in the server list
    for (const m of prevList) {
      if (m?.pending) {
        // Only skip if we have an exact signature match OR same temp ID was replaced
        if (serverSig.has(sig(m))) continue;
        if (serverById.has(m.id)) continue;
        merged.push(m);
      }
    }

    // Sort chronologically (ascending) by createdAt; fallback to 0 if missing
    merged.sort((a, b) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    });

    return merged;
  };

  const onEmojiClick = (emojiData, event) => {
    const emoji = emojiData?.emoji;
    if (!emoji) return;
    setNewMessage(prev => prev + emoji);
    // Keep picker open so user can choose multiple emojis (uncomment to auto-close)
    // setShowEmojiPicker(false);
  };

  // Retry sending a failed message (preserves attachments)
  async function handleRetry(msg) {
    if (!activeConversation || !msg) return;
    const tempId = msg.id; // reuse same temp id
    const filesToSend = Array.isArray(msg.localFiles) ? msg.localFiles : [];
    const content = msg.content || "";

    // mark as pending again
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === tempId);
      if (idx === -1) return prev;
      const next = prev.slice();
      next[idx] = { ...next[idx], pending: true, failed: false };
      return next;
    });

    try {
      let confirmed;
      if (filesToSend.length === 0 && connected) {
        const res = await sendPrivateMessage(activeConversation.otherUser.id, content);
        confirmed = res?.message || res?.data?.message || null;
      } else {
        const formData = new FormData();
        formData.append('content', content);
        filesToSend.forEach(file => {
          formData.append('attachments', file);
        });
        const { data } = await messageApi.sendMessage(activeConversation.otherUser.id, formData);
        confirmed = data || null;
      }

      // Update conversation preview
      setConversations((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex((c) => c.id === activeConversation.id);
        if (idx >= 0) {
          const conv = { ...updated[idx] };
          const preview =
            content && content.length > 0
              ? content
              : (filesToSend.length === 1 ? "Attachment" : `${filesToSend.length} attachments`);
          conv.lastMessage = preview;
          conv.lastMessageTime = new Date().toISOString();
          updated.splice(idx, 1);
          updated.unshift(conv);
        }
        return updated;
      });

      // Replace this temp failed message with confirmed one
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === tempId);
        if (idx === -1) return prev;
        const next = prev.slice();
        next[idx] = confirmed ? { ...confirmed, pending: false } : { ...next[idx], pending: false, failed: false };
        return next;
      });
    } catch (error) {
      console.error("Retry failed:", error);
      toast.error("Retry failed");
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === tempId);
        if (idx === -1) return prev;
        const next = prev.slice();
        next[idx] = { ...next[idx], pending: false, failed: true };
        return next;
      });
    }
  }

  async function handleSend() {
    if ((!newMessage.trim() && attachments.length === 0) || !activeConversation) return;

    const content = newMessage.trim();
    const filesToSend = [...attachments];
    setNewMessage("");
    setAttachments([]);
    setIsSendingMessage(true); // Prevent polling interference

    const tempId = Date.now().toString();
    const tempMessage = {
      id: tempId,
      content,
      senderId: user.id,
      receiverId: activeConversation.otherUser.id,
      createdAt: new Date().toISOString(),
      read: false,
      pending: true,
      failed: false,
      // keep original File objects to allow retry
      localFiles: filesToSend,
      attachments: filesToSend.map(f => ({
        filename: f.name,
        url: URL.createObjectURL(f),
        mimetype: f.type,
        size: f.size,
      })),
    };
    setMessages((prev) => [...prev, tempMessage]);
    // Force scroll to bottom when sending a message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      let confirmed;
      // Use socket only for text-only messages. For any attachments, use REST (multipart)
      if (filesToSend.length === 0 && connected) {
        const res = await sendPrivateMessage(activeConversation.otherUser.id, content);
        confirmed = res?.message || res?.data?.message || null;
      } else {
        const formData = new FormData();
        formData.append('content', content);
        filesToSend.forEach(file => {
          formData.append('attachments', file);
        });
        const { data } = await messageApi.sendMessage(activeConversation.otherUser.id, formData);
        confirmed = data || null;
      }

      setConversations((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex((c) => c.id === activeConversation.id);
        if (idx >= 0) {
          const conv = { ...updated[idx] };
          const preview =
            content && content.length > 0
              ? content
              : (filesToSend.length === 1 ? "Attachment" : `${filesToSend.length} attachments`);
          conv.lastMessage = preview;
          conv.lastMessageTime = new Date().toISOString();
          updated.splice(idx, 1);
          updated.unshift(conv);
        }
        return updated;
      });

      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === tempId);
        if (idx === -1) return prev;
        const next = prev.slice();
        next[idx] = confirmed ? { ...confirmed, pending: false } : { ...next[idx], pending: false };
        return next;
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
      // Mark as failed but keep it visible for retry
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === tempId);
        if (idx === -1) return prev;
        const next = prev.slice();
        next[idx] = { ...next[idx], pending: false, failed: true };
        return next;
      });
    } finally {
      setIsSendingMessage(false); // Re-enable polling
    }
  }

  
  function formatMessageTime(dateString) {
  
  const date = dateString ? new Date(dateString) : new Date();
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.floor((startOfToday - startOfDate) / (1000 * 60 * 60 * 24));

  const timePart = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (diffDays === 0) {
    return timePart; // Today
  }
  if (diffDays === 1) {
    return `Yesterday ${timePart}`;
  }
  if (diffDays < 7) {
    return `${date.toLocaleDateString([], { weekday: "long" })} ${timePart}`;
  }
  return `${date.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" })} ${timePart}`;
}


  // Calculate total unread count
  const totalUnreadCount = conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);

  const filteredConversations = conversations.filter((conv) => {
    // First filter by search query
    const matchesSearch = (conv.otherUser?.name || "User").toLowerCase().includes(searchQuery.toLowerCase());

    // Then filter by read/unread status
    const matchesFilter = messageFilter === 'all' || (messageFilter === 'unread' && (conv.unreadCount || 0) > 0);

    return matchesSearch && matchesFilter;
  });

  if (loading && conversations.length === 0) {
    return <FullPageLoader />;
  }

  return (
    <DefaultLayout>
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Make the card a fixed-height flex container and allow children to shrink with min-h-0 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden h-[calc(100vh-10rem)]">
          <div className="flex h-full min-h-0">
            {/* Sidebar */}
            <aside
              className={`w-80 border-r max-md:w-full ${activeConversation ? "hidden md:flex" : "flex"} flex-col min-h-0`}
            >
              <div className="p-4 border-b">
                <button
                  onClick={() => setShowUserSearch(true)}
                  className="w-full py-2 px-4 bg-brand-500 text-white rounded-xl flex items-center justify-center gap-2 mb-3"
                >
                  <Plus size={16} />
                  <span>New Message</span>
                </button>
                <div className="relative">
                  <input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm w-full"
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                </div>
                <div className="flex gap-4 mt-3 text-sm">
                  <button
                    onClick={() => setMessageFilter('all')}
                    className={`font-medium ${messageFilter === 'all' ? 'text-brand-600' : 'text-gray-500'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setMessageFilter('unread')}
                    className={`font-medium ${messageFilter === 'unread' ? 'text-brand-600' : 'text-gray-500'}`}
                  >
                    Unread {totalUnreadCount > 0 && `(${totalUnreadCount})`}
                  </button>
                </div>
              </div>

              {/* Online users */}
              {onlineConnections && onlineConnections.length > 0 && (
                <div className="p-4 border-b bg-gray-50 hidden">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Online Connections</h3>
                  <div className="flex flex-wrap gap-2">
                    {onlineConnections.map((c) => (
                      <div
                        key={c.userId}
                        onClick={() => setSelectedUserId(c.userId)}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        {c.user?.avatarUrl ? (
                          <div className="relative">
                            <img
                              src={c.user.avatarUrl}
                              alt={c.user.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-white" />
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                              <User size={16} />
                            </div>
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-white" />
                          </div>
                        )}
                        <span className="text-sm font-medium">{c.user?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversations list: flex-1 + overflow + min-h-0 so it scrolls even with the block above */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">No conversations yet</div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setActiveConversation(conv)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        activeConversation?.id === conv.id ? "bg-gray-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 relative">
                        {conv.otherUser?.avatarUrl ? (
                          <div className="relative">
                            {getImageLoadingState(`conv-${conv.id}`) !== false && (
                              <ImageSkeleton className="h-10 w-10 rounded-full" />
                            )}
                            <img
                              src={conv.otherUser.avatarUrl}
                              alt={conv.otherUser.name}
                              className={`h-10 w-10 rounded-full object-cover ${getImageLoadingState(`conv-${conv.id}`) === false ? 'block' : 'hidden'}`}
                              onLoad={() => handleImageLoad(`conv-${conv.id}`)}
                              onError={() => handleImageError(`conv-${conv.id}`)}
                              onLoadStart={() => setImageLoading(`conv-${conv.id}`)}
                            />
                            {onlineConnections?.some((c) => c.userId === conv.otherUser.id) && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-1 ring-white" />
                            )}
                          </div>
                        ) : (
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                              <User size={20} />
                            </div>
                            {onlineConnections?.some((c) => c.userId === conv.otherUser.id) && (
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-1 ring-white" />
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium truncate">{conv.otherUser?.name || "User"}</h3>
                            {conv.lastMessageTime && <span className="text-xs text-gray-500">{formatMessageTime(conv.lastMessageTime)}</span> }
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                            {conv.unreadCount > 0 && (
                              <span className="bg-brand-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>

            {/* Chat */}
            {activeConversation ? (
              <section className="flex-1 flex flex-col min-h-0">
                {/* Chat header stays visible */}
                <div className="h-14 border-b px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      className="md:hidden p-1 rounded-full hover:bg-gray-100"
                      onClick={() => setActiveConversation(null)}
                    >
                      <ArrowLeft size={20} />
                    </button>

                    {activeConversation.otherUser?.avatarUrl ? (
                      <div className="relative">
                        {getImageLoadingState(`header-${activeConversation.otherUser.id}`) !== false && (
                          <ImageSkeleton className="h-10 w-10 rounded-full" />
                        )}
                        <img
                          src={activeConversation.otherUser.avatarUrl}
                          alt={activeConversation.otherUser.name}
                          className={`h-10 w-10 rounded-full object-cover ${getImageLoadingState(`header-${activeConversation.otherUser.id}`) === false ? 'block' : 'hidden'}`}
                          onLoad={() => handleImageLoad(`header-${activeConversation.otherUser.id}`)}
                          onError={() => handleImageError(`header-${activeConversation.otherUser.id}`)}
                          onLoadStart={() => setImageLoading(`header-${activeConversation.otherUser.id}`)}
                        />
                        {onlineConnections?.some((c) => c.userId === activeConversation.otherUser.id) && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-1 ring-white" />
                        )}
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                          <User size={20} />
                        </div>
                        {onlineConnections?.some((c) => c.userId === activeConversation.otherUser.id) && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-1 ring-white" />
                        )}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold">{activeConversation.otherUser?.name || "User"}</h2>
                        {onlineConnections?.some((c) => c.userId === activeConversation.otherUser.id) && (
                          <span className="text-xs text-green-500 font-medium">Online</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages list: fill remaining height and scroll */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.senderId === user.id ? "justify-end" : "justify-start"}`}
                      >
                        {m.senderId !== user.id && (
                          <div className="flex-shrink-0 mr-2">
                            {m.sender?.avatarUrl ? (
                              <>
                                {getImageLoadingState(`msg-${m.id}-sender`) !== false && (
                                  <ImageSkeleton className="h-8 w-8 rounded-full" />
                                )}
                                <img
                                  src={m.sender.avatarUrl}
                                  alt={m.sender.name}
                                  className={`h-8 w-8 rounded-full object-cover ${getImageLoadingState(`msg-${m.id}-sender`) === false ? 'block' : 'hidden'}`}
                                  onLoad={() => handleImageLoad(`msg-${m.id}-sender`)}
                                  onError={() => handleImageError(`msg-${m.id}-sender`)}
                                  onLoadStart={() => setImageLoading(`msg-${m.id}-sender`)}
                                />
                              </>
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                                <User size={16} />
                              </div>
                            )}
                          </div>
                        )}

                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                            m.senderId === user.id ? "bg-brand-500 text-white" : "bg-gray-100"
                          } ${m.pending ? "opacity-70" : ""}`}
                        >
                          {m.content && <div className="mb-2">{m.content}</div>}
                          {m.attachments && m.attachments.length > 0 && (
                            <div className="space-y-2">
                              {m.attachments.map((attachment, idx) => (
                                <div key={idx} className={`p-2 rounded ${m.senderId === user.id ? "bg-white/10" : "bg-gray-200"}`}>
                                  {isImageAttachment(attachment) ? (
                                    <div className="relative inline-block">
                                      {getImageLoadingState(`attachment-${m.id}-${idx}`) !== false && (
                                        <ImageSkeleton className="rounded-lg max-w-[240px] max-h-[240px]" showIcon={true} />
                                      )}
                                      <button
                                        onClick={() => {
                                          setSelectedImage(attachment);
                                          setShowImageDialog(true);
                                        }}
                                        className={`block cursor-pointer ${getImageLoadingState(`attachment-${m.id}-${idx}`) === false ? 'block' : 'hidden'}`}
                                        title={attachment.filename}
                                      >
                                        <img
                                          src={attachment.url}
                                          alt={attachment.filename}
                                          className="rounded-lg max-w-[240px] max-h-[240px] object-cover border border-black/10"
                                          onLoad={() => handleImageLoad(`attachment-${m.id}-${idx}`)}
                                          onError={() => handleImageError(`attachment-${m.id}-${idx}`)}
                                          onLoadStart={() => setImageLoading(`attachment-${m.id}-${idx}`)}
                                        />
                                      </button>
                                      <a
                                        href={attachment.url.replace("/uploads/", "/download/")}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                                        title="Download"
                                      >
                                        <Download size={12} />
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <File size={16} />
                                      <div className="flex-1 min-w-0">
                                        <a
                                          href={attachment.url.replace("/uploads/", "/download/")}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs underline hover:no-underline truncate block"
                                        >
                                          {attachment.filename}
                                        </a>
                                        <span className="text-xs opacity-70">
                                          {(attachment.size / 1024).toFixed(1)} KB
                                        </span>
                                      </div>
                                      <a
                                        href={attachment.url.replace("/uploads/", "/download/")}
                                        download={attachment.filename}
                                        className="p-1 hover:bg-white/20 rounded"
                                        title="Download"
                                      >
                                        <Download size={12} />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-gray-400">
                            <div className="flex items-center gap-2">
                              {m.pending && <span className="opacity-70">Sending…</span>}
                              {m.failed && (
                                <div className="flex items-center gap-2 text-red-500">
                                  <span>Failed</span>
                                  <button
                                    onClick={() => handleRetry(m)}
                                    className="px-2 py-0.5 rounded bg-red-100 text-red-600 hover:bg-red-200"
                                  >
                                    Retry
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span>{formatMessageTime(m.createdAt)}</span>
                              {m.senderId === user.id && (m.read ? <CheckCheck size={12} /> : <Check size={12} />)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                <div className="border-t p-3 relative">
                  {/* Attachments preview */}
                  {attachments.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                          {isImageFile(file.name) ? (
                            <>
                              {getImageLoadingState(`preview-${index}`) !== false && (
                                <ImageSkeleton className="h-10 w-10 rounded" />
                              )}
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className={`h-10 w-10 object-cover rounded border border-black/10 ${getImageLoadingState(`preview-${index}`) === false ? 'block' : 'hidden'}`}
                                onLoad={() => handleImageLoad(`preview-${index}`)}
                                onError={() => handleImageError(`preview-${index}`)}
                                onLoadStart={() => setImageLoading(`preview-${index}`)}
                              />
                            </>
                          ) : (
                            <>
                              <File size={16} className="text-gray-600" />
                              <span className="text-sm text-gray-700 truncate max-w-32">{file.name}</span>
                            </>
                          )}
                          <button
                            onClick={() => removeAttachment(index)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                            title="Remove"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt,.csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                      title="Attach files"
                    >
                      <Paperclip size={18} />
                    </button>
                    <button
                      onClick={() => {
                        console.log('Emoji button clicked, current state:', showEmojiPicker);
                        setShowEmojiPicker(!showEmojiPicker);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                      title="Add emoji"
                    >
                      <Smile size={18} />
                    </button>
                    {showEmojiPicker && (
                      <div className="fixed bottom-24 right-6 z-[9999] emoji-picker-container">
                        <EmojiPicker onEmojiClick={onEmojiClick} />
                      </div>
                    )}
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type your message..."
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={handleSend}
                      disabled={(!newMessage.trim() && attachments.length === 0)}
                      className="p-2 rounded-xl bg-brand-500 text-white disabled:opacity-50"
                    >
                      <Send size={18} />
                    </button>
                  </div>

                </div>
              </section>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 max-md:hidden">
                <div className="text-center">
                  <div className="mb-2 mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <Send size={24} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium">Your Messages</h3>
                  <p className="mt-1">Select a conversation or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showImageDialog && selectedImage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">{selectedImage.filename}</h3>
              <div className="flex items-center gap-x-3">
                    <a
                    href={selectedImage.url.replace("/uploads/", "/download/")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                    title="Download"
                  >
                    <Download size={12} />
                  </a>
                  <button onClick={() => setShowImageDialog(false)} className="p-1 rounded-full hover:bg-gray-100">
                    <X size={20} />
                  </button>
              </div>
            </div>
            <div className="p-4">
              {getImageLoadingState(`dialog-${selectedImage.url}`) !== false && (
                <ImageSkeleton className="max-w-full max-h-[70vh] rounded-lg" showIcon={true} />
              )}
              <img
                src={selectedImage.url}
                alt={selectedImage.filename}
                className={`max-w-full max-h-[70vh] object-contain ${getImageLoadingState(`dialog-${selectedImage.url}`) === false ? 'block' : 'hidden'}`}
                onLoad={() => handleImageLoad(`dialog-${selectedImage.url}`)}
                onError={() => handleImageError(`dialog-${selectedImage.url}`)}
                onLoadStart={() => setImageLoading(`dialog-${selectedImage.url}`)}
              />
            </div>
          </div>
        </div>
      )}

      {showUserSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">New Message</h3>
              <button onClick={() => setShowUserSearch(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="relative mb-4">
                <input
                  placeholder="Search users..."
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    if (e.target.value.length > 2) {
                      searchUsers(e.target.value);
                    } else {
                      setUserSearchResults([]);
                    }
                  }}
                  className="rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm w-full"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              </div>

              <div className="max-h-80 overflow-y-auto">
                {userSearchLoading ? (
                  <div className="text-center py-4">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-brand-500 border-r-transparent"></div>
                  </div>
                ) : userSearchResults.length > 0 ? (
                  userSearchResults.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setShowUserSearch(false);
                        setUserSearchQuery("");
                        setUserSearchResults([]);
                      }}
                      className="p-3 border-b last:border-0 flex items-center gap-3 hover:bg-gray-50 cursor-pointer"
                    >
                      {u.avatarUrl ? (
                        <>
                          {getImageLoadingState(`search-${u.id}`) !== false && (
                            <ImageSkeleton className="h-10 w-10 rounded-full" />
                          )}
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className={`h-10 w-10 rounded-full object-cover ${getImageLoadingState(`search-${u.id}`) === false ? 'block' : 'hidden'}`}
                            onLoad={() => handleImageLoad(`search-${u.id}`)}
                            onError={() => handleImageError(`search-${u.id}`)}
                            onLoadStart={() => setImageLoading(`search-${u.id}`)}
                          />
                        </>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
                          <User size={20} />
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium">{u.name}</h4>
                        {u.professionalTitle && <p className="text-xs text-gray-500">{u.professionalTitle}</p>}
                      </div>
                    </div>
                  ))
                ) : userSearchQuery.length > 2 ? (
                  <p className="text-center py-4 text-gray-500">No users found</p>
                ) : (
                  <p className="text-center py-4 text-gray-500">Type at least 3 characters to search</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
}
