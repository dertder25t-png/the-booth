from __future__ import annotations

import asyncio
import os
import shutil
import subprocess
import time
from contextlib import suppress
from typing import Any

import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field

try:
    import win32con
    import win32gui
    import win32process
except ImportError:  # pragma: no cover - Windows-only dependency
    win32con = None
    win32gui = None
    win32process = None

DEFAULT_TEST_STREAM_URL = "https://www.youtube.com"
SCREEN_WIDTH = 1920
SCREEN_HEIGHT = 1080
GRID_SLOTS = {
    1: {"x": 0, "y": 0, "width": 960, "height": 540},
    2: {"x": 960, "y": 0, "width": 960, "height": 540},
    3: {"x": 0, "y": 540, "width": 960, "height": 540},
    4: {"x": 960, "y": 540, "width": 960, "height": 540},
}

active_processes: dict[str, dict[str, Any]] = {}
_process_lock = asyncio.Lock()


class Coordinates(BaseModel):
    model_config = ConfigDict(extra="forbid")

    x: int = 0
    y: int = 0
    width: int = Field(default=960, gt=0)
    height: int = Field(default=540, gt=0)


class LaunchRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    url: str | None = None
    grid_slot: int | None = None
    slot_id: str | None = None
    matchup: str | None = None
    network: str | None = None
    coordinates: Coordinates | None = None


class CloseRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    slot_id: str | None = None
    matchup: str | None = None
    grid_slot: int | None = None


class VolumeRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    slot_id: str | None = None
    matchup: str | None = None
    volume: float = Field(ge=0.0, le=1.0)
    muted: bool = False


def _normalize_slot_key(slot_id: str | None, matchup: str | None, grid_slot: int | None = None) -> str:
    if slot_id and slot_id.strip():
        return slot_id.strip()
    if matchup and matchup.strip():
        return matchup.strip()
    return f"slot-{grid_slot or 1}"


def _resolve_target_url(url: str | None, network: str | None = None) -> str:
    candidate = (url or "").strip()
    if candidate and candidate.lower() not in {"placeholder", "test", "dummy"}:
        return candidate
    if network and network.strip().upper() == "TEST":
        return DEFAULT_TEST_STREAM_URL
    return DEFAULT_TEST_STREAM_URL


def _resolve_window_rect(grid_slot: int | None, coords: Coordinates | None) -> Coordinates:
    if coords is not None:
        return coords
    if grid_slot is not None and grid_slot in GRID_SLOTS:
        layout = GRID_SLOTS[grid_slot]
        return Coordinates(x=layout["x"], y=layout["y"], width=layout["width"], height=layout["height"])
    return Coordinates(x=0, y=0, width=960, height=540)


