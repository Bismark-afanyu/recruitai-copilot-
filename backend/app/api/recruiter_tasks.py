"""Recruiter task endpoints."""
from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.recruiter_task import RecruiterTaskCreate, RecruiterTaskUpdate
from app.services import recruiter_task as task_service

router = APIRouter(prefix="/api/recruiter-tasks", tags=["recruiter-tasks"], dependencies=[Depends(get_current_user)])


@router.post("")
def create(body: RecruiterTaskCreate, user: dict = Depends(get_current_user)):
    return task_service.create(body, user)


@router.get("")
def list_all(status: str | None = None, limit: int = 20, user: dict = Depends(get_current_user)):
    return task_service.list_all(user, status_filter=status, limit=limit)


@router.get("/{task_id}")
def get(task_id: str, user: dict = Depends(get_current_user)):
    return task_service.get(task_id, user)


@router.patch("/{task_id}")
def update(task_id: str, body: RecruiterTaskUpdate, user: dict = Depends(get_current_user)):
    return task_service.update(task_id, body, user)


@router.delete("/{task_id}")
def delete(task_id: str, user: dict = Depends(get_current_user)):
    return task_service.delete(task_id, user)
