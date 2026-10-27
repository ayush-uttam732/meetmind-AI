import express from "express";
import cors from "cors";
import helmet from "helmet";
import { WebSocketServer } from "ws";
import { createServer } from "node:http";

import aiNotesRouter from "./routes/aiNotes";
import askRouter from "./routes/ask.routes";    

const app = express();
const server = createServer(app);
const port = Number(process.env.PORT) || 3001;

app.use(helmet());
// Dashboard dev server: localhost ya 127.0.0.1, kisi bhi port par
const LOCAL_DEV_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      origin.startsWith("chrome-extension://") ||
      LOCAL_DEV_ORIGIN.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error("Origin not allowed by CORS"));
    }
  }
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    name: "MeetMind AI API",
    status: "running"
  });
});

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (socket) => {
  socket.send(JSON.stringify({
    type: "CONNECTED",
    message: "MeetMind AI WebSocket connected"
  }));

  socket.on("error", (error) => {
    console.error("WebSocket error:", error.message);
  });
});

app.use("/api/ai-notes", aiNotesRouter);
app.use("/api/ai-notes", askRouter); 

server.listen(port, () => {
  console.log(`MeetMind API: http://localhost:${port}`);
  console.log(`WebSocket: ws://localhost:${port}/ws`);
});
