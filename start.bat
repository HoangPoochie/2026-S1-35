@echo off
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\start-app.ps1"
if errorlevel 1 (
  echo Something went wrong. See the error above.
  pause
  exit /b 1
)

pause
