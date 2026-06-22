from pydantic import BaseModel
from typing import Any


class PaginatedResponse(BaseModel):
    items: list[Any]
    total: int
    skip: int = 0
    limit: int = 50


class HealthResponse(BaseModel):
    status: str
    database: str
