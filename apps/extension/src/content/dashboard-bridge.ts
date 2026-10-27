const allowedOrigins = new Set([
  "http://127.0.0.1:5173",
  "http://localhost:5173",
]);

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (!allowedOrigins.has(event.origin)) return;

  const message = event.data;

  if (message?.type !== "MEETMIND_PING") return;
  if (typeof message.requestId !== "string") return;

  chrome.runtime.sendMessage(
    { type: "MEETMIND_PING" },
    (response) => {
      const error = chrome.runtime.lastError;

      window.postMessage(
        {
          type: "MEETMIND_PONG",
          requestId: message.requestId,
          success: !error && response?.success === true,
          status: error ? "error" : response?.status,
          name: response?.name,
          message: error?.message || response?.message,
        },
        event.origin
      );
    }
  );
});