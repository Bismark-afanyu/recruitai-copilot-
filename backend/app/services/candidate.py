"""Candidate business logic — CRUD orchestrated with AI CV parsing."""
from fastapi import HTTPException

from app.ai import service as ai
from app.repositories import candidate as repo
from app.repositories import job as job_repo
from app.services import file_parser


def _org(user: dict) -> str:
    org_id = user.get("org_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization assigned")
    return org_id


def upload_cvs(job_id: str, files: list, user: dict) -> dict:
    org_id = _org(user)
    job = job_repo.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    created, errors = [], []
    for upload in files:
        filename = upload.filename or "cv"
        try:
            text = file_parser.extract_text(filename, upload.file.read())
            parsed = ai.extract_cv(text)
        except file_parser.UnsupportedFileError as exc:
            errors.append({"filename": filename, "error": str(exc)})
            continue
        except ai.AIServiceError as exc:
            errors.append({"filename": filename, "error": str(exc)})
            continue

        candidate_id = repo.create_candidate(
            org_id=org_id,
            job_id=job_id,
            name=parsed.get("name") or filename,
            email=parsed.get("email", ""),
            phone=parsed.get("phone", ""),
            source_filename=filename,
            raw_cv_text=text,
            parsed_cv=parsed,
        )
        doc = repo.get_candidate(candidate_id)
        doc["job_title"] = job.get("title", "")
        created.append(repo.candidate_summary_dict(doc))

    return {"created": created, "errors": errors}


def list_all(user: dict, job_id: str | None = None, status: str | None = None,
             skip: int = 0, limit: int = 50) -> dict:
    org_id = _org(user)
    items, total = repo.list_candidates(org_id, job_id=job_id, status=status, skip=skip, limit=limit)
    for item in items:
        item["job_title"] = job_repo.get_job_title(item.get("job_id", ""))
    return {"total": total, "items": [repo.candidate_summary_dict(i) for i in items]}


def get(candidate_id: str, user: dict) -> dict:
    from app.repositories.candidate import enrich_candidate_detail
    doc = repo.get_candidate(candidate_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return enrich_candidate_detail(doc)


def update_status(candidate_id: str, status: str, user: dict) -> dict:
    from app.repositories.analysis import CANDIDATE_STATUSES
    doc = repo.get_candidate(candidate_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Candidate not found")
    from app.models.enums import CANDIDATE_STATUSES as STATUSES
    if status not in STATUSES:
        raise HTTPException(status_code=422, detail=f"Status must be one of: {', '.join(STATUSES)}")
    repo.update_candidate_status(candidate_id, status)
    doc = repo.get_candidate(candidate_id)
    doc["job_title"] = job_repo.get_job_title(doc.get("job_id", ""))
    return repo.candidate_summary_dict(doc)


def delete(candidate_id: str, user: dict) -> dict:
    doc = repo.get_candidate(candidate_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Candidate not found")
    repo.delete_candidate(candidate_id)
    return {"deleted": candidate_id}
