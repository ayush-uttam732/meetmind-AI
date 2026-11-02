import { useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  CalendarDays,
  Clock,
  Hourglass,
  FileText,
  LayoutGrid,
  Play,
  Loader2,
  CalendarClock,
  CheckCircle2,
  MoreVertical,
  Rocket,
  Users,
  Headphones,
  Code2,
  Palette,
  Lightbulb,
  MessageCircle,
  CircleCheck,
  ArrowRight,
  ArrowUpDown,
  SlidersHorizontal,
  AudioLines,
} from "lucide-react";
import type { ComponentType } from "react";
import "../styles/allmeetings.css";

type Status = "Completed" | "Processing" | "Upcoming";
type IconKey = "rocket" | "users" | "headphones" | "code" | "palette";

interface MeetingRow {
  id: string;
  title: string;
  subtitle: string;
  start: string; // ISO
  durationMin: number;
  extraParticipants: number;
  status: Status;
  notes: boolean;
  icon: IconKey;
  type: "Video" | "Audio";
  live?: boolean;
}

const iconMap: Record<IconKey, { Icon: ComponentType<{ size?: number }>; cls: string }> = {
  rocket: { Icon: Rocket, cls: "ic-indigo" },
  users: { Icon: Users, cls: "ic-blue" },
  headphones: { Icon: Headphones, cls: "ic-green" },
  code: { Icon: Code2, cls: "ic-pink" },
  palette: { Icon: Palette, cls: "ic-orange" },
};

const MEETINGS: MeetingRow[] = [
  { id: "1", title: "Project Planning & Roadmap", subtitle: "Product strategy discussion", start: "2026-10-31T10:30", durationMin: 75, extraParticipants: 2, status: "Completed", notes: true, icon: "rocket", type: "Video" },
  { id: "2", title: "Team Weekly Sync", subtitle: "Sprint progress & blockers", start: "2026-10-30T16:00", durationMin: 45, extraParticipants: 3, status: "Processing", notes: false, icon: "users", type: "Video" },
  { id: "3", title: "Client Requirements Discussion", subtitle: "E-commerce project", start: "2026-10-29T11:20", durationMin: 65, extraParticipants: 1, status: "Upcoming", notes: false, icon: "headphones", type: "Audio" },
  { id: "4", title: "MeetMind AI Sprint Review", subtitle: "Development progress", start: "2026-10-28T15:15", durationMin: 70, extraParticipants: 4, status: "Completed", notes: true, icon: "code", type: "Video", live: true },
  { id: "5", title: "UI/UX Design Feedback", subtitle: "Design updates", start: "2026-10-27T14:30", durationMin: 50, extraParticipants: 2, status: "Completed", notes: true, icon: "palette", type: "Video" },
  { id: "6", title: "Backend API Walkthrough", subtitle: "Endpoints & auth", start: "2026-10-25T12:00", durationMin: 30, extraParticipants: 2, status: "Completed", notes: true, icon: "code", type: "Video" },
  { id: "7", title: "Marketing Kickoff", subtitle: "Launch campaign ideas", start: "2026-10-23T10:00", durationMin: 25, extraParticipants: 3, status: "Completed", notes: true, icon: "rocket", type: "Audio" },
  { id: "8", title: "Customer Interview #4", subtitle: "Onboarding pain points", start: "2026-10-21T17:00", durationMin: 40, extraParticipants: 1, status: "Completed", notes: true, icon: "headphones", type: "Audio" },
  { id: "9", title: "Design System Review", subtitle: "Tokens & components", start: "2026-10-19T13:30", durationMin: 35, extraParticipants: 2, status: "Completed", notes: true, icon: "palette", type: "Video" },
  { id: "10", title: "Retro: Sprint 14", subtitle: "What went well / not", start: "2026-10-16T16:30", durationMin: 20, extraParticipants: 4, status: "Completed", notes: true, icon: "users", type: "Video" },
  { id: "11", title: "Investor Update Prep", subtitle: "Metrics & narrative", start: "2026-10-14T11:00", durationMin: 30, extraParticipants: 1, status: "Completed", notes: true, icon: "rocket", type: "Video" },
  { id: "12", title: "Security Audit Sync", subtitle: "Findings & fixes", start: "2026-10-10T15:00", durationMin: 25, extraParticipants: 2, status: "Upcoming", notes: false, icon: "code", type: "Video" },
];

