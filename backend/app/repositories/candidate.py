from google.cloud.firestore import Query

from .base import _get, _set, _delete, _query, _next_id, _now


def create_candidate(
    org_id: str,
    job_id: str,
    name: str,
    email: str,
    phone: str,
    source_filename: str,
    raw_cv_text: str,
    parsed_cv: dict,
) -> str:
    candidate_id = _next_id("candidates")
    _set("candidates", candidate_id, {
        "org_id": org_id,
        "job_id": job_id,
        "name": name,
        "email": email,
        "phone": phone,
        "source_filename": source_filename,
        "status": "New",
        "raw_cv_text": raw_cv_text,
        "parsed_cv": parsed_cv,
        "created_at": _now(),
    })
    return candidate_id


def get_candidate(candidate_id: str) -> dict | None:
    return _get("candidates", candidate_id)


def list_candidates(
    org_id: str,
    job_id: str | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[dict], int]:
    filters = [("org_id", "==", org_id)]
    if job_id:
        filters.append(("job_id", "==", job_id))
    if status:
        filters.append(("status", "==", status))
    return _query(
        "candidates",
        filters=filters,
        order_by=("created_at", Query.DESCENDING),
        limit=limit,
        offset=skip,
    )


def update_candidate_status(candidate_id: str, status: str) -> None:
    _set("candidates", candidate_id, {"status": status})


def delete_candidate(candidate_id: str) -> None:
    cascade = ["analyses", "question_sets", "evaluations", "sessions", "reports"]
    for coll in cascade:
        _delete(coll, candidate_id)
    _delete("candidates", candidate_id)


def candidate_summary_dict(doc: dict) -> dict:
    return {
        "id": doc["id"],
        "job_id": doc.get("job_id", ""),
        "name": doc.get("name", ""),
        "email": doc.get("email", ""),
        "phone": doc.get("phone", ""),
        "status": doc.get("status", "New"),
        "source_filename": doc.get("source_filename", ""),
        "cv_score": doc.get("_analysis_total_score"),
        "cv_recommendation": doc.get("_analysis_recommendation"),
        "interview_score": doc.get("_evaluation_score"),
        "has_questions": doc.get("_has_questions", False),
        "has_report": doc.get("_has_report", False),
        "created_at": doc.get("created_at", ""),
    }


def enrich_candidate_detail(candidate: dict) -> dict:
    from .analysis import get_analysis, get_question_set, get_evaluation, get_report
    from .job import get_job
    from .analysis import get_session

    cid = candidate["id"]
    data = dict(candidate)

    job = get_job(candidate.get("job_id", ""))
    data["job_title"] = job.get("title", "") if job else ""

    analysis = get_analysis(cid)
    data["analysis"] = analysis.get("result") if analysis else None
    data["parsed_cv"] = candidate.get("parsed_cv", {})
    data["raw_cv_text"] = candidate.get("raw_cv_text", "")

    qs = get_question_set(cid)
    data["questions"] = qs.get("questions") if qs else None

    ev = get_evaluation(cid)
    data["evaluation"] = {
        "ratings": ev.get("ratings", {}),
        "interviewer_notes": ev.get("interviewer_notes", ""),
        "score": ev.get("score", 0),
        "ai_summary": ev.get("ai_summary", ""),
    } if ev else None

    rp = get_report(cid)
    data["final_report"] = {
        "content": rp.get("content", {}),
        "recommendation": rp.get("recommendation", ""),
        "salary_range": rp.get("salary_range", ""),
        "hr_notes": rp.get("hr_notes", ""),
    } if rp else None

    if job:
        data["job_extracted"] = job.get("extracted", {})

    sess = get_session(cid)
    data["interview_session"] = {
        "token": sess.get("token", ""),
        "status": sess.get("status", ""),
        "transcript": sess.get("transcript", []),
        "expires_at": sess.get("expires_at"),
        "completed_at": sess.get("completed_at"),
        "ai_assessment": sess.get("ai_assessment"),
    } if sess else None

    return data
