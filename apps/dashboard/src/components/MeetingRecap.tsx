import { useState } from "react";
import { Check, CalendarClock, HelpCircle, User } from "lucide-react";
import type { MeetingNotes } from "../types/Meeting";

type Tab = "Summary" | "Decisions" | "Action Items";
const TABS: Tab[] = ["Summary", "Decisions", "Action Items"];

interface Props {
  notes: MeetingNotes;
  /** "tabs" is compact (dashboard card); "sections" shows everything at once (details page). */
  layout?: "tabs" | "sections";
}

function Summary({ notes }: { notes: MeetingNotes }) {
  return (
    <>
      <p className="mm-recap-text">{notes.summary}</p>
      {notes.keyPoints.length > 0 && (
        <ul className="mm-bullets">
          {notes.keyPoints.map((point) => (
            <li key={point}>
              <span>
                <Check size={11} />
              </span>
              {point}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Decisions({ notes }: { notes: MeetingNotes }) {
  if (notes.decisions.length === 0) {
    return <p className="mm-empty-line">No decisions were detected.</p>;
  }
  return (
    <ul className="mm-bullets spaced">
      {notes.decisions.map((decision) => (
        <li key={decision}>
          <span>
            <Check size={11} />
          </span>
          {decision}
        </li>
      ))}
    </ul>
  );
}

function ActionItems({ notes }: { notes: MeetingNotes }) {
  if (notes.actionItems.length === 0) {
    return <p className="mm-empty-line">No action items were detected.</p>;
  }
  return (
    <ul className="mm-actions">
      {notes.actionItems.map((item) => (
        <li key={`${item.owner}-${item.task}`}>
          <p>{item.task}</p>
          <div className="mm-action-meta">
            <span className="mm-chip">
              <User size={11} /> {item.owner}
            </span>
            {item.dueDate && (
              <span className="mm-chip due">
                <CalendarClock size={11} /> {item.dueDate}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function FollowUps({ notes }: { notes: MeetingNotes }) {
  if (notes.followUps.length === 0) return null;
  return (
    <div className="mm-followups">
      <h4>
        <HelpCircle size={14} /> Open questions
      </h4>
      <ul>
        {notes.followUps.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ul>
    </div>
  );
}

export default function MeetingRecap({ notes, layout = "sections" }: Props) {
  const [tab, setTab] = useState<Tab>("Summary");

  if (layout === "tabs") {
    return (
      <>
        <div className="mm-tabs">
          {TABS.map((name) => (
            <button
              key={name}
              className={tab === name ? "active" : ""}
              onClick={() => setTab(name)}
            >
              {name}
            </button>
          ))}
        </div>
        {tab === "Summary" && <Summary notes={notes} />}
        {tab === "Decisions" && <Decisions notes={notes} />}
        {tab === "Action Items" && <ActionItems notes={notes} />}
      </>
    );
  }

  return (
    <div className="mm-recap-grid">
      <section className="mm-recap-block wide">
        <h3>Summary</h3>
        <Summary notes={notes} />
      </section>
      <section className="mm-recap-block">
        <h3>Decisions</h3>
        <Decisions notes={notes} />
      </section>
      <section className="mm-recap-block">
        <h3>Action Items</h3>
        <ActionItems notes={notes} />
      </section>
      {notes.followUps.length > 0 && (
        <section className="mm-recap-block wide">
          <FollowUps notes={notes} />
        </section>
      )}
    </div>
  );
}