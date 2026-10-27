/**
 * Runs inside every https://meet.google.com tab.
 *
 * - Answers the side panel's { type: "MM_PING" } ("is a Meet tab here, and are captions on?").
 * - While a session is "recording" for THIS meeting, reads Meet's live captions and keeps them as
 *   chat messages (who said what) in chrome.storage.local. The side panel renders them.
 *
 * No audio is touched. Only the caption text that Meet already shows on screen is read.
 *
 * Meet's DOM is not a public API and can change without notice. If captions stop being detected,
 * the only things to adjust are CAPTION_REGION_SELECTORS, getItems() and parseItem() below.
 */
import {
  KEYS,
  parseMeetCode,
  type ActiveSession,
  type ChatMessage,
  type PingResponse,
} from "../shared/common";

const LOG = "[MeetMind]";

// The side panel can inject this file again if Chrome did not. Run only once per page.
const flagHost = window as unknown as { __meetmindLoaded?: boolean };
const alreadyLoaded = flagHost.__meetmindLoaded === true;
flagHost.__meetmindLoaded = true;
if (alreadyLoaded) throw new Error("MeetMind content script already running");
console.debug(LOG, "Content script loaded.");

const CAPTION_REGION_SELECTORS = [
  '[role="region"][aria-label="Captions"]',
  '[role="region"][aria-label^="Caption" i]',
  '[role="region"][aria-label*="subtitle" i]',
];

const SCAN_INTERVAL_MS = 1000;
const OBSERVER_DEBOUNCE_MS = 200;
const PERSIST_THROTTLE_MS = 500;
/** A rebuilt caption element of the same speaker within this time continues the same line. */
const CONTINUE_WINDOW_MS = 8000;
/** A caption whose text stops matching its old start, after this long, is a new sentence. */
const NEW_UTTERANCE_AFTER_MS = 2000;
const MAX_MESSAGES = 5000;

interface Tracked {
  id: string;
  lastChangeAt: number;
}

let session: ActiveSession | null = null;
/** true once the saved messages of the current session were loaded (so we never overwrite them). */
let ready = false;
let messages: ChatMessage[] = [];
/** Caption element on screen -> the message it feeds. */
const tracked = new Map<HTMLElement, Tracked>();

let persistTimer: number | undefined;
let scanTimer: number | undefined;
let observer: MutationObserver | null = null;
let observedRoot: HTMLElement | null = null;
let rootWasFound: boolean | null = null;

/* ---------------- reading Meet's caption DOM ---------------- */

