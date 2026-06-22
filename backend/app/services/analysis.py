"""Analysis, evaluation, and report business logic."""
from fastapi import HTTPException

from app.ai import service as ai
from app.repositories import analysis as analysis_repo
from app.repositories import candidate as candidate_repo
from app.repositories import job as job_repo
from app.repositories.candidate import enrich_candidate_detail
from app.services.pdf_export import build_report_pdf


def _org(user: dict) -> str:
    org_id = user.get("org_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization assigned")
    return org_id


def analyze(candidate_id: str, user: dict) -> dict:
    org_id = _org(user)
    candidate = candidate_repo.get_candidate(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    job = job_repo.get_job(candidate.get("job_id", ""))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    try:
        result = ai.score_candidate(job.get("extracted", {}), candidate.get("parsed_cv", {}))
    except ai.AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    analysis_repo.set_analysis(candidate_id, org_id, result)
    return enrich_candidate_detail(candidate_repo.get_candidate(candidate_id))


def generate_questions(candidate_id: str, user: dict) -> dict:
    org_id = _org(user)
    candidate = candidate_repo.get_candidate(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    job = job_repo.get_job(candidate.get("job_id", ""))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    analysis = analysis_repo.get_analysis(candidate_id)
    try:
        questions = ai.generate_questions(
            job.get("extracted", {}),
            candidate.get("parsed_cv", {}),
            analysis.get("result") if analysis else None,
        )
    except ai.AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    analysis_repo.set_question_set(candidate_id, org_id, questions)
    return enrich_candidate_detail(candidate_repo.get_candidate(candidate_id))


def submit_evaluation(candidate_id: str, ratings: dict, interviewer_notes: str, user: dict) -> dict:
    org_id = _org(user)
    candidate = candidate_repo.get_candidate(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    missing = [c for c in ai.EVALUATION_CATEGORIES if c not in ratings]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing ratings for: {', '.join(missing)}")
    invalid = [c for c, v in ratings.items() if not 1 <= int(v) <= 5]
    if invalid:
        raise HTTPException(status_code=422, detail=f"Ratings must be 1-5: {', '.join(invalid)}")

    score = ai.compute_interview_score(ratings)
    try:
        summary = ai.summarize_interview(
            candidate.get("name", ""),
            job_repo.get_job_title(candidate.get("job_id", "")),
            ratings,
            interviewer_notes,
            score,
        )
    except ai.AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    analysis_repo.set_evaluation(candidate_id, org_id, {
        "ratings": ratings,
        "interviewer_notes": interviewer_notes,
        "score": score,
        "ai_summary": summary,
    })
    if candidate.get("status") in ("New", "Shortlisted", "Interview Scheduled"):
        candidate_repo.update_candidate_status(candidate_id, "Interviewed")
    return enrich_candidate_detail(candidate_repo.get_candidate(candidate_id))


def generate_report(candidate_id: str, user: dict) -> dict:
    org_id = _org(user)
    candidate = candidate_repo.get_candidate(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    analysis = analysis_repo.get_analysis(candidate_id)
    if not analysis:
        raise HTTPException(status_code=409, detail="Run the CV analysis first.")
    evaluation = analysis_repo.get_evaluation(candidate_id)
    if not evaluation:
        raise HTTPException(status_code=409, detail="Submit the interview evaluation first.")
    job = job_repo.get_job(candidate.get("job_id", ""))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    try:
        content = ai.generate_final_report(
            candidate_name=candidate.get("name", ""),
            job_title=job.get("title", ""),
            analysis_result=analysis.get("result", {}),
            cv_score=analysis.get("total_score", 0),
            interview_score=evaluation.get("score", 0),
            ratings=evaluation.get("ratings", {}),
            notes=evaluation.get("interviewer_notes", ""),
            interview_summary=evaluation.get("ai_summary", ""),
        )
    except ai.AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    existing = analysis_repo.get_report(candidate_id)
    salary_range = existing.get("salary_range", "") if existing else ""
    hr_notes = existing.get("hr_notes", "") if existing else ""

    analysis_repo.set_report(candidate_id, org_id, {
        "content": content,
        "recommendation": content.get("recommendation", ""),
        "salary_range": salary_range,
        "hr_notes": hr_notes,
    })
    return enrich_candidate_detail(candidate_repo.get_candidate(candidate_id))


def update_report(candidate_id: str, salary_range: str | None, hr_notes: str | None, user: dict) -> dict:
    candidate = candidate_repo.get_candidate(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    existing = analysis_repo.get_report(candidate_id)
    if not existing:
        raise HTTPException(status_code=404, detail="No report generated yet.")
    analysis_repo.set_report(candidate_id, candidate.get("org_id", ""), {
        "content": existing.get("content", {}),
        "recommendation": existing.get("recommendation", ""),
        "salary_range": salary_range if salary_range is not None else existing.get("salary_range", ""),
        "hr_notes": hr_notes if hr_notes is not None else existing.get("hr_notes", ""),
    })
    return enrich_candidate_detail(candidate_repo.get_candidate(candidate_id))


def export_report_pdf(candidate_id: str, user: dict):
    candidate = candidate_repo.get_candidate(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    job = job_repo.get_job(candidate.get("job_id", ""))
    analysis = analysis_repo.get_analysis(candidate_id)
    evaluation = analysis_repo.get_evaluation(candidate_id)
    report = analysis_repo.get_report(candidate_id)
    if not report:
        raise HTTPException(status_code=404, detail="No report generated yet.")

    pdf = build_report_pdf(candidate, job or {}, analysis or {}, evaluation or {}, report)
    safe_name = "".join(ch if ch.isalnum() else "_" for ch in candidate.get("name", "candidate"))
    return pdf, safe_name
