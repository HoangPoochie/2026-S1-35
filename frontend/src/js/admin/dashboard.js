import { requireAuth, logoutUser } from "./auth.js";

// Redirect to login if not authenticated
await requireAuth();

document.getElementById("logout-btn").addEventListener("click", logoutUser);
