const button = document.querySelector<HTMLButtonElement>("#open-panel");
const message = document.querySelector<HTMLParagraphElement>("#message");

button?.addEventListener("click", async () => {
  try {
    const tab = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab[0]?.windowId !== undefined) {
      await chrome.sidePanel.open({ windowId: tab[0].windowId });
      window.close();
    } else if (message) {
      message.textContent = "Open a browser tab and try again.";
    }
  } catch {
    if (message) message.textContent = "Could not open the panel. Try again.";
  }
});
