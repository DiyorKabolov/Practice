@echo off
setlocal
cd /d "%~dp0"

call npm start
echo.
echo The process has exited. Press any key to close this window.
pause >nul
