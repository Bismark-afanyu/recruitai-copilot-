"""Simple in-memory background task queue for AI operations.

Tasks run in a daemon thread pool so they don't block API responses.
Task state is kept in memory (volatile — lost on restart).

Usage:
    from .task_queue import tasks

    task_id = tasks.enqueue("analyze_candidate", candidate_id=1, job_id=2)
    status = tasks.get_status(task_id)  # {"state": "done", "result": ...}
"""

import logging
import threading
import time
import uuid
from collections import OrderedDict
from collections.abc import Callable
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

log = logging.getLogger("recruitai.tasks")


class TaskState(str, Enum):
    pending = "pending"
    running = "running"
    done = "done"
    failed = "failed"


@dataclass
class Task:
    id: str
    name: str
    state: TaskState = TaskState.pending
    result: Any = None
    error: str | None = None
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    kwargs: dict = field(default_factory=dict)


class TaskQueue:
    def __init__(self, max_workers: int = 2):
        self._lock = threading.Lock()
        self._tasks: dict[str, Task] = {}
        self._queue: OrderedDict[str, Task] = OrderedDict()
        self._worker_thread: threading.Thread | None = None
        self._max_workers = max_workers
        self._active_workers = 0
        self._handlers: dict[str, Callable] = {}
        self._stop_event = threading.Event()

    def register(self, name: str, handler: Callable):
        self._handlers[name] = handler

    def enqueue(self, name: str, **kwargs: Any) -> str:
        task_id = uuid.uuid4().hex[:12]
        task = Task(id=task_id, name=name, kwargs=kwargs)
        with self._lock:
            self._tasks[task_id] = task
            self._queue[task_id] = task
        self._ensure_worker()
        return task_id

    def get_status(self, task_id: str) -> dict | None:
        with self._lock:
            task = self._tasks.get(task_id)
        if task is None:
            return None
        return {
            "id": task.id,
            "name": task.name,
            "state": task.state.value,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "result": task.result,
            "error": task.error,
        }

    def _ensure_worker(self):
        if self._worker_thread is None or not self._worker_thread.is_alive():
            self._stop_event.clear()
            self._worker_thread = threading.Thread(
                target=self._process_loop, daemon=True
            )
            self._worker_thread.start()

    def _process_loop(self):
        while not self._stop_event.is_set():
            task: Task | None = None
            with self._lock:
                if self._active_workers < self._max_workers and self._queue:
                    task_id, task = self._queue.popitem(last=False)
                    task.state = TaskState.running
                    task.updated_at = time.time()
                    self._active_workers += 1
            if task is None:
                time.sleep(0.2)
                continue

            handler = self._handlers.get(task.name)
            if handler is None:
                with self._lock:
                    task.state = TaskState.failed
                    task.error = f"No handler registered for '{task.name}'"
                    task.updated_at = time.time()
                    self._active_workers -= 1
                continue

            try:
                log.info("Executing task %s (%s)", task.id, task.name)
                result = handler(**task.kwargs)
                with self._lock:
                    task.state = TaskState.done
                    task.result = result
                    task.updated_at = time.time()
            except Exception as exc:
                log.exception("Task %s (%s) failed", task.id, task.name)
                with self._lock:
                    task.state = TaskState.failed
                    task.error = str(exc)
                    task.updated_at = time.time()
            finally:
                with self._lock:
                    self._active_workers -= 1

    def shutdown(self):
        self._stop_event.set()
        if self._worker_thread:
            self._worker_thread.join(timeout=3)


tasks = TaskQueue()
