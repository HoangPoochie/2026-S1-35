
import { Router } from "express";
import { z } from "zod";
import { timingSafeEqual } from "crypto";
import env from "../config/env.js";
import { adminAuthLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

function safeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  return timingSafeEqual(aBuf, bBuf);
}

router.post("/login", adminAuthLimiter, validate(loginSchema), (req, res) => {
  const usernameOk = safeEqual(req.body.username, env.ADMIN_USERNAME);
  const passwordOk = safeEqual(req.body.password, env.ADMIN_PASSWORD);

  if (!usernameOk || !passwordOk) {
    return res.status(401).json({
      message: "Invalid credentials"
    });
  }

  req.session.admin = {
    username: env.ADMIN_USERNAME,
    loggedIn: true,
    loggedInAt: new Date().toISOString()
  };

  return res.json({
    ok: true,
    admin: req.session.admin
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/me", (req, res) => {
  if (!req.session?.admin?.loggedIn) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.json({
    admin: req.session.admin
  });
});

export default router;
