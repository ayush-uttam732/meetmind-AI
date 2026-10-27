import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { useMeetings } from "../hooks/useMeetings";
import type { MeetingRecord } from "../types/Meeting";
import { formatMeetingDate } from "../utils/meetingFormat";
import MeetingChat from "./MeetingChat";
import MeetingRecap from "./MeetingRecap";

const MAX_RECAPS = 5;
/** Same name the dashboard greets. Their messages appear on the right, like "you" in WhatsApp. */
const CURRENT_USER = "Ayush Uttam";

type Mode = { name: "latest" } | { name: "list" } | { name: "detail"; id: string };

/** Plain-text version of the AI notes, used by the Copy button. */
function recapToText(meeting: MeetingRecord): string {
  const notes = meeting.notes;
  if (!notes) return "";
  const lines = [meeting.title, "", "Summary:", notes.summary];
  if (notes.decisions.length) {
    lines.push("", "Decisions:", ...notes.decisions.map((d) => `- ${d}`));
  }
  if (notes.actionItems.length) {
    lines.push(
      "",
      "Action items:",
      ...notes.actionItems.map(
        (a) => `- ${a.task} (${a.owner}${a.dueDate ? `, ${a.dueDate}` : ""})`
      )
    );
  }
  return lines.join("\n");
}

interface BodyProps {
  meeting: MeetingRecord;
  /** Extra controls on the left of the action row (the recap stepper). */
  nav?: ReactNode;
  chatOpenInitially?: boolean;
}

/** One meeting: recap tabs, copy and the full WhatsApp-style chat. */
function RecapBody({ meeting, nav, chatOpenInitially = false }: BodyProps) {
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(chatOpenInitially);

  async function copyRecap() {
    try {
      await navigator.clipboard.writeText(recapToText(meeting));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked (permissions / insecure context). Nothing else to do.
    }
  }

  return (
    <>
      <div className="mm-recap-title">
        <div className="mm-meeting-icon purple small">
          <Sparkles size={20} />
        </div>
        <div>
          <h4>
            {meeting.title}
            <span className="mm-badge done tiny">
              <Check size={10} /> {meeting.isSample ? "Sample" : "AI notes"}
            </span>
          </h4>
          <p>
            {formatMeetingDate(meeting.startedAt)} <i /> <Clock size={11} />{" "}
            {meeting.durationMin} min
          </p>
        </div>
      </div>

      {meeting.notes ? (
        <MeetingRecap notes={meeting.notes} layout="tabs" />
      ) : (
        <p className="mm-empty-line">
          AI notes are still being generated for this meeting.
        </p>
      )}

      {(nav || meeting.notes) && (
        <div className="mm-recap-actions">
          <div className="mm-recap-nav">{nav}</div>
          {meeting.notes && (
            <button className="mm-copy" onClick={copyRecap}>
              {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
      )}

      {meeting.transcript.length > 0 && (
        <button
          className="mm-view-chat"
          onClick={() => setShowChat((open) => !open)}
          aria-expanded={showChat}
        >
          <MessageSquare size={15} />{" "}
          {showChat ? "Hide full chat" : `View full chat (${meeting.transcript.length})`}
        </button>
      )}

      {showChat && (
        <MeetingChat transcript={meeting.transcript} selfName={CURRENT_USER} />
      )}
    </>
  );
}

/**
 * Self-contained "Latest AI Recap" card.
 *  - Latest view: newest recaps with tabs, copy, full chat.
 *  - "View all": the recap is replaced by the list of every meeting.
 *  - Click a meeting in the list: it opens here (recap + full chat) with a back button.
 */
export default function LatestRecapCard() {
  const { data: meetings, loading, error } = useMeetings();
  const [mode, setMode] = useState<Mode>({ name: "latest" });
  const [index, setIndex] = useState(0);

  const recaps = meetings.filter((m) => m.notes).slice(0, MAX_RECAPS);
  const processing = meetings.filter((m) => m.status === "Processing").length;
  const safeIndex = Math.min(index, Math.max(recaps.length - 1, 0));
  const latest = recaps[safeIndex];

  const selected =
    mode.name === "detail" ? meetings.find((m) => m.id === mode.id) : undefined;

  function step(delta: number) {
    setIndex((current) =>
      Math.min(Math.max(current + delta, 0), recaps.length - 1)
    );
  }

  /* ---------- All meetings list ---------- */
  if (mode.name === "list") {
    return (
      <section className="mm-card mm-panel">
        <div className="mm-panel-head">
          <h3>All Meetings</h3>
          <button className="mm-link" onClick={() => setMode({ name: "latest" })}>
            <ArrowLeft size={12} /> Back
          </button>
        </div>

        {meetings.length === 0 && (
          <p className="mm-empty-line">No meetings yet.</p>
        )}

        <div className="mm-list">
          {meetings.map((meeting) => {
            const done = meeting.status === "Completed";
            return (
              <button
                key={meeting.id}
                className="mm-list-row"
                onClick={() => setMode({ name: "detail", id: meeting.id })}
              >
                <div className="mm-list-main">
                  <h4>
                    {meeting.title}
                    {meeting.isSample && <span className="mm-chip">Sample</span>}
                  </h4>
                  <p>
                    {formatMeetingDate(meeting.startedAt)} <i /> {meeting.durationMin} min{" "}
                    <i /> <Users size={12} /> {meeting.participants.length}
                  </p>
                </div>
                <span className={`mm-badge ${done ? "done" : "proc"}`}>
                  {done ? <Check size={12} /> : <Clock size={12} />} {meeting.status}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  /* ---------- One meeting opened from the list ---------- */
  if (mode.name === "detail") {
    return (
      <section className="mm-card mm-panel">
        <div className="mm-panel-head">
          <h3>Meeting</h3>
          <button className="mm-link" onClick={() => setMode({ name: "list" })}>
            <ArrowLeft size={12} /> All meetings
          </button>
        </div>

        {selected ? (
          <RecapBody key={selected.id} meeting={selected} chatOpenInitially />
        ) : (
          <p className="mm-empty-line">This meeting could not be found.</p>
        )}
      </section>
    );
  }

  /* ---------- Latest recap ---------- */
  return (
    <section className="mm-card mm-panel">
      <div className="mm-panel-head">
        <h3>Latest AI Recap</h3>
        <button className="mm-link" onClick={() => setMode({ name: "list" })}>
          View all <ArrowRight size={12} />
        </button>
      </div>

      {loading && <p className="mm-empty-line">Loading...</p>}
      {error && <p role="alert" className="mm-error">{error}</p>}

      {!loading && !error && !latest && (
        <p className="mm-empty-line">
          No recap yet. Notes appear here automatically after a meeting is
          recorded with the extension.
          {processing > 0 && ` ${processing} meeting(s) still processing.`}
        </p>
      )}

      {latest && (
        <RecapBody
          key={latest.id}
          meeting={latest}
          nav={
            <>
              <button
                onClick={() => step(-1)}
                disabled={safeIndex === 0}
                aria-label="Newer recap"
              >
                <ChevronLeft size={16} />
              </button>
              <span>
                {safeIndex + 1} / {recaps.length}
              </span>
              <button
                onClick={() => step(1)}
                disabled={safeIndex >= recaps.length - 1}
                aria-label="Older recap"
              >
                <ChevronRight size={16} />
              </button>
            </>
          }
        />
      )}
    </section>
  );
}