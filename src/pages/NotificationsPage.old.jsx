// src/pages/NotificationsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import client from "../api/client";
import { toast } from "../lib/toast";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";

const styles = {
  primary: "rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600/30",
  outline: "rounded-lg px-3 py-1.5 text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
  danger: "rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700"
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


export default function NotificationsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("All");
  const { socket, connected } = useSocket();

  // State for different data types
  const [loadingConn, setLoadingConn] = useState(false);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [errorConn, setErrorConn] = useState("");

  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]); // Keep all notifications for badge counts
  const [errorNotifications, setErrorNotifications] = useState("");

  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [meetingRequests, setMeetingRequests] = useState([]);
  const [errorMeetings, setErrorMeetings] = useState("");

  // Live badge counts
  const [badgeCounts, setBadgeCounts] = useState({
    connectionsPending: 0,
    meetingsPending: 0,
    messagesPending: 0,
    jobApplicationsPending: 0,
    eventRegistrationsPending: 0,
    notificationsUnread: 0
  });

  // Socket event handlers for real-time updates
  useEffect(() => {
    if (!connected || !socket || !user?.id) return;

    // Handle new notifications in real-time
    const handleNewNotification = (data) => {
      setNotifications(prev => [data.notification, ...prev]);
      setAllNotifications(prev => [data.notification, ...prev]);
    };

    // Handle badge count updates
    const handleBadgeCounts = (counts) => {
      setBadgeCounts(prev => ({
        ...prev,
        ...counts
      }));
    };

    socket.on("new_notification", handleNewNotification);
    socket.on("header_badge_counts", handleBadgeCounts);

    // Subscribe to notifications
    socket.emit("subscribe_to_notifications");

    // Fetch initial counts
    socket.emit("get_header_badge_counts", (counts) => {
      if (counts) setBadgeCounts(prev => ({ ...prev, ...counts }));
    });

    return () => {
      socket.off("new_notification", handleNewNotification);
      socket.off("header_badge_counts", handleBadgeCounts);
    };

  }, [connected, socket, user?.id]);

  // Mark header badges as seen when page loads
  useEffect(() => {
    if (connected && socket) {
      socket.emit("mark_header_badge_seen", { type: "all" });
    }
  }, [connected, socket]);

  // Load data functions
  const loadConnections = async () => {

    setLoadingConn(true);
    setErrorConn("");

    try {
      if (connected && socket) {
        // Use socket for real-time data
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
        // Fallback to HTTP API
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
        // Use socket for real-time data

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
        // Fallback to HTTP API
        const { data } = await client.get("/notifications");
        setNotifications(data || []);
        setLoadingNotifications(false);
      }
    } catch (e) {
      setErrorNotifications(e?.response?.data?.message || "Failed to load notifications");
      setLoadingNotifications(false);
    }
  };

  // Load all notifications for badge counts when component mounts or socket connects
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
        // Use socket for real-time data
        socket.emit("qa_fetch_upcoming_meetings", (response) => {
          if (response?.ok) {
            // Filter to get pending meeting requests
            const pendingMeetings = response.data.filter(m => m.status === "pending");
            setMeetingRequests(pendingMeetings);
          } else {
            setErrorMeetings(response?.error || "Failed to load meeting requests");
          }
          setLoadingMeetings(false);
        });
      } else {
        // Fallback to HTTP API
        const { data } = await client.get("/meeting-requests");
        setMeetingRequests([...(data.received || []), ...(data.sent || [])]);
        setLoadingMeetings(false);
      }
    } catch (e) {
      setErrorMeetings(e?.response?.data?.message || "Failed to load meeting requests");
      setLoadingMeetings(false);
    }
  };

  // Load data on component mount and filter change
  useEffect(() => {
    loadConnections();
    loadMeetingRequests();
    loadNotifications(); // Load notifications for all tabs since they're now categorized by type
  }, [filter, connected, socket]);

  // Load all notifications for badge counts when component mounts or socket connects
  useEffect(() => {
    if (connected && socket) {
      loadAllNotificationsForBadges();
    }
  }, [connected, socket]);

  // Socket-based action handlers
  const handleRespond = async (id, action) => {
    try {
      const toastId = toast.loading(`${action === 'accept' ? 'Accepting' : 'Declining'} connection request...`);
      
      const relatedNotification = notifications.find(n => 
         n.type === "connection.request" && n.payload?.item_id === id
      );

      if (connected && socket && 0==1) {

        if (relatedNotification) {
            markNotificationAsRead(relatedNotification.id);
        }

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
      toast.error(e?.response?.data?.message || "Failed to update connection request");
    }
  };

  const handleMeetingRespond = async (id, action, rejectionReason = "") => {
    try {
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
      
      toast.success(`Meeting request ${action === 'accept' ? 'accepted' : 'declined'} successfully`, { id: toastId });
      
      // Reload data
      await Promise.all([
        loadMeetingRequests(),
        loadNotifications()
      ]);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update meeting request");
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      if (connected && socket) {
        socket.emit("qa_mark_notification_read", { notificationId }, (response) => {
          if (response?.ok) {
            // Update local state
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
            // Update badge counts
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
        // Update badge counts
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
      toast.error(e?.response?.data?.message || "Failed to delete notification");
    }
  };

  // Badge calculations
  const connBadge = badgeCounts.connectionsPending ?? incoming.length;
  const meetBadge = badgeCounts.meetingsPending ?? meetingRequests.filter(m =>
    m.status === "pending" && m.requester?.id !== user?.id
  ).length;
  const messageBadge = badgeCounts.messagesPending ?? allNotifications.filter(n => !n.readAt && n.type === "message.new").length;
  const jobBadge = badgeCounts.jobApplicationsPending ?? allNotifications.filter(n => !n.readAt && n.type.startsWith("job.application.")).length;
  const eventBadge = badgeCounts.eventRegistrationsPending ?? allNotifications.filter(n => !n.readAt && n.type.startsWith("event.registration.")).length;
  const invitationBadge = allNotifications.filter(n => !n.readAt && (n.type.startsWith("company.") || n.type.startsWith("organization."))).length;
  const systemBadge = badgeCounts.notificationsUnread ?? allNotifications.filter(n => !n.readAt && n.type === "system").length;


  // Combined items for "All" tab
  const allItems = useMemo(() => {
    const connectionItems = [
      ...incoming.map((r) => ({
        key: `conn-in-${r.id}`,
        id:r.id,
        type: "connection",
        tab:"Connections",
        hasApproval:true,
        title: "New Connection Request",
        desc: `${r.fromName || "Someone"} wants to connect with you.${r.reason ? ` Reason: ${r.reason}.` : ""}${r.message ? ` Message: "${r.message}"` : ""}`,
        time: timeAgo(r.createdAt),
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
      /*...outgoing.map((r) => ({
        key: `conn-out-${r.id}`,
        type: "connection",
        id:r.id,
        tab:"Connections",
        title: "Connection Request Sent",
        desc: `Waiting for approval from ${r.toName || "user"}.${r.reason ? ` Reason: ${r.reason}.` : ""}${r.message ? ` Message: "${r.message}"` : ""}`,
        time: timeAgo(r.createdAt),
        actions: <div className="mt-2 text-xs text-gray-500">Pending</div>,
      }))*/
    ];

    const meetingItems = meetingRequests
      .filter(m => m.status === "pending" && m.requester?.id !== user?.id)
      .map((m) => ({
        key: `meeting-${m.id}`,
        type: "meeting",
        id:m.id,
        title: "New Meeting Request",
        tab:"Meetings",
        hasApproval:true,
        desc: `${m.requester?.name || "Someone"} wants to schedule a meeting: "${m.title}"`,
        time: timeAgo(m.createdAt),
        meta: `📅 ${new Date(m.scheduledAt).toLocaleString('en-US', {dateStyle: 'short',timeStyle: 'short'})} ${m.time ? '-':''} ${m.time || ''} (${m.timezone}) • ${m.duration} min • ${m.mode} ${m.link || m.location ? '•':''} ${m.link || m.location || ''}`,
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
  // Generate title and message based on notification type and related user
    let title = "";
    let message = "";
    let meta = ""

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

    case "meeting_response":
      title = (n.payload?.action=="accept" ? "Meeting Accepted" : "Meeting Declined");
      message = `${n.payload?.fromName || "Someone"} ${n.payload?.action=="accept" ? "accepted" : "declined"} your meeting request${n.payload?.title  ? `: ${n.payload?.title}`:''}`;
      meta= `📅 ${new Date(n.payload.scheduledAt).toLocaleString('en-US', {dateStyle: 'short',timeStyle: 'short'})} ${n.payload.time ? '-':''} ${n.payload.time || ''} (${n.payload.timezone}) • ${n.payload.duration} min • ${n.payload.mode} ${n.payload.link || n.payload.location ? '•':''} ${n.payload.link || n.payload.location || ''}`
    
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
      // Fallback to stored title/message if available
      title = n.title || "Notification";
      message = n.message || "You have a new notification";
      break;
  }


  // Determine notification type for proper tab categorization
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

  // Check if this notification has actionable buttons (accept/reject)
  const hasActions = n.type === "connection.request" || n.type === "meeting_request";

  // Handle navigation for job application notifications
  const handleViewJobApplication = (applicationId) => {
    window.location.href = `/profile?jobApplication=${applicationId}`;
  };

  // Handle navigation for event registration notifications
  const handleViewEventRegistration = (registrationId) => {
    window.location.href = `/profile?eventRegistration=${registrationId}`;
  };

  // Handle navigation for company invitation notifications
  const handleViewCompanyInvitation = (actionLink) => {
    if (actionLink) {
      window.location.href = actionLink;
    }
  };


  const connectedNot=[...connectionItems,...meetingItems].filter(i=>i.id==n?.payload?.item_id)?.[0]

                       
  return {
    key: `notif-${n.id}`,
    id:n.id,
    type: notificationType,
    title: title,
    payload:n.payload,
    meta,
    tab:notificationType=="connection" ? "Connections":notificationType=="meeting" ? "Meetings":notificationType=="message" ? "Messages":notificationType=="job" ? "Jobs":notificationType=="event" ? "Events":notificationType=="invitation" ? "Invitations":"System",
    desc: message,
    isNotification:true,
    time: timeAgo(n.createdAt),
    read: !!n.readAt,
    readAt: n.readAt,
    hasActions: hasActions,
    actions: (
      <div className="mt-2 flex justify-between items-center text-sm">
        <div className="flex gap-2">
          {!n.readAt && (
            <button onClick={() => markNotificationAsRead(n.id)} className={styles.outline}>
              Mark Read
            </button>
          )}
          <button title="Respond to delete"  onClick={() => {
            if(!connectedNot)  deleteNotification(n.id)
          }} className={`${styles.danger} ${connectedNot ? 'opacity-50 cursor-not-allowed':''} `}>
            Delete
          </button>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>
    ),
  };
});

    // Sort all items so actionable notifications (with accept/reject buttons) come first
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

  // Debug logging
  console.log(`Filter: ${filter}, Type: ${typeMap[filter]}, Items found:`, filtered.length, filtered.map(i => ({ type: i.type, title: i.title })));

  return filtered;
}, [allItems, filter]);



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

        {/* Filter Tabs */}
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

        {/* Content */}
        <div className="mt-6 space-y-6">
          {loadingConn || loadingMeetings || loadingNotifications ? (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-center">
              <div className="animate-pulse">Loading notifications...</div>
            </div>
          ) : (
            <>
              {/* All Tab */}
             
                <div className="space-y-4">
                 {filteredItems.length === 0 ? (
                    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-center text-gray-500">
                      No {filter.toLowerCase()} notifications yet
                    </div>
                  ) : (
                    filteredItems.filter(i=>!i.hasApproval).map((item) => {

             
                        const connectedNot=filteredItems.filter(i=>i.id==item?.payload?.item_id && i.hasApproval)?.[0]
                        let connectedNotActions=connectedNot?.actions
                        let connectedNotMessage=connectedNot?.desc
                        let connectedNotMeta=connectedNot?.meta
                        item.meta=connectedNotMeta || item.meta

                  
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
                                <div className="flex items-center justify-between gap-x-5 gap-y-1">
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