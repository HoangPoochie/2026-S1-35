
import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import morgan from "morgan";

import env from "./config/env.js";
import logger from "./utils/logger.js";
import { publicLimiter } from "./middleware/rateLimit.js";

import healthRoutes from "./routes/health.js";
import publicContentRoutes from "./routes/public.content.js";
import publicSurveyRoutes from "./routes/public.surveys.js";
import adminAuthRoutes from "./routes/admin.auth.js";
import adminContentRoutes from "./routes/admin.content.js";
import adminReportRoutes from "./routes/admin.reports.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
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
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use(publicLimiter);

app.use(healthRoutes);
app.use("/api/content", publicContentRoutes);
app.use("/api/surveys", publicSurveyRoutes);
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin", adminContentRoutes);
app.use("/api/admin/reports", adminReportRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

app.use((error, req, res, next) => {
  logger.error("Unhandled error", {
    message: error.message,
    stack: error.stack
  });

  res.status(500).json({
    message: "Internal server error"
  });
});

export default app;