const PAGE_SIZE = 5;
const THIS_WEEK_COUNT = 4;

type Tab = "all" | "upcoming" | "recorded" | "processing";

const tabs: { key: Tab; label: string; Icon: ComponentType<{ size?: number }> }[] = [
  { key: "all", label: "All Meetings", Icon: LayoutGrid },
  { key: "upcoming", label: "Upcoming", Icon: Clock },
  { key: "recorded", label: "Recorded", Icon: Play },
  { key: "processing", label: "Processing", Icon: Loader2 },
];

const formatDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
};

function StatusBadge({ status }: { status: Status }) {
  if (status === "Completed")
    return (
      <span className="mt-badge completed">
        <CheckCircle2 size={14} /> Completed
      </span>
    );
  if (status === "Processing")
    return (
      <span className="mt-badge processing">
        <Loader2 size={14} className="mt-spin" /> Processing
      </span>
    );
  return (
    <span className="mt-badge upcoming">
      <CalendarClock size={14} /> Upcoming
    </span>
  );
}

interface AllMeetingsProps {
  onOpenMeeting?: (id: string) => void;
  onNewMeeting?: () => void;
  onJoinMeeting?: () => void;
}

export default function AllMeetings({
  onOpenMeeting,
  onNewMeeting,
  onJoinMeeting,
}: AllMeetingsProps) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"All" | "Video" | "Audio">("All");
  const [status, setStatus] = useState<"All" | Status>("All");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MEETINGS.filter((m) => {
      if (tab === "upcoming" && m.status !== "Upcoming") return false;
      if (tab === "recorded" && m.status !== "Completed") return false;
      if (tab === "processing" && m.status !== "Processing") return false;
      if (type !== "All" && m.type !== type) return false;
      if (status !== "All" && m.status !== status) return false;
      if (q && !`${m.title} ${m.subtitle}`.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) =>
      sort === "newest"
        ? b.start.localeCompare(a.start)
        : a.start.localeCompare(b.start)
    );
  }, [tab, query, type, status, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const totalMin = MEETINGS.reduce((s, m) => s + m.durationMin, 0);
  const notesCount = MEETINGS.filter((m) => m.notes).length;

  const reset = () => setPage(1);

  return (
    <div className="mt-main">

        <div className="mt-content">
          <div className="mt-body">
            {/* Page heading */}
            <section className="mt-heading">
              <div>
                <span className="mt-eyebrow">MEETINGS</span>
                <h2>Meetings</h2>
                <p>All your conversations, recordings and AI-generated notes in one place.</p>
              </div>
              <div className="mt-heading-actions">
                <button className="mt-btn primary" onClick={onNewMeeting}>
                  <Plus size={20} /> New Meeting
                </button>
                <button className="mt-btn ghost" onClick={onJoinMeeting}>
                  <Video size={20} /> Join Meeting
                </button>
              </div>
            </section>

            {/* Stats */}
            <section className="mt-stats">
              <div className="mt-stat">
                <div className="mt-stat-icon ic-indigo"><CalendarDays size={28} /></div>
                <div><span>Total Meetings</span><strong>{MEETINGS.length}</strong></div>
              </div>
              <div className="mt-stat">
                <div className="mt-stat-icon ic-blue"><Clock size={28} /></div>
                <div><span>This Week</span><strong>{THIS_WEEK_COUNT}</strong></div>
              </div>
              <div className="mt-stat">
                <div className="mt-stat-icon ic-green"><Hourglass size={28} /></div>
                <div><span>Total Duration</span><strong>{(totalMin / 60).toFixed(1)} hrs</strong></div>
              </div>
              <div className="mt-stat pink">
                <div className="mt-stat-icon ic-pink"><FileText size={28} /></div>
                <div><span>AI Notes</span><strong>{notesCount}</strong></div>
              </div>
            </section>

            {/* Tabs */}
            <div className="mt-tabs">
              {tabs.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  className={`mt-tab ${tab === key ? "active" : ""}`}
                  onClick={() => { setTab(key); reset(); }}
                >
                  <Icon size={20} /> {label}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="mt-filters">
              <div className="mt-filter-search">
                <Search size={18} />
                <input
                  placeholder="Search by title, participant, or keyword..."
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); reset(); }}
                />
              </div>

              <label className="mt-select">
                <CalendarDays size={18} />
                <select defaultValue="30">
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
                <ChevronDown size={16} />
              </label>

              <label className="mt-select">
                <Video size={18} />
                <select value={type} onChange={(e) => { setType(e.target.value as typeof type); reset(); }}>
                  <option value="All">All Types</option>
                  <option value="Video">Video</option>
                  <option value="Audio">Audio</option>
                </select>
                <ChevronDown size={16} />
              </label>

              <label className="mt-select">
                <SlidersHorizontal size={18} />
                <select value={status} onChange={(e) => { setStatus(e.target.value as typeof status); reset(); }}>
                  <option value="All">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Processing">Processing</option>
                  <option value="Upcoming">Upcoming</option>
                </select>
                <ChevronDown size={16} />
              </label>

              <label className="mt-select">
                <ArrowUpDown size={18} />
                <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
                <ChevronDown size={16} />
              </label>
            </div>

            {/* Table */}
            <div className="mt-table-card">
              <div className="mt-row mt-row-head">
                <span>Meeting</span>
                <span>Date &amp; Time</span>
                <span>Duration</span>
                <span>Participants</span>
                <span>Status</span>
                <span>AI Notes</span>
                <span>Actions</span>
              </div>

              {rows.length === 0 && <div className="mt-empty">No meetings found.</div>}

              {rows.map((m) => {
                const { Icon, cls } = iconMap[m.icon];
                const { date, time } = formatDate(m.start);
                return (
                  <div className="mt-row" key={m.id}>
                    <div className="mt-meeting-cell">
                      <div className={`mt-meeting-icon ${cls}`}><Icon size={22} /></div>
                      <div>
                        <strong>{m.title}</strong>
                        <small>{m.subtitle}</small>
                      </div>
                    </div>

                    <div className="mt-date">
                      <span>{date}</span>
                      <span>{time}</span>
                    </div>

                    <span className="mt-duration">{formatDuration(m.durationMin)}</span>

                    <div className="mt-people">
                      <span className="mt-avatar sm">AU</span>
                      <span className="mt-more">+{m.extraParticipants}</span>
                    </div>

                    <div><StatusBadge status={m.status} /></div>

                    <div>
                      {m.notes ? (
                        <span className="mt-notes"><FileText size={20} /> Available</span>
                      ) : (
                        <span className="mt-dash">—</span>
                      )}
                    </div>

                    <div className="mt-actions">
                      <button className="mt-view" onClick={() => onOpenMeeting?.(m.id)}>View</button>
                      <button className="mt-kebab" aria-label="More actions"><MoreVertical size={18} /></button>
                      {m.live && <AudioLines size={22} className="mt-wave" />}
                    </div>
                  </div>
                );
              })}

              <div className="mt-footer">
                <span>
                  Showing {filtered.length === 0 ? 0 : (current - 1) * PAGE_SIZE + 1}–
                  {Math.min(current * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="mt-pager">
                  <button disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Previous">
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} className={p === current ? "active" : ""} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  ))}
                  <button disabled={current === totalPages} onClick={() => setPage(current + 1)} aria-label="Next">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick insights */}
          <aside className="mt-insights">
            <div className="mt-insights-title">
              <Lightbulb size={28} />
              <h3>Quick insights</h3>
            </div>

            <div className="mt-insight">
              <MessageCircle size={30} className="c-indigo" />
              <div>
                <span>Most discussed topic:</span>
                <strong>Product roadmap</strong>
              </div>
            </div>

            <div className="mt-insight">
              <CircleCheck size={30} className="c-yellow" />
              <div>
                <span>Pending action items:</span>
                <strong>6</strong>
              </div>
            </div>

            <div className="mt-insight">
              <CalendarDays size={30} className="c-green" />
              <div>
                <span>Last meeting:</span>
                <strong>Today, 10:30 AM</strong>
              </div>
            </div>

            <a className="mt-insights-link" href="#insights">
              View AI insights <ArrowRight size={16} />
            </a>
          </aside>
        </div>
      </div>
  );
}