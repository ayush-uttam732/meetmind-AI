import {
  API_BASE,
  KEYS,
  MAX_HISTORY,
  parseMeetCode,
  type ActiveSession,
  type ChatMessage,
  type PingResponse,
  type SavedSession,
} from "../shared/common";

/* ---------------- small DOM helpers ---------------- */

function $<T extends HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing element: ${selector}`);
  return node;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const ui = {
  backend: $<HTMLSpanElement>("#backend"),
  state: $<HTMLSpanElement>("#state"),
  eyebrow: $<HTMLParagraphElement>("#meeting-eyebrow"),
  title: $<HTMLHeadingElement>("#meeting-title"),
  sub: $<HTMLParagraphElement>("#meeting-sub"),
  hint: $<HTMLParagraphElement>("#hint"),
  consentRow: $<HTMLLabelElement>("#consent-row"),
  consent: $<HTMLInputElement>("#consent"),
  start: $<HTMLButtonElement>("#start"),
  pause: $<HTMLButtonElement>("#pause"),
  resume: $<HTMLButtonElement>("#resume"),
  stop: $<HTMLButtonElement>("#stop"),
  feedback: $<HTMLParagraphElement>("#feedback"),
  chat: $<HTMLDivElement>("#chat"),
  previous: $<HTMLDivElement>("#previous"),
  disclaimer: $<HTMLParagraphElement>("#disclaimer"),
  notes: $<HTMLTextAreaElement>("#notes"),
  saveNotes: $<HTMLButtonElement>("#save"),
  notesFeedback: $<HTMLParagraphElement>("#notes-feedback"),
  taskForm: $<HTMLFormElement>("#task-form"),
  taskInput: $<HTMLInputElement>("#task"),
  tasks: $<HTMLUListElement>("#tasks"),
};

/* ---------------- state ---------------- */

type TabName = "chat" | "previous" | "notes";

let tab: chrome.tabs.Tab | null = null;
let meetingCode: string | null = null;
let pingError = "";
let active: ActiveSession | null = null;
let activeMessages: ChatMessage[] = [];
let history: SavedSession[] = [];
let ping: PingResponse | null = null;
let backendOnline: boolean | null = null;
let currentTab: TabName = "chat";
let openPreviousId: string | null = null;
let renderQueued = false;

/* ---------------- formatting ---------------- */

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDate(ts: number): string {
  const date = new Date(ts);
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${formatTime(ts)}`;
}

