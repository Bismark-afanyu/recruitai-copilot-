"""Candidate endpoints."""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.api.deps import get_current_user
from app.schemas.candidate import StatusUpdate
from app.services import candidate as candidate_service

router = APIRouter(prefix="/api", tags=["candidates"], dependencies=[Depends(get_current_user)])


@router.post("/jobs/{job_id}/candidates/upload")
def upload_cvs(job_id: str, files: list[UploadFile] = File(...), user: dict = Depends(get_current_user)):
    return candidate_service.upload_cvs(job_id, files, user)


@router.get("/candidates")
def list_all(
    job_id: str | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 50,
    user: dict = Depends(get_current_user),
):
    return candidate_service.list_all(user, job_id=job_id, status=status, skip=skip, limit=limit)


@router.get("/candidates/{candidate_id}")
def get(candidate_id: str, user: dict = Depends(get_current_user)):
    return candidate_service.get(candidate_id, user)


@router.patch("/candidates/{candidate_id}/status")
def update_status(candidate_id: str, body: StatusUpdate, user: dict = Depends(get_current_user)):
    return candidate_service.update_status(candidate_id, body.status, user)


@router.delete("/candidates/{candidate_id}")
def delete(candidate_id: str, user: dict = Depends(get_current_user)):
    return candidate_service.delete(candidate_id, user)
