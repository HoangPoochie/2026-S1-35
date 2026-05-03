import { signUpUser } from "./user-auth.js";

const form = document.getElementById("signup-form");
const errorMessage = document.getElementById("error-message");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const displayName = document.getElementById("display-name").value.trim();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const cohortCode = document.getElementById("cohort-code").value.trim();

  errorMessage.textContent = "";

  try {
    signUpUser({
      displayName,
      username,
      password,
      cohortCode
    });

    window.location.href = "/src/pages/user/signin.html";
  } catch (error) {
    errorMessage.textContent = error.message;
  }
});