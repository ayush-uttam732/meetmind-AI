import { ArrowLeft, Clock, MessageSquare, Users } from "lucide-react";
import MeetingChat from "../components/MeetingChat";
import MeetingRecap from "../components/MeetingRecap";
import { useMeeting } from "../hooks/useMeetings";
import { formatMeetingDate } from "../utils/meetingFormat";
import { openMeetingHistory } from "../utils/Navigation";
import "../styles/dashboard.css";
import "../styles/meetings.css";

/** Same name the dashboard greets. Their messages appear on the right in the chat. */
const CURRENT_USER = "Ayush Uttam";

export default function MeetingDetails() {
  const id = new URLSearchParams(window.location.search).get("id") ?? "";
  const { data: meeting, loading, error } = useMeeting(id);

  return (
    <main className="mm-page">
      <button className="mm-link back" onClick={openMeetingHistory}>
        <ArrowLeft size={14} /> All meetings
      </button>

      {loading && <p className="mm-empty-line">Loading meeting...</p>}
      {error && <p role="alert" className="mm-error">{error}</p>}

      {!loading && !error && !meeting && (
        <section className="mm-card mm-empty">
          <p>This meeting could not be found.</p>
        </section>
      )}

      {meeting && (
        <>
          <header className="mm-page-head">
            <div>
              <h2>{meeting.title}</h2>
              <p className="mm-meta">
                {formatMeetingDate(meeting.startedAt)}
                <i /> <Clock size={13} /> {meeting.durationMin} min
                <i /> <Users size={13} /> {meeting.participants.join(", ")}
              </p>
            </div>
            {meeting.isSample && <span className="mm-chip">Sample data</span>}
          </header>

          <section className="mm-card mm-detail-card">
            {meeting.notes ? (
              <MeetingRecap notes={meeting.notes} layout="sections" />
            ) : (
              <p className="mm-empty-line">
                AI notes are still being generated for this meeting. Check back
                in a few minutes.
              </p>
            )}
          </section>

          <section className="mm-card mm-detail-card">
            <h3 className="mm-section-title">
              <MessageSquare size={16} /> Conversation
            </h3>
            <MeetingChat transcript={meeting.transcript} selfName={CURRENT_USER} />
          </section>
        </>
      )}
    </main>
  );
}