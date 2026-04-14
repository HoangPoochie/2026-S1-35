import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after, before } from "node:test";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, "..");
const migrationsDir = path.join(backendDir, "src", "db", "migrations");

const rootDbHost = process.env.TEST_DB_HOST || "127.0.0.1";
const rootDbPort = Number(process.env.TEST_DB_PORT || 3307);
const rootDbUser = process.env.TEST_DB_ROOT_USER || "root";
const rootDbPassword =
  process.env.TEST_DB_ROOT_PASSWORD || "root_pass_change_me";

const testDbName = `bvom_test_${Date.now()}_${process.pid}`;
const uploadRoot = await mkdtemp(path.join(os.tmpdir(), "backend-integration-"));

process.env.NODE_ENV = "test";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.DB_HOST = rootDbHost;
process.env.DB_PORT = String(rootDbPort);
process.env.DB_NAME = testDbName;
process.env.DB_USER = rootDbUser;
process.env.DB_PASSWORD = rootDbPassword;
process.env.ADMIN_USERNAME = "admin-test";
process.env.ADMIN_PASSWORD = "admin-pass-test";
process.env.SESSION_SECRET = "session-secret-test";
process.env.UPLOAD_DIR = uploadRoot;
process.env.MAX_UPLOAD_MB = "5";
process.env.MAX_VIDEO_UPLOAD_MB = "20";

const rootConnection = await mysql.createConnection({
  host: rootDbHost,
  port: rootDbPort,
  user: rootDbUser,
  password: rootDbPassword,
  multipleStatements: true
});

await rootConnection.query(
  `CREATE DATABASE \`${testDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
);
await rootConnection.changeUser({ database: testDbName });

const migrationFiles = (await readdir(migrationsDir))
  .filter((name) => name.endsWith(".sql"))
  .sort();

for (const file of migrationFiles) {
  const sql = await readFile(path.join(migrationsDir, file), "utf8");
  await rootConnection.query(sql);
}

const [{ default: app }, { default: pool }] = await Promise.all([
  import("../src/app.js"),
  import("../src/db/index.js")
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

  await seedSurveyDefinition();
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

  await pool.end();

  await rootConnection.query("USE information_schema");
  await rootConnection.query(`DROP DATABASE IF EXISTS \`${testDbName}\``);
  await rootConnection.end();

  await rm(uploadRoot, { recursive: true, force: true });
});

