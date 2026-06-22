"""Job business logic — CRUD orchestrated with AI extraction."""
from fastapi import HTTPException

from app.ai import service as ai
from app.repositories import job as repo


def _org(user: dict) -> str:
    org_id = user.get("org_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization assigned")
    return org_id


def _job_dict(doc: dict, include_description: bool = False) -> dict:
    data = {
        "id": doc["id"],
        "title": doc.get("title", ""),
        "extracted": doc.get("extracted", {}),
        "candidate_count": len(doc.get("_candidates", []) or []),
        "created_at": doc.get("created_at", ""),
    }
    if include_description:
        data["raw_description"] = doc.get("raw_description", "")
    return data


def create(description: str, user: dict) -> dict:
    org_id = _org(user)
    try:
        extracted = ai.extract_job(description)
    except ai.AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    job_id = repo.create_job(
        org_id=org_id,
        title=extracted.get("job_title") or "Untitled Role",
        raw_description=description,
        extracted=extracted,
    )
    doc = repo.get_job(job_id)
    return _job_dict(doc, include_description=True)


def list_all(user: dict, skip: int = 0, limit: int = 50) -> dict:
    org_id = _org(user)
    items, total = repo.list_jobs(org_id, skip=skip, limit=limit)
    return {"total": total, "items": [_job_dict(j) for j in items]}


def get(job_id: str, user: dict) -> dict:
    doc = repo.get_job(job_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_dict(doc, include_description=True)


def delete(job_id: str, user: dict) -> dict:
    doc = repo.get_job(job_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")
    repo.delete_job(job_id)
    return {"deleted": job_id}
