const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Request failed.");
  }
  return data as T;
}

/** Real endpoint: transcript -> AI notes. */
export async function generateNotes(title: string, transcript: string): Promise<string> {
  const data = await postJson<{ notes?: unknown }>("/api/ai-notes/generate", {
    title: title.trim() || "Untitled Meeting",
    transcript: transcript.trim(),
  });
  return typeof data.notes === "string" ? data.notes : JSON.stringify(data.notes ?? data, null, 2);
}

/** Backend endpoint still to be built: POST /api/ai-notes/ask { question } -> { answer } */
export async function askMeetMind(question: string): Promise<string> {
  const data = await postJson<{ answer?: unknown }>("/api/ai-notes/ask", { question: question.trim() });
  return typeof data.answer === "string" ? data.answer : JSON.stringify(data, null, 2);
}