import { useMemo, useState } from "react";
import {
  type LucideIcon,
  CalendarDays,
  Video,
  Puzzle,
  Info,
  Sparkles,
  ArrowRight,
  Clock,
  Check,
  Users,
  FileText,
  Lightbulb,
  Megaphone,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import AskMeetMind from "../components/Askmeetmind";
import LatestRecapCard from "../components/LatestRecapCard";
import { useMeetings } from "../hooks/useMeetings";
import type { MeetingContext } from "../services/askService";
import { formatMeetingDate, meetingToContextText } from "../utils/meetingFormat";
import { openMeeting, openMeetingHistory } from "../utils/Navigation";
import "../styles/dashboard.css";
import "../styles/meetings.css";

type IconType = LucideIcon;
type Tone = "purple" | "blue" | "pink" | "orange" | "teal";
type ExtensionStatus = "disconnected" | "connecting" | "connected" | "error";

const TONES: { tone: Tone; icon: IconType }[] = [
  { tone: "purple", icon: Sparkles },
  { tone: "blue", icon: Users },
  { tone: "pink", icon: FileText },
  { tone: "orange", icon: Lightbulb },
  { tone: "teal", icon: Megaphone },
];

export default function Dashboard() {
  const userName = "Ayush Uttam";
  const firstName = userName.split(" ")[0];

  const { data: meetings, loading } = useMeetings();

  const [extensionStatus, setExtensionStatus] =
    useState<ExtensionStatus>("disconnected");
  const [extensionMessage, setExtensionMessage] = useState("");

  const recentMeetings = meetings.slice(0, 5);

  // Everything is computed from the meetings list, so the numbers are never made up.
  const stats = useMemo(() => {
    const totalMinutes = meetings.reduce((sum, m) => sum + m.durationMin, 0);
    const withNotes = meetings.filter((m) => m.notes);
    const actionItems = withNotes.reduce(
      (sum, m) => sum + (m.notes?.actionItems.length ?? 0),
      0
    );
    return [
      { label: "Total Meetings", value: String(meetings.length), unit: "", caption: "All recorded meetings", tone: "violet", icon: CalendarDays },
      { label: "Meeting Time", value: (totalMinutes / 60).toFixed(1), unit: " hrs", caption: "Total time recorded", tone: "blue", icon: Clock },
      { label: "Action Items", value: String(actionItems), unit: "", caption: "Found by AI in notes", tone: "green", icon: Check },
      { label: "AI Notes Created", value: String(withNotes.length), unit: "", caption: "Meetings with notes", tone: "pink", icon: Sparkles },
    ] as const;
  }, [meetings]);

  const insights = useMemo(() => {
    const done = meetings.filter((m) => m.status === "Completed");
    const avg = done.length
      ? Math.round(done.reduce((s, m) => s + m.durationMin, 0) / done.length)
      : 0;

    const messageCounts = new Map<string, number>();
    for (const meeting of meetings) {
      for (const message of meeting.transcript) {
        messageCounts.set(message.speaker, (messageCounts.get(message.speaker) ?? 0) + 1);
      }
    }
    const topSpeaker = [...messageCounts.entries()].sort((a, b) => b[1] - a[1])[0];

    const openQuestions = meetings.reduce(
      (sum, m) => sum + (m.notes?.followUps.length ?? 0),
      0
    );

    return { avg, topSpeaker, openQuestions };
  }, [meetings]);

  // Ask MeetMind AI answers from the real notes and transcripts.
  const askContext: MeetingContext[] = useMemo(
    () =>
      meetings
        .filter((m) => m.notes)
        .map((m) => ({ title: m.title, notes: meetingToContextText(m) })),
    [meetings]
  );

  async function handleConnectExtension() {
    const extensionId = import.meta.env.VITE_MEETMIND_EXTENSION_ID?.trim();

    if (!extensionId) {
      setExtensionStatus("error");
      setExtensionMessage(
        "Extension ID is not configured. Add VITE_MEETMIND_EXTENSION_ID to apps/dashboard/.env."
      );
      return;
    }

    setExtensionStatus("connecting");
    setExtensionMessage("Checking extension connection...");

    try {
      type PingResponse = {
        success?: boolean;
        name?: string;
        status?: string;
        message?: string;
      };

      type ChromeRuntime = {
        sendMessage: (
          id: string,
          message: { type: string },
          callback: (response?: PingResponse) => void
        ) => void;
        lastError?: { message?: string };
      };

      const browserWindow = window as Window & {
        chrome?: {
          runtime?: ChromeRuntime;
        };
      };

      const runtime = browserWindow.chrome?.runtime;

      if (!runtime?.sendMessage) {
        throw new Error(
          "Extension messaging is unavailable. Open this dashboard in Chrome and check the extension setup."
        );
      }

      const response = await new Promise<PingResponse>((resolve, reject) => {
        runtime.sendMessage(
          extensionId,
          { type: "MEETMIND_PING" },
          (result) => {
            const error = runtime.lastError;

            if (error) {
              reject(
                new Error(error.message || "Could not reach the extension.")
              );
              return;
            }

            if (!result) {
              reject(new Error("The extension did not respond."));
              return;
            }

            resolve(result);
          }
        );
      });

      if (!response.success || response.status !== "connected") {
        throw new Error(
          response.message || "The extension did not confirm its connection."
        );
      }

      setExtensionStatus("connected");
      setExtensionMessage(
        `${response.name || "MeetMind AI"} extension connected successfully.`
      );
    } catch (error) {
      setExtensionStatus("error");
      setExtensionMessage(
        error instanceof Error
          ? error.message
          : "Could not connect to the extension."
      );
    }
  }

  const connectDisabled =
    extensionStatus === "connecting" || extensionStatus === "connected";

  return (
    <main className="mm-content">
      <div className="mm-left">
        <section className="mm-card mm-hero">
          <div>
            <span className="mm-eyebrow">YOUR WORKSPACE</span>
            <h2>
              Good to see you, {firstName}! <span className="wave">👋</span>
            </h2>
            <p>
              Turn your meetings into clear summaries, decisions and action
              items.
            </p>
          </div>

          <div className="mm-hero-art" aria-hidden="true">
            <svg viewBox="0 0 320 120" fill="none">
              <ellipse cx="150" cy="95" rx="120" ry="18" fill="#3b2fd6" opacity=".35" />
              <rect x="40" y="30" width="110" height="64" rx="10" fill="#2a2a9e" stroke="#6d5dfc" />
              <circle cx="95" cy="62" r="14" fill="#6d5dfc" />
              <rect x="150" y="10" width="90" height="70" rx="10" fill="#14165c" stroke="#6d5dfc" />
              <rect x="164" y="30" width="46" height="5" rx="2.5" fill="#6d5dfc" />
              <rect x="164" y="44" width="34" height="5" rx="2.5" fill="#4a46c8" />
              <rect x="164" y="58" width="56" height="5" rx="2.5" fill="#4a46c8" />
            </svg>
            <p>
              Better
              <br />
              meetings,
              <br />
              more progress
            </p>
          </div>
        </section>

        <div className="mm-stats">
          {stats.map(({ label, value, unit, caption, tone, icon: Icon }) => (
            <article key={label} className={`mm-card mm-stat ${tone}`}>
              <div className="mm-stat-icon">
                <Icon size={22} />
              </div>
              <p>{label}</p>
              <div className="mm-stat-row">
                <strong>
                  {value}
                  {unit && <span>{unit}</span>}
                </strong>
              </div>
              <small>{caption}</small>
            </article>
          ))}
        </div>

        <div className="mm-two">
          <section className="mm-card mm-panel">
            <div className="mm-panel-head">
              <h3>Recent Meetings</h3>
              <button className="mm-link" onClick={openMeetingHistory}>
                View all <ArrowRight size={12} />
              </button>
            </div>

            <div className="mm-meetings">
              {!loading && recentMeetings.length === 0 && (
                <p className="mm-empty-line">
                  No meetings yet. Record one with the extension to see it here.
                </p>
              )}

              {recentMeetings.map((meeting, index) => {
                const { tone, icon: Icon } = TONES[index % TONES.length];
                const done = meeting.status === "Completed";
                return (
                  <div className="mm-meeting" key={meeting.id}>
                    <div className={`mm-meeting-icon ${tone}`}>
                      <Icon size={24} />
                    </div>

                    <div className="mm-meeting-info">
                      <h4>{meeting.title}</h4>
                      <p>
                        {formatMeetingDate(meeting.startedAt)}
                        <i /> {meeting.durationMin} min
                      </p>
                    </div>

                    <span className={`mm-badge ${done ? "done" : "proc"}`}>
                      {done ? <Check size={12} /> : <Clock size={12} />}{" "}
                      {meeting.status}
                    </span>

                    <button
                      className="mm-view"
                      onClick={() => openMeeting(meeting.id)}
                    >
                      View
                    </button>
                  </div>
                );
              })}
            </div>

            {recentMeetings.some((m) => m.isSample) && (
              <p className="mm-demo-note mm-demo-pad">
                Sample meetings — real history loads once the backend is connected.
              </p>
            )}
          </section>

          <LatestRecapCard />
        </div>

        <section className="mm-card mm-cta">
          <div className="mm-cta-icon">
            <Sparkles size={26} />
          </div>
          <div className="mm-cta-text">
            <h3>Make every meeting count</h3>
            <p>
              Get AI-powered notes, track action items and stay aligned — all
              in one place.
            </p>
          </div>
          <svg className="mm-wave" viewBox="0 0 200 60" fill="none">
            <path
              d="M0 35 H60 L75 10 L90 50 L105 20 L120 35 H200"
              stroke="#6d5dfc"
              strokeWidth="2"
            />
          </svg>
          <button
            className="mm-outline"
            onClick={handleConnectExtension}
            disabled={connectDisabled}
          >
            Start your next meeting <ArrowRight size={15} />
          </button>
        </section>
      </div>

      <div className="mm-right">
        <section className="mm-card mm-side">
          <div className="mm-side-head">
            <div className="mm-side-icon violet">
              <Video size={22} />
            </div>
            <div>
              <h3>Join / Start Meeting</h3>
              <p>
                Connect your browser extension to begin your meeting workflow.
              </p>
            </div>
          </div>

          <button
            className="mm-connect"
            onClick={handleConnectExtension}
            disabled={connectDisabled}
          >
            <Puzzle size={18} />
            {extensionStatus === "connecting"
              ? "Connecting..."
              : extensionStatus === "connected"
                ? "Extension Connected"
                : "Connect Extension"}
          </button>

          {extensionMessage && (
            <p
              role="status"
              style={{
                marginTop: 10,
                fontSize: 13,
                overflowWrap: "anywhere",
                color: extensionStatus === "error" ? "#ef4444" : "#64748b",
              }}
            >
              {extensionMessage}
            </p>
          )}

          <button
            className="mm-how"
            onClick={() =>
              setExtensionMessage(
                "1. Install and enable the MeetMind AI extension. 2. Configure its Extension ID in the dashboard .env file. 3. Reload the extension and click Connect Extension."
              )
            }
          >
            <Info size={14} /> How it works?
          </button>
        </section>

        <AskMeetMind meetings={askContext} />

        <section className="mm-card mm-side">
          <div className="mm-insights-head">
            <h3>
              <Sparkles size={20} /> Meeting Insights
            </h3>
            <button className="mm-link" onClick={openMeetingHistory}>
              View all <ArrowRight size={12} />
            </button>
          </div>

          <div className="mm-insight">
            <div className="mm-insight-icon">
              <Clock size={20} />
            </div>
            <div>
              <p>Average meeting duration</p>
              <strong>{insights.avg ? `${insights.avg} min` : "—"}</strong>
            </div>
          </div>

          <div className="mm-insight">
            <div className="mm-insight-icon">
              <MessageSquare size={20} />
            </div>
            <div>
              <p>Most active participant</p>
              <strong>{insights.topSpeaker ? insights.topSpeaker[0] : "—"}</strong>
            </div>
            {insights.topSpeaker && (
              <span className="mm-pill">{insights.topSpeaker[1]} messages</span>
            )}
          </div>

          <div className="mm-insight">
            <div className="mm-insight-icon">
              <HelpCircle size={20} />
            </div>
            <div>
              <p>Open questions</p>
              <strong>{insights.openQuestions}</strong>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}