async function seedSurveyDefinition() {
  const [surveyResult] = await rootConnection.execute(
    `
    INSERT INTO surveys (slug, name, survey_type, published)
    VALUES (?, ?, ?, ?)
    `,
    ["wellbeing-check", "Wellbeing Check", "generic", 1]
  );

  const surveyId = surveyResult.insertId;

  await rootConnection.execute(
    `
    INSERT INTO survey_questions
      (survey_id, question_key, prompt, question_type, options_json, is_required, sort_order)
    VALUES
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      surveyId,
      "mood_score",
      "How is your mood today?",
      "likert",
      JSON.stringify([1, 2, 3, 4, 5]),
      1,
      1,
      surveyId,
      "stressors",
      "Which stressors apply?",
      "multiple_choice",
      JSON.stringify(["Study", "Work", "Money"]),
      0,
      2,
      surveyId,
      "reflection",
      "Any reflections?",
      "short_text",
      null,
      1,
      3
    ]
  );
}

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

async function adminJson(method, endpoint, cookie, body) {
  const headers = {
    Cookie: cookie
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${baseUrl}${endpoint}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
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

test("backend skeleton health route responds successfully", async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.service, "bvom-backend");
  assert.match(body.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});

test("admin authentication login, me, and logout flow works", async () => {
  const unauthenticated = await fetch(`${baseUrl}/api/admin/me`);
  assert.equal(unauthenticated.status, 401);

  const cookie = await loginAsAdmin();

  const meResponse = await adminJson("GET", "/api/admin/me", cookie);
  assert.equal(meResponse.status, 200);
  const meBody = await meResponse.json();
  assert.equal(meBody.admin.username, process.env.ADMIN_USERNAME);
  assert.equal(meBody.admin.loggedIn, true);

  const logoutResponse = await adminJson("POST", "/api/admin/logout", cookie);
  assert.equal(logoutResponse.status, 200);

  const afterLogout = await adminJson("GET", "/api/admin/me", cookie);
  assert.equal(afterLogout.status, 401);
});

test("admin content APIs manage themes and modules and public content exposes published items only", async () => {
  const cookie = await loginAsAdmin();

  const createTheme = await adminJson("POST", "/api/admin/themes", cookie, {
    title: "Self Awareness",
    description: "Theme description",
    sortOrder: 1,
    published: true
  });
  assert.equal(createTheme.status, 201);
  const theme = await createTheme.json();

  const createDraftTheme = await adminJson("POST", "/api/admin/themes", cookie, {
    title: "Hidden Theme",
    description: "Draft",
    sortOrder: 2,
    published: false
  });
  assert.equal(createDraftTheme.status, 201);

  const uploadImageResponse = await uploadAsset({
    cookie,
    endpoint: "/api/admin/uploads/image",
    fieldName: "image",
    filename: "cover.png",
    mimeType: "image/png",
    contents: "image-bytes"
  });
  assert.equal(uploadImageResponse.status, 201);
  const uploadedImage = await uploadImageResponse.json();

  const uploadVideoResponse = await uploadAsset({
    cookie,
    endpoint: "/api/admin/uploads/video",
    fieldName: "video",
    filename: "lesson.mp4",
    mimeType: "video/mp4",
    contents: "video-bytes"
  });
  assert.equal(uploadVideoResponse.status, 201);
  const uploadedVideo = await uploadVideoResponse.json();

  const createModule = await adminJson("POST", "/api/admin/modules", cookie, {
    themeId: theme.id,
    title: "Know Yourself",
    summary: "Module summary",
    body: "Module body",
    imageUrl: uploadedImage.imageUrl,
    imageAltText: "Illustration",
    videoUrl: uploadedVideo.videoUrl,
    challengeText: "Reflect on your values",
    sortOrder: 1,
    published: true
  });
  assert.equal(createModule.status, 201);
  const module = await createModule.json();

  const createDraftModule = await adminJson("POST", "/api/admin/modules", cookie, {
    themeId: theme.id,
    title: "Draft Module",
    summary: "Draft summary",
    body: "Draft body",
    imageUrl: "",
    imageAltText: "",
    videoUrl: "",
    challengeText: "Draft challenge",
    sortOrder: 2,
    published: false
  });
  assert.equal(createDraftModule.status, 201);
  const draftModule = await createDraftModule.json();

  const updateTheme = await adminJson("PUT", `/api/admin/themes/${theme.id}`, cookie, {
    title: "Self Awareness Updated",
    description: "Updated description",
    sortOrder: 1,
    published: true
  });
  assert.equal(updateTheme.status, 200);

  const updateModule = await adminJson("PUT", `/api/admin/modules/${module.id}`, cookie, {
    themeId: theme.id,
    title: "Know Yourself Better",
    summary: "Updated module summary",
    body: "Updated module body",
    imageUrl: uploadedImage.imageUrl,
    imageAltText: "Updated illustration",
    videoUrl: uploadedVideo.videoUrl,
    challengeText: "Updated reflection",
    sortOrder: 1,
    published: true
  });
  assert.equal(updateModule.status, 200);

  const adminThemes = await adminJson("GET", "/api/admin/themes", cookie);
  assert.equal(adminThemes.status, 200);
  const adminThemesBody = await adminThemes.json();
  assert.equal(adminThemesBody.length, 2);

  const adminModules = await adminJson("GET", "/api/admin/modules", cookie);
  assert.equal(adminModules.status, 200);
  const adminModulesBody = await adminModules.json();
  assert.equal(adminModulesBody.length, 2);

  const publicThemes = await fetch(`${baseUrl}/api/content/themes`);
  assert.equal(publicThemes.status, 200);
  const publicThemesBody = await publicThemes.json();
  assert.equal(publicThemesBody.length, 1);
  assert.equal(publicThemesBody[0].title, "Self Awareness Updated");

  const publicModules = await fetch(`${baseUrl}/api/content/themes/${theme.id}/modules`);
  assert.equal(publicModules.status, 200);
  const publicModulesBody = await publicModules.json();
  assert.equal(publicModulesBody.length, 1);
  assert.equal(publicModulesBody[0].title, "Know Yourself Better");
  assert.equal(publicModulesBody[0].imageUrl, uploadedImage.imageUrl);
  assert.equal(publicModulesBody[0].videoUrl, uploadedVideo.videoUrl);

  const publicModule = await fetch(`${baseUrl}/api/content/modules/${module.id}`);
  assert.equal(publicModule.status, 200);
  const publicModuleBody = await publicModule.json();
  assert.equal(publicModuleBody.body, "Updated module body");
  assert.equal(publicModuleBody.challengeText, "Updated reflection");

  const hiddenModule = await fetch(
    `${baseUrl}/api/content/modules/${draftModule.id}`
  );
  assert.equal(hiddenModule.status, 404);
});

test("survey definition API, anonymous submissions, and admin reporting summary all work", async () => {
  const surveyDefinition = await fetch(`${baseUrl}/api/surveys/wellbeing-check`);
  assert.equal(surveyDefinition.status, 200);

  const surveyBody = await surveyDefinition.json();
  assert.equal(surveyBody.name, "Wellbeing Check");
  assert.equal(surveyBody.questions.length, 3);
  assert.deepEqual(surveyBody.questions[0].options, [1, 2, 3, 4, 5]);

  const validSubmission = await fetch(
    `${baseUrl}/api/surveys/${surveyBody.id}/submissions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        cohortCode: "ICT1",
        answers: [
          { questionId: surveyBody.questions[0].id, answer: 4 },
          {
            questionId: surveyBody.questions[1].id,
            answer: ["Study", "Work"]
          },
          {
            questionId: surveyBody.questions[2].id,
            answer: "Feeling positive."
          }
        ]
      })
    }
  );
  assert.equal(validSubmission.status, 201);

  const validSubmissionBody = await validSubmission.json();
  assert.match(validSubmissionBody.submissionCode, /^sub_[a-z0-9]{16}$/);

  const duplicateAnswerSubmission = await fetch(
    `${baseUrl}/api/surveys/${surveyBody.id}/submissions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        answers: [
          { questionId: surveyBody.questions[0].id, answer: 5 },
          { questionId: surveyBody.questions[0].id, answer: 4 },
          {
            questionId: surveyBody.questions[2].id,
            answer: "Duplicate answers should fail."
          }
        ]
      })
    }
  );
  assert.equal(duplicateAnswerSubmission.status, 400);

  const emptyRequiredAnswer = await fetch(
    `${baseUrl}/api/surveys/${surveyBody.id}/submissions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        answers: [
          { questionId: surveyBody.questions[0].id, answer: 3 },
          { questionId: surveyBody.questions[2].id, answer: "   " }
        ]
      })
    }
  );
  assert.equal(emptyRequiredAnswer.status, 400);

  const wrongTypeSubmission = await fetch(
    `${baseUrl}/api/surveys/${surveyBody.id}/submissions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        answers: [
          { questionId: surveyBody.questions[0].id, answer: ["bad"] },
          { questionId: surveyBody.questions[2].id, answer: "Still here" }
        ]
      })
    }
  );
  assert.equal(wrongTypeSubmission.status, 400);

  const cookie = await loginAsAdmin();
  const reportResponse = await adminJson(
    "GET",
    `/api/admin/reports/surveys/${surveyBody.id}/summary`,
    cookie
  );
  assert.equal(reportResponse.status, 200);

  const reportBody = await reportResponse.json();
  assert.equal(Number(reportBody.totalSubmissions), 1);
  assert.equal(reportBody.questions.length, 3);

  const likertSummary = reportBody.questions.find(
    (question) => question.questionKey === "mood_score"
  );
  assert.equal(likertSummary.averageValue, 4);
  assert.deepEqual(likertSummary.distribution, [{ value: "4", count: 1 }]);

  const multipleChoiceSummary = reportBody.questions.find(
    (question) => question.questionKey === "stressors"
  );
  assert.deepEqual(multipleChoiceSummary.distribution, [
    { value: ["Study", "Work"], count: 1 }
  ]);

  const shortTextSummary = reportBody.questions.find(
    (question) => question.questionKey === "reflection"
  );
  assert.deepEqual(shortTextSummary.latestResponses, ["Feeling positive."]);
});
