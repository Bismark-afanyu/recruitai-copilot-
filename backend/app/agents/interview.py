"""Interview Agent — conducts AI interviews and assesses transcripts.

This agent handles the interview stage of the recruitment pipeline:
1. Conduct live chat interviews with candidates
2. Assess completed interview transcripts
3. Generate interview summaries

Uses Qwen qwen3.7-plus for quality conversational output.
"""
import json
import logging

from .base import Agent, AgentRole, Task, AgentResult
from app.ai.providers.qwen import get_qwen_provider, QwenError
from app.ai import prompts

log = logging.getLogger("recruitai.agents.interview")


class InterviewAgent(Agent):
    """Handles AI-conducted interviews and transcript assessment."""

    name = "Interview Agent"
    role = AgentRole.INTERVIEW
    model_tier = "quality"

    # Interview limits
    MAX_INTERVIEWER_TURNS = 14
    HARD_TURN_LIMIT = 18

    def execute(self, task: Task) -> AgentResult:
        """Route to the appropriate handler based on task action."""
        action = task.payload.get("action", task.action)

        handlers = {
            "conduct_turn": self._conduct_turn,
            "assess_interview": self._assess_interview,
        }

        handler = handlers.get(action)
        if not handler:
            return AgentResult.fail(f"Unknown action: {action}")

        try:
            return handler(task)
        except QwenError as exc:
            log.exception("Interview Agent error")
            return AgentResult.fail(str(exc))

    def _conduct_turn(self, task: Task) -> AgentResult:
        """Conduct a single turn of the interview."""
        candidate_name = task.payload.get("candidate_name", "")
        job_extracted = task.payload.get("job_extracted", {})
        parsed_cv = task.payload.get("parsed_cv", {})
        questions = task.payload.get("questions")
        transcript = task.payload.get("transcript", [])
        force_wrap_up = task.payload.get("force_wrap_up", False)

        # Build context
        context = prompts.INTERVIEW_CONTEXT_PROMPT.format(
            job_json=json.dumps(job_extracted, indent=2),
            cv_json=json.dumps(parsed_cv, indent=2),
            questions_json=json.dumps(questions, indent=2) if questions else "(none prepared)",
            candidate_name=candidate_name,
        )

        # Build conversation messages
        messages = [{"role": "user", "content": context}]
        for entry in transcript:
            role = "assistant" if entry.get("role") == "interviewer" else "user"
            messages.append({"role": role, "content": entry.get("text", "")})

        if force_wrap_up:
            messages.append({"role": "user", "content": prompts.WRAP_UP_INSTRUCTION})

        # Check turn limits
        interviewer_turns = sum(1 for e in transcript if e.get("role") == "interviewer")
        if interviewer_turns >= self.HARD_TURN_LIMIT:
            return AgentResult.ok(
                data={
                    "message": "Thank you for your time. The hiring team will review your answers and contact you about next steps.",
                    "is_complete": True,
                }
            )

        provider = get_qwen_provider()
        system = prompts.FAIRNESS_CHARTER + "\n\n" + prompts.INTERVIEWER_ROLE

        try:
            result = provider.conversation_request(
                system=system,
                messages=messages,
                response_format=self._get_turn_schema(),
                tier=self.model_tier,
                max_tokens=1024,
            )

            if isinstance(result, str):
                result = json.loads(result)

            # Force wrap-up if approaching limit
            if interviewer_turns >= self.MAX_INTERVIEWER_TURNS - 1:
                result["is_complete"] = True

            return AgentResult.ok(data=result)
        except (QwenError, json.JSONDecodeError) as exc:
            return AgentResult.fail(f"Interview turn failed: {exc}")

    def _assess_interview(self, task: Task) -> AgentResult:
        """Assess a completed interview transcript."""
        candidate_name = task.payload.get("candidate_name", "")
        job_title = task.payload.get("job_title", "")
        job_extracted = task.payload.get("job_extracted", {})
        transcript = task.payload.get("transcript", [])

        # Convert transcript to text
        label = {"interviewer": "Interviewer", "candidate": "Candidate"}
        transcript_text = "\n".join(
            f"{label.get(e.get('role'), 'Unknown')}: {e.get('text', '')}"
            for e in transcript
        )[:60000]

        prompt = prompts.INTERVIEW_ASSESSMENT_PROMPT.format(
            candidate_name=candidate_name,
            job_title=job_title,
            job_json=json.dumps(job_extracted, indent=2),
            transcript_text=transcript_text,
        )

        provider = get_qwen_provider()
        schema = self._get_assessment_schema()

        try:
            result = provider.json_request(
                system=prompts.FAIRNESS_CHARTER,
                user=prompt,
                schema=schema,
                tier=self.model_tier,
                max_tokens=4000,
            )
            result["human_review_reminder"] = prompts.HUMAN_REVIEW_REMINDER
            return AgentResult.ok(data=result)
        except QwenError as exc:
            return AgentResult.fail(f"Interview assessment failed: {exc}")

    def confidence_check(self, result: dict) -> float:
        """Assessment confidence based on transcript length and ratings consistency."""
        ratings = result.get("ratings", {})
        if not ratings:
            return 0.5

        values = list(ratings.values())
        if not values:
            return 0.5

        # Higher confidence when ratings are consistent (low variance)
        avg = sum(values) / len(values)
        variance = sum((v - avg) ** 2 for v in values) / len(values)

        if variance < 0.5:
            return 0.9  # Very consistent ratings
        if variance < 1.5:
            return 0.75
        return 0.6  # High variance — may need human review

    # -------------------------------------------------------------------------
    # JSON schemas
    # -------------------------------------------------------------------------

    def _get_turn_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "message": {"type": "string"},
                "is_complete": {"type": "boolean"},
            },
            "required": ["message", "is_complete"],
            "additionalProperties": False,
        }

    def _get_assessment_schema(self) -> dict:
        categories = [
            "technical_skills", "problem_solving", "communication",
            "relevant_experience", "motivation", "team_fit",
            "leadership_potential", "overall_impression",
        ]
        rating = {"type": "integer", "enum": [1, 2, 3, 4, 5]}

        def string_array():
            return {"type": "array", "items": {"type": "string"}}

        return {
            "type": "object",
            "properties": {
                "ratings": {
                    "type": "object",
                    "properties": {cat: rating for cat in categories},
                    "required": categories,
                    "additionalProperties": False,
                },
                "strengths": string_array(),
                "concerns": string_array(),
                "summary": {"type": "string"},
                "notes": {"type": "string"},
            },
            "required": ["ratings", "strengths", "concerns", "summary", "notes"],
            "additionalProperties": False,
        }
