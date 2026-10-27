/**
 * Ask MeetMind AI: answers a question using ONLY the meeting notes the dashboard sends.
 * Groq is called from here (server side) so GROQ_API_KEY never reaches the browser.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// llama-3.3-70b-versatile was scheduled for shutdown on 2026-08-16; this is Groq's recommended replacement.
const DEFAULT_MODEL = "openai/gpt-oss-120b";
const REQUEST_TIMEOUT_MS = 30_000;

export const MAX_QUESTION_CHARS = 1_000;
const MAX_MEETINGS = 20;
const MAX_NOTES_PER_MEETING = 8_000;
const MAX_CONTEXT_CHARS = 24_000;

export interface MeetingContext {
  title: string;
  notes: string;
}

export class AskError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500
  ) {
    super(message);
    this.name = "AskError";
  }
}

/** Keeps the prompt inside a safe size. The dashboard sends the newest meeting first. */
function buildContext(meetings: MeetingContext[]): string {
  const parts: string[] = [];
  let total = 0;

  for (const meeting of meetings.slice(0, MAX_MEETINGS)) {
    const block = `### ${meeting.title}\n${meeting.notes.slice(0, MAX_NOTES_PER_MEETING)}`;
    if (total + block.length > MAX_CONTEXT_CHARS) break;
    parts.push(block);
    total += block.length;
  }

  return parts.join("\n\n");
}

const NO_NOTES_MARKER = "(No meeting notes are available yet.)";

const SYSTEM_PROMPT = [
  "You are MeetMind AI, a friendly assistant that answers questions about the user's meetings.",
  "You can greet the user and explain what you can do: summarize meetings, list decisions and action items, and answer questions about them.",
  "For any question about meeting content, answer ONLY from the meeting notes provided. Never invent decisions, owners, deadlines or quotes.",
  `If the notes say "${NO_NOTES_MARKER}", tell the user there are no meeting notes yet and that they should generate notes from a transcript first.`,
  "If notes exist but do not contain the answer, say you could not find it in the available meetings.",
  "Mention the meeting title when it helps. Be concise. Use short bullet points for lists.",
  "Reply in the same language the user asked in.",
].join(" ");

export async function askAboutMeetings(question: string, meetings: MeetingContext[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new AskError("The AI service is not configured. Set GROQ_API_KEY on the backend.", 503);
  }

  const context = buildContext(meetings) || NO_NOTES_MARKER;

  const model = process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;
  // gpt-oss models "think" first; keep that short, and leave room in the token budget for it.
  const isReasoningModel = model.startsWith("openai/gpt-oss");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_completion_tokens: isReasoningModel ? 2000 : 700,
        ...(isReasoningModel ? { reasoning_effort: "low", include_reasoning: false } : {}),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Meeting notes:\n\n${context}\n\n---\nQuestion: ${question}` },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      // Log details on the server only; never forward Groq's raw error body to the browser.
      const detail = await response.text().catch(() => "");
      console.error(`[ask] Groq responded ${response.status}: ${detail.slice(0, 300)}`);

      if (/model_decommissioned|model_not_found|decommissioned/i.test(detail)) {
        throw new AskError(
          `The AI model "${model}" is no longer available on Groq. Set GROQ_MODEL in the backend .env to a current model.`,
          502
        );
      }
      if (response.status === 429) {
        throw new AskError("The AI service is busy right now. Please try again in a moment.", 429);
      }
      if (response.status === 401 || response.status === 403) {
        throw new AskError("The AI service rejected the configured API key.", 502);
      }
      throw new AskError("The AI service could not answer right now.", 502);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      throw new AskError("The AI service returned an empty answer.", 502);
    }
    return answer;
  } catch (error) {
    if (error instanceof AskError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AskError("The AI service took too long to respond.", 504);
    }
    console.error("[ask] Unexpected error:", error);
    throw new AskError("Could not reach the AI service.", 502);
  } finally {
    clearTimeout(timer);
  }
}