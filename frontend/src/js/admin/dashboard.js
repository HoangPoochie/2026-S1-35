// dashboard.js
import { getCurrentAdmin, logoutAdmin } from "./auth.js";

async function initDashboard() {
  try {
    const data = await getCurrentAdmin();

    const adminName = document.getElementById("admin-name");
    if (adminName) {
      adminName.textContent = data.admin.username;
    }
  } catch {
    window.location.href = "/src/pages/admin/login.html";
  }
}

const logoutButton = document.getElementById("logout-button");

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      await logoutAdmin();
    } finally {
      window.location.href = "/src/pages/admin/login.html";
    }
  });
}

initDashboard();