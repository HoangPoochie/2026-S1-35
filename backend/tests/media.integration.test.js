
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after, before } from "node:test";

process.env.NODE_ENV = "test";
process.env.ADMIN_USERNAME = "admin-test";
process.env.ADMIN_PASSWORD = "admin-pass-test";
process.env.SESSION_SECRET = "session-secret-test";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.MAX_UPLOAD_MB = "5";
process.env.MAX_VIDEO_UPLOAD_MB = "20";

const uploadRoot = await mkdtemp(path.join(os.tmpdir(), "backend-media-test-"));
process.env.UPLOAD_DIR = uploadRoot;

const [{ default: app }, { moduleSchema }] = await Promise.all([
  import("../src/app.js"),
  import("../src/routes/admin.content.js")
]);

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  await rm(uploadRoot, { recursive: true, force: true });
});

async function loginAsAdmin() {
  const response = await fetch(`${baseUrl}/api/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD
    })
  });

  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie, "expected admin login to return a session cookie");
  return cookie.split(";", 1)[0];
}

async function uploadAsset({ cookie, endpoint, fieldName, filename, mimeType, contents }) {
  const formData = new FormData();
  formData.append(fieldName, new Blob([contents], { type: mimeType }), filename);

  return fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      Cookie: cookie
    },
    body: formData
  });
}

test("module schema accepts local uploaded media paths", () => {
  const result = moduleSchema.safeParse({
    themeId: 1,
    title: "Building Resilience",
    summary: "Summary",
    body: "Body",
    imageUrl: "/uploads/images/example.png",
    imageAltText: "An example image",
    videoUrl: "/uploads/videos/example.mp4",
    challengeText: "Reflection prompt",
    sortOrder: 0,
    published: false
  });

  assert.equal(result.success, true);
});
