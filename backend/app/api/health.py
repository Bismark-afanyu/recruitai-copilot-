"""Health check endpoint."""
from fastapi import APIRouter

from app.core.firebase import get_firestore

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health():
    fs = get_firestore()
    if fs is not None:
        try:
            fs.collections()
            return {"status": "ok", "database": "connected"}
        except Exception:
            return {"status": "degraded", "database": "unreachable"}
    return {"status": "degraded", "database": "not configured"}