function initials(name: string): string {
  const parts = name.replace(/\(.*?\)/g, "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toneOf(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return hash % 6;
}

/** Meet calls the current user "You" in captions. */
function isSelf(speaker: string): boolean {
  return speaker.trim().toLowerCase() === "you";
}

function cleanTitle(raw: string | undefined, code: string): string {
  const title = (raw ?? "").replace(/^Meet\s*[-–]\s*/i, "").trim();
  return !title || title === code ? `Meet ${code}` : title;
}

function pluralMessages(count: number): string {
  return `${count} message${count === 1 ? "" : "s"}`;
}

/* ---------------- chat rendering (WhatsApp style) ---------------- */

function renderMessages(container: HTMLElement, messages: ChatMessage[]): void {
  container.replaceChildren();
  let lastSpeaker: string | null = null;
  let column: HTMLElement | null = null;

  for (const message of messages) {
    if (message.speaker !== lastSpeaker || !column) {
      const self = isSelf(message.speaker);
      const tone = toneOf(message.speaker);
      const group = el("div", `chat-group ${self ? "self" : "other"}`);
      if (!self) group.append(el("div", `avatar tone-${tone}`, initials(message.speaker)));
      column = el("div", "chat-col");
      column.append(el("span", `chat-name tone-${tone}`, self ? "You" : message.speaker));
      group.append(column);
      container.append(group);
      lastSpeaker = message.speaker;
    }
    const bubble = el("div", "bubble");
    bubble.append(el("p", undefined, message.text), el("time", undefined, formatTime(message.ts)));
    column.append(bubble);
  }
}

function renderLiveChat(): void {
  const box = ui.chat;
  const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 70;

  if (activeMessages.length === 0) {
    const text = !active
      ? "The conversation will appear here like a chat once you start a session in a Google Meet call."
      : ping && !ping.captionsDetected
        ? "Waiting for captions. Turn on captions (CC) in Meet."
        : "Waiting for someone to speak...";
    box.replaceChildren(el("div", "empty", text));
    return;
  }

  renderMessages(box, activeMessages);
  if (nearBottom) box.scrollTop = box.scrollHeight;
}

/* ---------------- previous meetings ---------------- */

function previousItem(session: SavedSession): HTMLElement {
  const open = openPreviousId === session.id;
  const card = el("div", "prev");

  const head = el("button", "prev-head");
  const text = el("div");
  text.append(
    el("h3", undefined, session.title),
    el("p", undefined, `${formatDate(session.startedAt)} · ${pluralMessages(session.messages.length)}`)
  );
  head.append(text, el("span", undefined, open ? "▲" : "▼"));
  head.addEventListener("click", () => {
    openPreviousId = open ? null : session.id;
    queueRender();
  });
  card.append(head);

  if (open) {
    const body = el("div", "prev-body");
    const chat = el("div", "chat");
    renderMessages(chat, session.messages);
    const actions = el("div", "prev-actions");
    const remove = el("button", undefined, "Delete this meeting");
    remove.addEventListener("click", () => void deleteSaved(session.id));
    actions.append(remove);
    body.append(chat, actions);
    card.append(body);
  }
  return card;
}

function renderPrevious(): void {
  const box = ui.previous;
  box.replaceChildren();

  if (history.length === 0) {
    box.append(
      el(
        "div",
        "empty",
        "No previous meetings yet. After you stop a session, its conversation is saved on this device and shows up here."
      )
    );
    return;
  }

  const sameRoom = meetingCode ? history.filter((s) => s.meetingCode === meetingCode) : [];
  const others = history.filter((s) => !sameRoom.includes(s));

  if (meetingCode) {
    box.append(el("p", "group-title", "THIS MEETING ROOM"));
    if (sameRoom.length === 0) {
      box.append(el("div", "empty", "No earlier sessions from this meeting link."));
    }
    for (const session of sameRoom) box.append(previousItem(session));
  }

  if (others.length > 0) {
    box.append(el("p", "group-title", meetingCode ? "OTHER MEETINGS" : "ALL MEETINGS"));
    for (const session of others) box.append(previousItem(session));
  }
}

/* ---------------- main render ---------------- */

function setState(label: string, kind: "idle" | "recording" | "paused"): void {
  ui.state.textContent = label;
  ui.state.className = `state ${kind}`;
}

function renderMeeting(): void {
  const onMeet = !!meetingCode;
  const sessionHere = !!active && active.meetingCode === meetingCode;

  // Title area
  if (active) {
    ui.eyebrow.textContent = sessionHere ? "THIS MEETING" : "SESSION IN ANOTHER MEETING";
    ui.title.textContent = active.title;
    ui.sub.textContent = `Started ${formatTime(active.startedAt)} · ${pluralMessages(activeMessages.length)}`;
  } else if (onMeet && tab) {
    ui.eyebrow.textContent = "GOOGLE MEET";
    ui.title.textContent = cleanTitle(tab.title, meetingCode!);
    ui.sub.textContent = meetingCode!;
  } else {
    ui.eyebrow.textContent = "MEETING";
    ui.title.textContent = "No meeting detected";
    ui.sub.textContent = "";
  }

  // State badge
  if (active?.status === "recording") setState("● LIVE", "recording");
  else if (active?.status === "paused") setState("PAUSED", "paused");
  else setState("IDLE", "idle");

  // Hint line
  let hint = "";
  let ok = false;
  if (active && !sessionHere) {
    hint = "A session is running in another Meet tab. Switch to it, or stop it here.";
  } else if (!onMeet && !active) {
    hint = "Open a Google Meet call in this window. Other meeting sites are not supported yet.";
  } else if (onMeet && !ping) {
    hint =
      "Can't reach this Meet tab. Reload the tab once, then this panel connects." +
      (pingError ? ` (${pingError})` : "");
  } else if (ping && !ping.captionsDetected) {
    hint = "Turn on captions (CC) in Meet. MeetMind reads the conversation from them.";
  } else if (ping?.captionsDetected) {
    hint = "Captions detected.";
    ok = true;
  }
  ui.hint.textContent = hint;
  ui.hint.className = ok ? "hint ok" : "hint";

  // Controls
  const canStart = onMeet && !active && !!ping && ui.consent.checked;
  ui.consentRow.hidden = !!active;
  ui.start.hidden = !!active;
  ui.start.disabled = !canStart;
  ui.pause.hidden = active?.status !== "recording";
  ui.resume.hidden = active?.status !== "paused";
  ui.stop.hidden = !active;
}

function renderBackend(): void {
  const on = backendOnline === true;
  ui.backend.className = `pill ${on ? "on" : "off"}`;
  ui.backend.textContent =
    backendOnline === null ? "Backend: checking" : on ? "Backend online" : "Backend offline";
}

function renderTabs(): void {
  document.querySelectorAll<HTMLButtonElement>(".tabs button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === currentTab);
  });
  for (const name of ["chat", "previous", "notes"] as const) {
    $<HTMLElement>(`#tab-${name}`).hidden = name !== currentTab;
  }
}

