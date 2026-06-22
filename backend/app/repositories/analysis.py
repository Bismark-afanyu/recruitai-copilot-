from .base import _get, _set, _delete, _query, _now


# --------------------------------------------------------------------------
# Analysis (1:1 with candidate — document ID = candidate_id)
# --------------------------------------------------------------------------

def set_analysis(candidate_id: str, org_id: str, data: dict) -> None:
    _set("analyses", candidate_id, {
        "org_id": org_id,
        "candidate_id": candidate_id,
        "total_score": data["total_score"],
        "match_percentage": data["match_percentage"],
        "recommendation": data["recommendation"],
        "result": data,
        "created_at": _now(),
    })


def get_analysis(candidate_id: str) -> dict | None:
    return _get("analyses", candidate_id)


# --------------------------------------------------------------------------
# Question Sets (1:1 with candidate)
# --------------------------------------------------------------------------

def set_question_set(candidate_id: str, org_id: str, questions: dict) -> None:
    _set("question_sets", candidate_id, {
        "org_id": org_id,
        "candidate_id": candidate_id,
        "questions": questions,
        "created_at": _now(),
    })


def get_question_set(candidate_id: str) -> dict | None:
    return _get("question_sets", candidate_id)


# --------------------------------------------------------------------------
# Evaluation (1:1 with candidate)
# --------------------------------------------------------------------------

def set_evaluation(candidate_id: str, org_id: str, data: dict) -> None:
    _set("evaluations", candidate_id, {
        "org_id": org_id,
        "candidate_id": candidate_id,
        "ratings": data["ratings"],
        "interviewer_notes": data.get("interviewer_notes", ""),
        "score": data["score"],
        "ai_summary": data.get("ai_summary", ""),
        "created_at": _now(),
    })


def get_evaluation(candidate_id: str) -> dict | None:
    return _get("evaluations", candidate_id)


# --------------------------------------------------------------------------
# Interview Sessions (1:1 with candidate)
# --------------------------------------------------------------------------

def set_session(candidate_id: str, org_id: str, data: dict) -> None:
    _set("sessions", candidate_id, {
        "org_id": org_id,
        "candidate_id": candidate_id,
        "token": data["token"],
        "status": data.get("status", "pending"),
        "transcript": data.get("transcript", []),
        "ai_assessment": data.get("ai_assessment", {}),
        "created_at": _now(),
        "expires_at": data.get("expires_at"),
        "completed_at": data.get("completed_at"),
    })


def get_session(candidate_id: str) -> dict | None:
    return _get("sessions", candidate_id)


def get_session_by_token(token: str) -> dict | None:
    items, _ = _query("sessions", filters=[("token", "==", token)], limit=1)
    return items[0] if items else None


# --------------------------------------------------------------------------
# Final Reports (1:1 with candidate)
# --------------------------------------------------------------------------

def set_report(candidate_id: str, org_id: str, data: dict) -> None:
    _set("reports", candidate_id, {
        "org_id": org_id,
        "candidate_id": candidate_id,
        "content": data["content"],
        "recommendation": data.get("recommendation", ""),
        "salary_range": data.get("salary_range", ""),
        "hr_notes": data.get("hr_notes", ""),
        "created_at": _now(),
    })


def get_report(candidate_id: str) -> dict | None:
    return _get("reports", candidate_id)


# --------------------------------------------------------------------------
# Dashboard helpers
# --------------------------------------------------------------------------

def count_by_status(org_id: str) -> dict[str, int]:
    """Count candidates per status. Uses Firestore streaming for accuracy."""
    from .base import db
    CANDIDATE_STATUSES = [
        "New", "Shortlisted", "Interview Scheduled",
        "Interviewed", "Recommended", "Rejected", "Hired",
    ]
    counts = {s: 0 for s in CANDIDATE_STATUSES}
    for snap in db().collection("candidates").where("org_id", "==", org_id).stream():
        s = snap.to_dict().get("status", "New")
        if s in counts:
            counts[s] += 1
    return counts


def get_recent_candidates(org_id: str, n: int = 8) -> list[dict]:
    from google.cloud.firestore import Query
    items, _ = _query(
        "candidates",
        filters=[("org_id", "==", org_id)],
        order_by=("created_at", Query.DESCENDING),
        limit=n,
    )
    return items
