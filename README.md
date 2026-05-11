# Best Version of Me

Web platform for delivering workshop modules in a browser, with a backend API for admin authentication, content management, surveys, reporting, media uploads, and activity tracking.

## Services And Ports

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- MySQL: `127.0.0.1:3307`
- Admin login: `http://localhost:5173/src/admin/admin.html`

## Prerequisites

- Node.js `20.19+` or `22.12+` for the frontend Vite build.
- Docker with Compose support.
- npm.

Check Node:

```bash
node -v
```

Use one environment consistently for npm commands. If dependencies were installed in WSL, run `npm install`, `npm run dev`, and `npm run build` from WSL. If dependencies were installed in Windows PowerShell, run those commands from PowerShell instead. Mixing the same `node_modules` folder between Windows and WSL can cause platform-specific package errors.

## 1. Start The Database

Run from the repository root:

```bash
docker compose -f docker/docker-compose.yml up -d
```

Check MySQL is reachable.

PowerShell:

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 3307
```

Ubuntu/WSL:

```bash
nc -zv 127.0.0.1 3307
```

Stop the database when finished:

```bash
docker compose -f docker/docker-compose.yml down
```

## 2. Start The Backend

Open a terminal at the repository root:

```bash
cd backend
npm install
npm run migrate
npm run dev
```

`npm run dev` uses nodemon polling mode so it works reliably from WSL on Windows-mounted paths such as `/mnt/c/...`.

If you are running from a normal Linux/macOS filesystem and want native file watching instead, use:

```bash
cd backend
npm run dev:native
```

For a normal non-dev run:

```bash
cd backend
npm start
```

The backend command should stay running after startup. That means the server is active. Stop it with `Ctrl+C`.

If `backend/.env` is missing, create it with:

```env
PORT=8080
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=bvom
DB_USER=bvom_user
DB_PASSWORD=bvom_pass
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_me_now
SESSION_SECRET=replace_with_a_long_random_string
SESSION_NAME=bvom.sid
SESSION_TIMEOUT_MS=1800000
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_SAMESITE=lax
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=5
MAX_VIDEO_UPLOAD_MB=50
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
ADMIN_RATE_LIMIT_MAX=10
```

## 3. Start The Frontend

Open a second terminal at the repository root:

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server is configured to use polling mode so it works reliably from WSL on Windows-mounted paths such as `/mnt/c/...`.

Open:

```text
http://localhost:5173
```

The frontend dev server should stay running. Stop it with `Ctrl+C`.

## 4. Automated Tests

The MySQL container must be running first.

Backend integration tests:

```bash
cd backend
npm test
```

Backend media test:

```bash
cd backend
node tests/media.integration.test.js
```

Frontend production build:

```bash
cd frontend
npm run build
```

Expected result:

- Backend tests pass.
- Frontend build creates `frontend/dist/index.html`.

## 5. Manual API Tests

These examples use Ubuntu/WSL Bash. Run them while the database and backend are running.

Health check:

```bash
curl http://localhost:8080/health
```

Expected: JSON with `"ok":true`.

Public content API:

```bash
curl http://localhost:8080/api/content/themes
```

This may return `[]` until you create published content.

Admin login and cookie:

```bash
rm -f cookies.txt

curl -i -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"change_me_now"}' \
  http://localhost:8080/api/admin/login
```

Check current admin session:

```bash
curl -b cookies.txt http://localhost:8080/api/admin/me
```

Create a published theme:

```bash
curl -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Self Awareness",
    "description":"Workshop theme",
    "sortOrder":0,
    "published":true
  }' \
  http://localhost:8080/api/admin/themes
```

Create a published module:

```bash
curl -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "themeId":1,
    "title":"Know Yourself",
    "summary":"Understanding thoughts, feelings, and behaviours.",
    "body":"This module helps participants understand self-awareness.",
    "imageUrl":"",
    "imageAltText":"",
    "videoUrl":"",
    "challengeText":"Write one strength you noticed today.",
    "sortOrder":0,
    "published":true
  }' \
  http://localhost:8080/api/admin/modules
```

Check public published content:

```bash
curl http://localhost:8080/api/content/themes
curl http://localhost:8080/api/content/themes/1/modules
curl http://localhost:8080/api/content/modules/1
```

## 6. Media Upload Tests

Login first and keep `cookies.txt`.

Image upload:

```bash
curl -b cookies.txt \
  -F "image=@/mnt/c/Users/georg/Documents/ICT1/testimgs/Dogtest01.jpg" \
  http://localhost:8080/api/admin/uploads/image
```

Video upload:

```bash
curl -b cookies.txt \
  -F "video=@/mnt/c/Users/georg/Documents/ICT1/testvideos/Testvideo01.mp4;type=video/mp4" \
  http://localhost:8080/api/admin/uploads/video
```

External image/video URL test:

```bash
curl -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "themeId":1,
    "title":"External Media Module",
    "summary":"Testing external media URLs",
    "body":"This module uses external media.",
    "imageUrl":"https://http.cat/images/100.jpg",
    "imageAltText":"Cat photo",
    "videoUrl":"https://www.w3schools.com/html/mov_bbb.mp4",
    "challengeText":"Test challenge",
    "sortOrder":1,
    "published":true
  }' \
  http://localhost:8080/api/admin/modules
