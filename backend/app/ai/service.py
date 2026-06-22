"""Claude-powered analysis functions.

Each function sends one structured request to the Claude API and returns a
validated Python dict. JSON output is enforced with structured outputs
(output_config.format), so responses always parse.
"""
import hashlib
import json
import re
import time

import anthropic

from app.core.config import get_settings
from . import prompts

settings = get_settings()
_client = anthropic.Anthropic(api_key=settings.anthropic_api_key or None)

MAX_INPUT_CHARS = 60_000  # generous cap for a single CV / job description
_MAX_RETRIES = 3
_RETRY_BASE_DELAY = 1.0

# ---------------------------------------------------------------------------
# Tiered model selection
# ---------------------------------------------------------------------------
_MODEL_FAST_DEFAULT = "claude-sonnet-4-20250514"
_MODEL_QUALITY_DEFAULT = "claude-opus-4-8"


def get_model(tier: str = "quality") -> str:
    """Return the model name for the requested tier: 'fast' or 'quality'."""
    s = get_settings()
    if tier == "fast":
        return s.ai_model_fast or _MODEL_FAST_DEFAULT
    return s.ai_model_quality or _MODEL_QUALITY_DEFAULT


# ---------------------------------------------------------------------------
# In-memory AI response cache
# ---------------------------------------------------------------------------
_cache: dict[str, tuple[float, str]] = {}  # key -> (expiry_ts, json_str)


def _cache_key(*, prompt: str, schema_str: str, model: str, tier: str) -> str:
    raw = f"{prompt}|{schema_str}|{model}|{tier}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _cached_json_request(
    prompt: str,
    schema: dict,
    max_tokens: int = 4096,
    tier: str = "quality",
) -> dict:
    key = _cache_key(prompt=prompt, schema_str=json.dumps(schema, sort_keys=True),
                     model=get_model(tier), tier=tier)
    now = time.time()
    ttl = get_settings().ai_cache_ttl_seconds

    if ttl > 0 and key in _cache:
        expiry, cached = _cache[key]
        if now < expiry:
            return json.loads(cached)

    result = _json_request(prompt, schema, max_tokens, tier=tier)

    if ttl > 0:
        _cache[key] = (now + ttl, json.dumps(result))

    return result


def clear_cache():
    _cache.clear()


# Pattern matches common prompt-injection vectors like embedded instructions,
# XML/HTML tag closings, template variable overrides, and delimiter escapes.
_INJECTION_PATTERNS = re.compile(
    r"(?is)"
    r"(?:<\|?system\|?>|</?(?:system|assistant|user|prompt|instructions)>)"
    r"|(?:ignore\s+(?:all\s+)?(?:above|previous|below|instructions))"
    r"|(?:\{\{|\}\}|{#|#})",
)


def _sanitize(text: str) -> str:
    """Strip or replace common prompt-injection patterns in user-provided text."""
    text = _INJECTION_PATTERNS.sub("[sanitized]", text)
    return text[:MAX_INPUT_CHARS]


class AIServiceError(Exception):
    pass


def _string_array() -> dict:
    return {"type": "array", "items": {"type": "string"}}


def _create_message(*, model: str | None = None, **kwargs):
    last_exc = None
    resolved = model or settings.ai_model
    for attempt in range(_MAX_RETRIES):
        try:
            return _client.messages.create(model=resolved, **kwargs)
        except (TypeError, anthropic.AuthenticationError):
            # The SDK raises TypeError when no credentials are configured at all.
            raise AIServiceError("Anthropic API key is missing or invalid. Set ANTHROPIC_API_KEY.")
        except anthropic.RateLimitError as exc:
            last_exc = exc
            if attempt < _MAX_RETRIES - 1:
                time.sleep(_RETRY_BASE_DELAY * (2 ** attempt))
                continue
        except anthropic.APIStatusError as exc:
            # Retry on server errors (5xx), fail fast on client errors (4xx).
            if exc.status_code >= 500 and attempt < _MAX_RETRIES - 1:
                last_exc = exc
                time.sleep(_RETRY_BASE_DELAY * (2 ** attempt))
                continue
            raise AIServiceError(f"AI request failed: {exc}")
        except anthropic.APIError as exc:
            raise AIServiceError(f"AI request failed: {exc}")
    raise AIServiceError(f"AI request failed after {_MAX_RETRIES} retries: {last_exc}")


def _json_request(prompt: str, schema: dict, max_tokens: int = 4096, tier: str = "quality") -> dict:
    response = _create_message(
        max_tokens=max_tokens,
        model=get_model(tier),
        system=prompts.FAIRNESS_CHARTER,
        messages=[{"role": "user", "content": prompt}],
        output_config={"format": {"type": "json_schema", "schema": schema}},
    )
    if response.stop_reason == "refusal":
        raise AIServiceError("The AI declined to process this request.")
    text = next((b.text for b in response.content if b.type == "text"), "")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        raise AIServiceError("AI returned malformed output. Please retry.")


