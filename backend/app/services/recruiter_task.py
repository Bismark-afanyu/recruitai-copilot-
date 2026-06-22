"""Recruiter task business logic."""
from fastapi import HTTPException, status

from app.repositories import recruiter_task as repo


def _org(user: dict) -> str:
    org_id = user.get("org_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization assigned")
    return org_id


def _task_dict(doc: dict) -> dict:
    return {
        "id": doc["id"],
        "title": doc.get("title", ""),
        "description": doc.get("description", ""),
        "status": doc.get("status", "In Progress"),
        "assignee_name": doc.get("assignee_name", ""),
        "related_job_id": doc.get("related_job_id", ""),
        "related_candidate_id": doc.get("related_candidate_id", ""),
        "due_at": doc.get("due_at", ""),
        "created_at": doc.get("created_at", ""),
        "updated_at": doc.get("updated_at", ""),
    }


def create(body, user: dict) -> dict:
    org_id = _org(user)
    task_id = repo.create_recruiter_task(
        org_id=org_id,
        title=body.title,
        description=body.description,
        status=body.status,
        assignee_name=body.assignee_name,
        related_job_id=body.related_job_id,
        related_candidate_id=body.related_candidate_id,
        due_at=body.due_at,
    )
    return _task_dict(repo.get_recruiter_task(task_id))


def list_all(user: dict, status_filter: str | None = None, limit: int = 20) -> dict:
    org_id = _org(user)
    items = repo.list_recruiter_tasks(org_id, status=status_filter, limit=limit)
    return {"total": len(items), "items": [_task_dict(i) for i in items]}


def get(task_id: str, user: dict) -> dict:
    org_id = _org(user)
    doc = repo.get_recruiter_task(task_id)
    if not doc or doc.get("org_id") != org_id:
        raise HTTPException(status_code=404, detail="Task not found")
    return _task_dict(doc)


def update(task_id: str, body, user: dict) -> dict:
    org_id = _org(user)
    doc = repo.get_recruiter_task(task_id)
    if not doc or doc.get("org_id") != org_id:
        raise HTTPException(status_code=404, detail="Task not found")
    data = body.model_dump(exclude_unset=True)
    updated = repo.update_recruiter_task(task_id, data)
    return _task_dict(updated)


def delete(task_id: str, user: dict) -> dict:
    org_id = _org(user)
    doc = repo.get_recruiter_task(task_id)
    if not doc or doc.get("org_id") != org_id:
        raise HTTPException(status_code=404, detail="Task not found")
    repo.delete_recruiter_task(task_id)
    return {"deleted": task_id}
