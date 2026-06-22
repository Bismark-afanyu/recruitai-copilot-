"""Interview business logic — AI-conducted interview flow."""
import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from app.ai import service as ai
from app.repositories import candidate as candidate_repo
from app.repositories import analysis as analysis_repo
from app.repositories import job as job_repo

log = logging.getLogger("recruitai.interview")

LINK_VALIDITY_DAYS = 7


def _org(user: dict) -> str:
    org_id = user.get("org_id")
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization assigned")
    return org_id


def session_dict(sess: dict, include_assessment: bool = False) -> dict:
    data = {
        "token": sess.get("token", ""),
        "status": sess.get("status", ""),
        "transcript": sess.get("transcript", []),
        "created_at": sess.get("created_at", ""),
        "expires_at": sess.get("expires_at"),
        "completed_at": sess.get("completed_at"),
        "has_assessment": bool(sess.get("ai_assessment")),
    }
    if include_assessment:
        data["ai_assessment"] = sess.get("ai_assessment")
    return data


def _public_dict(sess: dict, candidate: dict | None = None) -> dict:
    if candidate is None:
        candidate = candidate_repo.get_candidate(sess.get("candidate_id", "")) or {}
    job = job_repo.get_job(candidate.get("job_id", "")) if candidate.get("job_id") else {}
    return {
        "candidate_name": candidate.get("name", ""),
        "job_title": job.get("title", ""),
        "status": sess.get("status", ""),
        "transcript": sess.get("transcript", []),
    }


def _assess_and_apply(candidate_id: str, candidate: dict, job: dict, sess: dict, org_id: str) -> None:
    assessment = ai.assess_interview(
        candidate_name=candidate.get("name", ""),
        job_title=job.get("title", ""),
        job_extracted=job.get("extracted", {}),
        transcript=sess.get("transcript", []),
    )
    analysis_repo.set_session(candidate_id, org_id, {**sess, "ai_assessment": assessment})

    ratings = assessment["ratings"]
    score = ai.compute_interview_score(ratings)
    notes = "[AI-conducted interview — pending human review] " + assessment.get("notes", "")

    existing = analysis_repo.get_evaluation(candidate_id)
    if existing:
        if existing.get("interviewer_notes") and not existing["interviewer_notes"].startswith(
            "[AI-conducted interview — pending human review]"
        ):
            log.info(
                "Skipping AI assessment pre-fill for candidate %s — existing evaluation has human edits.",
                candidate_id,
            )
            return

    analysis_repo.set_evaluation(candidate_id, org_id, {
        "ratings": ratings,
        "interviewer_notes": notes,
        "score": score,
        "ai_summary": assessment.get("summary", ""),
    })


# ---------------------------------------------------------------------------
# HR endpoints
# ---------------------------------------------------------------------------

