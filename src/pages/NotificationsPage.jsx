// src/pages/NotificationsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import client from "../api/client";

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
  const [filter, setFilter] = useState("All");

  const [loadingConn, setLoadingConn] = useState(false);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [errorConn, setErrorConn] = useState("");

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

  useEffect(() => {
    loadConnections();
  }, []);

  async function handleRespond(id, action) {
    try {
      await client.post(`/connections/requests/${id}/respond`, { action });
      await loadConnections();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update request");
    }
  }

  const allItems = useMemo(() => {
    return [
      ...incoming.map((r) => ({
        key: `in-${r.id}`,
        title: "New Connection Request",
        desc:
          `${r.fromName || "Someone"} wants to connect with you.` +
          (r.reason ? ` Reason: ${r.reason}.` : "") +
          (r.message ? ` Message: “${r.message}”` : ""),
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
          (r.message ? ` Message: “${r.message}”` : ""),
        time: timeAgo(r.createdAt),
        actions: <div className="mt-2 text-xs text-gray-500">Pending</div>,
      })),
    ];
  }, [incoming, outgoing]);

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
            {["All", "Connections", "Jobs", "Events", "Messages", "System"].map(
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
            <button className={styles.primary}>Mark All Read</button>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          {(filter === "All" || filter === "Connections") && (
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
          onClick={loadConnections}
        >
          Refresh
        </button>
      </main>
    </div>
  );
}