def _text_request(prompt: str, max_tokens: int = 1500, tier: str = "quality") -> str:
    response = _create_message(
        max_tokens=max_tokens,
        model=get_model(tier),
        system=prompts.FAIRNESS_CHARTER,
        messages=[{"role": "user", "content": prompt}],
    )
    if response.stop_reason == "refusal":
        raise AIServiceError("The AI declined to process this request.")
    return next((b.text for b in response.content if b.type == "text"), "")


# ---------------------------------------------------------------------------
# 1. Job description extraction
# ---------------------------------------------------------------------------
JOB_SCHEMA = {
    "type": "object",
    "properties": {
        "job_title": {"type": "string"},
        "required_skills": _string_array(),
        "preferred_skills": _string_array(),
        "years_of_experience": {"type": "integer"},
        "education_requirements": _string_array(),
        "responsibilities": _string_array(),
        "soft_skills": _string_array(),
        "evaluation_criteria": _string_array(),
    },
    "required": [
        "job_title", "required_skills", "preferred_skills", "years_of_experience",
        "education_requirements", "responsibilities", "soft_skills", "evaluation_criteria",
    ],
    "additionalProperties": False,
}


def extract_job(description: str, tier: str = "quality") -> dict:
    prompt = prompts.JOB_EXTRACTION_PROMPT.format(job_description=_sanitize(description))
    return _cached_json_request(prompt, JOB_SCHEMA, tier=tier)


# ---------------------------------------------------------------------------
# 2. CV extraction
# ---------------------------------------------------------------------------
CV_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "email": {"type": "string"},
        "phone": {"type": "string"},
        "location": {"type": "string"},
        "education": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "degree": {"type": "string"},
                    "institution": {"type": "string"},
                    "period": {"type": "string"},
                },
                "required": ["degree", "institution", "period"],
                "additionalProperties": False,
            },
        },
        "work_experience": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "company": {"type": "string"},
                    "period": {"type": "string"},
                    "description": {"type": "string"},
                },
                "required": ["title", "company", "period", "description"],
                "additionalProperties": False,
            },
        },
        "skills": _string_array(),
        "certifications": _string_array(),
        "projects": _string_array(),
        "achievements": _string_array(),
        "languages": _string_array(),
        "career_timeline": _string_array(),
    },
    "required": [
        "name", "email", "phone", "location", "education", "work_experience",
        "skills", "certifications", "projects", "achievements", "languages",
        "career_timeline",
    ],
    "additionalProperties": False,
}


def extract_cv(cv_text: str, tier: str = "quality") -> dict:
    prompt = prompts.CV_EXTRACTION_PROMPT.format(cv_text=_sanitize(cv_text))
    return _cached_json_request(prompt, CV_SCHEMA, max_tokens=6000, tier=tier)


# ---------------------------------------------------------------------------
# 3. Scoring + candidate summary
# ---------------------------------------------------------------------------
SCORE_CAPS = {
    "required_skills_match": 30,
    "relevant_experience": 25,
    "education_certifications": 15,
    "achievements_projects": 15,
    "soft_skills_communication": 10,
    "overall_role_fit": 5,
}

ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "scores": {
            "type": "object",
            "properties": {key: {"type": "number"} for key in SCORE_CAPS},
            "required": list(SCORE_CAPS),
            "additionalProperties": False,
        },
        "match_percentage": {"type": "number"},
        "key_strengths": _string_array(),
        "missing_skills": _string_array(),
        "risk_factors": _string_array(),
        "recommendation": {
            "type": "string",
            "enum": ["Strong Match", "Good Match", "Average Match", "Weak Match"],
        },
        "summary": {
            "type": "object",
            "properties": {
                "overview": {"type": "string"},
                "best_matching_experience": {"type": "string"},
                "top_strengths": _string_array(),
                "possible_concerns": _string_array(),
                "suggested_next_step": {"type": "string"},
            },
            "required": [
                "overview", "best_matching_experience", "top_strengths",
                "possible_concerns", "suggested_next_step",
            ],
            "additionalProperties": False,
        },
    },
    "required": [
        "scores", "match_percentage", "key_strengths", "missing_skills",
        "risk_factors", "recommendation", "summary",
    ],
    "additionalProperties": False,
}


def _recommendation_for(total: float) -> str:
    if total >= 80:
        return "Strong Match"
    if total >= 65:
        return "Good Match"
    if total >= 50:
        return "Average Match"
    return "Weak Match"


