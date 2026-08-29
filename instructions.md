
Act as a Senior Full-Stack Developer. I need to make my sports multiviewer app "The Booth" completely turnkey for Saturdays. You must execute the following three tasks precisely. Do not leave any placeholder comments like '// implement here'; write the complete code.

- [x] TASK 1: Update `server.py` for Persistent Hulu Auto-Login
Rewrite the Playwright launch logic in `server.py` so the user does not have to log into Hulu every time. 
- Instead of using `playwright.chromium.launch()`, you MUST use `playwright.chromium.launch_persistent_context()`.
- Set the `user_data_dir` parameter to `"./chrome_profile"`.
- You MUST keep `headless=False` and `ignore_default_args=["--mute-audio"]`.
- Ensure that the `/launch` endpoint checks if the context already has an active page for the requested matchup. If it doesn't, use `context.new_page()` to spawn the window, navigate to the network URL, and resize/position it using the provided coordinates. 

- [x] TASK 2: Update `App.tsx` and Frontend Components for "College GameDay" & Auto-Reconnect
- WebSocket Auto-Reconnect: In `App.tsx` (or wherever the Playwright Gateway status is managed), wrap the WebSocket connection in a function that automatically retries connecting every 3 seconds if it fails or disconnects. This ensures the UI connects smoothly even if the Python server boots a few seconds later.
- GameDay Button: In the Header navigation, add a new button with the label "🏈 GameDay".
- GameDay Logic: When the "🏈 GameDay" button is clicked, execute a function that does exactly three things:
  1. Automatically switches the `react-grid-layout` preset to "The Showcase" (1 large slot, 3 stacked small slots).
  2. Sends a POST request to the backend's `/launch` endpoint setting the Primary Display slot to `matchup: "College GameDay"` and `network: "ESPN"`.
  3. Scans the fetched ESPN Scoreboard API data, filters for the first three upcoming 12:00 PM ET games, and assigns them to the 3 remaining peripheral grid slots.

- [x] TASK 3: Create a `start.bat` Desktop Launcher
Create a new file in the root directory named `start.bat`. This file needs to start both the Python backend and Next.js frontend with one click, then open the browser. Write exactly this code into the file:

@echo off
title The Booth - Saturday Control Room
echo Starting The Booth Command Center...
echo.

:: Start Python Playwright Backend on Port 8000
start "The Booth Backend" cmd /k "python server.py"

:: Start Next.js React Frontend on Port 5173 (or 3000)
start "The Booth UI" cmd /k "npm run dev"

:: Wait 4 seconds for servers to initialize, then launch remote control
echo Waiting for servers to spin up...
timeout /t 4 /nobreak >nul
start http://localhost:5173

exit