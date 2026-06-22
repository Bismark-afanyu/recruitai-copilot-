"""CV Screening Agent — parses CVs, scores candidates, generates questions.

This agent handles the initial stages of the recruitment pipeline:
1. Extract structured data from raw CV text
2. Score the candidate against job requirements
3. Generate targeted interview questions

Uses Qwen qwen3.7-plus for quality structured output.
"""
import json
import logging

from .base import Agent, AgentRole, Task, AgentResult
from app.ai.providers.qwen import get_qwen_provider, QwenError
from app.ai import prompts

log = logging.getLogger("recruitai.agents.cv_screening")


class CVScreeningAgent(Agent):
    """Handles CV parsing, candidate scoring, and question generation."""

    name = "CV Screening Agent"
    role = AgentRole.CV_SCREENING
    model_tier = "quality"

    def execute(self, task: Task) -> AgentResult:
        """Route to the appropriate handler based on task action."""
        action = task.payload.get("action", task.action)

        handlers = {
            "extract_cv": self._extract_cv,
            "score_candidate": self._score_candidate,
            "generate_questions": self._generate_questions,
        }

        handler = handlers.get(action)
        if not handler:
            return AgentResult.fail(f"Unknown action: {action}")

        try:
            return handler(task)
        except QwenError as exc:
            log.exception("CV Screening Agent error")
            return AgentResult.fail(str(exc))

    def _extract_cv(self, task: Task) -> AgentResult:
        """Extract structured data from raw CV text."""
        cv_text = task.payload.get("cv_text", "")
        if not cv_text:
            return AgentResult.fail("No CV text provided")

        provider = get_qwen_provider()
        schema = self._get_cv_schema()

        try:
            result = provider.json_request(
                system=prompts.FAIRNESS_CHARTER,
                user=prompts.CV_EXTRACTION_PROMPT.format(cv_text=cv_text[:60000]),
                schema=schema,
                tier=self.model_tier,
                max_tokens=6000,
            )
            return AgentResult.ok(data=result)
        except QwenError as exc:
            return AgentResult.fail(f"CV extraction failed: {exc}")

    def _score_candidate(self, task: Task) -> AgentResult:
        """Score a candidate against job requirements."""
        job_extracted = task.payload.get("job_extracted", {})
        parsed_cv = task.payload.get("parsed_cv", {})

        if not job_extracted or not parsed_cv:
            return AgentResult.fail("Missing job_extracted or parsed_cv")

        provider = get_qwen_provider()
        schema = self._get_analysis_schema()

        prompt = prompts.SCORING_PROMPT.format(
            job_json=json.dumps(job_extracted, indent=2),
            cv_json=json.dumps(parsed_cv, indent=2),
        )

        try:
            result = provider.json_request(
                system=prompts.FAIRNESS_CHARTER,
                user=prompt,
                schema=schema,
                tier=self.model_tier,
                max_tokens=6000,
            )

            # Enforce category caps server-side
            from app.ai.service import SCORE_CAPS, _recommendation_for
            scores = result.get("scores", {})
            for key, cap in SCORE_CAPS.items():
                scores[key] = max(0, min(float(scores.get(key, 0)), cap))
            total = round(sum(scores.values()), 1)
            result["scores"] = scores
            result["total_score"] = total
            result["match_percentage"] = max(0, min(float(result.get("match_percentage", total)), 100))
            result["recommendation"] = _recommendation_for(total)
            result["human_review_reminder"] = prompts.HUMAN_REVIEW_REMINDER

            confidence = self.confidence_check(result)
            if self.requires_approval(result, confidence):
                return AgentResult.needs_approval(data=result, confidence=confidence)

            return AgentResult.ok(data=result, confidence=confidence)
        except QwenError as exc:
            return AgentResult.fail(f"Scoring failed: {exc}")

    def _generate_questions(self, task: Task) -> AgentResult:
        """Generate interview questions based on job and CV."""
        job_extracted = task.payload.get("job_extracted", {})
        parsed_cv = task.payload.get("parsed_cv", {})
        analysis = task.payload.get("analysis", {})

        provider = get_qwen_provider()
        schema = self._get_questions_schema()

        prompt = prompts.QUESTIONS_PROMPT.format(
            job_json=json.dumps(job_extracted, indent=2),
            cv_json=json.dumps(parsed_cv, indent=2),
            missing_skills=", ".join(analysis.get("missing_skills", [])) or "none identified",
            strengths=", ".join(analysis.get("key_strengths", [])) or "none identified",
        )

        try:
            result = provider.json_request(
                system=prompts.FAIRNESS_CHARTER,
                user=prompt,
                schema=schema,
                tier=self.model_tier,
                max_tokens=6000,
            )
            return AgentResult.ok(data=result)
        except QwenError as exc:
            return AgentResult.fail(f"Question generation failed: {exc}")

    def confidence_check(self, result: dict) -> float:
        """Higher confidence when scores are clear-cut, lower when borderline."""
        total = result.get("total_score", 50)
        recommendation = result.get("recommendation", "")

        # High confidence for strong/weak matches, lower for borderline
        if total >= 80 or total < 40:
            return 0.9
        if total >= 65 or total < 50:
            return 0.75
        return 0.6  # Borderline candidates need human review

    # -------------------------------------------------------------------------
    # JSON schemas for structured output
    # -------------------------------------------------------------------------

    def _get_cv_schema(self) -> dict:
        def string_array():
            return {"type": "array", "items": {"type": "string"}}

        return {
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
                "skills": string_array(),
                "certifications": string_array(),
                "projects": string_array(),
                "achievements": string_array(),
                "languages": string_array(),
                "career_timeline": string_array(),
            },
            "required": [
                "name", "email", "phone", "location", "education", "work_experience",
                "skills", "certifications", "projects", "achievements", "languages",
                "career_timeline",
            ],
            "additionalProperties": False,
        }

    def _get_analysis_schema(self) -> dict:
        score_caps = ["required_skills_match", "relevant_experience", "education_certifications",
                       "achievements_projects", "soft_skills_communication", "overall_role_fit"]
        def string_array():
            return {"type": "array", "items": {"type": "string"}}

        return {
            "type": "object",
            "properties": {
                "scores": {
                    "type": "object",
                    "properties": {key: {"type": "number"} for key in score_caps},
                    "required": score_caps,
                    "additionalProperties": False,
                },
                "match_percentage": {"type": "number"},
                "key_strengths": string_array(),
                "missing_skills": string_array(),
                "risk_factors": string_array(),
                "recommendation": {
                    "type": "string",
                    "enum": ["Strong Match", "Good Match", "Average Match", "Weak Match"],
                },
                "summary": {
                    "type": "object",
                    "properties": {
                        "overview": {"type": "string"},
                        "best_matching_experience": {"type": "string"},
                        "top_strengths": string_array(),
                        "possible_concerns": string_array(),
                        "suggested_next_step": {"type": "string"},
                    },
                    "required": ["overview", "best_matching_experience", "top_strengths",
                                  "possible_concerns", "suggested_next_step"],
                    "additionalProperties": False,
                },
            },
            "required": ["scores", "match_percentage", "key_strengths", "missing_skills",
                          "risk_factors", "recommendation", "summary"],
            "additionalProperties": False,
        }

    def _get_questions_schema(self) -> dict:
        def question_array():
            return {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "question": {"type": "string"},
                        "follow_up": {"type": "string"},
                    },
                    "required": ["question", "follow_up"],
                    "additionalProperties": False,
                },
            }

        sections = ["technical", "behavioral", "experience_based", "culture_fit", "practical_case"]
        return {
            "type": "object",
            "properties": {s: question_array() for s in sections},
            "required": sections,
            "additionalProperties": False,
        }
