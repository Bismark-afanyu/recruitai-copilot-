from pydantic import BaseModel


class Analysis(BaseModel):
    candidate_id: str | None = None
    org_id: str = ""
    total_score: float = 0.0
    match_percentage: float = 0.0
    recommendation: str = ""
    result: dict = {}
    created_at: str = ""


class QuestionSet(BaseModel):
    candidate_id: str | None = None
    org_id: str = ""
    questions: dict = {}
    created_at: str = ""


class Evaluation(BaseModel):
    candidate_id: str | None = None
    org_id: str = ""
    ratings: dict = {}
    interviewer_notes: str = ""
    score: float = 0.0
    ai_summary: str = ""
    created_at: str = ""


class Report(BaseModel):
    candidate_id: str | None = None
    org_id: str = ""
    content: dict = {}
    recommendation: str = ""
    salary_range: str = ""
    hr_notes: str = ""
    created_at: str = ""
