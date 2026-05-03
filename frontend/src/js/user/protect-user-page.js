import { getCurrentUser } from "./user-auth.js";

const user = getCurrentUser();

if (!user) {
  window.location.href = "/src/pages/user/signin.html";
}