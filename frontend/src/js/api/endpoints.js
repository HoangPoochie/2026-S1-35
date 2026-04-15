import client from "./client.js";

export async function login(username, password) {
  const res = await client.post("/api/admin/login", { username, password });
  return res.data;
}

export async function logout() {
  const res = await client.post("/api/admin/logout");
  return res.data;
}

export async function getMe() {
  const res = await client.get("/api/admin/me");
  return res.data;
}
