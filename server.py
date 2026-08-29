from __future__ import annotations

import asyncio
import os
import re
from contextlib import asynccontextmanager, suppress
from typing import Any

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from playwright.async_api import BrowserContext, Page, Playwright, async_playwright
from pydantic import BaseModel, ConfigDict, Field

DEFAULT_TEST_STREAM_URL = "https://www.youtube.com"
NETWORK_URL_MAP: dict[str, str] = {
    "NBC": "https://www.hulu.com/live-tv/network/nbc",
    "ABC": "https://www.hulu.com/live-tv/network/abc",
    "FOX": "https://www.hulu.com/live-tv/network/fox",
    "ESPN": "https://www.espn.com/watch/espn",
    "ESPN2": "https://www.espn.com/watch/espn2",
    "ESPNU": "https://www.espn.com/watch/espnu",
    "FS1": "https://www.hulu.com/live-tv/network/fs1",
    "SEC NETWORK": "https://www.espn.com/watch/sec-network",
    "SECN": "https://www.espn.com/watch/sec-network",
    "SECN+": "https://www.espn.com/watch/sec-network-plus",
    "ACCN": "https://www.espn.com/watch/accn",
}

active_processes: dict[str, dict[str, Any]] = {}
_process_lock = asyncio.Lock()
_playwright: Playwright | None = None


class Coordinates(BaseModel):
    model_config = ConfigDict(extra="forbid")

    x: int
    y: int
    width: int = Field(gt=0)
    height: int = Field(gt=0)


class LaunchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    matchup: str = Field(min_length=1)
    network: str = ""
    slot_id: str | None = None
    coordinates: Coordinates
    url: str | None = None


class VolumeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slot_id: str | None = None
    matchup: str | None = None
    volume: float = Field(ge=0.0, le=1.0)
    muted: bool


class CloseRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slot_id: str | None = None
    matchup: str | None = None


async def _ensure_playwright() -> Playwright:
    global _playwright
    if _playwright is None:
        _playwright = await async_playwright().start()
    return _playwright


def _resolve_slot_key(slot_id: str | None, matchup: str) -> str:
    raw = (slot_id or matchup).strip()
    cleaned = re.sub(r"[^A-Za-z0-9_.-]+", "-", raw).strip("-_. ")
    return cleaned or matchup.strip()


def _resolve_target_url(network: str, url: str | None) -> str:
    candidate = (url or "").strip()
    if candidate and candidate.lower() not in {"placeholder", "test", "dummy"} and "placeholder" not in candidate.lower():
        return candidate

    mapped = NETWORK_URL_MAP.get(network.strip().upper())
    return mapped or DEFAULT_TEST_STREAM_URL


async def _close_process_key(slot_key: str) -> None:
    entry = active_processes.pop(slot_key, None)
    if entry is None:
        return

    context: BrowserContext | None = entry.get("context")
    if context is not None:
        with suppress(Exception):
            await context.close()


async def _find_entry_by_slot_or_matchup(slot_id: str | None, matchup: str | None) -> dict[str, Any] | None:
    if slot_id:
        entry = active_processes.get(slot_id)
        if entry is not None:
            return entry

    if matchup:
        entry = active_processes.get(matchup)
        if entry is not None:
            return entry

    for key, entry in active_processes.items():
        if slot_id and entry.get("slot_id") == slot_id:
            return entry
        if matchup and entry.get("matchup") == matchup:
            return entry
        if key == entry.get("slot_id") or key == entry.get("matchup"):
            return entry
    return None


async def _close_previous_process(slot_key: str) -> None:
    if slot_key not in active_processes:
        return
    await _close_process_key(slot_key)


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        yield
    finally:
        async with _process_lock:
            for key in list(active_processes.keys()):
                entry = active_processes.get(key)
                if not entry:
                    continue
                context = entry.get("context")
                if context is not None:
                    with suppress(Exception):
                        await context.close()
                active_processes.pop(key, None)

        playwright = _playwright
        _playwright = None
        if playwright is not None:
            with suppress(Exception):
                await playwright.stop()


app = FastAPI(title="The Booth Backend", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/launch")
async def launch_stream(request: LaunchRequest) -> dict[str, str]:
    slot_key = _resolve_slot_key(request.slot_id, request.matchup)
    matchup = request.matchup.strip()
    target_url = _resolve_target_url(request.network, request.url)
    coords = request.coordinates

    async with _process_lock:
        await _close_previous_process(slot_key)

        playwright = await _ensure_playwright()
        os.makedirs("./profiles", exist_ok=True)
        user_data_dir = os.path.abspath(os.path.join("./profiles", slot_key))

        context = await playwright.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            channel="chrome",
            headless=False,
            ignore_default_args=["--mute-audio"],
            args=[
                f"--window-position={coords.x},{coords.y}",
                f"--window-size={coords.width},{coords.height}",
                "--no-first-run",
                "--no-default-browser-check",
                "--autoplay-policy=no-user-gesture-required",
                "--hide-crash-restore-bubble",
                "--disable-infobars",
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--disable-gpu",
            ],
        )

        page = context.pages[0] if context.pages else await context.new_page()
        try:
            await page.goto(target_url, wait_until="domcontentloaded", timeout=90000)
        except Exception:
            with suppress(Exception):
                await page.goto(target_url, wait_until="load", timeout=120000)

        entry = {
            "context": context,
            "page": page,
            "slot_id": slot_key,
            "matchup": matchup,
            "network": request.network,
            "coordinates": {"x": coords.x, "y": coords.y, "width": coords.width, "height": coords.height},
            "target_url": target_url,
        }
        active_processes[slot_key] = entry
        if matchup != slot_key:
            active_processes[matchup] = entry

    return {"status": "launched", "matchup": matchup}


@app.post("/volume")
async def set_volume(request: VolumeRequest) -> dict[str, str]:
    entry = await _find_entry_by_slot_or_matchup(request.slot_id, request.matchup)
    if entry is None:
        raise HTTPException(status_code=404, detail="Stream is not running")

    page: Page | None = entry.get("page")
    if page is None:
        raise HTTPException(status_code=404, detail="Stream page unavailable")

    try:
        await page.evaluate(
            """({ volume, muted }) => {
                document.querySelectorAll('video').forEach((v) => {
                    v.volume = volume;
                    v.muted = muted;
                });
            }""",
            {"volume": request.volume, "muted": request.muted},
        )
    except Exception as exc:  # pragma: no cover - browser page differences may vary
        raise HTTPException(status_code=502, detail=f"Unable to set stream volume: {exc}") from exc

    return {"status": "success"}


@app.post("/close")
async def close_stream(request: CloseRequest) -> dict[str, str]:
    slot_key = request.slot_id or request.matchup
    if not slot_key:
        raise HTTPException(status_code=400, detail="slot_id or matchup is required")

    async with _process_lock:
        if slot_key in active_processes:
            await _close_process_key(slot_key)
            return {"status": "closed"}

        entry = await _find_entry_by_slot_or_matchup(request.slot_id, request.matchup)
        if entry is None:
            raise HTTPException(status_code=404, detail="Stream is not running")

        await _close_process_key(entry["slot_id"])
        return {"status": "closed"}


if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000)