function clean(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

/** Caption rows: the biggest element that still holds exactly one speaker avatar. */
function getItems(root: HTMLElement): HTMLElement[] {
  const items: HTMLElement[] = [];

  for (const img of Array.from(root.querySelectorAll("img"))) {
    let item: HTMLElement | null = null;
    let node: HTMLElement | null = img.parentElement;
    while (node && node !== root && node.querySelectorAll("img").length === 1) {
      item = node;
      node = node.parentElement;
    }
    if (item && !items.includes(item)) items.push(item);
  }

  if (items.length > 0) return items;
  // No avatars (layout without pictures): treat each direct child as a row.
  return Array.from(root.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
}

/** One caption row -> speaker name (first span with text) + spoken text (the text divs). */
function parseItem(item: HTMLElement): { speaker: string; text: string } | null {
  const nameElement = Array.from(item.querySelectorAll("span")).find((span) => clean(span.textContent));
  const speaker = clean(nameElement?.textContent);
  if (!speaker) return null;

  const candidates = Array.from(item.querySelectorAll("div")).filter(
    (div) => !div.querySelector("img") && !div.contains(nameElement ?? null) && clean(div.textContent)
  );
  const leaves = candidates.filter((div) => !candidates.some((other) => other !== div && div.contains(other)));
  const text = clean(leaves.map((div) => div.textContent ?? "").join(" "));

  if (!text || text === speaker) return null;
  return { speaker, text };
}

function findRoot(): HTMLElement | null {
  for (const selector of CAPTION_REGION_SELECTORS) {
    const node = document.querySelector<HTMLElement>(selector);
    if (node) return node;
  }
  return null;
}

/* ---------------- turning captions into messages ---------------- */

function sharesStart(a: string, b: string): boolean {
  const length = Math.min(12, a.length, b.length);
  return length > 0 && a.slice(0, length).toLowerCase() === b.slice(0, length).toLowerCase();
}

function findMessage(id: string): ChatMessage | undefined {
  for (let i = messages.length - 1; i >= 0; i--) if (messages[i].id === id) return messages[i];
  return undefined;
}

function scan(final = false): void {
  if (!session || !ready) return;
  if (!final && session.status !== "recording") return;
  if (session.meetingCode !== parseMeetCode(location.href)) return;

  const root = findRoot();
  if (!root) {
    if (final) flush();
    return;
  }

  const now = Date.now();
  const seen = new Set<HTMLElement>();
  let dirty = false;

  for (const item of getItems(root)) {
    const parsed = parseItem(item);
    if (!parsed) continue;
    seen.add(item);

    let entry = tracked.get(item);
    let message = entry ? findMessage(entry.id) : undefined;

    // Same element, but the speaker started a new sentence.
    if (entry && message && message.text.length >= 12 && now - entry.lastChangeAt >= NEW_UTTERANCE_AFTER_MS) {
      if (!sharesStart(message.text, parsed.text)) {
        entry = undefined;
        message = undefined;
      }
    }

    if (!entry || !message) {
      const last = messages[messages.length - 1];
      if (
        !entry &&
        last &&
        last.speaker === parsed.speaker &&
        now - last.ts < CONTINUE_WINDOW_MS &&
        sharesStart(last.text, parsed.text)
      ) {
        message = last; // Meet rebuilt the element: keep one line instead of a duplicate
      } else {
        message = { id: crypto.randomUUID(), speaker: parsed.speaker, text: parsed.text, ts: now };
        messages.push(message);
        dirty = true;
      }
      entry = { id: message.id, lastChangeAt: now };
      tracked.set(item, entry);
    }

    if (message.text !== parsed.text) {
      message.text = parsed.text;
      entry.lastChangeAt = now;
      dirty = true;
    }
  }

  for (const element of Array.from(tracked.keys())) {
    if (!seen.has(element)) tracked.delete(element);
  }

  if (messages.length > MAX_MESSAGES) messages.splice(0, messages.length - MAX_MESSAGES);

  if (final) flush();
  else if (dirty) schedulePersist();
}

/* ---------------- saving ---------------- */

function extensionAlive(): boolean {
  try {
    return !!chrome.runtime?.id;
  } catch {
    return false;
  }
}

function flush(): void {
  window.clearTimeout(persistTimer);
  persistTimer = undefined;
  if (!session || !extensionAlive()) return;
  chrome.storage.local.set({ [KEYS.messages(session.id)]: messages }).catch(() => undefined);
}

function schedulePersist(): void {
  if (persistTimer !== undefined) return;
  persistTimer = window.setTimeout(flush, PERSIST_THROTTLE_MS);
}

/* ---------------- session handling ---------------- */

async function adopt(next: ActiveSession | null): Promise<void> {
  const changed = next?.id !== session?.id;
  session = next;
  if (!changed) return;

  ready = false;
  tracked.clear();
  messages = [];
  window.clearTimeout(persistTimer);
  persistTimer = undefined;
  if (!next) return;

  // Continue after a reload of this tab / the extension instead of starting an empty chat.
  const key = KEYS.messages(next.id);
  const data = await chrome.storage.local.get(key);
  if (session?.id !== next.id) return; // changed again while loading
  messages = Array.isArray(data[key]) ? (data[key] as ChatMessage[]) : [];
  ready = true;
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes[KEYS.active]) return;
  const next = (changes[KEYS.active].newValue as ActiveSession | undefined) ?? null;
  const wasRecording = session?.id === next?.id && session?.status === "recording";

  void adopt(next).then(() => {
    // Paused: capture the last lines now. The side panel reads them right after pausing.
    if (next && wasRecording && next.status !== "recording") scan(true);
    if (next?.status === "recording") scheduleScan();
  });
});

/* ---------------- scheduling ---------------- */

function scheduleScan(): void {
  window.clearTimeout(scanTimer);
  scanTimer = window.setTimeout(() => scan(), OBSERVER_DEBOUNCE_MS);
}

function attachObserver(root: HTMLElement | null): void {
  if (root === observedRoot) return;
  observer?.disconnect();
  observer = null;
  observedRoot = root;
  if (!root) return;
  observer = new MutationObserver(scheduleScan);
  observer.observe(root, { childList: true, subtree: true, characterData: true });
}

const intervalId = window.setInterval(() => {
  if (!extensionAlive()) {
    // The extension was reloaded or updated: this old script must stop.
    window.clearInterval(intervalId);
    observer?.disconnect();
    return;
  }
  const root = findRoot();
  attachObserver(root);
  if (rootWasFound !== (root !== null)) {
    rootWasFound = root !== null;
    console.debug(LOG, rootWasFound ? "Captions detected." : "Captions not detected. Turn on CC in Meet.");
  }
  scan();
}, SCAN_INTERVAL_MS);

/* ---------------- side panel ping ---------------- */

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "MM_PING") return;
  const response: PingResponse = {
    ok: true,
    captionsDetected: findRoot() !== null,
    meetingCode: parseMeetCode(location.href),
  };
  sendResponse(response);
});

/* ---------------- start ---------------- */

chrome.storage.local
  .get(KEYS.active)
  .then((data) => adopt((data[KEYS.active] as ActiveSession | undefined) ?? null))
  .catch(() => undefined);