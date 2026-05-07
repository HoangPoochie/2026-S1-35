import {
  getCurrentAdmin,
  redirectToAdminLogin,
  scheduleAdminSessionTimeout
} from "./auth.js";

async function protectPage() {
  try {
    const data = await getCurrentAdmin();
    scheduleAdminSessionTimeout(data.admin);
  } catch {
    redirectToAdminLogin();
  }
}

protectPage();
