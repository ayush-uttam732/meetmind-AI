import { KEYS, type ActiveSession } from "../shared/common";

/* Clicking the toolbar icon opens the side panel. */
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);

/* Toolbar badge: REC while recording, II while paused. */
function updateBadge(session: ActiveSession | null | undefined): void {
  if (session?.status === "recording") {
    void chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
    void chrome.action.setBadgeText({ text: "REC" });
  } else if (session?.status === "paused") {
    void chrome.action.setBadgeBackgroundColor({ color: "#d97706" });
    void chrome.action.setBadgeText({ text: "II" });
  } else {
    void chrome.action.setBadgeText({ text: "" });
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[KEYS.active]) {
    updateBadge(changes[KEYS.active].newValue as ActiveSession | undefined);
  }
});

chrome.runtime.onStartup.addListener(() => {
  void chrome.storage.local.get(KEYS.active).then((data) => updateBadge(data[KEYS.active] as ActiveSession | undefined));
});

/*
 * The dashboard's "Connect Extension" button calls chrome.runtime.sendMessage(extensionId, ...).
 * Only pages listed under externally_connectable in manifest.json can reach this.
 */
chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (message?.type === "MEETMIND_PING") {
    sendResponse({
      success: true,
      name: "MeetMind AI",
      status: "connected",
      version: chrome.runtime.getManifest().version,
    });
  }
});