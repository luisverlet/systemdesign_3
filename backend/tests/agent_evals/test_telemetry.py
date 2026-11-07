"""Test - Agent Telemetry and PII-Safe Trace Logging."""

from pathlib import Path
from app.core.telemetry import agent_telemetry


def test_agent_telemetry_records_sanitized_trace(tmp_path: Path):
    trace_file = tmp_path / "test_trace.jsonl"
    agent_telemetry.trace_file_path = trace_file

    trajectory = [
        {
            "tool": "get_trip_context",
            "args": {"booking_id": "ABC123"},
            "result": {
                "passenger": {"name": "Maria Silva", "email": "maria.silva@example.com", "phone": "+56 9 8765 4321"},
            },
        }
    ]

    record = agent_telemetry.record_trace(
        trace_id="test-trace-uuid",
        booking_id="ABC123",
        trajectory=trajectory,
        latency_ms=152.4,
        prompt_tokens=450,
        completion_tokens=85,
    )

    assert record["trace_id"] == "test-trace-uuid"
    assert record["booking_id"] == "ABC123"
    assert record["tokens"]["total"] == 535

    # Verify PII was redacted
    sanitized_passenger = record["trajectory"][0]["result"]["passenger"]
    assert sanitized_passenger["email"] == "m***a@example.com"
    assert sanitized_passenger["phone"] == "***-4321"

    # Verify file was written
    assert trace_file.exists()
    content = trace_file.read_text(encoding="utf-8")
    assert "maria.silva@example.com" not in content
