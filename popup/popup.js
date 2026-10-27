
const openPanel = document.getElementById("openPanel");
const demoToggle = document.getElementById("demoToggle");
const meetingStatus = document.getElementById("meetingStatus");

async function restoreDemoState() {
  try {
    const result = await chrome.storage.local.get("demoSession");
    const running = result.demoSession === true;

    demoToggle.textContent = running
      ? "■ Stop demo session"
      : "▶ Start demo session";

    demoToggle.classList.toggle("active", running);

    meetingStatus.textContent = running
      ? "Demo session running"
      : "Ready when you are";
  } catch (error) {
    console.error("Could not restore demo state:", error);
  }
}

openPanel.addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab || !tab.windowId) {
      throw new Error("No active Chrome tab found.");
    }

    if (!chrome.sidePanel?.open) {
      throw new Error(
        "Side Panel API unavailable. Check your manifest and Chrome version."
      );
    }

    await chrome.sidePanel.open({
      windowId: tab.windowId
    });

    window.close();
  } catch (error) {
    console.error("Could not open MeetMind panel:", error);

    alert(
      "MeetMind panel open nahi hua.\n\n" +
      error.message +
      "\n\nchrome://extensions par manifest aur errors check karein."
    );
  }
});

demoToggle.addEventListener("click", async () => {
  try {
    const result = await chrome.storage.local.get("demoSession");
    const running = result.demoSession !== true;

    await chrome.storage.local.set({
      demoSession: running
    });

    demoToggle.textContent = running
      ? "■ Stop demo session"
      : "▶ Start demo session";

    demoToggle.classList.toggle("active", running);

    meetingStatus.textContent = running
      ? "Demo session running"
      : "Ready when you are";
  } catch (error) {
    console.error("Could not update demo session:", error);
    alert("Demo session update nahi hui. Console mein error check karein.");
  }
});

restoreDemoState();