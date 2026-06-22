"""RecruitAI — AI recruitment assistant API.

Run locally:
    uvicorn app.main:app --reload --port 8000
"""
import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import (
    analysis,
    auth,
    candidates,
    dashboard,
    health,
    interview,
    jobs,
    recruiter_tasks,
    schedule,
    tasks,
)
from app.core.config import get_settings
from app.core.firebase import get_firestore
from app.core.logging import configure_logging
from app.core.security import ensure_admin_user

configure_logging()

log = logging.getLogger("recruitai")

app = FastAPI(
    title="RecruitAI",
    description=(
        "AI recruitment assistant for HR teams: CV screening, scoring, interview "
        "preparation, structured evaluation and final reports. "
        "Final hiring decisions must be reviewed and approved by a human "
        "recruiter or hiring manager."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Rate limiting ---
_request_timestamps: dict[str, list[float]] = {}
_RATE_LIMIT_WINDOW = 60.0


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    settings = get_settings()
    limit = settings.rate_limit_per_minute
    if limit <= 0:
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    timestamps = _request_timestamps.setdefault(client_ip, [])
    cutoff = now - _RATE_LIMIT_WINDOW
    while timestamps and timestamps[0] < cutoff:
        timestamps.pop(0)

    if len(timestamps) >= limit:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Try again later."},
            headers={"Retry-After": "60"},
        )

    timestamps.append(now)
    return await call_next(request)


app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(candidates.router)
app.include_router(analysis.router)
app.include_router(dashboard.router)
app.include_router(interview.hr_router)
app.include_router(interview.public_router)
app.include_router(recruiter_tasks.router)
app.include_router(schedule.router)
app.include_router(tasks.router)
app.include_router(health.router)


@app.on_event("startup")
def startup():
    settings = get_settings()
    if settings.secret_key == "change-me-to-a-long-random-string":
        log.warning("SECRET_KEY is still the default! Set a unique SECRET_KEY in .env for production.")
    if settings.admin_password == "admin123":
        log.warning("ADMIN_PASSWORD is still the default! Change ADMIN_PASSWORD in .env for production.")

    fs = get_firestore()
    if fs is not None:
        try:
            fs.collections()
            log.info("Firebase Firestore connected.")
        except Exception as exc:
            log.warning("Firebase Firestore not available: %s", exc)

    ensure_admin_user()
