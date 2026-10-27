const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export interface MeetingContext {
  title: string;
  notes: string;
}

/** Calls POST /api/ai-notes/ask on the backend (which talks to Groq). */
export async function askMeetMind(
  question: string,
  meetings: MeetingContext[],
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(`${API_URL}/api/ai-notes/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: question.trim(), meetings }),
    signal,
  });

  const data = (await response.json().catch(() => null)) as {
    answer?: unknown;
    message?: unknown;
    error?: unknown;
  } | null;

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : typeof data?.error === "string"
          ? data.error
          : `Request failed (${response.status}).`;
    throw new Error(message);
  }

  if (typeof data?.answer !== "string" || !data.answer.trim()) {
    throw new Error("The AI returned an empty answer.");
  }
  return data.answer;
}