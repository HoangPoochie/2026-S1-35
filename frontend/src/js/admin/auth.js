// auth.js
import { apiFetch } from "../api/client.js";
import { endpoints } from "../api/endpoints.js";

let sessionTimeoutTimer = null;
const ADMIN_LOGIN_PATH = "/src/admin/admin.html";

export async function loginAdmin(username, password) {
  return apiFetch(endpoints.adminLogin, {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

export async function logoutAdmin() {
  return apiFetch(endpoints.adminLogout, {
    method: "POST"
  });
}

export async function getCurrentAdmin() {
  return apiFetch(endpoints.adminMe, {
    method: "GET"
  });
}

export function redirectToAdminLogin() {
  if (sessionTimeoutTimer) {
    clearTimeout(sessionTimeoutTimer);
    sessionTimeoutTimer = null;
  }

  if (window.location.pathname !== ADMIN_LOGIN_PATH) {
    window.location.href = ADMIN_LOGIN_PATH;
  }
}

export function scheduleAdminSessionTimeout(admin) {
  if (sessionTimeoutTimer) {
    clearTimeout(sessionTimeoutTimer);
    sessionTimeoutTimer = null;
  }

  const expiryTime = Date.parse(admin?.expiresAt);

  if (!Number.isFinite(expiryTime)) {
    return;
  }

  const delay = expiryTime - Date.now();

  if (delay <= 0) {
    redirectToAdminLogin();
    return;
  }

  sessionTimeoutTimer = setTimeout(redirectToAdminLogin, delay);
}
