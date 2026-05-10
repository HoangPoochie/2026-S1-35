// dashboard.js
import {
  getCurrentAdmin,
  logoutAdmin,
  redirectToAdminLogin,
  scheduleAdminSessionTimeout
} from "./auth.js";

async function initDashboard() {
  try {
    const data = await getCurrentAdmin();
    scheduleAdminSessionTimeout(data.admin);

    const adminName = document.getElementById("admin-name");
    if (adminName) {
      adminName.textContent = data.admin.username;
    }
  } catch {
    redirectToAdminLogin();
  }
}

const logoutButton = document.getElementById("logout-button");

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      await logoutAdmin();
    } finally {
      redirectToAdminLogin();
    }
  });
}

initDashboard();
