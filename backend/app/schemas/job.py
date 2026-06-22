from pydantic import BaseModel, Field


class JobCreate(BaseModel):
    description: str = Field(min_length=30, description="Full job description text")


class JobResponse(BaseModel):
    id: str
    org_id: str = ""
    title: str = ""
    raw_description: str = ""
    extracted: dict = {}
    status: str = "open"
    is_active: bool = True
    department: str = ""
    target_headcount: int = 1
    filled_count: int = 0
    candidate_count: int = 0
    created_at: str = ""
