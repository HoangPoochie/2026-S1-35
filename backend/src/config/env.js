
import dotenv from "dotenv";

dotenv.config();

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: toNumber(process.env.PORT, 8080),

  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",

  DB_HOST: process.env.DB_HOST || "127.0.0.1",
  DB_PORT: toNumber(process.env.DB_PORT, 3306),
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,

  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_RECOVERY_KEY: process.env.ADMIN_RECOVERY_KEY,

  SESSION_SECRET:
    process.env.SESSION_SECRET,
  SESSION_NAME: process.env.SESSION_NAME,
  SESSION_TIMEOUT_MS: toNumber(process.env.SESSION_TIMEOUT_MS, 30 * 60 * 1000),
  SESSION_COOKIE_SECURE: toBoolean(process.env.SESSION_COOKIE_SECURE, false),
  SESSION_COOKIE_SAMESITE: process.env.SESSION_COOKIE_SAMESITE || "lax",

  RATE_LIMIT_WINDOW_MS: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  RATE_LIMIT_MAX: toNumber(process.env.RATE_LIMIT_MAX, 120),
  ADMIN_RATE_LIMIT_MAX: toNumber(process.env.ADMIN_RATE_LIMIT_MAX, 10),

  UPLOAD_DIR: process.env.UPLOAD_DIR,
  MAX_UPLOAD_MB: toNumber(process.env.MAX_UPLOAD_MB, 5),
  MAX_VIDEO_UPLOAD_MB: toNumber(process.env.MAX_VIDEO_UPLOAD_MB, 50),

};

export default env;
