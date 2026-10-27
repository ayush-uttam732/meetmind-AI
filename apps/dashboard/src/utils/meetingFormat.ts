import type { MeetingRecord } from "../types/Meeting";

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** "Today, 10:30 AM" / "Yesterday, 3:00 PM" / "Oct 12, 11:00 AM" */
export function formatMeetingDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / 86_400_000
  );

  const time = formatTime(date);
  if (dayDiff === 0) return `Today, ${time}`;
  if (dayDiff === 1) return `Yesterday, ${time}`;
  const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${day}, ${time}`;
}

export function initials(name: string): string {
  const clean = name.replace(/\(.*?\)/g, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Stable colour slot (0-5) per speaker, so one person always keeps one colour. */
export function speakerTone(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash % 6;
}

/** Flattens a meeting into plain text so Ask MeetMind AI can answer from it. */
export function meetingToContextText(meeting: MeetingRecord): string {
  const lines: string[] = [];
  const notes = meeting.notes;

  if (notes) {
    lines.push(`Summary: ${notes.summary}`);
    if (notes.decisions.length) {
      lines.push("Decisions:", ...notes.decisions.map((d) => `- ${d}`));
    }
    if (notes.actionItems.length) {
      lines.push(
        "Action items:",
        ...notes.actionItems.map(
          (a) => `- ${a.task} (owner: ${a.owner}${a.dueDate ? `, due: ${a.dueDate}` : ""})`
        )
      );
    }
    if (notes.followUps.length) {
      lines.push("Open questions:", ...notes.followUps.map((f) => `- ${f}`));
    }
  }

  if (meeting.transcript.length) {
    lines.push(
      "Transcript:",
      ...meeting.transcript.map((m) => `${m.speaker} (${m.time}): ${m.text}`)
    );
  }

  return lines.join("\n");
}

/** Text used by the history search box. */
export function meetingSearchText(meeting: MeetingRecord): string {
  return [
    meeting.title,
    meeting.participants.join(" "),
    meetingToContextText(meeting),
  ]
    .join(" ")
    .toLowerCase();
}