```

## 7. Survey API Tests

Fresh databases do not include survey definitions by default. Seed one test survey first:

```bash
docker exec -i bvom-mysql mysql -uroot -proot_pass_change_me bvom <<'SQL'
INSERT INTO surveys (slug, name, survey_type, published)
VALUES ('wellbeing-check', 'Wellbeing Check', 'generic', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), published = VALUES(published);

SET @survey_id := (SELECT id FROM surveys WHERE slug = 'wellbeing-check');

DELETE FROM survey_questions WHERE survey_id = @survey_id;

INSERT INTO survey_questions
  (survey_id, question_key, prompt, question_type, options_json, is_required, sort_order)
VALUES
  (@survey_id, 'mood_score', 'How is your mood today?', 'likert', '[1,2,3,4,5]', 1, 1),
  (@survey_id, 'stressors', 'Which stressors apply?', 'multiple_choice', '["Study","Work","Money"]', 0, 2),
  (@survey_id, 'reflection', 'Any reflections?', 'short_text', NULL, 1, 3);
SQL
```

Survey definition:

```bash
curl http://localhost:8080/api/surveys/wellbeing-check
```

Load the survey/question IDs into shell variables:

```bash
SURVEY_ID=$(docker exec bvom-mysql mysql -N -uroot -proot_pass_change_me bvom \
  -e "SELECT id FROM surveys WHERE slug = 'wellbeing-check'")

MOOD_ID=$(docker exec bvom-mysql mysql -N -uroot -proot_pass_change_me bvom \
  -e "SELECT id FROM survey_questions WHERE survey_id = $SURVEY_ID AND question_key = 'mood_score'")

STRESS_ID=$(docker exec bvom-mysql mysql -N -uroot -proot_pass_change_me bvom \
  -e "SELECT id FROM survey_questions WHERE survey_id = $SURVEY_ID AND question_key = 'stressors'")

REFLECTION_ID=$(docker exec bvom-mysql mysql -N -uroot -proot_pass_change_me bvom \
  -e "SELECT id FROM survey_questions WHERE survey_id = $SURVEY_ID AND question_key = 'reflection'")
```

Anonymous submission:

```bash
curl -H "Content-Type: application/json" \
  -d '{
    "cohortCode":"ICT1",
    "answers":[
      {"questionId":'"$MOOD_ID"',"answer":4},
      {"questionId":'"$STRESS_ID"',"answer":["Study","Work"]},
      {"questionId":'"$REFLECTION_ID"',"answer":"Feeling positive."}
    ]
  }' \
  http://localhost:8080/api/surveys/$SURVEY_ID/submissions
```

Admin survey report summary:

```bash
curl -b cookies.txt http://localhost:8080/api/admin/reports/surveys/$SURVEY_ID/summary
```

## 8. Browser Tests

Public modules:

1. Open `http://localhost:5173`.
2. Click any module card.
3. Use Next/Previous navigation.
4. Finish a module with Complete.
5. Refresh the browser and reopen the same module.
6. Progress should be remembered on the same browser/device only.

Check local progress in DevTools Console:

```js
localStorage.getItem("bvm.publicProgress.v1")
```

Reset local progress using the `Reset progress` button on the page.

Admin content management:

1. Open `http://localhost:5173/src/admin/admin.html`.
2. Login with `admin` / `change_me_now`.
3. Use the Content Management section on the dashboard.
4. Create or edit themes/modules.
5. Upload image/video files or paste external media URLs.
6. Mark items as Published to expose them through `/api/content`.

Admin session timeout:

1. Set `SESSION_TIMEOUT_MS=1000` in `backend/.env`.
2. Restart the backend.
3. Login to admin.
4. Wait longer than one second.
5. Refresh or request `/api/admin/me`.
6. The session should expire and redirect/return `SESSION_EXPIRED`.

## 9. QR Code / Link Delivery

The workshop can be delivered by sharing or generating a QR code for:

```text
http://localhost:5173
```

For deployed hosting, replace `localhost:5173` with the deployed frontend URL.

## 10. Required Function Checklist

- Backend skeleton: `GET /health`
- MySQL setup and migrations: Docker Compose plus `npm run migrate`
- Public content APIs: `GET /api/content/themes`, `GET /api/content/themes/:id/modules`, `GET /api/content/modules/:id`
- Public module access: `http://localhost:5173`
- Browser-only public progress: `localStorage` key `bvm.publicProgress.v1`
- Admin authentication: `POST /api/admin/login`, `GET /api/admin/me`, `POST /api/admin/logout`
- Admin session timeout: `SESSION_TIMEOUT_MS`
- Admin content management APIs/UI: dashboard Content Management section
- Admin reporting summary: `GET /api/admin/reports/surveys/:surveyId/summary`
- Survey definition API: `GET /api/surveys/:surveyIdOrSlug`
- Anonymous survey submission API: `POST /api/surveys/:surveyId/submissions`
- Media support: `/api/admin/uploads/image`, `/api/admin/uploads/video`, and external `http(s)` media URLs
