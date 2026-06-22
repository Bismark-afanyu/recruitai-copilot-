"""Recruiter task repository."""
from google.cloud.firestore import Query

from .base import _get, _set, _delete, _query, _next_id, _now


def create_recruiter_task(
    org_id: str,
    title: str,
    status: str,
    assignee_name: str = "",
    description: str = "",
    related_job_id: str = "",
    related_candidate_id: str = "",
    due_at: str = "",
) -> str:
    task_id = _next_id("recruiter_tasks")
    now = _now()
    _set("recruiter_tasks", task_id, {
        "org_id": org_id,
        "title": title,
        "description": description,
        "assignee_name": assignee_name,
        "status": status,
        "related_job_id": related_job_id,
        "related_candidate_id": related_candidate_id,
        "due_at": due_at,
        "created_at": now,
        "updated_at": now,
    })
    return task_id


def list_recruiter_tasks(org_id: str, status: str | None = None, limit: int | None = None) -> list[dict]:
    filters = [("org_id", "==", org_id)]
    if status:
        filters.append(("status", "==", status))
    items, _ = _query("recruiter_tasks", filters=filters)
    items.sort(key=lambda d: (d.get("due_at") or "", d.get("created_at") or ""), reverse=True)
    return items[:limit] if limit else items


def get_recruiter_task(task_id: str) -> dict | None:
    return _get("recruiter_tasks", task_id)


def update_recruiter_task(task_id: str, data: dict) -> dict | None:
    doc = get_recruiter_task(task_id)
    if not doc:
        return None
    data["updated_at"] = _now()
    _set("recruiter_tasks", task_id, data)
    return {**doc, **data}


def delete_recruiter_task(task_id: str) -> None:
    _delete("recruiter_tasks", task_id)
