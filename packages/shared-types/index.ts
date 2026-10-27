export interface MeetingSession {
  id: string;
  title: string;
  startedAt: string;
  status: "recording" | "paused" | "completed";
}

export interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: number;
  speaker?: string;
}
