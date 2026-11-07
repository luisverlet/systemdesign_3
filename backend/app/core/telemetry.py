"""Agent Observability, Tracing and PII-Safe Telemetry Module."""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.core.security import sanitize_payload

LOGS_DIR = Path(__file__).resolve().parents[2] / "logs"
TRACE_FILE = LOGS_DIR / "agent_trace.jsonl"


class AgentTelemetry:
    """Manages structured JSONL trace logging for autonomous agent executions."""

    def __init__(self, trace_file_path: Path = TRACE_FILE):
        self.trace_file_path = trace_file_path
        self._ensure_log_dir()

    def _ensure_log_dir(self) -> None:
        self.trace_file_path.parent.mkdir(parents=True, exist_ok=True)

    def record_trace(
        self,
        trace_id: str,
        booking_id: str,
        trajectory: list[dict[str, Any]],
        latency_ms: float,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Sanitizes PII and appends an execution record to the trace log."""
        sanitized_trajectory = [sanitize_payload(step) for step in trajectory]
        sanitized_metadata = sanitize_payload(metadata or {})

        record = {
            "trace_id": trace_id,
            "booking_id": booking_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "latency_ms": round(latency_ms, 2),
            "tokens": {
                "prompt": prompt_tokens,
                "completion": completion_tokens,
                "total": prompt_tokens + completion_tokens,
            },
            "trajectory_steps": len(trajectory),
            "trajectory": sanitized_trajectory,
            "metadata": sanitized_metadata,
        }

        with open(self.trace_file_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

        return record


agent_telemetry = AgentTelemetry()
