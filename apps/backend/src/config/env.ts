
// Loads apps/backend/.env into process.env. Import this file FIRST in server.ts.
import "dotenv/config";

function readPort(value: string | undefined, fallback: number): number {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : fallback;
}

export const env = {
  port: readPort(process.env.PORT, 3001),
  /** Comma-separated list of allowed browser origins (the dashboard, later the extension). */
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  groqApiKey: process.env.GROQ_API_KEY?.trim() ?? "",
};