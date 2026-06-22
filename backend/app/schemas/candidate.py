from pydantic import BaseModel, Field


class StatusUpdate(BaseModel):
    status: str


class CandidateResponse(BaseModel):
    id: str
    job_id: str = ""
    org_id: str = ""
    name: str = ""
    email: str = ""
    phone: str = ""
    source_filename: str = ""
    status: str = "New"
    raw_cv_text: str = ""
    parsed_cv: dict = {}
    created_at: str = ""
    job_title: str = ""
    analysis: dict | None = None
    questions: list | dict | None = None
    evaluation: dict | None = None
    final_report: dict | None = None
    interview_session: dict | None = None
    job_extracted: dict | None = None
