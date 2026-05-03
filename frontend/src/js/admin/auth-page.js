// auth-page.js
import { loginAdmin, getCurrentAdmin } from "./auth.js";

const form = document.getElementById("login-form");
const errorMessage = document.getElementById("error-message");

async function checkExistingSession() {
  try {
    await getCurrentAdmin();
    window.location.href = "/src/pages/admin/dashboard.html";
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
      await loginAdmin(username, password);
        window.location.href = "/src/pages/admin/dashboard.html";
    } catch (error) {
      errorMessage.textContent = error.message;
    }
  });
}

checkExistingSession();