"""Job endpoints."""
from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.job import JobCreate
from app.services import job as job_service

router = APIRouter(prefix="/api/jobs", tags=["jobs"], dependencies=[Depends(get_current_user)])


@router.post("")
def create(body: JobCreate, user: dict = Depends(get_current_user)):
    return job_service.create(body.description, user)


@router.get("")
def list_all(skip: int = 0, limit: int = 50, user: dict = Depends(get_current_user)):
    return job_service.list_all(user, skip=skip, limit=limit)


@router.get("/{job_id}")
def get(job_id: str, user: dict = Depends(get_current_user)):
    return job_service.get(job_id, user)


@router.delete("/{job_id}")
def delete(job_id: str, user: dict = Depends(get_current_user)):
    return job_service.delete(job_id, user)
