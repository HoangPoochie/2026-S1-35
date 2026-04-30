import { getCurrentAdmin } from "./auth.js";

async function protectPage() {
  try {
    await getCurrentAdmin();
  } catch {
    window.location.href = "/index.html";
  }
}

protectPage();