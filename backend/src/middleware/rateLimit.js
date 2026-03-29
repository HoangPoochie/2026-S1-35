
import rateLimit from "express-rate-limit";
import env from "../config/env.js";

export const publicLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false
});

export const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.ADMIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again later."
  }
});
