import { Router } from "express";
import {
  AskError,
  MAX_QUESTION_CHARS,
  askAboutMeetings,
  type MeetingContext,
} from "../services/ask.service";

const router = Router();

function parseMeetings(value: unknown): MeetingContext[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { title, notes } = item as Record<string, unknown>;
    if (typeof notes !== "string" || !notes.trim()) return [];
    return [
      {
        title: typeof title === "string" && title.trim() ? title.trim() : "Untitled Meeting",
        notes: notes.trim(),
      },
    ];
  });
}

/** POST /api/ai-notes/ask  body: { question: string, meetings: { title, notes }[] }  ->  { answer } */
router.post("/ask", async (req, res) => {
  const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
  if (!question) {
    res.status(400).json({ message: "Please enter a question." });
    return;
  }
  if (question.length > MAX_QUESTION_CHARS) {
    res.status(400).json({ message: `Question is too long (max ${MAX_QUESTION_CHARS} characters).` });
    return;
  }

  // Meetings may be empty: the AI then explains that notes must be generated first.
  const meetings = parseMeetings(req.body?.meetings);

  try {
    const answer = await askAboutMeetings(question, meetings);
    res.json({ answer });
  } catch (error) {
    if (error instanceof AskError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error("[ask] Unhandled error:", error);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});

export default router;