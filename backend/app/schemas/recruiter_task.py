from pydantic import BaseModel, Field


class RecruiterTaskCreate(BaseModel):
    title: str = Field(min_length=1)
    description: str = ""
    status: str = "In Progress"
    assignee_name: str = ""
    related_job_id: str = ""
    related_candidate_id: str = ""
    due_at: str = ""


class RecruiterTaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    assignee_name: str | None = None
    related_job_id: str | None = None
    related_candidate_id: str | None = None
    due_at: str | None = None
