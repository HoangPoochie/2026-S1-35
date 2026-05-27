// app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import morgan from "morgan";

import env from "./config/env.js";
import logger from "./utils/logger.js";
import { publicLimiter } from "./middleware/rateLimit.js";
import { resolveUploadDir } from "./utils/media.js";

import healthRoutes from "./routes/health.js";
import publicContentRoutes from "./routes/public.content.js";
import publicSurveyRoutes from "./routes/public.surveys.js";
import adminAuthRoutes from "./routes/admin.auth.js";
import adminContentRoutes from "./routes/admin.content.js";
import adminReportRoutes from "./routes/admin.reports.js";
import adminUploadRoutes from "./routes/admin.uploads.js";
import activityRoutes from "./routes/admin.activity.js";

const app = express();

app.set("trust proxy", 1);

const corsOrigins = new Set(
  String(env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

corsOrigins.add("http://localhost:5173");
corsOrigins.add("http://127.0.0.1:5173");
corsOrigins.add("http://0.0.0.0:5173");

function allowCorsOrigin(origin, callback) {
  if (!origin || corsOrigins.has(origin)) {
    callback(null, true);
    return;
  }

  callback(null, false);
}

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin: allowCorsOrigin,
    credentials: true
  })
);

app.use(morgan("dev", { stream: logger.stream }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: env.SESSION_NAME,
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.SESSION_COOKIE_SECURE,
      sameSite: env.SESSION_COOKIE_SAMESITE,
      maxAge: env.SESSION_TIMEOUT_MS * 2
    }
  })
);

app.use(publicLimiter);

app.use("/uploads", express.static(resolveUploadDir(env.UPLOAD_DIR)));

app.use(healthRoutes);
app.use("/api/content", publicContentRoutes);
app.use("/api/surveys", publicSurveyRoutes);
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin", adminContentRoutes);
app.use("/api/admin/reports", adminReportRoutes);
app.use("/api/admin", adminUploadRoutes);
app.use("/api/activity", activityRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

app.use((error, req, res, next) => {
  if (error.name === "MulterError") {
    return res.status(400).json({
      message: error.message
    });
  }

  if (
    error.message === "Only JPG, PNG, and WEBP images are allowed." ||
    error.message === "Only MP4, WEBM, MOV, and OGG videos are allowed."
  ) {
    return res.status(400).json({
      message: error.message
    });
  }

  logger.error("Unhandled error", {
    message: error.message,
    stack: error.stack
  });

  res.status(500).json({
    message: "Internal server error"
  });
});

export default app;
