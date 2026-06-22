from pydantic import BaseModel


class Organization(BaseModel):
    id: str | None = None
    name: str
    created_at: str = ""
