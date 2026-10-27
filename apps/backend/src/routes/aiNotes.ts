import dotenv from "dotenv";
import path from "node:path";
// apps/backend hatakar direct .env resolve karein
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

console.log(
  "Groq API key loaded:",
  Boolean(process.env.GROQ_API_KEY)
);

import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const apiKey = process.env.GROQ_API_KEY;

console.log("Groq key loaded:", Boolean(apiKey));
console.log("Groq key length:", apiKey?.length ?? 0);

const ai = apiKey
  ? new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    })
  : null;

router.post("/generate", async (req, res) => {
  try {
    const transcript = req.body?.transcript;

    if (
      typeof transcript !== "string" ||
      transcript.trim().length < 20
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide a meeting transcript of at least 20 characters.",
      });
      return;
    }

    if (transcript.length > 50000) {
      res.status(413).json({
        success: false,
        message: "Transcript is too long. Please split it into smaller parts.",
      });
      return;
    }

    if (!ai) {
      res.status(503).json({
        success: false,
        message: "GROQ_API_KEY is missing in the backend .env file.",
      });
      return;
    }

    const completion = await ai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are MeetMind AI, a professional meeting assistant.
Analyze the transcript and return valid JSON with this structure:
{
  "title": "short meeting title",
  "summary": "concise meeting summary",
  "keyPoints": ["important points"],
  "decisions": ["decisions actually made"],
  "actionItems": [
    {
      "task": "specific next step",
      "owner": "person's name or Unassigned",
      "dueDate": "stated deadline or Not specified"
    }
  ],
  "followUps": ["open questions or follow-up topics"]
}
Do not invent decisions, people, deadlines, or facts.
If something is not stated, say so.
Use the language most commonly used in the transcript.
          `.trim(),
        },
        {
          role: "user",
          content: transcript,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("The AI returned an empty response.");
    }

    const notes = JSON.parse(content);

    res.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error("AI notes generation failed:", error);

    res.status(500).json({
      success: false,
      message: "Could not generate meeting notes. Please try again.",
    });
  }
});

export default router;