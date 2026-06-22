from pydantic import BaseModel, Field


class EvaluationRequest(BaseModel):
    ratings: dict[str, int]
    interviewer_notes: str = ""


class ReportUpdateRequest(BaseModel):
    salary_range: str | None = None
    hr_notes: str | None = None
