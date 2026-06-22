from pydantic import BaseModel, Field


class InterviewScheduleCreate(BaseModel):
    candidate_id: str = Field(min_length=1)
    job_id: str = Field(min_length=1)
    candidate_name: str = Field(min_length=1)
    role: str = Field(min_length=1)
    scheduled_at: str = Field(min_length=1)
    end_at: str = ""
    timezone: str = ""
    meeting_url: str = ""
    interviewer_name: str = ""
    description: str = ""
    status: str = "Interview"


class InterviewScheduleUpdate(BaseModel):
    candidate_name: str | None = None
    role: str | None = None
    scheduled_at: str | None = None
    end_at: str | None = None
    timezone: str | None = None
    meeting_url: str | None = None
    interviewer_name: str | None = None
    description: str | None = None
    status: str | None = None
