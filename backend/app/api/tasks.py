"""Background task endpoints."""
from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.services import task as task_service

router = APIRouter(prefix="/api/tasks", tags=["tasks"], dependencies=[Depends(get_current_user)])


@router.post("/analyze/{candidate_id}")
def submit_analysis(candidate_id: str, user: dict = Depends(get_current_user)):
    return task_service.submit_analysis(candidate_id, user)


@router.get("/{task_id}")
def get_task_status(task_id: str):
    return task_service.get_task_status(task_id)
