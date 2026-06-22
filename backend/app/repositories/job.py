from google.cloud.firestore import Query

from .base import _get, _set, _delete, _query, _next_id, _now


def create_job(
    org_id: str,
    title: str,
    raw_description: str,
    extracted: dict,
    status: str = "open",
    is_active: bool = True,
    department: str = "",
    target_headcount: int = 1,
) -> str:
    job_id = _next_id("jobs")
    _set("jobs", job_id, {
        "org_id": org_id,
        "title": title,
        "raw_description": raw_description,
        "extracted": extracted,
        "status": status,
        "is_active": is_active,
        "department": department,
        "target_headcount": target_headcount,
        "filled_count": 0,
        "_candidates": [],
        "created_at": _now(),
    })
    return job_id


def get_job(job_id: str) -> dict | None:
    return _get("jobs", job_id)


def list_jobs(org_id: str, skip: int = 0, limit: int = 50) -> tuple[list[dict], int]:
    return _query(
        "jobs",
        filters=[("org_id", "==", org_id)],
        order_by=("created_at", Query.DESCENDING),
        limit=limit,
        offset=skip,
    )


def list_active_jobs(org_id: str) -> list[dict]:
    items, _ = _query("jobs", filters=[("org_id", "==", org_id)])
    return [j for j in items if j.get("is_active", True) and j.get("status", "open") == "open"]


def delete_job(job_id: str) -> None:
    _delete("jobs", job_id)


def get_job_title(job_id: str) -> str:
    job = get_job(job_id)
    return job.get("title", "") if job else ""


def add_candidate_to_job(job_id: str, candidate_id: str) -> None:
    job = get_job(job_id)
    if not job:
        return
    candidates = list(job.get("_candidates", []) or [])
    if candidate_id not in candidates:
        candidates.append(candidate_id)
        _set("jobs", job_id, {"_candidates": candidates})
