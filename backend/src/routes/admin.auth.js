import { Router } from "express";
import { z } from "zod";
import { timingSafeEqual } from "crypto";
import bcrypt from "bcrypt";

import env from "../config/env.js";
import { getAdminSessionExpiry, requireAdmin } from "../middleware/auth.js";
import { adminAuthLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { uploadJournalPdf } from "../middleware/upload.js";

// IMPORTANT:
// Change this import to match your actual database file.
import db from "../db/index.js";

const router = Router();

const recoverPasswordSchema = z.object({
  recoveryKey: z.string().min(1),
  newPassword: z.string().min(8)
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

function safeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  return timingSafeEqual(aBuf, bBuf);
}

async function getStoredAdminCredential(username) {
  const [rows] = await db.query(
    "SELECT username, password_hash FROM admin_credentials WHERE username = ? LIMIT 1",
    [username]
  );

  return rows[0] || null;
}

async function isValidAdminPassword(username, password) {
  const storedAdmin = await getStoredAdminCredential(username);

  // If password has already been changed, check MySQL hash.
  if (storedAdmin) {
    return bcrypt.compare(password, storedAdmin.password_hash);
  }

  // First-time fallback: check .env temporary password.
  const usernameOk = safeEqual(username, env.ADMIN_USERNAME);
  const passwordOk = safeEqual(password, env.ADMIN_PASSWORD);

  return usernameOk && passwordOk;
}

router.post(
  "/login",
  adminAuthLimiter,
  validate(loginSchema),
  async (req, res) => {
    const { username, password } = req.body;

    try {
      const isValidPassword = await isValidAdminPassword(username, password);

      if (!isValidPassword) {
        return res.status(401).json({
          error: "Invalid credentials."
        });
      }

      const loggedInAt = new Date().toISOString();

      req.session.admin = {
        username,
        loggedIn: true,
        loggedInAt,
        expiresAt: getAdminSessionExpiry(loggedInAt)
      };

      return res.json({
        ok: true,
        admin: req.session.admin
      });
    } catch (error) {
      console.error("Login error:", error);

      return res.status(500).json({
        error: "Failed to login."
      });
    }
  }
);

router.patch(
  "/change-password",
  requireAdmin,
  validate(changePasswordSchema),
  async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
      const username = req.session.admin?.username;

      if (!username) {
        return res.status(401).json({
          error: "Not logged in."
        });
      }

      const currentPasswordCorrect = await isValidAdminPassword(
        username,
        currentPassword
      );

      if (!currentPasswordCorrect) {
        return res.status(401).json({
          error: "Current password is incorrect."
        });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      await db.query(
        `
        INSERT INTO admin_credentials (username, password_hash)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
          password_hash = VALUES(password_hash)
        `,
        [username, newPasswordHash]
      );

      return res.json({
        ok: true,
        message: "Password changed successfully."
      });
    } catch (error) {
      console.error("Change password error:", error);

      return res.status(500).json({
        error: "Failed to change password."
      });
    }
  }
);

router.patch(
  "/recover-password",
  adminAuthLimiter,
  validate(recoverPasswordSchema),
  async (req, res) => {
    const { recoveryKey, newPassword } = req.body;

    try {
      if (!env.ADMIN_RECOVERY_KEY) {
        return res.status(500).json({
          error: "Password recovery is not configured."
        });
      }

      const recoveryKeyOk = safeEqual(recoveryKey, env.ADMIN_RECOVERY_KEY);

      if (!recoveryKeyOk) {
        return res.status(401).json({
          error: "Invalid recovery key."
        });
      }

      const username = env.ADMIN_USERNAME;
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      await db.query(
        `
        INSERT INTO admin_credentials (username, password_hash)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
          password_hash = VALUES(password_hash)
        `,
        [username, newPasswordHash]
      );

      return res.json({
        ok: true,
        message: "Password recovered successfully."
      });
    } catch (error) {
      console.error("Recover password error:", error);

      return res.status(500).json({
        error: "Failed to recover password."
      });
    }
  }
);

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/me", requireAdmin, (req, res) => {
  res.json({
    admin: req.session.admin
  });
});

router.post(
  "/journal",
  requireAdmin,
  uploadJournalPdf.single("journalPdf"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: "No journal PDF uploaded."
      });
    }

    return res.json({
      ok: true,
      message: "Journal PDF uploaded successfully.",
      path: "/uploads/documents/journal.pdf"
    });
  }
);

export default router;