def score_candidate(job_extracted: dict, parsed_cv: dict, tier: str = "quality") -> dict:
    prompt = prompts.SCORING_PROMPT.format(
        job_json=json.dumps(job_extracted, indent=2),
        cv_json=json.dumps(parsed_cv, indent=2),
    )
    result = _cached_json_request(prompt, ANALYSIS_SCHEMA, max_tokens=6000, tier=tier)

    # Enforce category caps and recompute the total/recommendation server-side
    # so the scoring weights are always honored regardless of model output.
    scores = result.get("scores", {})
    for key, cap in SCORE_CAPS.items():
        scores[key] = max(0, min(float(scores.get(key, 0)), cap))
    total = round(sum(scores.values()), 1)
    result["scores"] = scores
    result["total_score"] = total
    result["match_percentage"] = max(0, min(float(result.get("match_percentage", total)), 100))
    result["recommendation"] = _recommendation_for(total)
    result["human_review_reminder"] = prompts.HUMAN_REVIEW_REMINDER
    return result


# ---------------------------------------------------------------------------
# 4. Interview question generation
# ---------------------------------------------------------------------------
_QUESTION_ITEM = {
    "type": "object",
    "properties": {
        "question": {"type": "string"},
        "follow_up": {"type": "string"},
    },
    "required": ["question", "follow_up"],
    "additionalProperties": False,
}

QUESTIONS_SCHEMA = {
    "type": "object",
    "properties": {
        section: {"type": "array", "items": _QUESTION_ITEM}
        for section in ["technical", "behavioral", "experience_based", "culture_fit", "practical_case"]
    },
    "required": ["technical", "behavioral", "experience_based", "culture_fit", "practical_case"],
    "additionalProperties": False,
}


def generate_questions(job_extracted: dict, parsed_cv: dict, analysis: dict | None, tier: str = "quality") -> dict:
    analysis = analysis or {}
    prompt = prompts.QUESTIONS_PROMPT.format(
        job_json=json.dumps(job_extracted, indent=2),
        cv_json=json.dumps(parsed_cv, indent=2),
        missing_skills=", ".join(analysis.get("missing_skills", [])) or "none identified",
        strengths=", ".join(analysis.get("key_strengths", [])) or "none identified",
    )
    return _cached_json_request(prompt, QUESTIONS_SCHEMA, max_tokens=6000, tier=tier)


# ---------------------------------------------------------------------------
# 4b. AI-conducted live interview
# ---------------------------------------------------------------------------
MAX_INTERVIEWER_TURNS = 14   # ask the model to wrap up after this many messages
HARD_TURN_LIMIT = 18         # force-close without the model beyond this
MAX_CANDIDATE_MESSAGE_CHARS = 4000

INTERVIEW_TURN_SCHEMA = {
    "type": "object",
    "properties": {
        "message": {"type": "string"},
        "is_complete": {"type": "boolean"},
    },
    "required": ["message", "is_complete"],
    "additionalProperties": False,
}

_INTERVIEWER_SYSTEM = prompts.FAIRNESS_CHARTER + "\n\n" + prompts.INTERVIEWER_ROLE


def conduct_interview_turn(
    candidate_name: str,
    job_extracted: dict,
    parsed_cv: dict,
    questions: dict | None,
    transcript: list[dict],
    force_wrap_up: bool = False,
    tier: str = "quality",
) -> dict:
    """Return the interviewer's next turn: {"message": str, "is_complete": bool}."""
    context = prompts.INTERVIEW_CONTEXT_PROMPT.format(
        job_json=json.dumps(job_extracted, indent=2),
        cv_json=json.dumps(parsed_cv, indent=2),
        questions_json=json.dumps(questions, indent=2) if questions else "(none prepared — derive questions from the job and CV)",
        candidate_name=candidate_name,
    )
    messages = [{"role": "user", "content": context}]
    for entry in transcript:
        role = "assistant" if entry.get("role") == "interviewer" else "user"
        text = _sanitize(entry.get("text", "")) if role == "user" else entry.get("text", "")
        messages.append({"role": role, "content": text})
    if force_wrap_up:
        messages.append({"role": "user", "content": prompts.WRAP_UP_INSTRUCTION})

    response = _create_message(
        max_tokens=1024, model=get_model(tier),
        system=_INTERVIEWER_SYSTEM,
        messages=messages,
        output_config={"format": {"type": "json_schema", "schema": INTERVIEW_TURN_SCHEMA}},
    )
    if response.stop_reason == "refusal":
        raise AIServiceError("The AI declined to process this request.")
    text = next((b.text for b in response.content if b.type == "text"), "")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        raise AIServiceError("AI returned malformed output. Please retry.")


