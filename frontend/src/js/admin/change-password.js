import {
  getCurrentAdmin,
  changeAdminPassword,
  scheduleAdminSessionTimeout
} from "./auth.js";

const form = document.getElementById("change-password-form");
const errorMessage = document.getElementById("error-message");

async function protectPage() {
  try {
    const data = await getCurrentAdmin();
    scheduleAdminSessionTimeout(data.admin);
  } catch {
    window.location.href = "/src/admin/admin.html";
  }
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    errorMessage.textContent = "";
    errorMessage.style.color = "#C62828";

    if (newPassword !== confirmPassword) {
      errorMessage.textContent = "New passwords do not match.";
      return;
    }

    if (newPassword.length < 8) {
      errorMessage.textContent = "New password must be at least 8 characters.";
      return;
    }

    try {
      await changeAdminPassword(currentPassword, newPassword);

      errorMessage.style.color = "#2E7D32";
      errorMessage.textContent = "Password changed successfully.";
      form.reset();
    } catch (error) {
      errorMessage.style.color = "#C62828";
      errorMessage.textContent = error.message;
    }
  });
}

protectPage();