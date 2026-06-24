@echo off
cd /d "%~dp0\docker"

echo Stopping the app...
docker compose --profile tunnel down

pause
