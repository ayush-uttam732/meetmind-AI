/**
 * Shared by the side panel, the Meet content script and the service worker.
 * Everything that must stay identical in all three places lives here.
 */

/** MeetMind backend (apps/backend). Only used for the health check for now. */
export const API_BASE = "http://localhost:3001";

/** How many finished meetings are kept on this device. */
export const MAX_HISTORY = 50;

/** chrome.storage.local keys. */
export const KEYS = {
  /** The session that is recording / paused right now (ActiveSession). */
  active: "mm.activeSession",
  /** Finished sessions, newest first (SavedSession[]). */
  history: "mm.history",
  /** Free-text meeting notes typed in the panel. */
  notes: "mm.notes",
  /** Follow-up tasks typed in the panel (string[]). */
  tasks: "mm.tasks",
  /** Prefix of the live message buffers, one key per session. */
  messagesPrefix: "mm.messages.",
  /** Live captions of one session (ChatMessage[]). Written by the content script. */
  messages: (sessionId: string): string => `mm.messages.${sessionId}`,
} as const;

export type SessionStatus = "recording" | "paused";

export interface ActiveSession {
  id: string;
  meetingCode: string;
  title: string;
  tabId: number;
  startedAt: number;
  /** When the user confirmed the participants know the meeting is transcribed. */
  consentAt: number;
  status: SessionStatus;
}

/** One chat bubble: who said what. */
export interface ChatMessage {
  id: string;
  speaker: string;
  text: string;
  /** Epoch ms when the line first appeared. */
  ts: number;
}

export interface SavedSession {
  id: string;
  meetingCode: string;
  title: string;
  startedAt: number;
  endedAt: number;
  messages: ChatMessage[];
}

/** Reply of the Meet content script to { type: "MM_PING" }. */
export interface PingResponse {
  ok: true;
  /** true when Meet's captions (CC) are switched on and readable. */
  captionsDetected: boolean;
  meetingCode: string | null;
}

/** "https://meet.google.com/abc-defg-hij?authuser=0" -> "abc-defg-hij". null for anything else. */
export function parseMeetCode(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "meet.google.com") return null;
    // Normal code: /abc-defg-hij
    // Also the newer form: /meet/abc-defg-hij
    const standard = parsed.pathname.match(/^\/(?:meet\/)?([a-z]{3}-[a-z]{4}-[a-z]{3})(?:\/|$)/i);
    if (standard) return standard[1].toLowerCase();
    // Calendar / nickname links: /lookup/<id> or /<nickname>
    const lookup = parsed.pathname.match(/^\/lookup\/([\w-]+)/i);
    if (lookup) return lookup[1].toLowerCase();
    const single = parsed.pathname.match(/^\/([a-z0-9][\w-]{2,})\/?$/i);
    const reserved = [
      "home", "meet", "landing", "new", "whoops", "_meet", "about", "calling", "tel", "lookup",
      "linkredirect", "meetings", "schedule", "help", "settings", "signin", "services",
    ];
    if (single && !reserved.includes(single[1].toLowerCase())) return single[1].toLowerCase();
    return null;
  } catch {
    return null;
  }
}