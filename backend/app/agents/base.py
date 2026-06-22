"""Base classes and data types for the multi-agent system.

Each agent is a specialized module with its own system prompt, tool set,
and responsibility boundary. Agents communicate through a shared message
bus and follow a consistent interface.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable


class AgentRole(str, Enum):
    """Unique identifier for each agent type."""
    ORCHESTRATOR = "orchestrator"
    CV_SCREENING = "cv_screening"
    INTERVIEW = "interview"
    EVALUATION = "evaluation"
    EMAIL = "email"


class PipelineState(str, Enum):
    """Tracks where a candidate is in the recruitment pipeline."""
    NEW = "new"
    SCREENING = "screening"
    SCREENED = "screened"
    QUESTIONS_GENERATED = "questions_generated"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_IN_PROGRESS = "interview_in_progress"
    INTERVIEWED = "interviewed"
    EVALUATED = "evaluated"
    REPORT_READY = "report_ready"
    COMPLETED = "completed"
    REJECTED = "rejected"


class TaskStatus(str, Enum):
    """Status of an individual task."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    WAITING_APPROVAL = "waiting_approval"
    COMPLETED = "completed"
    FAILED = "failed"
    REJECTED = "rejected"


@dataclass
class Task:
    """Represents a unit of work to be processed by an agent."""
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])
    candidate_id: str = ""
    job_id: str = ""
    action: str = ""
    payload: dict = field(default_factory=dict)
    status: TaskStatus = TaskStatus.PENDING
    result: dict = field(default_factory=dict)
    error: str | None = None
    requires_human: bool = False
    confidence: float = 0.0
    created_at: float = field(default_factory=lambda: __import__("time").time())
    updated_at: float = field(default_factory=lambda: __import__("time").time())

    def mark_in_progress(self):
        self.status = TaskStatus.IN_PROGRESS
        self.updated_at = __import__("time").time()

    def mark_completed(self, result: dict):
        self.status = TaskStatus.COMPLETED
        self.result = result
        self.updated_at = __import__("time").time()

    def mark_failed(self, error: str):
        self.status = TaskStatus.FAILED
        self.error = error
        self.updated_at = __import__("time").time()

    def mark_waiting_approval(self):
        self.status = TaskStatus.WAITING_APPROVAL
        self.requires_human = True
        self.updated_at = __import__("time").time()


@dataclass
class AgentResult:
    """Result returned by an agent after executing a task."""
    success: bool
    data: dict = field(default_factory=dict)
    next_action: str | None = None
    requires_human: bool = False
    confidence: float = 1.0
    error: str | None = None

    @classmethod
    def ok(cls, data: dict, next_action: str | None = None, confidence: float = 1.0) -> AgentResult:
        return cls(success=True, data=data, next_action=next_action, confidence=confidence)

    @classmethod
    def needs_approval(cls, data: dict, confidence: float = 0.5) -> AgentResult:
        return cls(success=True, data=data, requires_human=True, confidence=confidence)

    @classmethod
    def fail(cls, error: str) -> AgentResult:
        return cls(success=False, error=error)


class Agent:
    """Base class for all agents in the system.

    Subclasses must implement:
    - name: Human-readable agent name
    - role: Unique agent role identifier
    - model_tier: Which Qwen model tier to use
    - system_prompt: The system prompt for this agent
    - execute(task): The main execution logic
    """

    name: str = "BaseAgent"
    role: AgentRole = AgentRole.ORCHESTRATOR
    model_tier: str = "quality"  # "quality", "fast", or "reasoning"
    system_prompt: str = ""

    def __init__(self):
        self._tools: dict[str, Callable] = {}

    def register_tool(self, name: str, handler: Callable):
        """Register a callable tool that this agent can use."""
        self._tools[name] = handler

    def get_tool(self, name: str) -> Callable | None:
        """Get a registered tool by name."""
        return self._tools.get(name)

    def execute(self, task: Task) -> AgentResult:
        """Execute a task and return a result.

        Subclasses must implement this method.
        """
        raise NotImplementedError(f"{self.name} must implement execute()")

    def confidence_check(self, result: dict) -> float:
        """Calculate confidence score for a result (0.0 - 1.0).

        Override in subclasses for agent-specific confidence logic.
        Default: 1.0 (fully confident).
        """
        return 1.0

    def requires_approval(self, result: dict, confidence: float) -> bool:
        """Determine if this result requires human approval.

        Override in subclasses for agent-specific approval logic.
        Default: True if confidence < 0.7.
        """
        return confidence < 0.7

    def __repr__(self) -> str:
        return f"<{self.name} role={self.role.value} tier={self.model_tier}>"
