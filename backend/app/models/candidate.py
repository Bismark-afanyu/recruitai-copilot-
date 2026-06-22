from pydantic import BaseModel


class Candidate(BaseModel):
    id: str | None = None
    org_id: str = ""
    job_id: str = ""
    name: str = ""
    email: str = ""
    phone: str = ""
    source_filename: str = ""
    status: str = "New"
    raw_cv_text: str = ""
    parsed_cv: dict = {}
    created_at: str = ""


class CandidateSummary(BaseModel):
    id: str
    job_id: str = ""
    name: str = ""
    email: str = ""
    phone: str = ""
    status: str = "New"
    source_filename: str = ""
    cv_score: float | None = None
    cv_recommendation: str | None = None
    interview_score: float | None = None
    has_questions: bool = False
    has_report: bool = False
    created_at: str = ""
