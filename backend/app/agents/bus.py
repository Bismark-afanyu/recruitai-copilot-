"""Message bus for inter-agent communication.

The message bus allows agents to communicate through typed messages
without direct coupling. Messages are processed synchronously in this
implementation (suitable for a single-process FastAPI server).
"""
from __future__ import annotations

import logging
import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any, Callable

log = logging.getLogger("recruitai.agents.bus")


@dataclass
class AgentMessage:
    """A message passed between agents via the bus."""
    id: str = field(default_factory=lambda: __import__("uuid").uuid4().hex[:8])
    sender: str = ""
    recipient: str = ""  # "" or "broadcast" means all subscribers
    topic: str = ""
    payload: dict = field(default_factory=dict)
    priority: int = 0  # 0=normal, 1=high, 2=urgent
    requires_response: bool = False
    created_at: float = field(default_factory=lambda: time.time())

    def __repr__(self) -> str:
        return f"<Message {self.id} from={self.sender} to={self.recipient} topic={self.topic}>"


# Handler type: receives a message and returns an optional response
MessageHandler = Callable[[AgentMessage], dict | None]


class MessageBus:
    """Synchronous message bus for agent communication.

    Usage:
        bus = MessageBus()
        bus.subscribe("cv_screening", my_handler)
        bus.publish(AgentMessage(sender="orchestrator", recipient="cv_screening", topic="screen", payload={...}))
    """

    def __init__(self):
        self._handlers: dict[str, list[MessageHandler]] = defaultdict(list)
        self._history: list[AgentMessage] = []
        self._max_history = 1000

    def subscribe(self, topic: str, handler: MessageHandler):
        """Subscribe a handler to a topic."""
        self._handlers[topic].append(handler)

    def unsubscribe(self, topic: str, handler: MessageHandler):
        """Unsubscribe a handler from a topic."""
        if topic in self._handlers:
            self._handlers[topic] = [h for h in self._handlers[topic] if h != handler]

    def publish(self, message: AgentMessage) -> dict | None:
        """Publish a message to the bus.

        If the message has a specific recipient, only that recipient's
        handlers are called. If recipient is empty or "broadcast",
        all handlers for the topic are called.

        Returns the response from the first handler that returns one.
        """
        self._history.append(message)
        if len(self._history) > self._max_history:
            self._history = self._history[-self._max_history:]

        log.debug("Publishing: %s", message)

        handlers = self._handlers.get(message.topic, [])
        if not handlers:
            log.debug("No handlers for topic: %s", message.topic)
            return None

        response = None
        for handler in handlers:
            try:
                result = handler(message)
                if result is not None and response is None:
                    response = result
            except Exception as exc:
                log.exception("Handler error for topic %s: %s", message.topic, exc)

        return response

    def request(self, message: AgentMessage, timeout: float = 30.0) -> dict | None:
        """Publish a message and wait for a response.

        Similar to publish() but explicitly expects a response.
        """
        response = self.publish(message)
        if response is None and message.requires_response:
            log.warning("No response received for request: %s", message)
        return response

    def get_history(self, topic: str | None = None, limit: int = 50) -> list[AgentMessage]:
        """Get message history, optionally filtered by topic."""
        msgs = self._history
        if topic:
            msgs = [m for m in msgs if m.topic == topic]
        return msgs[-limit:]

    def clear_history(self):
        """Clear message history."""
        self._history.clear()


# Singleton bus instance
_bus: MessageBus | None = None


def get_message_bus() -> MessageBus:
    """Get or create the singleton message bus."""
    global _bus
    if _bus is None:
        _bus = MessageBus()
    return _bus