def create_interview_link(candidate_id: str, user: dict) -> dict:
    org_id = _org(user)
    candidate = candidate_repo.get_candidate(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    token = secrets.token_urlsafe(24)
    now = datetime.now(timezone.utc)
    analysis_repo.set_session(candidate_id, org_id, {
        "token": token,
        "status": "pending",
        "transcript": [],
        "ai_assessment": {},
        "expires_at": (now + timedelta(days=LINK_VALIDITY_DAYS)).isoformat(),
        "completed_at": None,
    })
    if candidate.get("status") in ("New", "Shortlisted"):
        candidate_repo.update_candidate_status(candidate_id, "Interview Scheduled")

    sess = analysis_repo.get_session(candidate_id)
    return session_dict(sess)


def get_interview_session(candidate_id: str, user: dict) -> dict:
    sess = analysis_repo.get_session(candidate_id)
    if not sess:
        raise HTTPException(status_code=404, detail="No interview session for this candidate")
    return session_dict(sess, include_assessment=True)


def rerun_assessment(candidate_id: str, user: dict) -> dict:
    org_id = _org(user)
    candidate = candidate_repo.get_candidate(candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    sess = analysis_repo.get_session(candidate_id)
    if not sess:
        raise HTTPException(status_code=404, detail="No interview session for this candidate")
    if sess.get("status") != "completed":
        raise HTTPException(status_code=409, detail="The interview has not been completed yet.")
    job = job_repo.get_job(candidate.get("job_id", ""))
    try:
        _assess_and_apply(candidate_id, candidate, job or {}, sess, org_id)
    except ai.AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    return candidate_repo.enrich_candidate_detail(candidate_repo.get_candidate(candidate_id))


# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------

def _get_session_by_token_or_404(token: str) -> dict:
    sess = analysis_repo.get_session_by_token(token)
    if not sess:
        raise HTTPException(status_code=404, detail="This interview link is invalid.")
    expires = sess.get("expires_at")
    if expires and sess.get("status") != "completed":
        try:
            exp = datetime.fromisoformat(expires)
            if datetime.now(timezone.utc) > exp:
                raise HTTPException(status_code=410, detail="This interview link has expired. Please contact the recruiter.")
        except (ValueError, TypeError):
            pass
    return sess


def get_public_interview(token: str) -> dict:
    sess = _get_session_by_token_or_404(token)
    candidate = candidate_repo.get_candidate(sess.get("candidate_id", "")) or {}
    return _public_dict(sess, candidate)


def start_interview(token: str) -> dict:
    sess = _get_session_by_token_or_404(token)
    if sess.get("status") == "completed":
        raise HTTPException(status_code=409, detail="This interview has already been completed.")
    if sess.get("status") == "in_progress":
        candidate = candidate_repo.get_candidate(sess.get("candidate_id", "")) or {}
        return _public_dict(sess, candidate)

    candidate = candidate_repo.get_candidate(sess.get("candidate_id", ""))
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    job = job_repo.get_job(candidate.get("job_id", ""))
    qs = analysis_repo.get_question_set(sess.get("candidate_id", ""))

    try:
        turn = ai.conduct_interview_turn(
            candidate_name=candidate.get("name", ""),
            job_extracted=job.get("extracted", {}) if job else {},
            parsed_cv=candidate.get("parsed_cv", {}),
            questions=qs.get("questions") if qs else None,
            transcript=[],
        )
    except ai.AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    analysis_repo.set_session(sess["candidate_id"], candidate.get("org_id", ""), {
        "token": sess["token"],
        "status": "in_progress",
        "transcript": [{"role": "interviewer", "text": turn["message"]}],
        "ai_assessment": sess.get("ai_assessment", {}),
        "expires_at": sess.get("expires_at"),
        "completed_at": None,
    })
    updated = analysis_repo.get_session(sess["candidate_id"])
    return _public_dict(updated, candidate)


def send_message(token: str, text: str) -> dict:
    sess = _get_session_by_token_or_404(token)
    if sess.get("status") == "completed":
        raise HTTPException(status_code=409, detail="This interview has already been completed.")
    if sess.get("status") != "in_progress":
        raise HTTPException(status_code=409, detail="The interview has not started yet.")

    candidate = candidate_repo.get_candidate(sess.get("candidate_id", ""))
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    job = job_repo.get_job(candidate.get("job_id", ""))
    qs = analysis_repo.get_question_set(sess.get("candidate_id", ""))

    transcript = list(sess.get("transcript", []))
    transcript.append({"role": "candidate", "text": text.strip()})

    interviewer_turns = sum(1 for e in transcript if e["role"] == "interviewer")
    if interviewer_turns >= ai.HARD_TURN_LIMIT:
        turn = {
            "message": (
                "Thank you for your time — that concludes our interview. "
                "The hiring team will review your answers and contact you about next steps."
            ),
            "is_complete": True,
        }
    else:
        try:
            turn = ai.conduct_interview_turn(
                candidate_name=candidate.get("name", ""),
                job_extracted=job.get("extracted", {}) if job else {},
                parsed_cv=candidate.get("parsed_cv", {}),
                questions=qs.get("questions") if qs else None,
                transcript=transcript,
                force_wrap_up=interviewer_turns >= ai.MAX_INTERVIEWER_TURNS,
            )
        except ai.AIServiceError as exc:
            raise HTTPException(status_code=502, detail=str(exc))

    transcript.append({"role": "interviewer", "text": turn["message"]})
    is_complete = turn.get("is_complete", False)
    now = datetime.now(timezone.utc).isoformat()

    sess_data = {
        "token": sess["token"],
        "status": "completed" if is_complete else "in_progress",
        "transcript": transcript,
        "ai_assessment": sess.get("ai_assessment", {}),
        "expires_at": sess.get("expires_at"),
        "completed_at": now if is_complete else None,
    }

    if is_complete:
        if candidate.get("status") in ("New", "Shortlisted", "Interview Scheduled"):
            candidate_repo.update_candidate_status(sess["candidate_id"], "Interviewed")
        try:
            _assess_and_apply(
                sess["candidate_id"], candidate, job or {},
                {**sess, **sess_data}, candidate.get("org_id", ""),
            )
        except ai.AIServiceError as exc:
            log.warning("AI assessment failed for candidate %s: %s", sess["candidate_id"], exc)
            sess_data["ai_assessment"] = {"error": str(exc), "note": "Assessment failed. HR can re-run."}

    analysis_repo.set_session(sess["candidate_id"], candidate.get("org_id", ""), sess_data)
    updated = analysis_repo.get_session(sess["candidate_id"])
    return _public_dict(updated, candidate)
