from app.services.disruption import mocks
from app.services.disruption.events import resolve_events


def test_base_case_keeps_delay_and_gate_and_drops_legacy():
    resolved, discarded = resolve_events(mocks.get_operational_events(["S1", "S2"]))
    s1 = resolved["S1"]
    assert s1["status"]["event_id"] == "E-1001"
    assert s1["status"]["delay_minutes"] == 160
    assert s1["gate"]["gate"] == "24"
    assert s1["conflicts"] == []
    assert {"event_id": "E-1012", "reason": "source degraded"} in discarded


def test_untrusted_source_is_discarded():
    resp = {
        "events": [
            {
                "event_id": "X",
                "segment_id": "S1",
                "type": "STATUS",
                "status": "ON_TIME",
                "source": "UNKNOWN_FEED",
                "recorded_at": "2026-09-15T10:00:00Z",
            }
        ],
        "_meta": {},
    }
    resolved, discarded = resolve_events(resp)
    assert resolved == {}
    assert discarded == [{"event_id": "X", "reason": "untrusted source"}]


def test_trusted_sources_disagreeing_is_a_conflict():
    resp = mocks.get_operational_events(["S1"])
    resp["events"].append(
        {
            "event_id": "E-9",
            "segment_id": "S1",
            "type": "STATUS",
            "status": "ON_TIME",
            "source": "AIRPORT_FEED",
            "recorded_at": "2026-09-15T10:50:00Z",
        }
    )
    resolved, _ = resolve_events(resp)
    assert set(resolved["S1"]["conflicts"]) == {"E-1001", "E-9"}
