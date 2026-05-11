
import env from "../config/env.js";

function destroyExpiredSession(req, res) {
  req.session.destroy(() => {
    res.status(401).json({
      code: "SESSION_EXPIRED",
      message: "Session expired. Please log in again."
    });
  });
}

export function getAdminSessionExpiry(loggedInAt) {
  const loginTime = Date.parse(loggedInAt);

  if (!Number.isFinite(loginTime)) {
    return null;
  }

  return new Date(loginTime + env.SESSION_TIMEOUT_MS).toISOString();
}

export function requireAdmin(req, res, next) {
  const admin = req.session?.admin;

  if (!admin?.loggedIn) {
    const hadSessionCookie = req.headers.cookie
      ?.split(";")
      .some((cookie) => cookie.trim().startsWith(`${env.SESSION_NAME}=`));

    if (hadSessionCookie) {
      return res.status(401).json({
        code: "SESSION_EXPIRED",
        message: "Session expired. Please log in again."
      });
    }

    return res.status(401).json({
      message: "Unauthorized"
    });
  }

  const expiresAt = admin.expiresAt || getAdminSessionExpiry(admin.loggedInAt);
  const expiryTime = Date.parse(expiresAt);

  if (!Number.isFinite(expiryTime) || Date.now() >= expiryTime) {
    return destroyExpiredSession(req, res);
  }

  admin.expiresAt = expiresAt;
  req.session.admin = admin;

  return next();
}
