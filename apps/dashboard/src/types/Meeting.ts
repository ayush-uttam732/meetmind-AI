export type MeetingStatus = "Completed" | "Processing";

export interface TranscriptMessage {
  id: string;
  speaker: string;
  /** Display time such as "10:31 AM". */
  time: string;
  text: string;
}

export interface ActionItem {
  task: string;
  owner: string;
  dueDate?: string;
}

export interface MeetingNotes {
  summary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  followUps: string[];
}

export interface MeetingRecord {
  id: string;
  title: string;
  /** ISO date string. */
  startedAt: string;
  durationMin: number;
  status: MeetingStatus;
  isSample?: boolean;
  participants: string[];
  /** null while the AI is still processing the meeting. */
  notes: MeetingNotes | null;
  transcript: TranscriptMessage[];
}