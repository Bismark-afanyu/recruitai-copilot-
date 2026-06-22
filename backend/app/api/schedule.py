"""Interview schedule endpoints."""
from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.interview_schedule import InterviewScheduleCreate, InterviewScheduleUpdate
from app.services import interview_schedule as schedule_service

router = APIRouter(prefix="/api/schedule", tags=["schedule"], dependencies=[Depends(get_current_user)])


@router.post("")
def create(body: InterviewScheduleCreate, user: dict = Depends(get_current_user)):
    return schedule_service.create(body, user)


@router.get("")
def list_all(status: str | None = None, limit: int = 20, user: dict = Depends(get_current_user)):
    return schedule_service.list_all(user, status_filter=status, limit=limit)


@router.get("/{schedule_id}")
def get(schedule_id: str, user: dict = Depends(get_current_user)):
    return schedule_service.get(schedule_id, user)


@router.patch("/{schedule_id}")
def update(schedule_id: str, body: InterviewScheduleUpdate, user: dict = Depends(get_current_user)):
    return schedule_service.update(schedule_id, body, user)


@router.delete("/{schedule_id}")
def delete(schedule_id: str, user: dict = Depends(get_current_user)):
    return schedule_service.delete(schedule_id, user)
