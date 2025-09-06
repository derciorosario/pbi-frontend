// src/components/QuickActionsPanel.jsx
import { X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import  client  from "../api/client";

/* brand */
const BRAND = "#0a66c2";

/* tiny inline icons */
const I = {
  chevron: ({open}) => (
    <svg
      className={`h-4 w-4 transform transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  bell:   () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill={BRAND}><path d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22ZM18 16v-5a6 6 0 1 0-12 0v5l-1.8 1.8A1 1 0 0 0 5 20h14a1 1 0 0 0 .8-1.6Z"/></svg>,
  users:  () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill={BRAND}><path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4ZM2 20a6 6 0 0 1 12 0v1H2Z"/></svg>,
  chat:   () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill={BRAND}><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  plus:   () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>,
  calendar:() => <svg className="h-4 w-4" viewBox="0 0 24 24" fill={BRAND}><path d="M7 2h2v3H7zm8 0h2v3h-2z"/><path d="M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2Z"/></svg>,
  check:  () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="white"><path d="M9 16.2 4.8 12l-1.8 1.8L9 20l12-12-1.8-1.8z"/></svg>,
  close:  () => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  pin:    () => <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg>,
};

/* helpers */
const Section = ({title, icon, children, right}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          {icon}{title}
        </div>
        <div className="flex items-center gap-2">
          {right}
          <I.chevron open={open}/>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
};

const Counter = ({n}) => (
  <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FF6B6B] px-1.5 text-[11px] font-semibold text-white">
    {n}
  </span>
);

const CircleBtn = ({children, className="", style, ...rest}) => (
  <button
    className={`h-8 w-8 grid place-items-center rounded-full shadow-sm ${className}`}
    style={style}
    {...rest}
  >
    {children}
  </button>
);

/* component */
export default function QuickActionsPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for data
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);

      // Load connection requests
      const connectionRes = await client.get('/connections/requests');
      setConnectionRequests(connectionRes.data.incoming || []);

      // Load recent chats (conversations)
      const chatsRes = await client.get('/messages/conversations');
      setRecentChats(chatsRes.data || []);

      // Load upcoming meetings
      const meetingsRes = await client.get('/meeting-requests/upcoming');
      setUpcomingMeetings(meetingsRes.data || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Set up polling every 3 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadData();
    }, 3000); // 3 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [user]);

  // Handle connection request response
  const handleConnectionResponse = async (requestId, action) => {
    try {
      await client.post(`/api/connections/requests/${requestId}/respond`, { action });
      // Refresh data after response
      loadData();
    } catch (error) {
      console.error('Error responding to connection request:', error);
    }
  };

  // Handle chat navigation
  const handleChatClick = (userId) => {
    navigate(`/messages?user=${userId}`);
  };

  // Handle meeting join
  const handleJoinMeeting = async (meetingId) => {
    try {
      // Get meeting details
      const response = await client.get(`/api/meeting-requests/${meetingId}`);
      const meeting = response.data;

      if (meeting.link) {
        window.open(meeting.link, '_blank');
      } else {
        console.log('No meeting link available');
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
    }
  };

  if (!user) return null;

  return (
    <aside className={`w-full ${!user ? 'hidden':''} max-w-sm rounded-2xl border border-gray-200 bg-white shadow-sm my-2`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <I.bell />
            <h3 className="text-lg font-semibold text-gray-900">My Hub</h3>
          </div>
          <button
            onClick={loadData}
            className="h-8 w-8 grid place-items-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
            title="Refresh"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">Stay connected and organized</p>
      </div>
{/* Connection Requests */}
<Section
  title="Connection Requests"
  icon={<I.users />}
  right={<Counter n={connectionRequests.length} />}
>
  {connectionRequests.length === 0 ? (
    <div className="text-sm text-gray-500 text-center py-4">
      No pending connection requests
    </div>
  ) : (
    connectionRequests.map((request) => (
      <div key={request.id} className="flex items-center justify-between mb-3 hover:bg-gray-50 cursor-pointer">
        <div className="flex items-center gap-3 min-w-0">
          <img src={request.from?.avatarUrl || "https://i.pravatar.cc/80?img=1"} alt="" className="h-9 w-9 rounded-full object-cover flex-shrink-0"/>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-gray-900 truncate">{request.fromName || request.from?.name}</div>
            <div className="text-xs text-gray-500 truncate">{request.reason || "Professional"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CircleBtn style={{background: BRAND}} onClick={() => handleConnectionResponse(request.id, "accept")}>
            <I.check/>
          </CircleBtn>
          <CircleBtn className="border border-gray-200 text-gray-500 bg-white" onClick={() => handleConnectionResponse(request.id, "reject")}>
            <X size={18}/>
          </CircleBtn>
        </div>
      </div>
    ))
  )}
</Section>

      {/* Recent Chats */}
      <Section
        title="Recent Chats"
        icon={<I.chat />}
        right={
          <button className="h-7 w-7 grid place-items-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50">
            <I.plus/>
          </button>
        }
      >
        {recentChats.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            No recent chats
          </div>
        ) : (
          recentChats.map((chat) => (
            <div
              key={chat.id}
              className="flex items-center justify-between mb-3 rounded-lg px-2 py-1 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleChatClick(chat.otherUser.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <img src={chat.otherUser.avatarUrl || "https://i.pravatar.cc/80?img=1"} alt="" className="h-9 w-9 rounded-full object-cover flex-shrink-0"/>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white bg-gray-300"/>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{chat.otherUser.name}</div>
                  <div className="text-xs text-gray-500 truncate">{chat.lastMessage || "No messages yet"}</div>
                </div>
              </div>
              <span className="text-[11px] text-gray-400">
                {chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ""}
              </span>
            </div>
          ))
        )}
      </Section>

      {/* Upcoming Meetings */}
      <Section
        title="Upcoming Meetings"
        icon={<I.calendar />}
        right={<Counter n={upcomingMeetings.length} />}
      >
        {upcomingMeetings.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            No upcoming meetings
          </div>
        ) : (
          upcomingMeetings.map((meeting) => {
            // Calculate time label
            const meetingDate = new Date(meeting.scheduledAt);
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);

            let timeLabel = "";
            if (meetingDate.toDateString() === today.toDateString()) {
              timeLabel = "Today";
            } else if (meetingDate.toDateString() === tomorrow.toDateString()) {
              timeLabel = "Tomorrow";
            } else {
              timeLabel = meetingDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              });
            }

            const timeString = meetingDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });

            const otherUser = meeting.fromUserId === user?.id ? meeting.recipient : meeting.requester;

            return (
              <div key={meeting.id} className="rounded-xl border border-gray-200 bg-white mb-3">
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-800">{meeting.title}</div>
                    <span className={`rounded-full text-[11px] px-2 py-0.5 ${
                      timeLabel === "Today" ? "bg-orange-100 text-orange-700" :
                      timeLabel === "Tomorrow" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {timeLabel}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 flex items-center gap-1.5">
                    <I.pin/> with {otherUser?.name || "Unknown"} • {timeString}
                  </div>
                </div>
                <div className="p-3 pt-0">
                  <button
                    className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                    style={{background: BRAND}}
                    onClick={() => handleJoinMeeting(meeting.id)}
                  >
                    Join Meeting
                  </button>
                </div>
              </div>
            );
          })
        )}
      </Section>
    </aside>
  );
}