# ---------------------------------------------------------------------------
# 4c. Assessment of an AI-conducted interview
# ---------------------------------------------------------------------------


def _build_assessment_schema() -> dict:
    rating = {"type": "integer", "enum": [1, 2, 3, 4, 5]}
    return {
        "type": "object",
        "properties": {
            "ratings": {
                "type": "object",
                "properties": {cat: rating for cat in EVALUATION_CATEGORIES},
                "required": list(EVALUATION_CATEGORIES),
                "additionalProperties": False,
            },
            "strengths": _string_array(),
            "concerns": _string_array(),
            "summary": {"type": "string"},
            "notes": {"type": "string"},
        },
        "required": ["ratings", "strengths", "concerns", "summary", "notes"],
        "additionalProperties": False,
    }


def transcript_to_text(transcript: list[dict]) -> str:
    label = {"interviewer": "Interviewer", "candidate": "Candidate"}
    return "\n".join(
        f"{label.get(e.get('role'), 'Unknown')}: {e.get('text', '')}" for e in transcript
    )


def assess_interview(candidate_name: str, job_title: str, job_extracted: dict, transcript: list[dict], tier: str = "quality") -> dict:
    prompt = prompts.INTERVIEW_ASSESSMENT_PROMPT.format(
        candidate_name=candidate_name,
        job_title=job_title,
        job_json=json.dumps(job_extracted, indent=2),
        transcript_text=transcript_to_text(transcript)[:MAX_INPUT_CHARS],
    )
    result = _cached_json_request(prompt, _build_assessment_schema(), max_tokens=4000, tier=tier)
    result["human_review_reminder"] = prompts.HUMAN_REVIEW_REMINDER
    return result


# ---------------------------------------------------------------------------
# 5. Interview evaluation
# ---------------------------------------------------------------------------
EVALUATION_CATEGORIES = [
    "technical_skills",
    "problem_solving",
    "communication",
    "relevant_experience",
    "motivation",
    "team_fit",
    "leadership_potential",
    "overall_impression",
]


def compute_interview_score(ratings: dict) -> float:
    """Average of the 1-5 ratings, scaled to 0-100."""
    values = [max(1, min(int(ratings.get(cat, 1)), 5)) for cat in EVALUATION_CATEGORIES]
    return round(sum(values) / (len(values) * 5) * 100, 1)


def summarize_interview(candidate_name: str, job_title: str, ratings: dict, notes: str, score: float, tier: str = "quality") -> str:
    ratings_text = "\n".join(
        f"- {cat.replace('_', ' ').title()}: {ratings.get(cat, 'n/a')}/5" for cat in EVALUATION_CATEGORIES
    )
    prompt = prompts.INTERVIEW_EVALUATION_PROMPT.format(
        candidate_name=candidate_name,
        job_title=job_title,
        ratings_text=ratings_text,
        score=score,
        notes=notes.strip() or "(no notes provided)",
    )
    return _text_request(prompt, tier=tier)


# ---------------------------------------------------------------------------
# 6. Final candidate report
# ---------------------------------------------------------------------------
REPORT_SCHEMA = {
    "type": "object",
    "properties": {
        "executive_summary": {"type": "string"},
        "strengths": _string_array(),
        "weaknesses": _string_array(),
        "concerns": _string_array(),
        "recommendation": {
            "type": "string",
            "enum": ["Highly Recommended", "Recommended", "Consider with Caution", "Not Recommended"],
        },
        "suggested_salary_range": {"type": "string"},
    },
    "required": [
        "executive_summary", "strengths", "weaknesses", "concerns",
        "recommendation", "suggested_salary_range",
    ],
    "additionalProperties": False,
}


def generate_final_report(
    candidate_name: str,
    job_title: str,
    analysis_result: dict,
    cv_score: float,
    interview_score: float,
    ratings: dict,
    notes: str,
    interview_summary: str,
    tier: str = "quality",
) -> dict:
    prompt = prompts.FINAL_REPORT_PROMPT.format(
        candidate_name=candidate_name,
        job_title=job_title,
        cv_score=cv_score,
        cv_recommendation=analysis_result.get("recommendation", "n/a"),
        interview_score=interview_score,
        analysis_json=json.dumps(analysis_result, indent=2),
        ratings_json=json.dumps(ratings, indent=2),
        notes=notes.strip() or "(no notes provided)",
        interview_summary=interview_summary or "(not available)",
    )
    result = _cached_json_request(prompt, REPORT_SCHEMA, max_tokens=4000, tier=tier)
    result["human_review_reminder"] = prompts.HUMAN_REVIEW_REMINDER
    return result
