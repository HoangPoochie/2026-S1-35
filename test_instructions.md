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

```powershell
# PowerShell
Invoke-RestMethod http://localhost:8080/health
```

**Public content**

```bash
curl http://localhost:8080/api/content/themes
curl http://localhost:8080/api/surveys/wellbeing-check
```

**Admin login**

Use the admin password printed by the setup script on first run (or whatever
you've since changed it to from the admin dashboard).

```bash
# Bash - saves session cookie to cookies.txt
curl -i -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<your-admin-password>"}' \
  http://localhost:8080/api/admin/login
```

```powershell
# PowerShell
$body = '{"username":"admin","password":"<your-admin-password>"}'
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
