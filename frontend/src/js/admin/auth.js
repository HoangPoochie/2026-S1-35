import { login, logout, getMe } from "../api/endpoints.js";

// Redirect to login if current session not authenticated - call this at the top of any protected admin page script
export async function requireAuth() {
  try {
    await getMe();
  } catch {
    window.location.href = "/src/pages/admin/login.html";
  }
}

// Logs the admin out and redirects to the login page
export async function logoutUser() {
  try {
    await logout();
  } finally {
    window.location.href = "/src/pages/admin/login.html";
  }
}

// Login page logic
const form = document.getElementById("login-form");
if (form) {
  const errorEl = document.getElementById("login-error");

  // If already authenticated, skip
  getMe()
    .then(() => {
      window.location.href = "/src/pages/admin/dashboard.html";
    })
    .catch(() => {
      // Not logged in, stay on login page
    });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
      await login(username, password);
      window.location.href = "/src/pages/admin/dashboard.html";
    } catch (err) {
      const msg =
        err.response?.data?.message || "Login failed. Please try again.";
      errorEl.textContent = msg;
    }
  });
}
