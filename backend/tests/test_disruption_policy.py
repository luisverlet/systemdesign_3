from app.services.disruption import mocks
from app.services.disruption.events import resolve_events
from app.services.disruption.facts import derive_facts
from app.services.disruption.policy import evaluate


def _base_facts():
    trip = mocks.get_trip_context("ABC123")
    resolved, _ = resolve_events(mocks.get_operational_events(["S1", "S2"]))
    return trip, derive_facts(trip, resolved)


def test_base_case_facts():
    _, f = _base_facts()
    assert f["delay_minutes"] == 160
    assert f["international"] is True
    assert f["group_includes_minor"] is True
    assert f["compensation_requested"] is False
    assert f["estimated_arrival"].strftime("%H:%M") == "20:35"
    assert f["missed_connection"] is True


def test_connection_exactly_at_minimum_is_not_missed():
    trip = mocks.get_trip_context("ABC123")
    # 17:55 + 10 min = 18:05; + 60 min MCT = 19:05, the S2 departure.
    resolved = {"S1": {"status": {"type": "DELAY", "delay_minutes": 10}}}
    assert derive_facts(trip, resolved)["missed_connection"] is False
    resolved["S1"]["status"]["delay_minutes"] = 11
    assert derive_facts(trip, resolved)["missed_connection"] is True


def test_base_case_rules():
    _, f = _base_facts()
    result = evaluate(mocks.get_policy_rules("DELAY"), f)
    assert result["applied_rules"] == ["R3", "R5"]
    assert result["entitlements"] == ["PRIORITY_HANDLING", "REBOOK_NO_FEE"]
    assert result["policy_ref"] == "POL-DELAY-2026-03"
    assert result["requires_human"] is True


def test_unknown_condition_fails_closed():
    policy = {
        "version": "P",
        "rules": [
            {
                "rule_id": "RX",
                "condition": "weather_event == true",
                "entitlement": "X",
                "requires_human_approval": False,
            }
        ],
    }
    result = evaluate(policy, {})
    assert result["not_evaluable"] == ["RX"]
    assert result["requires_human"] is True
