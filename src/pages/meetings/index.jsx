import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import client from "../../api/client";
import { CalendarDays, Clock, Video, MapPin, ExternalLink } from "lucide-react";
import DefaultLayout from "../../layout/DefaultLayout";

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

function isJoinWindow(scheduledAt, duration) {
  const now = Date.now();
  const start = new Date(scheduledAt).getTime();
  const joinOpen = start - 10 * 60 * 1000; // 10 minutes before
  const end = start + (Number(duration) || 30) * 60 * 1000;
  return now >= joinOpen && now <= end;
}

function getMeetingStatus(scheduledAt, duration) {
  const now = Date.now();
  const start = new Date(scheduledAt).getTime();
  const end = start + (Number(duration) || 30) * 60 * 1000;
  
  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "ongoing";
}

export default function MeetingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [error, setError] = useState("");

  async function loadMeetings() {
    setLoading(true);
    setError("");
    try {
      const { data } = await client.get("/meeting-requests/upcoming");
      setMeetings(data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load meetings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMeetings();
  }, []);

  const upcomingMeetings = meetings.filter(m => getMeetingStatus(m.scheduledAt, m.duration) === "upcoming");
  const ongoingMeetings = meetings.filter(m => getMeetingStatus(m.scheduledAt, m.duration) === "ongoing");
  const pastMeetings = meetings.filter(m => getMeetingStatus(m.scheduledAt, m.duration) === "ended");

  function renderMeeting(meeting) {
    const status = getMeetingStatus(meeting.scheduledAt, meeting.duration);
    const canJoin = meeting.mode === "video" && isJoinWindow(meeting.scheduledAt, meeting.duration);
    const otherUser = meeting.requester?.id === meeting.fromUserId ? meeting.recipient : meeting.requester;

    return (
      <div key={meeting.id} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{meeting.title}</h3>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  status === "upcoming"
                    ? "bg-blue-50 text-blue-700"
                    : status === "ongoing"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {status === "upcoming" ? "Upcoming" : status === "ongoing" ? "Ongoing" : "Ended"}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              Meeting with <span className="font-medium">{otherUser?.name || "User"}</span>
            </p>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-brand-600" />
                <span>
                  {new Date(meeting.scheduledAt).toLocaleDateString()} at{" "}
                  {new Date(meeting.scheduledAt).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-brand-600" />
                <span>{meeting.duration} minutes • {meeting.timezone}</span>
              </div>

              <div className="flex items-center gap-2">
                {meeting.mode === "video" ? (
                  <>
                    <Video size={16} className="text-brand-600" />
                    <span>Video call</span>
                  </>
                ) : (
                  <>
                    <MapPin size={16} className="text-brand-600" />
                    <span>In person</span>
                  </>
                )}
              </div>

              {meeting.agenda && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700 mb-1">Agenda:</p>
                  <p className="text-sm text-gray-600">{meeting.agenda}</p>
                </div>
              )}
            </div>
          </div>

          <div className="ml-4 flex flex-col gap-2">
            {meeting.mode === "video" && meeting.link && (
              <a
                href={meeting.link}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                  canJoin
                    ? "bg-brand-500 text-white hover:bg-brand-600"
                    : "bg-gray-100 text-gray-500 cursor-not-allowed"
                }`}
                onClick={(e) => {
                  if (!canJoin) e.preventDefault();
                }}
                title={
                  canJoin
                    ? "Join meeting"
                    : status === "upcoming"
                    ? "Join opens 10 minutes before start"
                    : "Meeting has ended"
                }
              >
                <Video size={16} />
                {canJoin ? "Join Now" : "Join"}
              </a>
            )}

            {meeting.mode === "in_person" && meeting.location && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meeting.location)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-brand-50 text-brand-700 hover:bg-brand-100"
              >
                <ExternalLink size={16} />
                View Location
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <DefaultLayout>
      <Header />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Meetings</h1>
            <p className="text-sm text-gray-500">
              Manage your scheduled meetings and join calls
            </p>
          </div>
          <button
            onClick={loadMeetings}
            className="rounded-lg px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 text-sm text-gray-600">
            Loading meetings…
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-white border border-red-200 bg-red-50 shadow-sm p-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-8">
            {/* Ongoing Meetings */}
            {ongoingMeetings.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 text-green-700">
                  🔴 Ongoing Meetings
                </h2>
                <div className="space-y-4">
                  {ongoingMeetings.map(renderMeeting)}
                </div>
              </section>
            )}

            {/* Upcoming Meetings */}
            {upcomingMeetings.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4">
                  📅 Upcoming Meetings
                </h2>
                <div className="space-y-4">
                  {upcomingMeetings.map(renderMeeting)}
                </div>
              </section>
            )}

            {/* Past Meetings */}
            {pastMeetings.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 text-gray-600">
                  📋 Past Meetings
                </h2>
                <div className="space-y-4">
                  {pastMeetings.slice(0, 10).map(renderMeeting)}
                </div>
              </section>
            )}

            {/* Empty state */}
            {meetings.length === 0 && !loading && (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8 text-center">
                <CalendarDays size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings yet</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Start connecting with people and schedule meetings to collaborate
                </p>
                <button
                  onClick={() => navigate("/people")}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600"
                >
                  Explore People
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </DefaultLayout>
  );
}