function render(): void {
  renderQueued = false;
  renderBackend();
  renderMeeting();
  renderTabs();
  renderLiveChat();
  renderPrevious();
}

function queueRender(): void {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(render);
}

let feedbackTimer: number | undefined;
function flash(message: string): void {
  ui.feedback.textContent = message;
  window.clearTimeout(feedbackTimer);
  feedbackTimer = window.setTimeout(() => {
    ui.feedback.textContent = "";
  }, 6000);
}

/* ---------------- session actions ---------------- */

async function startSession(): Promise<void> {
  if (!tab?.id || !meetingCode || active || !ui.consent.checked) return;
  const now = Date.now();
  const session: ActiveSession = {
    id: crypto.randomUUID(),
    meetingCode,
    title: cleanTitle(tab.title, meetingCode),
    tabId: tab.id,
    startedAt: now,
    consentAt: now,
    status: "recording",
  };
  activeMessages = [];
  await chrome.storage.local.set({ [KEYS.active]: session });
  ui.consent.checked = false;
  flash("Session started. Captions from this tab are saved as chat messages.");
}

async function setStatus(status: ActiveSession["status"]): Promise<void> {
  if (!active) return;
  await chrome.storage.local.set({ [KEYS.active]: { ...active, status } });
}

async function stopSession(): Promise<void> {
  if (!active) return;
  const session = active;
  ui.stop.disabled = true;

  // Pausing first makes the Meet tab save its last lines before we read them.
  await setStatus("paused");
  await new Promise((resolve) => window.setTimeout(resolve, 500));

  const key = KEYS.messages(session.id);
  const data = await chrome.storage.local.get([key, KEYS.history]);
  const messages = Array.isArray(data[key]) ? (data[key] as ChatMessage[]) : [];
  const saved = Array.isArray(data[KEYS.history]) ? (data[KEYS.history] as SavedSession[]) : [];

  if (messages.length > 0) {
    saved.unshift({
      id: session.id,
      meetingCode: session.meetingCode,
      title: session.title,
      startedAt: session.startedAt,
      endedAt: Date.now(),
      messages,
    });
  }
  await chrome.storage.local.set({ [KEYS.history]: saved.slice(0, MAX_HISTORY) });
  await chrome.storage.local.remove([KEYS.active, key]);

  ui.stop.disabled = false;
  if (messages.length > 0) {
    flash(`Saved ${pluralMessages(messages.length)}. Find it under Previous.`);
  } else {
    flash("No captions were captured, so nothing was saved. Check that captions (CC) were on.");
  }
}

async function deleteSaved(id: string): Promise<void> {
  if (!window.confirm("Delete this meeting from this device?")) return;
  history = history.filter((s) => s.id !== id);
  openPreviousId = null;
  await chrome.storage.local.set({ [KEYS.history]: history });
  queueRender();
}

/* ---------------- notes & tasks (kept from the old panel) ---------------- */

function addTaskElement(value: string): void {
  const item = el("li");
  const remove = el("button", undefined, "×");
  remove.setAttribute("aria-label", "Remove task");
  remove.style.marginLeft = "8px";
  remove.addEventListener("click", async () => {
    const data = await chrome.storage.local.get(KEYS.tasks);
    const next = ((data[KEYS.tasks] ?? []) as string[]).filter((task) => task !== value);
    await chrome.storage.local.set({ [KEYS.tasks]: next });
    item.remove();
  });
  item.append(el("span", undefined, value), remove);
  ui.tasks.append(item);
}

async function loadNotesAndTasks(): Promise<void> {
  const data = await chrome.storage.local.get([KEYS.notes, KEYS.tasks]);
  ui.notes.value = typeof data[KEYS.notes] === "string" ? (data[KEYS.notes] as string) : "";
  const tasks = Array.isArray(data[KEYS.tasks])
    ? (data[KEYS.tasks] as unknown[]).filter((t): t is string => typeof t === "string")
    : [];
  for (const task of tasks) addTaskElement(task);
}

/* ---------------- data loading ---------------- */

async function loadStored(): Promise<void> {
  const data = await chrome.storage.local.get([KEYS.active, KEYS.history]);
  active = (data[KEYS.active] as ActiveSession | undefined) ?? null;
  history = Array.isArray(data[KEYS.history]) ? (data[KEYS.history] as SavedSession[]) : [];
  activeMessages = [];
  if (active) {
    const stored = await chrome.storage.local.get(KEYS.messages(active.id));
    const list = stored[KEYS.messages(active.id)];
    activeMessages = Array.isArray(list) ? (list as ChatMessage[]) : [];
  }
}

