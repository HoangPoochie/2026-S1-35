
// run the following command in bash if any packages missing

// npm i express cors dotenv express-rate-limit express-session helmet morgan mysql2 nanoid zod
// npm i -D nodemon

// run the backend using: 
// npm run dev

// api calling that should be working:

GET /health (This is used to check if backend is working)
GET /api/content/themes
GET /api/content/themes/:id/modules
GET /api/content/modules/:id
GET /api/surveys/:surveyId
POST /api/admin/login
POST /api/admin/logout
GET /api/admin/me
