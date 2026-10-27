
(() => {
  const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]);

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (!allowedOrigins.has(event.origin)) return;

    const message = event.data;

    if (!message || message.type !== "MEETMIND_PING") return;
    if (typeof message.requestId !== "string") return;

    chrome.runtime.sendMessage(
      {
        type: "MEETMIND_PING",
        requestId: message.requestId,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          window.postMessage(
            {
              type: "MEETMIND_PONG",
              requestId: message.requestId,
              success: false,
              message: "MeetMind extension did not respond.",
            },
            event.origin
          );
          return;
        }

        window.postMessage(
          {
            type: "MEETMIND_PONG",
            requestId: message.requestId,
            ...response,
          },
          event.origin
        );
      }
    );
  });
})();