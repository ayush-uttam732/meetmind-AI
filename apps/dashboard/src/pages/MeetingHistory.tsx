import { useMemo, useState } from "react";
import { Check, Clock, Search, Users } from "lucide-react";
import { useMeetings } from "../hooks/useMeetings";
import type { MeetingStatus } from "../types/meeting";
import { formatMeetingDate, meetingSearchText } from "../utils/meetingFormat";
import { openMeeting } from "../utils/Navigation";
import "../styles/dashboard.css";
import "../styles/meetings.css";

type Filter = "All" | MeetingStatus;
const FILTERS: Filter[] = ["All", "Completed", "Processing"];

export default function MeetingHistory() {
  const { data: meetings, loading, error } = useMeetings();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return meetings.filter(
      (m) =>
        (filter === "All" || m.status === filter) &&
        (!q || meetingSearchText(m).includes(q))
    );
  }, [meetings, query, filter]);

  return (
    <main className="mm-page">
      <header className="mm-page-head">
        <div>
          <h2>Meeting History</h2>
          <p>
            {loading
              ? "Loading meetings..."
              : `${meetings.length} meeting${meetings.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </header>

      <div className="mm-toolbar">
        <label className="mm-search">
          <Search size={16} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, person, decision or anything said"
            aria-label="Search meetings"
          />
        </label>

        <div className="mm-tabs inline">
          {FILTERS.map((name) => (
            <button
              key={name}
              className={filter === name ? "active" : ""}
              onClick={() => setFilter(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="mm-error">{error}</p>}

      {!loading && !error && visible.length === 0 && (
        <section className="mm-card mm-empty">
          <p>
            {meetings.length === 0
              ? "No meetings yet. Record a meeting with the extension and it will appear here."
              : "No meetings match your search."}
          </p>
        </section>
      )}

      <div className="mm-history-list">
        {visible.map((meeting) => {
          const done = meeting.status === "Completed";
          return (
            <button
              key={meeting.id}
              className="mm-card mm-history-row"
              onClick={() => openMeeting(meeting.id)}
            >
              <div className="mm-history-main">
                <h4>
                  {meeting.title}
                  {meeting.isSample && <span className="mm-chip">Sample</span>}
                </h4>
                <p>
                  {formatMeetingDate(meeting.startedAt)} <i /> {meeting.durationMin} min{" "}
                  <i /> <Users size={12} /> {meeting.participants.length}
                </p>
                {meeting.notes && (
                  <p className="mm-history-summary">{meeting.notes.summary}</p>
                )}
              </div>

              <div className="mm-history-side">
                {meeting.notes && (
                  <span className="mm-count">
                    {meeting.notes.decisions.length} decisions ·{" "}
                    {meeting.notes.actionItems.length} actions
                  </span>
                )}
                <span className={`mm-badge ${done ? "done" : "proc"}`}>
                  {done ? <Check size={12} /> : <Clock size={12} />} {meeting.status}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}