def _chrome_executable() -> str:
    candidates = [
        "chrome",
        "google-chrome",
        "google-chrome-stable",
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
        "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    ]
    for candidate in candidates:
        resolved = shutil.which(candidate) if not os.path.isabs(candidate) else candidate
        if resolved and os.path.exists(resolved):
            return resolved
    raise FileNotFoundError("Google Chrome executable not found. Install Chrome or add it to PATH.")


def _profile_root() -> str:
    base_dir = os.path.abspath(os.path.join("profiles", "chrome"))
    os.makedirs(base_dir, exist_ok=True)
    return base_dir


def _slot_profile_name(slot_key: str) -> str:
    safe_key = "".join(ch if ch.isalnum() or ch in ("-", "_") else "-" for ch in slot_key).strip("-")
    return safe_key or "slot-1"


def _launch_native_chrome(slot_key: str, url: str, rect: Coordinates) -> subprocess.Popen[str]:
    chrome_path = _chrome_executable()
    profile_root = _profile_root()
    profile_name = _slot_profile_name(slot_key)
    profile_dir = os.path.join(profile_root, profile_name)
    os.makedirs(profile_dir, exist_ok=True)

    cmd = [
        chrome_path,
        f"--app={url}",
        "--new-window",
        f"--user-data-dir={profile_root}",
        f"--profile-directory={profile_name}",
        "--no-first-run",
        "--no-default-browser-check",
        "--autoplay-policy=no-user-gesture-required",
        "--disable-infobars",
        "--disable-session-crashed-bubble",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        f"--window-position={rect.x},{rect.y}",
        f"--window-size={rect.width},{rect.height}",
    ]

    proc = subprocess.Popen(cmd, cwd=os.getcwd())
    time.sleep(1.5)
    return proc


def _find_window_handle(process_id: int):
    if win32gui is None or win32con is None:
        return None

    matches: list[int] = []

    def enum_windows(hwnd: int, _):
        if not win32gui.IsWindowVisible(hwnd):
            return True
        try:
            pid = win32process.GetWindowThreadProcessId(hwnd)[1]
        except Exception:
            return True
        if pid == process_id:
            matches.append(hwnd)
        return True

    win32gui.EnumWindows(enum_windows, None)
    if not matches:
        return None
    return matches[-1]


def _snap_window_to_rect(process_id: int, rect: Coordinates) -> None:
    if win32gui is None or win32con is None:
        return

    hwnd = _find_window_handle(process_id)
    if hwnd is None:
        return

    win32gui.MoveWindow(hwnd, rect.x, rect.y, rect.width, rect.height, True)
    win32gui.SetWindowPos(
        hwnd,
        win32con.HWND_TOP,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        win32con.SWP_NOOWNERZORDER | win32con.SWP_SHOWWINDOW,
    )
    win32gui.SetForegroundWindow(hwnd)


async def _close_process_key(slot_key: str) -> None:
    entry = active_processes.pop(slot_key, None)
    if entry is None:
        return

    process = entry.get("process")
    if process is not None and process.poll() is None:
        with suppress(Exception):
            process.terminate()
        with suppress(Exception):
            process.wait(timeout=8)


async def _find_entry_by_slot_or_matchup(slot_id: str | None, matchup: str | None, grid_slot: int | None = None) -> dict[str, Any] | None:
    if slot_id:
        entry = active_processes.get(slot_id)
        if entry is not None:
            return entry
    if matchup:
        entry = active_processes.get(matchup)
        if entry is not None:
            return entry
    if grid_slot is not None:
        entry = active_processes.get(f"slot-{grid_slot}")
        if entry is not None:
            return entry
    return None


async def _close_previous_process(slot_key: str) -> None:
    if slot_key in active_processes:
        await _close_process_key(slot_key)


@app.on_event("shutdown")
async def shutdown_event() -> None:
    async with _process_lock:
        for key in list(active_processes.keys()):
            await _close_process_key(key)


app = FastAPI(title="The Booth Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/launch")
async def launch_stream(request: LaunchRequest) -> dict[str, Any]:
    target_url = _resolve_target_url(request.url, request.network)
    slot_key = _normalize_slot_key(request.slot_id, request.matchup, request.grid_slot)
    rect = _resolve_window_rect(request.grid_slot, request.coordinates)

    async with _process_lock:
        await _close_previous_process(slot_key)

        proc = _launch_native_chrome(slot_key, target_url, rect)
        _snap_window_to_rect(proc.pid, rect)

        entry = {
            "slot_id": slot_key,
            "matchup": request.matchup or slot_key,
            "network": request.network or "",
            "url": target_url,
            "grid_slot": request.grid_slot,
            "coordinates": {"x": rect.x, "y": rect.y, "width": rect.width, "height": rect.height},
            "process": proc,
            "created_at": time.time(),
        }
        active_processes[slot_key] = entry
        if request.matchup and request.matchup != slot_key:
            active_processes[request.matchup] = entry

    return {
        "status": "launched",
        "slot_id": slot_key,
        "url": target_url,
        "grid_slot": request.grid_slot,
    }


@app.post("/close")
async def close_stream(request: CloseRequest) -> dict[str, str]:
    slot_key = request.slot_id or request.matchup or (f"slot-{request.grid_slot}" if request.grid_slot else None)
    if not slot_key:
        raise HTTPException(status_code=400, detail="slot_id, matchup, or grid_slot is required")

    async with _process_lock:
        entry = await _find_entry_by_slot_or_matchup(request.slot_id, request.matchup, request.grid_slot)
        if entry is None:
            if slot_key in active_processes:
                await _close_process_key(slot_key)
                return {"status": "closed"}
            raise HTTPException(status_code=404, detail="Stream is not running")

        await _close_process_key(entry.get("slot_id") or slot_key)
        return {"status": "closed"}


@app.post("/volume")
async def set_volume(request: VolumeRequest) -> dict[str, str]:
    entry = await _find_entry_by_slot_or_matchup(request.slot_id, request.matchup)
    if entry is None:
        raise HTTPException(status_code=404, detail="Stream is not running")
    return {"status": "accepted"}


@app.websocket("/ws/control")
async def websocket_control(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            payload = await websocket.receive_json()
            url = payload.get("url")
            if not url:
                await websocket.send_json({"status": "error", "detail": "url is required"})
                continue

            slot_key = _normalize_slot_key(payload.get("slot_id"), payload.get("matchup"), payload.get("grid_slot"))
            rect = _resolve_window_rect(payload.get("grid_slot"), None if not payload.get("coordinates") else Coordinates(**payload["coordinates"]))
            async with _process_lock:
                await _close_previous_process(slot_key)
                proc = _launch_native_chrome(slot_key, url, rect)
                _snap_window_to_rect(proc.pid, rect)
                active_processes[slot_key] = {
                    "slot_id": slot_key,
                    "url": url,
                    "grid_slot": payload.get("grid_slot"),
                    "coordinates": {"x": rect.x, "y": rect.y, "width": rect.width, "height": rect.height},
                    "process": proc,
                }
            await websocket.send_json({"status": "launched", "slot_id": slot_key, "url": url})
    except WebSocketDisconnect:
        pass


@app.websocket("/ws/status")
async def websocket_status(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            await websocket.send_json({"status": "ok", "slots": list(active_processes.keys())})
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000)
