"""Interview schedule business logic."""
from fastapi import HTTPException

from app.repositories import interview_schedule as repo


def _org(user: dict) -> str:
    org_id = user.get("org_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization assigned")
    return org_id


def _schedule_dict(doc: dict) -> dict:
    return {
        "id": doc["id"],
        "candidate_id": doc.get("candidate_id", ""),
        "job_id": doc.get("job_id", ""),
        "candidate_name": doc.get("candidate_name", ""),
        "role": doc.get("role", ""),
        "scheduled_at": doc.get("scheduled_at", ""),
        "end_at": doc.get("end_at", ""),
        "timezone": doc.get("timezone", ""),
        "meeting_url": doc.get("meeting_url", ""),
        "interviewer_name": doc.get("interviewer_name", ""),
        "description": doc.get("description", ""),
        "status": doc.get("status", "Interview"),
        "created_at": doc.get("created_at", ""),
        "updated_at": doc.get("updated_at", ""),
    }


def create(body, user: dict) -> dict:
    org_id = _org(user)
    schedule_id = repo.create_interview_schedule(
        org_id=org_id,
        candidate_id=body.candidate_id,
        job_id=body.job_id,
        candidate_name=body.candidate_name,
        role=body.role,
        scheduled_at=body.scheduled_at,
        end_at=body.end_at,
        timezone=body.timezone,
        meeting_url=body.meeting_url,
        interviewer_name=body.interviewer_name,
        description=body.description,
        status=body.status,
    )
    return _schedule_dict(repo.get_interview_schedule(schedule_id))


def list_all(user: dict, status_filter: str | None = None, limit: int = 20) -> dict:
    org_id = _org(user)
    items = repo.list_interview_schedules(org_id, status=status_filter, limit=limit)
    return {"total": len(items), "items": [_schedule_dict(i) for i in items]}


def get(schedule_id: str, user: dict) -> dict:
    org_id = _org(user)
    doc = repo.get_interview_schedule(schedule_id)
    if not doc or doc.get("org_id") != org_id:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return _schedule_dict(doc)


def update(schedule_id: str, body, user: dict) -> dict:
    org_id = _org(user)
    doc = repo.get_interview_schedule(schedule_id)
    if not doc or doc.get("org_id") != org_id:
        raise HTTPException(status_code=404, detail="Schedule not found")
    data = body.model_dump(exclude_unset=True)
    updated = repo.update_interview_schedule(schedule_id, data)
    return _schedule_dict(updated)


def delete(schedule_id: str, user: dict) -> dict:
    org_id = _org(user)
    doc = repo.get_interview_schedule(schedule_id)
    if not doc or doc.get("org_id") != org_id:
        raise HTTPException(status_code=404, detail="Schedule not found")
    repo.delete_interview_schedule(schedule_id)
    return {"deleted": schedule_id}
