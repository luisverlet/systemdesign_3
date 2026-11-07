"""Evaluation Test - Case 2: Contradictory Operational Sources.

Validates that operational events from degraded sources (LEGACY_MIRROR)
are discarded and the latest event from valid sources (OPS_CORE) prevails.
"""

from app.services.disruption.events import resolve_events


def test_case2_contradictory_sources_reconciliation():
    raw_payload = {
        "events": [
            {
                "event_id": "E-1001",
                "segment_id": "S1",
                "type": "DELAY",
                "new_departure": "17:10",
                "delay_minutes": 160,
                "source": "OPS_CORE",
                "recorded_at": "2026-09-15T10:48:00Z",
            },
            {
                "event_id": "E-1012",
                "segment_id": "S1",
                "type": "STATUS",
                "status": "ON_TIME",
                "source": "LEGACY_MIRROR",
                "recorded_at": "2026-09-15T09:30:00Z",
            },
        ],
        "_meta": {
            "sources_available": ["OPS_CORE", "LEGACY_MIRROR"],
            "sources_degraded": ["LEGACY_MIRROR"],
        },
    }

    resolved, discarded = resolve_events(raw_payload)

    # Legacy mirror event must be in discarded list with degraded source reason
    assert any(e.get("event_id") == "E-1012" and "degraded" in e.get("reason", "").lower() for e in discarded)

    # Valid event from OPS_CORE must be accepted for S1
    assert "S1" in resolved
    assert resolved["S1"]["status"]["event_id"] == "E-1001"
    assert resolved["S1"]["status"]["type"] == "DELAY"
