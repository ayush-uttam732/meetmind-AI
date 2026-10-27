import cors from "cors";
import { env } from "./env";

export const corsMiddleware = cors({
  origin(origin, callback) {
    // No Origin header = curl, server-to-server or same-origin requests: allow.
    if (!origin || env.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
});