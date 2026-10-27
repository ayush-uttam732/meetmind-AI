import type { MeetingRecord } from "../types/meeting";
import { SAMPLE_MEETINGS } from "../data/sampleMeetings";

/** Sample meetings show only in dev builds, or when VITE_DEMO_MODE=true. */
export const DEMO_MODE =
  import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === "true";

/**
 * Single place the UI gets meetings from.
 * TODO: when the backend is ready, replace the body with a fetch to the
 * sessions API (GET /sessions and GET /sessions/:id) and map the response
 * to MeetingRecord. No component needs to change.
 */
export async function listMeetings(): Promise<MeetingRecord[]> {
  if (DEMO_MODE) {
    return [...SAMPLE_MEETINGS].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }
  return [];
}

export async function getMeeting(id: string): Promise<MeetingRecord | null> {
  const all = await listMeetings();
  return all.find((m) => m.id === id) ?? null;
}