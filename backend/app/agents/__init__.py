"""Multi-agent system for RecruitAI Copilot.

This package implements a coordinated multi-agent architecture where
specialized Qwen-powered agents handle different stages of the recruitment
pipeline while maintaining human-in-the-loop checkpoints.

Agents:
- Orchestrator: Pipeline state machine, HITL routing, task delegation
- CVScreening: Parse CVs, score candidates, generate questions
- Interview: Conduct AI interviews, assess transcripts
- Evaluation: Scorecards, summaries, final reports
- Email: Draft and send notifications via DirectMail
"""
from .base import Agent, AgentRole, Task, AgentResult, PipelineState
from .bus import MessageBus, AgentMessage
from .orchestrator import OrchestratorAgent

__all__ = [
    "Agent", "AgentRole", "Task", "AgentResult", "PipelineState",
    "MessageBus", "AgentMessage",
    "OrchestratorAgent",
]
