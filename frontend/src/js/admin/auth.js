// auth.js
import { apiFetch } from "../api/client.js";
import { endpoints } from "../api/endpoints.js";

export async function loginAdmin(username, password) {
  return apiFetch(endpoints.adminLogin, {
    method: "POST",
    body: JSON.stringify({ username, password })
  });
}

export async function logoutAdmin() {
  return apiFetch(endpoints.adminLogout, {
    method: "POST"
  });
}

export async function getCurrentAdmin() {
  return apiFetch(endpoints.adminMe, {
    method: "GET"
  });
}