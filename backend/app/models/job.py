from pydantic import BaseModel


class Job(BaseModel):
    id: str | None = None
    org_id: str = ""
    title: str = ""
    raw_description: str = ""
    extracted: dict = {}
    status: str = "open"
    is_active: bool = True
    department: str = ""
    target_headcount: int = 1
    filled_count: int = 0
    created_at: str = ""
