from pydantic import BaseModel


class InterviewSession(BaseModel):
    candidate_id: str | None = None
    org_id: str = ""
    token: str = ""
    status: str = "pending"
    transcript: list = []
    ai_assessment: dict = {}
    created_at: str = ""
    expires_at: str | None = None
    completed_at: str | None = None
