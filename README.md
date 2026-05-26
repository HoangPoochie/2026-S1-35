# Best Version of Me

## Check Docker is installed

Everything runs via Docker.
1. Ensure Docker is installed on your system by opening a terminal and running:
```bash
docker -V
```

If Docker is not installed, you may install Docker Desktop from: https://www.docker.com/products/docker-desktop/

## To start the app:
```bash
cd docker && docker compose up --build
```

The `--build` flag is only needed the first time. After the first time, you can run:

```bash
cd docker && docker compose up
```

## Access the app:

Once started, the app can then be accessed at:
- http://localhost:5173


Additionally:
- Backend API: http://localhost:8080
- MySQL: localhost:3307


## To stop the app:

```bash
cd docker && docker compose down
```

---

## Testing

### Automated tests

Run from the project root:

```bash
cd docker && docker compose exec backend npm test
```

### Manual API checks

**Health check**

```bash
# Bash
curl http://localhost:8080/health
```

# PowerShell
Invoke-RestMethod http://localhost:8080/health
```

**Public content**

```bash
curl http://localhost:8080/api/content/themes
curl http://localhost:8080/api/surveys/wellbeing-check
```

**Admin login**

```bash
# Bash - saves session cookie to cookies.txt
curl -i -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"change_me_now"}' \
  http://localhost:8080/api/admin/login

# PowerShell
$body = '{"username":"admin","password":"change_me_now"}'
Invoke-RestMethod -Method Post http://localhost:8080/api/admin/login \
  -ContentType 'application/json' -Body $body -SessionVariable s
```

**Authenticated admin requests (Bash)**

```bash
curl -b cookies.txt http://localhost:8080/api/admin/me
curl -b cookies.txt http://localhost:8080/api/admin/themes
curl -b cookies.txt http://localhost:8080/api/admin/modules
curl -b cookies.txt http://localhost:8080/api/admin/reports/surveys/1/summary
```

**File uploads (Bash)**

```bash
# Image
curl -b cookies.txt -F "image=@/path/to/file.png" \
  http://localhost:8080/api/admin/uploads/image

# Video
curl -b cookies.txt -F "video=@/path/to/file.mp4;type=video/mp4" \
  http://localhost:8080/api/admin/uploads/video
```

---

## Project Structure

```
docker/         - docker-compose.yml
backend/        - Express API (port 8080)
frontend/       - React + Vite SPA (port 5173)
```

See `backend/` for additional backend notes and available npm scripts.
