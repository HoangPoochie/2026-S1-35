# Best Version of Me

## Check Docker is installed

Everything runs via Docker.
1. Ensure Docker is installed on your system by opening a terminal and running:
```bash
docker -v
```

If Docker is not installed, you may install Docker Desktop from: https://www.docker.com/products/docker-desktop/

## To start the app:

**Windows:** double-click `start.bat`.

**Mac:** double-click `start.command`.

The first run will create `docker/.env` for you, automatically filled in
with secure random secrets, and print an admin username/password to the
terminal - write that down, you'll need it to log in. Then it will ask:

> Make this app accessible from other devices over the internet?

This is optional - press Enter/N to skip and only run the app on this
computer. If you say yes, it uses a free Cloudflare Quick Tunnel (no account
or domain needed) and prints a public link you can share with someone else
to try the app remotely. That link stops working once you stop the app (see
below), and a new (different) link is generated each time you start the app
and say yes again.

After that, it builds and starts the app. Leave the terminal window open
while using the app. **Closing the window does not stop the app** - Docker
keeps it running in the background. To stop it, use `stop.bat` / `stop.command`
below.

If you'd rather run it manually from a terminal instead of double-clicking:

Mac/Linux:
```bash
./scripts/start-app.sh
```

Windows:
```powershell
.\scripts\start-app.ps1
```

Both scripts create `docker/.env` if it doesn't exist yet, ask about the
optional Cloudflare Quick Tunnel, then build and start the app. To start
the app without being asked you can instead run:

```bash
cd docker && docker compose up
```

## Access the app:

Once started, the app can then be accessed at:
- http://localhost:5173
- Or the Cloudflare URL you are given when running the script with remote access enabled


Additionally:
- Backend API: http://localhost:8080
- MySQL: localhost:3307

The frontend calls the API through same-origin `/api/...` URLs. In Docker,
Vite proxies those requests to the backend service automatically.


## To stop the app:

**Windows:** double-click `stop.bat`.

**Mac:** double-click `stop.command`.

Or from a terminal:
```bash
cd docker && docker compose --profile tunnel down
```

(The `--profile tunnel` part is needed even if you didn't use the remote
access option, otherwise the tunnel container - if it was started - gets
left running in the background. `stop.bat`/`stop.command` already handle
this for you.)

---

## Testing
For test instructions refer to the following file:
https://github.com/HoangPoochie/2026-S1-35/blob/main/test_instructions.md

## Project Structure

```
docker/         - docker-compose.yml
backend/        - Express API (port 8080)
frontend/       - React + Vite SPA (port 5173)
```

See `backend/` for additional backend notes and available npm scripts.
