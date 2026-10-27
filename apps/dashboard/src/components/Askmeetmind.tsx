import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, ClipboardList, CalendarCheck, MessagesSquare, Share2 } from "lucide-react";
import { askMeetMind, type MeetingContext } from "../services/askService";
import { SAMPLE_MEETINGS } from "../data/sampleMeeting";
import "../styles/ask.css";

const popularQuestions = [
  { text: "What are the pending action items?", icon: ClipboardList },
  { text: "Summarize last week's meetings", icon: CalendarCheck },
  { text: "Who mentioned the budget?", icon: MessagesSquare },
  { text: "What are the next steps for the project?", icon: Share2 },
];

interface AskMeetMindProps {
  /** Meetings that have real AI notes, newest first. The AI answers only from these. */
  meetings: MeetingContext[];
}

export default function AskMeetMind({ meetings }: AskMeetMindProps) {
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  // DEMO: lets you try Ask before real meetings exist. Dev mode only, never saved.
  const [useSample, setUseSample] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Cancel an in-flight request if the component unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  const activeMeetings = useSample ? [...meetings, ...SAMPLE_MEETINGS] : meetings;
  const hasMeetings = activeMeetings.length > 0;

  async function handleAsk(text: string) {
    const trimmed = text.trim();
    if (!trimmed || asking) return;

    setQuestion(trimmed);
    setAnswer("");
    setError("");

    const controller = new AbortController();
    abortRef.current = controller;
    setAsking(true);

    try {
      setAnswer(await askMeetMind(trimmed, activeMeetings, controller.signal));
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error("[AskMeetMind] request failed:", err);
      setError(
        err instanceof TypeError
          ? "Could not reach the backend. Check that it is running."
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
      );
    } finally {
      if (abortRef.current === controller) {
        setAsking(false);
        abortRef.current = null;
      }
    }
  }

  return (
    <section className="mm-card mm-side">
      <div className="mm-side-head">
        <div className="mm-side-icon lilac">
          <Sparkles size={22} />
        </div>
        <div>
          <h3>Ask MeetMind AI</h3>
          <p>Get instant answers from your meeting notes.</p>
        </div>
      </div>

      {/* Deliberately NOT a <form>: a native form submit reloads the page. */}
      <div className="mm-ask">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void handleAsk(question);
            }
          }}
          placeholder="e.g. What were the key decisions?"
          aria-label="Ask MeetMind AI a question"
          maxLength={1000}
        />
        <button
          type="button"
          aria-label="Ask"
          disabled={asking || !question.trim()}
          onClick={() => void handleAsk(question)}
        >
          <Send size={16} />
        </button>
      </div>

      <p className="mm-ask-meta">
        {useSample
          ? `Demo mode: answering from ${SAMPLE_MEETINGS.length} made-up sample meetings${
              meetings.length ? ` + ${meetings.length} real` : ""
            }. This is not real data.`
          : hasMeetings
            ? `Answering from ${meetings.length} meeting${meetings.length === 1 ? "" : "s"} with generated notes.`
            : "No meeting notes yet. Generate notes to start asking."}
      </p>
      {import.meta.env.DEV && (
        <button type="button" className="mm-ask-demo" onClick={() => setUseSample((on) => !on)}>
          {useSample ? "Turn off sample notes" : "Try with sample notes (demo)"}
        </button>
      )}

      {asking && (
        <div className="mm-answer" role="status">
          Thinking...
        </div>
      )}
      {!asking && answer && (
        <div className="mm-answer" role="status">
          {answer}
        </div>
      )}
      {!asking && error && (
        <div className="mm-answer mm-answer-error" role="alert">
          {error}
        </div>
      )}

      <p className="mm-popular">Try a question:</p>
      <div className="mm-chips">
        {popularQuestions.map(({ text, icon: Icon }) => (
          <button key={text} disabled={asking} onClick={() => void handleAsk(text)}>
            <Icon size={14} /> {text}
          </button>
        ))}
      </div>
    </section>
  );
}