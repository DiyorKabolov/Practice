@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0cleanup-app-processes.ps1"
call npm start
echo.
echo The process has exited. Press any key to close this window.
pause >nul
