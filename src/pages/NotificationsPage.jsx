// src/pages/NotificationsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import client from "../api/client";
import { toast } from "../lib/toast";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { useNavigate } from "react-router-dom";
import { Delete, DeleteIcon, LucideDelete } from "lucide-react";

const styles = {
  primary: "rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600/30",
  outline: "rounded-lg px-3 py-1.5 text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
  danger: "rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700",
  icon: "rounded-lg p-1.5 text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
};

function timeAgo(d) {
  const ts = typeof d === "string" ? new Date(d).getTime() : d?.getTime?.() ?? Date.now();
  const diff = Math.max(0, Date.now() - ts);
  const sec = Math.floor(diff / 1000);
  if (sec < 5) return "Just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min${min > 1 ? "s" : ""} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr > 1 ? "s" : ""} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day > 1 ? "s" : ""} ago`;
}

const getUserIdFromNotification = (notification) => {
  const { type, payload, user } = notification;
  
  switch (type) {
    case "connection.request":
      return payload?.fromId || payload?.fromUserId || payload?.byUserId;
    case "connection.accepted":
    case "connection.rejected":
    case "connection.removed":
      return payload?.fromId || payload?.fromUserId || payload?.byUserId;
    case "meeting_request":
      return payload?.fromId || payload?.fromUserId || payload?.byUserId;
    case "meeting_invitation":
      return payload?.fromId || payload?.fromUserId || payload?.byUserId;
    case "meeting_response":
      return payload?.fromId || payload?.fromUserId || payload?.byUserId;
    case "meeting_participant_response":
      return payload?.participantId;
    case "meeting_cancelled":
      return user?.id || payload?.fromId || payload?.fromUserId;
    case "message.new":
      return payload?.senderId;
    case "job.application.received":
      return payload?.applicantId;
    case "job.application.accepted":
    case "job.application.rejected":
    case "job.application.reviewed":
      return payload?.employerId;
    case "event.registration.received":
      return payload?.registrantId;
    case "event.registration.confirmed":
    case "event.registration.cancelled":
      return payload?.organizerId;
    case "company.staff.accepted":
    case "company.staff.rejected":
      return payload?.staffId;
    case "company.staff.removed":
      return payload?.removedBy;
    case "company.representative.revoked":
      return payload?.revokedBy;
    case "company.representative.invitation":
      return payload?.invitedBy;
    case "company.representative.authorized":
      return payload?.representativeId;
    case "company.staff.invitation":
      return payload?.invitedBy;
    case "company.staff.left":
      return payload?.staffId;
    case "organization.join.request":
      return payload?.userId;
    case "organization.join.approved":
    case "organization.join.rejected":
      return payload?.approvedBy;
    default:
      return user?.id || payload?.userId;
  }
};


