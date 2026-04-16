"""Structured JSON logging for the LiveKit agent.

Provides a JSON formatter and a contextvars-based session context so every
log line carries session-scoped fields (pilot_id, room_name, drill_id, ...)
without having to thread them through every call site.
"""

from __future__ import annotations

import contextvars
import json
import logging
import sys
import traceback
from datetime import datetime, timezone

# ─── Session-scoped context ───────────────────────────────
_log_context: contextvars.ContextVar[dict] = contextvars.ContextVar(
    "_log_context", default={}
)


def set_log_context(**kwargs) -> None:
    """Merge kwargs into the current session log context."""
    current = dict(_log_context.get({}))
    current.update(kwargs)
    _log_context.set(current)


def clear_log_context() -> None:
    """Reset the current session log context to empty."""
    _log_context.set({})


# ─── JSON formatter ───────────────────────────────────────
_SKIP_FIELDS = {
    "args",
    "created",
    "exc_info",
    "exc_text",
    "filename",
    "funcName",
    "levelno",
    "lineno",
    "module",
    "msecs",
    "msg",
    "name",
    "pathname",
    "process",
    "processName",
    "relativeCreated",
    "stack_info",
    "thread",
    "threadName",
    "taskName",
}


class JsonFormatter(logging.Formatter):
    """Format log records as single-line JSON objects."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict = {
            "timestamp": datetime.fromtimestamp(
                record.created, tz=timezone.utc
            ).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Merge session context
        ctx = _log_context.get({})
        if ctx:
            log_entry.update(ctx)

        # Merge any extra=... fields stashed on the record
        for key, value in record.__dict__.items():
            if key in _SKIP_FIELDS or key in log_entry:
                continue
            try:
                json.dumps(value)
                log_entry[key] = value
            except (TypeError, ValueError):
                log_entry[key] = str(value)

        # Attach exception traceback if present
        if record.exc_info:
            log_entry["exception"] = traceback.format_exception(*record.exc_info)

        return json.dumps(log_entry, default=str)


def setup_logging(level: int = logging.INFO) -> None:
    """Install the JSON formatter on the root logger, replacing any handlers."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)
