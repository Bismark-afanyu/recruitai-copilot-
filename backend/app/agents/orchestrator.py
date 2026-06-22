"""Orchestrator Agent — pipeline state machine and task coordinator.

The Orchestrator is the central coordinator that:
1. Manages the recruitment pipeline state for each candidate
2. Routes tasks to specialized agents
3. Handles human-in-the-loop checkpoints
4. Manages error recovery and retries

Uses Qwen qwen3.7-max for complex reasoning and planning.
"""
import logging
import time

from .base import Agent, AgentRole, Task, AgentResult, TaskStatus, PipelineState
from .bus import MessageBus, AgentMessage, get_message_bus
from .cv_screening import CVScreeningAgent
from .interview import InterviewAgent
from .evaluation import EvaluationAgent
from .email import EmailAgent

log = logging.getLogger("recruitai.agents.orchestrator")


class OrchestratorAgent(Agent):
    """Central coordinator for the recruitment pipeline."""

    name = "Orchestrator"
    role = AgentRole.ORCHESTRATOR
    model_tier = "reasoning"

    def __init__(self):
        super().__init__()
        self.cv_agent = CVScreeningAgent()
        self.interview_agent = InterviewAgent()
        self.evaluation_agent = EvaluationAgent()
        self.email_agent = EmailAgent()
        self.bus = get_message_bus()

        # Pipeline state tracking: candidate_id -> PipelineState
        self._pipeline_states: dict[str, PipelineState] = {}

    def execute(self, task: Task) -> AgentResult:
        """Route task to the appropriate agent based on pipeline state."""
        candidate_id = task.candidate_id
        action = task.payload.get("action", task.action)

        log.info("Orchestrating task: candidate=%s action=%s", candidate_id, action)

        # Get or initialize pipeline state
        state = self._pipeline_states.get(candidate_id, PipelineState.NEW)

        # Route based on action and state
        try:
            result = self._route_task(task, state)

            # Update pipeline state based on result
            if result.success:
                new_state = self._next_state(state, action)
                self._pipeline_states[candidate_id] = new_state
                result.data["pipeline_state"] = new_state.value

            return result

        except Exception as exc:
            log.exception("Orchestrator error for candidate %s", candidate_id)
            return AgentResult.fail(f"Orchestration failed: {exc}")

    def _route_task(self, task: Task, state: PipelineState) -> AgentResult:
        """Route task to the appropriate agent based on action type."""
        action = task.payload.get("action", task.action)

        # CV Screening actions
        if action in ("extract_cv", "score_candidate", "generate_questions"):
            return self.cv_agent.execute(task)

        # Interview actions
        if action in ("conduct_turn", "assess_interview"):
            return self.interview_agent.execute(task)

        # Evaluation actions
        if action in ("compute_score", "summarize_interview", "generate_report"):
            return self.evaluation_agent.execute(task)

        # Email actions
        if action in ("draft_interview_invite", "draft_status_update",
                       "draft_report_delivery", "send_email"):
            return self.email_agent.execute(task)

        # Pipeline control actions
        if action == "start_screening":
            return self._start_screening(task)
        if action == "schedule_interview":
            return self._schedule_interview(task)
        if action == "complete_evaluation":
            return self._complete_evaluation(task)
        if action == "generate_final_report":
            return self._generate_final_report(task)

        return AgentResult.fail(f"Unknown action: {action}")

    def _start_screening(self, task: Task) -> AgentResult:
        """Start the screening process for a candidate."""
        candidate_id = task.candidate_id
        job_id = task.job_id

        # Step 1: Extract CV
        extract_task = Task(
            candidate_id=candidate_id,
            job_id=job_id,
            action="extract_cv",
            payload={"cv_text": task.payload.get("cv_text", "")},
        )
        extract_result = self.cv_agent.execute(extract_task)
        if not extract_result.success:
            return extract_result

        # Step 2: Score candidate
        score_task = Task(
            candidate_id=candidate_id,
            job_id=job_id,
            action="score_candidate",
            payload={
                "job_extracted": task.payload.get("job_extracted", {}),
                "parsed_cv": extract_result.data,
            },
        )
        score_result = self.cv_agent.execute(score_task)
        if not score_result.success:
            return score_result

        # Step 3: Generate questions
        questions_task = Task(
            candidate_id=candidate_id,
            job_id=job_id,
            action="generate_questions",
            payload={
                "job_extracted": task.payload.get("job_extracted", {}),
                "parsed_cv": extract_result.data,
                "analysis": score_result.data,
            },
        )
        questions_result = self.cv_agent.execute(questions_task)

        combined_data = {
            "parsed_cv": extract_result.data,
            "analysis": score_result.data,
            "questions": questions_result.data if questions_result.success else None,
            "confidence": score_result.confidence,
            "requires_human": score_result.requires_human,
        }

        # Check if human approval needed
        if score_result.requires_human:
            return AgentResult.needs_approval(
                data=combined_data,
                confidence=score_result.confidence,
            )

        return AgentResult.ok(data=combined_data, confidence=score_result.confidence)

    def _schedule_interview(self, task: Task) -> AgentResult:
        """Schedule an interview for a candidate."""
        candidate_id = task.candidate_id

        # Draft interview invitation
        invite_task = Task(
            candidate_id=candidate_id,
            action="draft_interview_invite",
            payload={
                "candidate_name": task.payload.get("candidate_name", ""),
                "job_title": task.payload.get("job_title", ""),
                "interview_link": task.payload.get("interview_link", ""),
            },
        )
        invite_result = self.email_agent.execute(invite_task)

        if not invite_result.success:
            return invite_result

        # Always require HR approval before sending emails
        return AgentResult.needs_approval(
            data={
                "email_draft": invite_result.data,
                "message": "Interview invitation drafted. Awaiting HR approval to send.",
            },
            confidence=0.9,
        )

    def _complete_evaluation(self, task: Task) -> AgentResult:
        """Complete the evaluation stage for a candidate."""
        candidate_id = task.candidate_id
        ratings = task.payload.get("ratings", {})

        # Step 1: Compute score
        score_task = Task(
            candidate_id=candidate_id,
            action="compute_score",
            payload={"ratings": ratings},
        )
        score_result = self.evaluation_agent.execute(score_task)
        if not score_result.success:
            return score_result

        # Step 2: Summarize interview
        summary_task = Task(
            candidate_id=candidate_id,
            action="summarize_interview",
            payload={
                "candidate_name": task.payload.get("candidate_name", ""),
                "job_title": task.payload.get("job_title", ""),
                "ratings": ratings,
                "notes": task.payload.get("notes", ""),
                "score": score_result.data.get("score", 0),
            },
        )
        summary_result = self.evaluation_agent.execute(summary_task)

        return AgentResult.ok(data={
            "score": score_result.data.get("score", 0),
            "ratings": ratings,
            "summary": summary_result.data.get("summary", "") if summary_result.success else "",
        })

    def _generate_final_report(self, task: Task) -> AgentResult:
        """Generate the final candidate report."""
        candidate_id = task.candidate_id

        report_task = Task(
            candidate_id=candidate_id,
            action="generate_report",
            payload={
                "candidate_name": task.payload.get("candidate_name", ""),
                "job_title": task.payload.get("job_title", ""),
                "analysis_result": task.payload.get("analysis_result", {}),
                "cv_score": task.payload.get("cv_score", 0),
                "interview_score": task.payload.get("interview_score", 0),
                "ratings": task.payload.get("ratings", {}),
                "notes": task.payload.get("notes", ""),
                "interview_summary": task.payload.get("interview_summary", ""),
            },
        )

        return self.evaluation_agent.execute(report_task)

    def _next_state(self, current: PipelineState, action: str) -> PipelineState:
        """Determine the next pipeline state based on current state and action."""
        transitions = {
            (PipelineState.NEW, "start_screening"): PipelineState.SCREENING,
            (PipelineState.SCREENING, "score_candidate"): PipelineState.SCREENED,
            (PipelineState.SCREENED, "generate_questions"): PipelineState.QUESTIONS_GENERATED,
            (PipelineState.QUESTIONS_GENERATED, "schedule_interview"): PipelineState.INTERVIEW_SCHEDULED,
            (PipelineState.INTERVIEW_SCHEDULED, "conduct_turn"): PipelineState.INTERVIEW_IN_PROGRESS,
            (PipelineState.INTERVIEW_IN_PROGRESS, "conduct_turn"): PipelineState.INTERVIEW_IN_PROGRESS,
            (PipelineState.INTERVIEW_IN_PROGRESS, "assess_interview"): PipelineState.INTERVIEWED,
            (PipelineState.INTERVIEWED, "complete_evaluation"): PipelineState.EVALUATED,
            (PipelineState.EVALUATED, "generate_final_report"): PipelineState.REPORT_READY,
            (PipelineState.REPORT_READY, "send_report"): PipelineState.COMPLETED,
        }

        return transitions.get((current, action), current)

    def get_pipeline_state(self, candidate_id: str) -> str:
        """Get the current pipeline state for a candidate."""
        state = self._pipeline_states.get(candidate_id, PipelineState.NEW)
        return state.value

    def set_pipeline_state(self, candidate_id: str, state: PipelineState):
        """Manually set the pipeline state (for HR overrides)."""
        self._pipeline_states[candidate_id] = state
