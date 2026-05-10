// auth-page.js
import {
  getCurrentAdmin,
  loginAdmin,
  scheduleAdminSessionTimeout
} from "./auth.js";

const form = document.getElementById("login-form");
const errorMessage = document.getElementById("error-message");

async function checkExistingSession() {
  try {
    const data = await getCurrentAdmin();
    scheduleAdminSessionTimeout(data.admin);
    window.location.href = "/src/admin/dashboard.html";
  } catch {
    // stay on login page
  }
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    errorMessage.textContent = "";

    try {
      const data = await loginAdmin(username, password);
      scheduleAdminSessionTimeout(data.admin);
      window.location.href = "/src/admin/dashboard.html";
    } catch (error) {
      errorMessage.textContent = error.message;
    }
  });
}

checkExistingSession();
