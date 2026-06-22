"""Dashboard and ranking endpoints."""
from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.services import dashboard as dashboard_service

router = APIRouter(prefix="/api", tags=["dashboard"], dependencies=[Depends(get_current_user)])


@router.get("/dashboard")
def dashboard(user: dict = Depends(get_current_user)):
    return dashboard_service.dashboard(user)


@router.get("/ranking")
def ranking(
    job_id: str | None = None,
    skip: int = 0,
    limit: int = 50,
    user: dict = Depends(get_current_user),
):
    return dashboard_service.ranking(user, job_id=job_id, skip=skip, limit=limit)