export default function NotificationsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("All");
  const { socket, connected } = useSocket();
  const navigate=useNavigate()

  const handleViewProfile = (userId) => {
  if (userId) {
    navigate(`/profile/${userId}`);
  }
};


  const [loadingConn, setLoadingConn] = useState(false);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [errorConn, setErrorConn] = useState("");

  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);
  const [errorNotifications, setErrorNotifications] = useState("");

  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [meetingRequests, setMeetingRequests] = useState([]);
  const [errorMeetings, setErrorMeetings] = useState("");

  const [badgeCounts, setBadgeCounts] = useState({
    connectionsPending: 0,
    meetingsPending: 0,
    messagesPending: 0,
    jobApplicationsPending: 0,
    eventRegistrationsPending: 0,
    notificationsUnread: 0
  });

  const ProfileButton = ({ userId, className = "" }) => {
    if (!userId) return null;
    return (
      <button 
        onClick={() => handleViewProfile(userId)}
        className={`${styles.icon} ${className} px-2.5 py-2.5`}
        title="View Profile"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      </button>
    );
  };

  useEffect(() => {
    if (!connected || !socket || !user?.id) return;

    const handleNewNotification = (data) => {
      setNotifications(prev => [data.notification, ...prev]);
      setAllNotifications(prev => [data.notification, ...prev]);
    };

    const handleBadgeCounts = (counts) => {
      setBadgeCounts(prev => ({
        ...prev,
        ...counts
      }));
    };

    socket.on("new_notification", handleNewNotification);
    socket.on("header_badge_counts", handleBadgeCounts);

    socket.emit("subscribe_to_notifications");

    socket.emit("get_header_badge_counts", (counts) => {
      if (counts) setBadgeCounts(prev => ({ ...prev, ...counts }));
    });

    return () => {
      socket.off("new_notification", handleNewNotification);
      socket.off("header_badge_counts", handleBadgeCounts);
    };

  }, [connected, socket, user?.id]);

  useEffect(() => {
    if (connected && socket) {
      socket.emit("mark_header_badge_seen", { type: "all" });
    }
  }, [connected, socket]);

  const loadConnections = async () => {
    setLoadingConn(true);
    setErrorConn("");

    try {
      if (connected && socket) {
        socket.emit("qa_fetch_connection_requests", (response) => {
          if (response?.ok) {
            setIncoming(response.data.incoming || []);
            setOutgoing(response.data.outgoing || []);
          } else {
            setErrorConn(response?.error || "Failed to load connection requests");
          }
          setLoadingConn(false);
        });
      } else {
        const { data } = await client.get("/connections/requests");
        setIncoming(data.incoming || []);
        setOutgoing(data.outgoing || []);
        setLoadingConn(false);
      }
    } catch (e) {
      setErrorConn(e?.response?.data?.message || "Failed to load connection requests");
      setLoadingConn(false);
    }
  };

  const loadNotifications = async () => {
    setLoadingNotifications(true);
    setErrorNotifications("");
    try {
      if (connected && socket) {
        let t=filter.toLowerCase()
        socket.emit("qa_fetch_notifications", { type: filter === "All" ? "all" : t=="meetings" ? 'meeting' : t=="connections" ? 'connection' : t=="messages" ? 'message' : t=="jobs" ? 'job' : t=="events" ? 'event' : t=="invitations" ? 'invitation' : filter.toLowerCase() }, (response) => {
          console.log(`Loading notifications for filter: ${filter}, type: ${t=="jobs" ? 'job' : filter.toLowerCase()}, response:`, response);
          if (response?.ok) {
            setNotifications(response.data.notifications || []);
            console.log(`Loaded ${response.data.notifications?.length || 0} notifications`);
          } else {
            setErrorNotifications(response?.error || "Failed to load notifications");
          }
          setLoadingNotifications(false);
        });
      } else {
        const { data } = await client.get("/notifications");
        setNotifications(data || []);
        setLoadingNotifications(false);
      }
    } catch (e) {
      setErrorNotifications(e?.response?.data?.message || "Failed to load notifications");
      setLoadingNotifications(false);
    }
  };

  const loadAllNotificationsForBadges = async () => {
    if (connected && socket) {
      socket.emit("qa_fetch_notifications", { type: "all" }, (response) => {
        if (response?.ok) {
          setAllNotifications(response.data.notifications || []);
        }
      });
    } else {
      try {
        const { data } = await client.get("/notifications");
        setAllNotifications(data || []);
      } catch (e) {
        console.error("Failed to load notifications for badges:", e);
      }
    }
  };

  const loadMeetingRequests = async () => {
    setLoadingMeetings(true);
    setErrorMeetings("");
    try {
      if (connected && socket && 0==1) {
        socket.emit("qa_fetch_upcoming_meetings", (response) => {
          if (response?.ok) {
            const pendingMeetings = response.data.filter(m => m.status === "pending");
            setMeetingRequests(pendingMeetings);
          } else {
            setErrorMeetings(response?.error || "Failed to load meeting requests");
          }
          setLoadingMeetings(false);
        });
      } else {
        const { data } = await client.get("/meeting-requests");
        setMeetingRequests([...(data.received || []), ...(data.sent || [])]);
        setLoadingMeetings(false);
      }
    } catch (e) {
      setErrorMeetings(e?.response?.data?.message || "Failed to load meeting requests");
      setLoadingMeetings(false);
    }
  };

  useEffect(() => {
    loadConnections();
    loadMeetingRequests();
    loadNotifications();
  }, [filter, connected, socket]);

  useEffect(() => {
    if (connected && socket) {
      loadAllNotificationsForBadges();
    }
  }, [connected, socket]);

  const handleRespond = async (id, action) => {

    try {

      toast.dismiss()
  
      const toastId = toast.loading(`${action === 'accept' ? 'Accepting' : 'Declining'} connection request...`);
      
      const relatedNotification = notifications.find(n => 
         n.type === "connection.request" && n.payload?.item_id === id
      );

      if (connected && socket && 0==1) {

        if (relatedNotification) {
            markNotificationAsRead(relatedNotification.id);
        }
        toast.dismiss()

        socket.emit("qa_respond_connection_request", { requestId: id, action }, (response) => {
          if (response?.ok) {
            toast.success(`Connection request ${action === 'accept' ? 'accepted' : 'declined'} successfully`, { id: toastId });
            loadConnections();
          } else {
            toast.error(response?.error || "Failed to update connection request", { id: toastId });
          }
        });

      } else {

        await client.post(`/connections/requests/${id}/respond`, { action });
        toast.success(`Connection request ${action === 'accept' ? 'accepted' : 'declined'} successfully`, { id: toastId });
        if (relatedNotification) {
            markNotificationAsRead(relatedNotification.id);
        }
        loadConnections();

      }
    } catch (e) {
      toast.dismiss()
      toast.error(e?.response?.data?.message || "Failed to update connection request");
    }

  };

  const handleMeetingRespond = async (id, action, rejectionReason = "") => {
    try {

      toast.dismiss()
      const toastId = toast.loading(`${action === 'accept' ? 'Accepting' : 'Declining'} meeting request...`);
      
      const relatedNotification = notifications.find(n =>
          n.type === "meeting_request" && n.payload?.item_id === id
      );

      if (connected && socket) {
        await client.post(`/meeting-requests/${id}/respond`, { action, rejectionReason });
      } else {
        await client.post(`/meeting-requests/${id}/respond`, { action, rejectionReason });
      }

      if (relatedNotification) {
        await markNotificationAsRead(relatedNotification.id);
      }

      toast.dismiss()
      
      toast.success(`Meeting request ${action === 'accept' ? 'accepted' : 'declined'} successfully`, { id: toastId });
      
      await Promise.all([
        loadMeetingRequests(),
        loadNotifications()
      ]);
    } catch (e) {
      toast.dismiss()
      toast.error(e?.response?.data?.message || "Failed to update meeting request");
    }
  };

  const handleParticipantRespond = async (id, action, rejectionReason = "") => {
    try {

      toast.dismiss()
      const toastId = toast.loading(`${action === 'accept' ? 'Accepting' : action === 'reject' ? 'Declining' : 'Setting as tentative'} meeting invitation...`);
      
      const relatedNotification = notifications.find(n =>
          n.type === "meeting_invitation" && n.payload?.item_id === id
      );

      if (connected && socket) {
        await client.post(`/meeting-requests/${id}/respond-invitation`, { action, rejectionReason });
      } else {
        await client.post(`/meeting-requests/${id}/respond-invitation`, { action, rejectionReason });
      }

      if (relatedNotification) {
        await markNotificationAsRead(relatedNotification.id);
      }

      toast.dismiss()
      
      toast.success(`Meeting invitation ${action === 'accept' ? 'accepted' : action === 'reject' ? 'declined' : 'set as tentative'} successfully`, { id: toastId });
      
      await Promise.all([
        loadMeetingRequests(),
        loadNotifications()
      ]);
    } catch (e) {
      toast.dismiss()
      toast.error(e?.response?.data?.message || "Failed to update meeting invitation");
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      if (connected && socket) {
        socket.emit("qa_mark_notification_read", { notificationId }, (response) => {
          if (response?.ok) {
            setNotifications(prev => prev.map(n =>
              n.id === notificationId ? { ...n, readAt: new Date() } : n
            ));
            setAllNotifications(prev => prev.map(n =>
              n.id === notificationId ? { ...n, readAt: new Date() } : n
            ));
          }
        });
      } else {
        let r=await client.post(`/notifications/${notificationId}/read`);
        console.log(r)
        setNotifications(prev => prev.map(n =>
          n.id === notificationId ? { ...n, readAt: new Date() } : n
        ));
        setAllNotifications(prev => prev.map(n =>
          n.id === notificationId ? { ...n, readAt: new Date() } : n
        ));
      }
    } catch (e) {
      console.error("Error marking notification as read:", e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const toastId = toast.loading("Marking all notifications as read...");

      if (connected && socket) {
        socket.emit("qa_mark_all_notifications_read", (response) => {
          if (response?.ok) {
            toast.success("All notifications marked as read", { id: toastId });
            setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date() })));
            setAllNotifications(prev => prev.map(n => ({ ...n, readAt: new Date() })));
            setBadgeCounts(prev => ({
              ...prev,
              notificationsUnread: 0,
              connectionsPending: 0,
              meetingsPending: 0,
              messagesPending: 0,
              jobApplicationsPending: 0,
              eventRegistrationsPending: 0
            }));
          } else {
            toast.error(response?.error || "Failed to mark notifications as read", { id: toastId });
          }
        });
      } else {
        await client.post("/notifications/mark-all-read");
        toast.success("All notifications marked as read", { id: toastId });
        setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date() })));
        setAllNotifications(prev => prev.map(n => ({ ...n, readAt: new Date() })));
        setBadgeCounts(prev => ({
          ...prev,
          notificationsUnread: 0,
          connectionsPending: 0,
          meetingsPending: 0,
          messagesPending: 0,
          jobApplicationsPending: 0,
          eventRegistrationsPending: 0
        }));
      }
    } catch (e) {
      toast.dismiss()
      toast.error(e?.response?.data?.message || "Failed to mark notifications as read");
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      if (connected && socket) {
        socket.emit("qa_delete_notification", { notificationId }, (response) => {
          if (response?.ok) {
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
            setAllNotifications(prev => prev.filter(n => n.id !== notificationId));
            toast.success("Notification deleted");
          }
        });
      } else {
        await client.delete(`/notifications/${notificationId}`);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setAllNotifications(prev => prev.filter(n => n.id !== notificationId));
        toast.success("Notification deleted");
      }
    } catch (e) {
      toast.dismiss()
      toast.error(e?.response?.data?.message || "Failed to delete notification");
    }
  };

  const connBadge = badgeCounts.connectionsPending ?? incoming.length;
  const meetBadge = badgeCounts.meetingsPending ?? meetingRequests.filter(m =>
    m.status === "pending" && m.requester?.id !== user?.id
  ).length;
  const messageBadge = badgeCounts.messagesPending ?? allNotifications.filter(n => !n.readAt && n.type === "message.new").length;
  const jobBadge = badgeCounts.jobApplicationsPending ?? allNotifications.filter(n => !n.readAt && n.type.startsWith("job.application.")).length;
  const eventBadge = badgeCounts.eventRegistrationsPending ?? allNotifications.filter(n => !n.readAt && n.type.startsWith("event.registration.")).length;
  const invitationBadge = allNotifications.filter(n => !n.readAt && (n.type.startsWith("company.") || n.type.startsWith("organization."))).length;
  const systemBadge = badgeCounts.notificationsUnread ?? allNotifications.filter(n => !n.readAt && n.type === "system").length;

  const allItems = useMemo(() => {
    const connectionItems = [
      ...incoming.map((r) => ({
        key: `conn-in-${r.id}`,
        id: r.id,
        type: "connection",
        tab: "Connections",
        hasApproval: true,
        title: "New Connection Request",
        desc: `${r.fromName || "Someone"} wants to connect with you.${r.reason ? ` Reason: ${r.reason}.` : ""}${r.message ? ` Message: "${r.message}"` : ""}`,
        time: timeAgo(r.createdAt),
        userId: r.fromId,
        actions: (
          <div className="mt-2 flex gap-2 text-sm">
            <button onClick={() => handleRespond(r.id, "accept")} className={styles.primary}>
              Accept
            </button>
            <button onClick={() => handleRespond(r.id, "reject")} className={styles.outline}>
              Decline
            </button>
          </div>
        ),
      })),
    ];


    const meetingItems = meetingRequests
      .filter(m => m.status === "pending" && m.requester?.id !== user?.id)
      .map((m) => ({
        key: `meeting-${m.id}`,
        type: "meeting",
        id: m.id,
        title: "New Meeting Request",
        tab: "Meetings",
        hasApproval: true,
        desc: `${m.requester?.name || "Someone"} wants to schedule a meeting: "${m.title}"`,
        time: timeAgo(m.createdAt),
        meta: `📅 ${new Date(m.scheduledAt).toLocaleString('en-US', {dateStyle: 'short',timeStyle: 'short'})} ${m.time ? '-' : ''} ${m.time || ''} (${m.timezone}) • ${m.duration} min • ${m.mode} ${m.link || m.location ? '•' : ''} ${m.link || m.location || ''}`,
        userId: m.requester?.id,
        actions: (
          <div className="mt-2 flex gap-2 text-sm">
            <button onClick={() => handleMeetingRespond(m.id, "accept")} className={styles.primary}>
              Accept
            </button>
            <button onClick={() => handleMeetingRespond(m.id, "reject")} className={styles.outline}>
              Decline
            </button>
          </div>
        ),
      }));

    const notificationItems = notifications.map((n) => {
      let title = "";
      let message = "";
      let meta = ""

      console.log({type:n.type})
      
      switch (n.type) {
        case "connection.request":
          title = "New Connection Request";
          message = `${n.payload?.fromName || "Someone"} wants to connect with you`;
          if (n.payload?.reason) {
            message += `. Reason: ${n.payload.reason}`;
          }
          break;

        case "connection.accepted":
          title = "Connection Accepted";
          message = `${n.payload?.fromName || "Someone"} accepted your connection request`;
          break;

        case "connection.rejected":
          title = "Connection Declined";
          message = `${n.payload?.fromName || "Someone"} declined your connection request`;
          break;

        case "connection.removed":
          title = "Connection Removed";
          message = `${n.payload?.fromName || "Someone"} removed the connection`;
          if (n.payload?.note) {
            message += `. Note: ${n.payload.note}`;
          }
          break;

        case "meeting_request":
          title = "New Meeting Request";
          message = `${n.payload?.fromName || "Someone"} requested a meeting ${n.payload?.title  ? `:${n.payload?.title}`:''}`;
          meta= `📅 ${new Date(n.payload.scheduledAt).toLocaleString('en-US', {dateStyle: 'short',timeStyle: 'short'})} ${n.payload.time ? '-':''} ${n.payload.time || ''} (${n.payload.timezone}) • ${n.payload.duration} min • ${n.payload.mode} ${n.payload.link || n.payload.location ? '•':''} ${n.payload.link || n.payload.location || ''}`
          if (n.payload?.agenda) {
            message += `. Agenda: ${n.payload.agenda}`;
          }
          break;

        case "meeting_invitation":
          title = "Meeting Invitation";
          message = `${n.payload?.fromName || "Someone"} has invited you to a meeting ${n.payload?.title  ? `:${n.payload?.title}`:''}`;
          meta= `📅 ${new Date(n.payload.scheduledAt).toLocaleString('en-US', {dateStyle: 'short',timeStyle: 'short'})} ${n.payload.time ? '-':''} ${n.payload.time || ''} (${n.payload.timezone}) • ${n.payload.duration} min • ${n.payload.mode} ${n.payload.link || n.payload.location ? '•':''} ${n.payload.link || n.payload.location || ''}`
          if (n.payload?.agenda) {
            message += `. Agenda: ${n.payload.agenda}`;
          }
          break;

        case "meeting_response":
          title = (n.payload?.action=="accept" ? "Meeting Accepted" : "Meeting Declined");
          message = `${n.payload?.fromName || "Someone"} ${n.payload?.action=="accept" ? "accepted" : "declined"} your meeting request${n.payload?.title  ? `: ${n.payload?.title}`:''}`;
          meta= `📅 ${new Date(n.payload.scheduledAt).toLocaleString('en-US', {dateStyle: 'short',timeStyle: 'short'})} ${n.payload.time ? '-':''} ${n.payload.time || ''} (${n.payload.timezone}) • ${n.payload.duration} min • ${n.payload.mode} ${n.payload.link || n.payload.location ? '•':''} ${n.payload.link || n.payload.location || ''}`
        
          if (n.payload?.rejectionReason) {
            message += `. Reason: ${n.payload.rejectionReason}`;
          }
          break;

        case "meeting_participant_response":
          title = n.payload?.action === "accept" ? "Meeting Invitation Accepted" : n.payload?.action === "reject" ? "Meeting Invitation Declined" : "Meeting Invitation Response";
          message = `${n.payload?.participantName || "Someone"} ${n.payload?.action}ed your meeting invitation${n.payload?.title  ? `: ${n.payload?.title}`:''}`;
          meta = `📅 ${new Date(n.payload.scheduledAt).toLocaleString('en-US', {dateStyle: 'short',timeStyle: 'short'})} (${n.payload.timezone}) • ${n.payload.duration} min • ${n.payload.mode} ${n.payload.link || n.payload.location ? '•' : ''} ${n.payload.link || n.payload.location || ''}`;
        
          if (n.payload?.rejectionReason) {
            message += `. Reason: ${n.payload.rejectionReason}`;
          }
          break;

        case "meeting_cancelled":
          title = "Meeting Cancelled";
          message = `${n.user?.name || "Someone"} cancelled the meeting: "${n.payload?.title || "Untitled"}"`;
          break;

        case "message.new":
          title = "New Message";
          message = `${n.payload?.senderName || "Someone"} sent you a message`;
          if (n.payload?.content) {
            message += `: "${n.payload.content.length > 50 ? n.payload.content.substring(0, 50) + '...' : n.payload.content}"`;
          }
          break;

        case "job.application.received":
          title = "New Job Application";
          message = `${n.payload?.applicantName || "Someone"} applied for your job: "${n.payload?.jobTitle || "Untitled"}"`;
          break;

        case "job.application.accepted":
          title = "Job Application Accepted";
          message = `Your application for "${n.payload?.jobTitle || "the job"}" was accepted`;
          break;

        case "job.application.rejected":
          title = "Job Application Rejected";
          message = `Your application for "${n.payload?.jobTitle || "the job"}" was rejected`;
          break;

        case "job.application.reviewed":
          title = "Job Application Reviewed";
          message = `Your application for "${n.payload?.jobTitle || "the job"}" has been reviewed`;
          break;

        case "event.registration.received":
          title = "New Event Registration";
          message = `${n.payload?.registrantName || "Someone"} registered for your event: "${n.payload?.eventTitle || "Untitled"}"`;
          break;

        case "event.registration.confirmed":
          title = "Event Registration Confirmed";
          message = `Your registration for "${n.payload?.eventTitle || "the event"}" has been confirmed`;
          break;

        case "event.registration.cancelled":
          title = "Event Registration Cancelled";
          message = `Your registration for "${n.payload?.eventTitle || "the event"}" has been cancelled`;
          break;

        case "company.staff.accepted":
          title = "Staff Invitation Accepted";
          message = `${n.payload?.staffName || "Someone"} accepted your staff invitation for the role of ${n.payload?.role || "staff"}`;
          break;

        case "company.staff.rejected":
          title = "Staff Invitation Declined";
          message = `${n.payload?.staffName || "Someone"} declined your staff invitation for the role of ${n.payload?.role || "staff"}`;
          break;

        case "company.staff.removed":
          title = "Removed from Company Staff";
          message = `You have been removed from the staff of ${n.payload?.companyName || "the company"}`;
          break;

        case "company.representative.revoked":
          title = "Representative Authorization Revoked";
          message = `Your representative authorization for ${n.payload?.companyName || "the company"} has been revoked`;
          break;

        case "company.representative.invitation":
          title = "Company Representative Invitation";
          message = `${n.payload?.companyName || "A company"} has invited you to be their representative`;
          break;

        case "company.representative.authorized":
          title = "Representative Authorization Confirmed";
          message = `${n.payload?.representativeName || "Someone"} has authorized as your company representative`;
          break;

        case "company.staff.invitation":
          title = "Company Staff Invitation";
          message = `${n.payload?.companyName || "A company"} has invited you to join their staff as ${n.payload?.role || "a staff member"}`;
          break;

        case "company.staff.left":
          title = "Staff Member Left";
          message = `${n.payload?.staffName || "Someone"} has left your organization`;
          break;

        case "organization.join.request":
          title = "New Organization Join Request";
          message = `${n.payload?.userName || "Someone"} wants to join your organization`;
          if (n.payload?.message) {
            message += `. Message: "${n.payload.message}"`;
          }
          break;

        case "organization.join.approved":
          title = "Organization Join Request Approved";
          message = `Your join request for ${n.payload?.organizationName || "the organization"} has been approved`;
          break;

        case "organization.join.rejected":
          title = "Organization Join Request Rejected";
          message = `Your join request for ${n.payload?.organizationName || "the organization"} has been rejected`;
          break;

        default:
          title = n.title || "Notification";
          message = n.message || "You have a new notification";
          break;
      }

      let notificationType = "system";
      if (n.type.startsWith("connection.")) {
        notificationType = "connection";
      } else if (n.type.startsWith("meeting_")) {
        notificationType = "meeting";
      } else if (n.type === "message.new") {
        notificationType = "message";
      } else if (n.type.startsWith("job.application.")) {
        notificationType = "job";
      } else if (n.type.startsWith("event.registration.")) {
        notificationType = "event";
      } else if (n.type.startsWith("company.") || n.type.startsWith("organization.")) {
        notificationType = "invitation";
      }

      const hasActions = n.type === "connection.request" || n.type === "meeting_request" || n.type === "meeting_invitation";

      const handleViewJobApplication = (applicationId) => {
        window.location.href = `/profile?jobApplication=${applicationId}`;
      };

      const handleViewEventRegistration = (registrationId) => {
        window.location.href = `/profile?eventRegistration=${registrationId}`;
      };

      const handleViewCompanyInvitation = (actionLink) => {
        if (actionLink) {
          window.location.href = actionLink;
        }
      };

      const userId = getUserIdFromNotification(n);

      console.log({n})

      return {
        key: `notif-${n.id}`,
        id: n.id,
        type: notificationType,
        title: title,
        payload: n.payload,
        meta,
        tab: notificationType == "connection" ? "Connections" : notificationType == "meeting" ? "Meetings" : notificationType == "message" ? "Messages" : notificationType == "job" ? "Jobs" : notificationType == "event" ? "Events" : notificationType == "invitation" ? "Invitations" : "System",
        desc: message,
        isNotification: true,
        time: timeAgo(n.createdAt),
        read: !!n.readAt,
        readAt: n.readAt,
        hasActions: hasActions,
        userId: userId,
        actions: (
          <div className="mt-2 flex sm:justify-between items-center text-sm gap-x-2">
            <div className="flex gap-2">
              {!n.readAt && (
                <button onClick={() => markNotificationAsRead(n.id)} className={styles.outline}>
                 <span className="max-md:hidden">Mark Read</span>
                 <span className="md:hidden">
                      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M480-480Zm280-160q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q28 0 55.5 4t54.5 12q-11 17-18 36.5T562-788q-20-6-40.5-9t-41.5-3q-134 0-227 93t-93 227q0 134 93 227t227 93q134 0 227-93t93-227q0-21-3-41.5t-9-40.5q20-3 39.5-10t36.5-18q8 27 12 54.5t4 55.5q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-57-216 273-273q-20-7-37.5-17.5T625-611L424-410 310-522l-56 56 169 170Z"/></svg>
                 </span> 
                </button>
              )}
              <button onClick={() => deleteNotification(n.id)} className={styles.danger}>
                <span className="max-md:hidden">Delete</span>
                <span className="md:hidden">
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#fff"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
                </span>
              </button>
            </div>
            <div className="flex gap-2">
              <ProfileButton userId={userId} />
              
              {n.type.startsWith("job.application.") && n.payload?.applicationId && (
                <button
                  onClick={() => handleViewJobApplication(n.payload.applicationId)}
                  className={styles.primary}
                >
                  View
                </button>
              )}
              {n.type.startsWith("event.registration.") && n.payload?.registrationId && (
                <button
                  onClick={() => handleViewEventRegistration(n.payload.registrationId)}
                  className={styles.primary}
                >
                  View
                </button>
              )}
              {n.type.startsWith("company.") && n.payload?.actionLink && (
                <button
                  onClick={() => handleViewCompanyInvitation(n.payload.actionLink)}
                  className={styles.primary}
                >
                  View
                </button>
              )}
              {n.type.startsWith("organization.") && n.payload?.actionLink && (
                <button
                  onClick={() => handleViewCompanyInvitation(n.payload.actionLink)}
                  className={styles.primary}
                >
                  View
                </button>
              )}
              {n.type === "message.new" && n.payload?.senderId && (
                <button
                  onClick={() => window.location.href = `/messages?userId=${n.payload.senderId}`}
                  className={styles.primary}
                >
                  View
                </button>
              )}
              {n.type === "meeting_invitation" && !n.readAt && (
                <div className="flex gap-2">
                  <button onClick={() => handleParticipantRespond(n.payload.item_id, "accept")} className={styles.primary}>
                    Accept
                  </button>
                  <button onClick={() => {
                    const reason = window.prompt("Reason for rejection (optional):");
                    handleParticipantRespond(n.payload.item_id, "reject", reason || "");
                  }} className={styles.outline}>
                    Decline
                  </button>
                </div>
              )}
            </div>
          </div>
        ),
      };
    });

    const allItemsUnsorted = [...connectionItems, ...meetingItems, ...notificationItems];
    return allItemsUnsorted;
  }, [incoming, outgoing, meetingRequests, notifications, user?.id]);

  const filteredItems = useMemo(() => {
    if (filter === "All") return allItems;

    const typeMap = {
      "Connections": "connection",
      "Meetings": "meeting",
      "Messages": "message",
      "Jobs": "job",
      "Events": "event",
      "Invitations": "invitation",
      "System": "system"
    };

    const filtered = allItems.filter(item => item.type === typeMap[filter]);

    console.log(`Filter: ${filter}, Type: ${typeMap[filter]}, Items found:`, filtered.length, filtered.map(i => ({ type: i.type, title: i.title })));

    return filtered;
  }, [allItems, filter]);

  console.log({allItems})

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-gray-500">Stay updated with your network activities</p>  
          </div>

          <button onClick={markAllAsRead} className={styles.primary}>
            Mark All Read
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {["All", "Connections", "Meetings", "Messages", "Jobs", "Events", "Invitations", "System"].map((tab) => {
              const isActive = filter === tab;
              let badgeCount = 0;

              if (tab === "Connections") badgeCount = connBadge;
              else if (tab === "Meetings") badgeCount = meetBadge;
              else if (tab === "Messages") badgeCount = messageBadge;
              else if (tab === "Jobs") badgeCount = jobBadge;
              else if (tab === "Events") badgeCount = eventBadge;
              else if (tab === "Invitations") badgeCount = invitationBadge;
              else if (tab === "System") badgeCount = systemBadge;
              else if (tab === "All") badgeCount = connBadge + meetBadge + messageBadge + jobBadge + eventBadge + invitationBadge + systemBadge;

              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`relative px-4 py-1.5 rounded-full text-sm font-medium ${
                    isActive ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>{tab}</span>
                  {badgeCount > 0 && (
                    <span className={`ml-2 inline-grid place-items-center rounded-full text-[10px] font-semibold px-1.5 h-4 min-w-4 ${
                      isActive ? "bg-white text-brand-600" : "bg-red-500 text-white"
                    }`}>
                      {badgeCount > 9 ? "9+" : badgeCount}
                    </span>
                  )}
                  
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {loadingConn || loadingMeetings || loadingNotifications ? (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-center">
              <div className="animate-pulse">
                {filter === "Connections" ? "Loading connection requests..." : `Loading ${filter.toLowerCase()} notifications...`}
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                 {filteredItems.length === 0 ? (
                    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-center text-gray-500">
                      {filter === "All" ? "No notifications yet" : filter === "Connections" ? "No connection requests yet" : filter === "Meetings" ? "No meeting requests yet" : `No ${filter.toLowerCase()} notifications yet`}
                    </div>
                  ) : (
                    filteredItems.filter(i=>!i.hasApproval).map((item) => {
                        const connectedNot = filteredItems.filter(i=>i.id==item?.payload?.item_id && i.hasApproval)?.[0]
                        let connectedNotActions = connectedNot?.actions
                        let connectedNotMessage = connectedNot?.desc
                        let connectedNotMeta = connectedNot?.meta
                        item.meta = connectedNotMeta || item.meta

                        return (
                           <div key={item.key} className={`rounded-2xl  ${item?.hasApproval  ? 'bg-gray-100':'bg-white'} border shadow-sm p-4 flex justify-between ${
                              item.readAt && !connectedNot  ? "border-gray-100 opacity-75" : "border-brand-200 bg-brand-50"
                            }`}>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{item.title}</h3>
                                  {(!item.readAt &&  !item.hasApproval) && (
                                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{connectedNotMessage || item.desc}</p>
                                {item.meta && <p className="text-xs text-gray-500 mt-1">{item.meta}</p>}
                                <div className="flex md:items-center max-sm:flex-col justify-between gap-x-5 gap-y-1">
                                   <div className="flex-1">
                                     {item.actions}
                                   </div>
                                   {connectedNotActions}
                                </div>
                              </div>
                              <div className="text-xs text-gray-400 whitespace-nowrap ml-4">
                                {item.time}
                              </div>
                            </div>
                        )
                    })
                  )}
                </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}