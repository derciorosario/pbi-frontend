// src/pages/NotificationsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import client from "../api/client";
import { toast } from "../lib/toast";
import { useAuth } from "../contexts/AuthContext";

const styles = {
  primary:
    "rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600/30",
  outline:
    "rounded-lg px-3 py-1.5 text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
};

function timeAgo(d) {
  const ts =
    typeof d === "string"
      ? new Date(d).getTime()
      : d?.getTime?.() ?? Date.now();
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

  const [loadingConn, setLoadingConn] = useState(false);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [errorConn, setErrorConn] = useState("");

  // Notifications state
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [errorNotifications, setErrorNotifications] = useState("");
  
  // Meeting requests state
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [meetingRequests, setMeetingRequests] = useState([]);
  const [errorMeetings, setErrorMeetings] = useState("");

  async function loadConnections() {
    setLoadingConn(true);
    setErrorConn("");
    try {
      const { data } = await client.get("/connections/requests");
      setIncoming(data.incoming || []);
      setOutgoing(data.outgoing || []);
    } catch (e) {
      setErrorConn(
        e?.response?.data?.message || "Failed to load connection requests"
      );
    } finally {
      setLoadingConn(false);
    }
  }

  async function loadNotifications() {
    setLoadingNotifications(true);
    setErrorNotifications("");
    try {
      const { data } = await client.get("/notifications");
      setNotifications(data || []);
    } catch (e) {
      setErrorNotifications(
        e?.response?.data?.message || "Failed to load notifications"
      );
    } finally {
      setLoadingNotifications(false);
    }
  }
  
  async function loadMeetingRequests() {
    setLoadingMeetings(true);
    setErrorMeetings("");
    try {
      const { data } = await client.get("/meeting-requests");
      setMeetingRequests([...(data.received || []), ...(data.sent || [])]);
    } catch (e) {
      setErrorMeetings(
        e?.response?.data?.message || "Failed to load meeting requests"
      );
    } finally {
      setLoadingMeetings(false);
    }
  }

  useEffect(() => {
    loadConnections();
    loadNotifications();
    loadMeetingRequests();
  }, []);

  async function handleRespond(id, action) {
    try {
      // Show loading toast
      const toastId = toast.loading(`${action === 'accept' ? 'Accepting' : 'Declining'} connection request...`);
      
      // Send the request to the server
      await client.post(`/connections/requests/${id}/respond`, { action });
      
      // Update the toast with success message
      toast.success(
        `Connection request ${action === 'accept' ? 'accepted' : 'declined'} successfully`,
        { id: toastId }
      );
      
      // Reload connections
      await loadConnections();
    } catch (e) {
      // Show error toast
      toast.error(e?.response?.data?.message || "Failed to update connection request");
      console.error("Error responding to connection request:", e);
    }
  }

  async function handleMeetingRespond(id, action, rejectionReason = "") {
    try {
      // Show loading toast
      const toastId = toast.loading(`${action === 'accept' ? 'Accepting' : 'Declining'} meeting request...`);
      
      // Send the request to the server
      await client.post(`/meeting-requests/${id}/respond`, { action, rejectionReason });
      
      // Update the toast with success message
      toast.success(
        `Meeting request ${action === 'accept' ? 'accepted' : 'declined'} successfully`,
        { id: toastId }
      );
      
      // Remove the notification from the list
      setNotifications(prev => prev.filter(n =>
        !(n.type === "meeting_request" && n.data?.meetingRequestId === id)
      ));
      
      // Reload all data
      await Promise.all([
        loadNotifications(),
        loadMeetingRequests()
      ]);
    } catch (e) {
      // Show error toast
      toast.error(e?.response?.data?.message || "Failed to update meeting request");
      console.error("Error responding to meeting request:", e);
    }
  }

  async function markAllAsRead() {
    try {
      // Show loading toast
      const toastId = toast.loading("Marking all notifications as read...");
      
      // Send the request to the server
      await client.post("/notifications/mark-all-read");
      
      // Update the toast with success message
      toast.success("All notifications marked as read", { id: toastId });
      
      // Reload notifications
      await loadNotifications();
    } catch (e) {
      // Show error toast
      toast.error(e?.response?.data?.message || "Failed to mark notifications as read");
      console.error("Error marking notifications as read:", e);
    }
  }

  const allItems = useMemo(() => {
    const connectionItems = [
      ...incoming.map((r) => ({
        key: `in-${r.id}`,
        title: "New Connection Request",
        desc:
          `${r.fromName || "Someone"} wants to connect with you.` +
          (r.reason ? ` Reason: ${r.reason}.` : "") +
          (r.message ? ` Message: "${r.message}"` : ""),
        time: timeAgo(r.createdAt),
        actions: (
          <div className="mt-2 flex gap-2 text-sm">
            <button
              onClick={() => handleRespond(r.id, "accept")}
              className={styles.primary}
            >
              Accept
            </button>
            <button
              onClick={() => handleRespond(r.id, "reject")}
              className={styles.outline}
            >
              Decline
            </button>
          </div>
        ),
      })),
      ...outgoing.map((r) => ({
        key: `out-${r.id}`,
        title: "Connection Request Sent",
        desc:
          `Waiting for approval from ${r.toName || "user"}.` +
          (r.reason ? ` Reason: ${r.reason}.` : "") +
          (r.message ? ` Message: "${r.message}"` : ""),
        time: timeAgo(r.createdAt),
        actions: <div className="mt-2 text-xs text-gray-500">Pending</div>,
      })),
    ];

    const notificationItems = notifications.map((n) => {
      let actions = null;
      let customDesc = n.message;
      
      // Handle meeting request notifications
      if (n.type === "meeting_request" && n.data?.meetingRequestId) {
        // Check if this is a meeting request sent by the current user
        const isSentByCurrentUser = n.data.fromUserId === user?.id;
        
        if (isSentByCurrentUser) {
          // Custom message for meeting requests sent by the current user
          customDesc = `You requested a meeting with ${n.data.toName || "someone"}: "${n.data.title}"`;
          // No actions for sent requests
        } else {
          // This is a meeting request received by the current user
          customDesc = `${n.data.fromName || "Someone"} wants to schedule a meeting with you: "${n.data.title}"`;
          // Show accept/decline actions
          actions = (
            <div className="mt-2 flex gap-2 text-sm">
              <button
                onClick={() => handleMeetingRespond(n.data.meetingRequestId, "accept")}
                className={styles.primary}
              >
                Accept
              </button>
              <button
                onClick={() => handleMeetingRespond(n.data.meetingRequestId, "reject")}
                className={styles.outline}
              >
                Decline
              </button>
            </div>
          );
        }
      }

      return {
        key: `notification-${n.id}`,
        title: n.title,
        desc: customDesc,
        time: timeAgo(n.createdAt),
        actions,
      };
    });

    return [...connectionItems, ...notificationItems];
  }, [incoming, outgoing, notifications]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-gray-500">
          Stay updated with your network activities
        </p>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-2">
            {["All", "Connections", "Meetings", "Jobs", "Events", "Messages", "System"].map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    filter === t
                      ? "bg-brand-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t}
                </button>
              )
            )}
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm">
              ⚙ Settings
            </button>
            <button
              onClick={markAllAsRead}
              className={styles.primary}
            >
              Mark All Read
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {(filter === "All" || filter === "Connections" || filter === "Meetings") && (
            <div className="space-y-6">
              {filter === "Connections" && (
                <>
                  <section>
                    <h2 className="text-lg font-semibold mb-3">
                      Incoming Requests
                    </h2>
                    {loadingConn && (
                      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 text-sm text-gray-600">
                        Loading…
                      </div>
                    )}
                    {errorConn && (
                      <div className="rounded-2xl bg-white border border-red-200 bg-red-50 shadow-sm p-4 text-sm text-red-700">
                        {errorConn}
                      </div>
                    )}
                    {!loadingConn && !incoming.length && (
                      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-sm text-gray-600">
                        No incoming requests.
                      </div>
                    )}
                    {incoming.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 flex justify-between"
                      >
                        <div>
                          <h3 className="font-semibold">
                            New Connection Request
                          </h3>
                          <p className="text-sm text-gray-600">
                            {r.fromName || "Someone"} wants to connect with you.
                            {r.reason ? (
                              <span>
                                {" "}
                                Reason:{" "}
                                <span className="font-medium">{r.reason}</span>.
                              </span>
                            ) : null}
                            {r.message ? (
                              <span> Message: “{r.message}”</span>
                            ) : null}
                          </p>
                          <div className="mt-2 flex gap-2 text-sm">
                            <button
                              onClick={() => handleRespond(r.id, "accept")}
                              className={styles.primary}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRespond(r.id, "reject")}
                              className={styles.outline}
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {timeAgo(r.createdAt)}
                        </div>
                      </div>
                    ))}
                  </section>

                  <section>
                    <h2 className="text-lg font-semibold mb-3">
                      Sent Requests
                    </h2>
                    {loadingConn && (
                      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 text-sm text-gray-600">
                        Loading…
                      </div>
                    )}
                    {!loadingConn && !outgoing.length && (
                      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-sm text-gray-600">
                        You haven’t sent any connection requests.
                      </div>
                    )}
                    {outgoing.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 flex justify-between"
                      >
                        <div>
                          <h3 className="font-semibold">
                            Connection Request Sent
                          </h3>
                          <p className="text-sm text-gray-600">
                            Waiting for approval from {r.toName || "user"}.
                            {r.reason ? (
                              <span>
                                {" "}
                                Reason:{" "}
                                <span className="font-medium">{r.reason}</span>.
                              </span>
                            ) : null}
                            {r.message ? (
                              <span> Message: “{r.message}”</span>
                            ) : null}
                          </p>
                          <div className="mt-2 text-xs text-gray-500">
                            Pending
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {timeAgo(r.createdAt)}
                        </div>
                      </div>
                    ))}
                  </section>
                </>
              )}

              {filter === "Meetings" && (
                <section>
                  <h2 className="text-lg font-semibold mb-3">
                    Meeting Requests
                  </h2>
                  {loadingMeetings && (
                    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 text-sm text-gray-600">
                      Loading…
                    </div>
                  )}
                  {errorMeetings && (
                    <div className="rounded-2xl bg-white border border-red-200 bg-red-50 shadow-sm p-4 text-sm text-red-700">
                      {errorMeetings}
                    </div>
                  )}
                  {!loadingMeetings && !meetingRequests.filter(m => m.status === "pending").length && (
                    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-sm text-gray-600">
                      No pending meeting requests.
                    </div>
                  )}
                  {meetingRequests.filter(m => m.status === "pending").map((m) => (
                    <div
                      key={m.id}
                      className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 flex justify-between"
                    >
                      <div>
                        <h3 className="font-semibold">
                          New Meeting Request
                        </h3>
                        <p className="text-sm text-gray-600">
                          {m.requester?.name || "Someone"} wants to schedule a meeting: "{m.title}"
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          📅 {new Date(m.scheduledAt).toLocaleDateString()} at {new Date(m.scheduledAt).toLocaleTimeString()}
                          • {m.duration} minutes • {m.mode === "video" ? "Video call" : "In person"}
                        </p>
                        {m.agenda && (
                          <p className="text-xs text-gray-500 mt-1">
                            📝 {m.agenda}
                          </p>
                        )}
                        <div className="mt-2 flex gap-2 text-sm">
                          <button
                            onClick={() => handleMeetingRespond(m.id, "accept")}
                            className={styles.primary}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleMeetingRespond(m.id, "reject")}
                            className={styles.outline}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {timeAgo(m.createdAt)}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {filter === "All" && (
                <section>
                  {!allItems.length && (
                    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-sm text-gray-600">
                      No notifications yet.
                    </div>
                  )}
                  {allItems.map((n) => (
                    <div
                      key={n.key}
                      className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 flex justify-between"
                    >
                      <div>
                        <h3 className="font-semibold">{n.title}</h3>
                        <p className="text-sm text-gray-600">{n.desc}</p>
                        {n.actions}
                      </div>
                      <div className="text-xs text-gray-400">{n.time}</div>
                    </div>
                  ))}
                </section>
              )}
            </div>
          )}

          {filter === "Jobs" && (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-sm text-gray-600">
              No job notifications.
            </div>
          )}

          {filter === "Events" && (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-sm text-gray-600">
              No event notifications.
            </div>
          )}

          {filter === "Messages" && (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-sm text-gray-600">
              No message notifications.
            </div>
          )}

          {filter === "System" && (
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-sm text-gray-600">
              No system notifications.
            </div>
          )}
        </div>

        <button
          className={`mt-6 mx-auto block ${styles.outline}`}
          onClick={() => {
            loadConnections();
            loadNotifications();
            loadMeetingRequests();
          }}
        >
          Refresh
        </button>
      </main>
    </div>
  );
}
