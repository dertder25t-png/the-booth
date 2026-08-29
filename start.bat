@echo off
title The Booth - Saturday Control Room
echo Starting The Booth Command Center...
echo.

:: Start Python Playwright Backend on Port 8000 using the project venv
start "The Booth Backend" cmd /k ".\.venv\Scripts\python.exe server.py"

:: Start Next.js React Frontend on Port 5173
start "The Booth UI" cmd /k "npm run dev"

:: Wait 4 seconds for servers to initialize, then launch remote control
echo Waiting for servers to spin up...
timeout /t 4 /nobreak >nul
start http://localhost:5173

exit