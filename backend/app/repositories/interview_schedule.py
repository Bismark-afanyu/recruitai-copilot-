"""Interview schedule repository."""
from google.cloud.firestore import Query

from .base import _get, _set, _delete, _query, _next_id, _now


def create_interview_schedule(
    org_id: str,
    candidate_id: str,
    job_id: str,
    candidate_name: str,
    role: str,
    scheduled_at: str,
    end_at: str = "",
    timezone: str = "",
    meeting_url: str = "",
    interviewer_name: str = "",
    description: str = "",
    status: str = "Interview",
) -> str:
    schedule_id = _next_id("interview_schedules")
    now = _now()
    _set("interview_schedules", schedule_id, {
        "org_id": org_id,
        "candidate_id": candidate_id,
        "job_id": job_id,
        "candidate_name": candidate_name,
        "role": role,
        "scheduled_at": scheduled_at,
        "end_at": end_at,
        "timezone": timezone,
        "meeting_url": meeting_url,
        "interviewer_name": interviewer_name,
        "description": description,
        "status": status,
        "created_at": now,
        "updated_at": now,
    })
    return schedule_id


def list_interview_schedules(org_id: str, status: str | None = None, limit: int | None = None) -> list[dict]:
    filters = [("org_id", "==", org_id)]
    if status:
        filters.append(("status", "==", status))
    items, _ = _query("interview_schedules", filters=filters)
    items.sort(key=lambda d: d.get("scheduled_at") or "")
    return items[:limit] if limit else items


def get_interview_schedule(schedule_id: str) -> dict | None:
    return _get("interview_schedules", schedule_id)


def update_interview_schedule(schedule_id: str, data: dict) -> dict | None:
    doc = get_interview_schedule(schedule_id)
    if not doc:
        return None
    data["updated_at"] = _now()
    _set("interview_schedules", schedule_id, data)
    return {**doc, **data}


def delete_interview_schedule(schedule_id: str) -> None:
    _delete("interview_schedules", schedule_id)
