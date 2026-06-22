"""Evaluation Agent — handles scorecards, summaries, and final reports.

This agent handles the evaluation stage of the recruitment pipeline:
1. Compute interview scores from ratings
2. Generate interview summaries
3. Generate final candidate reports

Uses Qwen qwen3.7-plus for quality structured output.
"""
import json
import logging

from .base import Agent, AgentRole, Task, AgentResult
from app.ai.providers.qwen import get_qwen_provider, QwenError
from app.ai import prompts

log = logging.getLogger("recruitai.agents.evaluation")

EVALUATION_CATEGORIES = [
    "technical_skills", "problem_solving", "communication",
    "relevant_experience", "motivation", "team_fit",
    "leadership_potential", "overall_impression",
]


class EvaluationAgent(Agent):
    """Handles scorecard computation, summaries, and final reports."""

    name = "Evaluation Agent"
    role = AgentRole.EVALUATION
    model_tier = "quality"

    def execute(self, task: Task) -> AgentResult:
        """Route to the appropriate handler based on task action."""
        action = task.payload.get("action", task.action)

        handlers = {
            "compute_score": self._compute_score,
            "summarize_interview": self._summarize_interview,
            "generate_report": self._generate_report,
        }

        handler = handlers.get(action)
        if not handler:
            return AgentResult.fail(f"Unknown action: {action}")

        try:
            return handler(task)
        except QwenError as exc:
            log.exception("Evaluation Agent error")
            return AgentResult.fail(str(exc))

    def _compute_score(self, task: Task) -> AgentResult:
        """Compute interview score from ratings (0-100 scale)."""
        ratings = task.payload.get("ratings", {})

        if not ratings:
            return AgentResult.fail("No ratings provided")

        # Validate all categories present
        missing = [c for c in EVALUATION_CATEGORIES if c not in ratings]
        if missing:
            return AgentResult.fail(f"Missing ratings for: {', '.join(missing)}")

        # Validate rating range
        invalid = [c for c, v in ratings.items() if not 1 <= int(v) <= 5]
        if invalid:
            return AgentResult.fail(f"Ratings must be 1-5: {', '.join(invalid)}")

        # Compute average and scale to 0-100
        values = [max(1, min(int(ratings.get(cat, 1)), 5)) for cat in EVALUATION_CATEGORIES]
        score = round(sum(values) / (len(values) * 5) * 100, 1)

        return AgentResult.ok(data={"score": score, "ratings": ratings})

    def _summarize_interview(self, task: Task) -> AgentResult:
        """Generate an AI summary of the interview based on ratings."""
        candidate_name = task.payload.get("candidate_name", "")
        job_title = task.payload.get("job_title", "")
        ratings = task.payload.get("ratings", {})
        notes = task.payload.get("notes", "")
        score = task.payload.get("score", 0)

        ratings_text = "\n".join(
            f"- {cat.replace('_', ' ').title()}: {ratings.get(cat, 'n/a')}/5"
            for cat in EVALUATION_CATEGORIES
        )

        prompt = prompts.INTERVIEW_EVALUATION_PROMPT.format(
            candidate_name=candidate_name,
            job_title=job_title,
            ratings_text=ratings_text,
            score=score,
            notes=notes.strip() or "(no notes provided)",
        )

        provider = get_qwen_provider()
        try:
            summary = provider.text_request(
                system=prompts.FAIRNESS_CHARTER,
                user=prompt,
                tier=self.model_tier,
                max_tokens=1500,
            )
            return AgentResult.ok(data={"summary": summary})
        except QwenError as exc:
            return AgentResult.fail(f"Summary generation failed: {exc}")

    def _generate_report(self, task: Task) -> AgentResult:
        """Generate the final candidate report."""
        candidate_name = task.payload.get("candidate_name", "")
        job_title = task.payload.get("job_title", "")
        analysis_result = task.payload.get("analysis_result", {})
        cv_score = task.payload.get("cv_score", 0)
        interview_score = task.payload.get("interview_score", 0)
        ratings = task.payload.get("ratings", {})
        notes = task.payload.get("notes", "")
        interview_summary = task.payload.get("interview_summary", "")

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

        provider = get_qwen_provider()
        schema = self._get_report_schema()

        try:
            result = provider.json_request(
                system=prompts.FAIRNESS_CHARTER,
                user=prompt,
                schema=schema,
                tier=self.model_tier,
                max_tokens=4000,
            )
            result["human_review_reminder"] = prompts.HUMAN_REVIEW_REMINDER

            confidence = self.confidence_check(result)
            if self.requires_approval(result, confidence):
                return AgentResult.needs_approval(data=result, confidence=confidence)

            return AgentResult.ok(data=result, confidence=confidence)
        except QwenError as exc:
            return AgentResult.fail(f"Report generation failed: {exc}")

    def confidence_check(self, result: dict) -> float:
        """Report confidence based on recommendation strength."""
        recommendation = result.get("recommendation", "")
        if recommendation in ("Highly Recommended", "Not Recommended"):
            return 0.9  # Clear-cut decisions
        if recommendation == "Recommended":
            return 0.8
        return 0.65  # "Consider with Caution" needs human review

    # -------------------------------------------------------------------------
    # JSON schemas
    # -------------------------------------------------------------------------

    def _get_report_schema(self) -> dict:
        def string_array():
            return {"type": "array", "items": {"type": "string"}}

        return {
            "type": "object",
            "properties": {
                "executive_summary": {"type": "string"},
                "strengths": string_array(),
                "weaknesses": string_array(),
                "concerns": string_array(),
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
