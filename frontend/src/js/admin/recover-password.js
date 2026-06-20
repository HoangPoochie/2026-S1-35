import { recoverAdminPassword } from "./auth.js";

const form = document.getElementById("recover-password-form");
const errorMessage = document.getElementById("error-message");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const recoveryKey = document.getElementById("recovery-key").value;
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
      await recoverAdminPassword(recoveryKey, newPassword);

      errorMessage.style.color = "#2E7D32";
      errorMessage.textContent = "Password reset successfully. You can now log in.";
      form.reset();
    } catch (error) {
      errorMessage.style.color = "#C62828";
      errorMessage.textContent = error.message;
    }
  });
}