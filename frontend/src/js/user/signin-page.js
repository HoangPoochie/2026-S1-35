import { getCurrentUser, signInUser } from "./user-auth.js";

const form = document.getElementById("signin-form");
const errorMessage = document.getElementById("error-message");

const existingUser = getCurrentUser();

if (existingUser) {
  window.location.href = "/home.html";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  errorMessage.textContent = "";

  try {
    signInUser(username, password);
    window.location.href = "/home.html";
  } catch (error) {
    errorMessage.textContent = error.message;
  }
});