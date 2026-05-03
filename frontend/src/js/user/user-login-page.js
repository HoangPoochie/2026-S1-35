import { getCurrentUser, loginUser } from "./user-auth.js";

const form = document.getElementById("user-login-form");
const errorMessage = document.getElementById("error-message");

const existingUser = getCurrentUser();

if (existingUser) {
  window.location.href = "/home.html";
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const displayName = document.getElementById("display-name").value.trim();
    const cohortCode = document.getElementById("cohort-code").value.trim();

    errorMessage.textContent = "";

    if (!displayName) {
      errorMessage.textContent = "Please enter your name.";
      return;
    }

    loginUser(displayName, cohortCode);
    window.location.href = "/home.html";
  });
}