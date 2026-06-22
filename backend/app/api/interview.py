"""Interview endpoints (HR + public)."""
from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.interview import CandidateMessage
from app.services import interview as interview_service

hr_router = APIRouter(
    prefix="/api/candidates", tags=["ai-interview"], dependencies=[Depends(get_current_user)]
)
public_router = APIRouter(prefix="/api/interview", tags=["ai-interview-public"])


# --- HR endpoints ---
@hr_router.post("/{candidate_id}/interview-link")
def create_interview_link(candidate_id: str, user: dict = Depends(get_current_user)):
    return interview_service.create_interview_link(candidate_id, user)


@hr_router.get("/{candidate_id}/interview-session")
def get_interview_session(candidate_id: str, user: dict = Depends(get_current_user)):
    return interview_service.get_interview_session(candidate_id, user)


@hr_router.post("/{candidate_id}/interview-session/assess")
def rerun_assessment(candidate_id: str, user: dict = Depends(get_current_user)):
    return interview_service.rerun_assessment(candidate_id, user)


# --- Public endpoints ---
@public_router.get("/{token}")
def get_public_interview(token: str):
    return interview_service.get_public_interview(token)


@public_router.post("/{token}/start")
def start_interview(token: str):
    return interview_service.start_interview(token)


@public_router.post("/{token}/message")
def send_message(token: str, body: CandidateMessage):
    return interview_service.send_message(token, body.text)
