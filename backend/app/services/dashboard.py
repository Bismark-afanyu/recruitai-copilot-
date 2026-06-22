"""Dashboard business logic — aggregate stats and ranking."""
from fastapi import HTTPException

from app.repositories import candidate as candidate_repo
from app.repositories import analysis as analysis_repo
from app.repositories import job as job_repo


def _org(user: dict) -> str:
    org_id = user.get("org_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization assigned")
    return org_id


def dashboard(user: dict) -> dict:
    org_id = _org(user)
    jobs, _ = job_repo.list_jobs(org_id, limit=1000)
    candidates, _ = candidate_repo.list_candidates(org_id, limit=1000)
    analyzed_count = 0
    cv_scores = []
    interviewed_count = 0
    reports_count = 0

    for c in candidates:
        cid = c["id"]
        analysis = analysis_repo.get_analysis(cid)
        if analysis:
            analyzed_count += 1
            cv_scores.append(analysis.get("total_score", 0))
        if analysis_repo.get_evaluation(cid):
            interviewed_count += 1
        if analysis_repo.get_report(cid):
            reports_count += 1

    by_status = analysis_repo.count_by_status(org_id)
    recent = analysis_repo.get_recent_candidates(org_id, 8)
    for r in recent:
        r["job_title"] = job_repo.get_job_title(r.get("job_id", ""))

    return {
        "jobs": len(jobs),
        "candidates": len(candidates),
        "analyzed": analyzed_count,
        "interviewed": interviewed_count,
        "reports": reports_count,
        "average_cv_score": round(sum(cv_scores) / len(cv_scores), 1) if cv_scores else None,
        "by_status": by_status,
        "recent_candidates": [candidate_repo.candidate_summary_dict(r) for r in recent],
    }


def ranking(user: dict, job_id: str | None = None, skip: int = 0, limit: int = 50) -> dict:
    org_id = _org(user)
    candidates, total = candidate_repo.list_candidates(org_id, job_id=job_id, limit=1000)
    rows = []
    for c in candidates:
        cid = c["id"]
        analysis = analysis_repo.get_analysis(cid)
        evaluation = analysis_repo.get_evaluation(cid)
        cv = analysis.get("total_score") if analysis else None
        interview = evaluation.get("score") if evaluation else None
        if cv is not None and interview is not None:
            final = round(cv * 0.6 + interview * 0.4, 1)
        else:
            final = cv if cv is not None else interview

        item = candidate_repo.candidate_summary_dict(c)
        item["job_title"] = job_repo.get_job_title(c.get("job_id", ""))
        item["final_score"] = final
        report = analysis_repo.get_report(cid)
        item["report_recommendation"] = report.get("recommendation") if report else None
        rows.append(item)

    rows.sort(key=lambda r: (r["final_score"] is None, -(r["final_score"] or 0)))
    return {"total": total, "items": rows[skip:skip + limit]}
