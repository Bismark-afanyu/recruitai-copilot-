"""Background task orchestration."""
from fastapi import HTTPException

from app.ai import service as ai
from app.repositories import candidate as candidate_repo
from app.repositories import analysis as analysis_repo
from app.repositories import job as job_repo
from app.repositories.candidate import enrich_candidate_detail
from app.task_queue import tasks


def _analyze_handler(candidate_id: str, org_id: str) -> dict:
    candidate = candidate_repo.get_candidate(candidate_id)
    if not candidate:
        raise ValueError(f"Candidate {candidate_id} not found")
    job = job_repo.get_job(candidate.get("job_id", ""))
    if not job:
        raise ValueError(f"Job not found for candidate {candidate_id}")
    result = ai.score_candidate(job.get("extracted", {}), candidate.get("parsed_cv", {}))
    analysis_repo.set_analysis(candidate_id, org_id, result)
    return enrich_candidate_detail(candidate_repo.get_candidate(candidate_id))


tasks.register("analyze_candidate", _analyze_handler)


def submit_analysis(candidate_id: str, user: dict) -> dict:
    org_id = user.get("org_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization assigned")
    candidate = candidate_repo.get_candidate(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    task_id = tasks.enqueue("analyze_candidate", candidate_id=candidate_id, org_id=org_id)
    return {"task_id": task_id}


def get_task_status(task_id: str) -> dict:
    status = tasks.get_status(task_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return status