/** Remove message buffers of sessions that no longer exist. */
async function pruneOrphans(): Promise<void> {
  const all = await chrome.storage.local.get(null);
  const keep = active ? KEYS.messages(active.id) : null;
  const stale = Object.keys(all).filter(
    (key) => key.startsWith(KEYS.messagesPrefix) && key !== keep
  );
  if (stale.length > 0) await chrome.storage.local.remove(stale);
}

async function refreshTab(): Promise<void> {
  const [current] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  tab = current ?? null;
  meetingCode = parseMeetCode(tab?.url);
  await refreshPing();
  queueRender();
}

let pingInFlight = false;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    promise.then(
      (value) => { window.clearTimeout(timer); resolve(value); },
      (error) => { window.clearTimeout(timer); reject(error); }
    );
  });
}

async function refreshPing(): Promise<void> {
  if (!tab?.id || !meetingCode) {
    ping = null;
    pingError = "";
    return;
  }
  if (pingInFlight) return;
  pingInFlight = true;
  const tabId = tab.id;
  const send = async (): Promise<PingResponse> => {
    const reply = (await withTimeout(chrome.tabs.sendMessage(tabId, { type: "MM_PING" }), 2500, "ping")) as
      | PingResponse
      | undefined;
    if (!reply || reply.ok !== true) throw new Error("no reply from the Meet tab");
    return reply;
  };
  try {
    try {
      ping = await send();
      pingError = "";
    } catch (first) {
      // Content script not running in this tab (opened before the extension was loaded, or Chrome
      // did not inject it). Inject it now so a reload is not needed.
      try {
        await withTimeout(chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] }), 4000, "inject");
        ping = await send();
        pingError = "";
      } catch (second) {
        ping = null;
        pingError = String((second as Error)?.message || second || (first as Error)?.message || first || "unknown error");
        console.warn("[MeetMind] cannot reach Meet tab:", first, second);
      }
    }
  } finally {
    pingInFlight = false;
  }
}

async function checkBackend(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    backendOnline = response.ok;
  } catch {
    backendOnline = false;
  }
  queueRender();
}

/* ---------------- wiring ---------------- */

document.querySelectorAll<HTMLButtonElement>(".tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    currentTab = (button.dataset.tab as TabName) ?? "chat";
    queueRender();
  });
});

ui.consent.addEventListener("change", queueRender);
ui.start.addEventListener("click", () => void startSession());
ui.pause.addEventListener("click", () => void setStatus("paused"));
ui.resume.addEventListener("click", () => void setStatus("recording"));
ui.stop.addEventListener("click", () => void stopSession());

ui.saveNotes.addEventListener("click", async () => {
  await chrome.storage.local.set({ [KEYS.notes]: ui.notes.value });
  ui.notesFeedback.textContent = "Notes saved on this device.";
});

ui.taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = ui.taskInput.value.trim();
  if (!value) return;
  const data = await chrome.storage.local.get(KEYS.tasks);
  await chrome.storage.local.set({ [KEYS.tasks]: [...((data[KEYS.tasks] ?? []) as string[]), value] });
  addTaskElement(value);
  ui.taskForm.reset();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;

  if (changes[KEYS.active]) {
    const next = (changes[KEYS.active].newValue as ActiveSession | undefined) ?? null;
    if (next?.id !== active?.id) activeMessages = [];
    active = next;
    void refreshPing().then(queueRender);
  }
  if (changes[KEYS.history]) {
    history = Array.isArray(changes[KEYS.history].newValue)
      ? (changes[KEYS.history].newValue as SavedSession[])
      : [];
  }
  if (active && changes[KEYS.messages(active.id)]) {
    const list = changes[KEYS.messages(active.id)].newValue;
    activeMessages = Array.isArray(list) ? (list as ChatMessage[]) : [];
  }
  queueRender();
});

chrome.tabs.onActivated.addListener(() => void refreshTab());
chrome.tabs.onUpdated.addListener((_id, info, updated) => {
  if (updated.active && (info.status === "complete" || info.title || info.url)) void refreshTab();
});

window.setInterval(() => {
  if (meetingCode) void refreshPing().then(queueRender);
}, 3000);
window.setInterval(() => void checkBackend(), 15000);

async function init(): Promise<void> {
  await loadStored();
  await Promise.all([loadNotesAndTasks(), pruneOrphans(), refreshTab(), checkBackend()]);
  queueRender();
}

void init();