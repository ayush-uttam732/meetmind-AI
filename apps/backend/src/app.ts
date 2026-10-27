import express, { type ErrorRequestHandler } from "express";
import { corsMiddleware } from "./config/cors";
import healthRoutes from "./routes/health.routes";
import askRoutes from "./routes/ask.routes";

export const app = express();

app.use(corsMiddleware);
// Meeting notes can be long, so allow a bigger JSON body than Express' 100kb default.
app.use(express.json({ limit: "2mb" }));

app.use("/api", healthRoutes);
app.use("/api/ai-notes", askRoutes);
// TODO: mount the transcript -> notes route here too if it is not part of this app yet:
// app.use("/api/ai-notes", notesRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof SyntaxError) {
    res.status(400).json({ message: "Request body is not valid JSON." });
    return;
  }
  if (error instanceof Error && error.message.includes("not allowed by CORS")) {
    res.status(403).json({ message: error.message });
    return;
  }
  console.error("[app] Unhandled error:", error);
  res.status(500).json({ message: "Something went wrong. Please try again." });
};
app.use(errorHandler);