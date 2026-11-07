import json
from datetime import datetime, timezone

from app.services.disruption import mocks
from app.services.disruption.decision import decide
from app.services.disruption.events import resolve_events
from app.services.disruption.facts import derive_facts
from app.services.disruption.options import select_option
from app.services.disruption.policy import evaluate

NOW = datetime(2026, 9, 15, 11, 3, 0, tzinfo=timezone.utc)


def _inputs():
    trip = mocks.get_trip_context("ABC123")
    return (
        trip,
        mocks.get_operational_events(["S1", "S2"]),
        mocks.get_eligible_options(trip),
        mocks.get_policy_rules("DELAY"),
    )


def _select(options_resp, now=NOW):
    trip, events, _, policy = _inputs()
    resolved, _ = resolve_events(events)
    facts = derive_facts(trip, resolved)
    return select_option(options_resp, trip, facts, evaluate(policy, facts), now)


def test_base_case_options():
    option, rejected = _select(_inputs()[2])
    assert option["option_id"] == "O1"
    reasons = {r["option_id"]: r["reasons"] for r in rejected}
    assert "not enough seats" in reasons["O2"]
    assert "fare difference not covered" in reasons["O2"]
    assert reasons["O3"] == ["not a rebooking"]


def test_expired_options_are_not_used():
    option, rejected = _select(
        _inputs()[2], datetime(2026, 9, 15, 11, 5, tzinfo=timezone.utc)
    )
    assert option is None
    assert all(r["reasons"] == ["options expired"] for r in rejected)


def test_tie_break_by_earliest_departure():
    options = _inputs()[2]
    options["options"][1].update(seats_available=4, fare_difference=0)
    option, _ = _select(options)
    assert option["option_id"] == "O2"


def test_base_case_decision():
    d = decide(*_inputs(), now=NOW)
    assert d["facts"]["missed_connection"] is True
    assert d["applied_rules"] == ["R3", "R5"]
    assert d["recommended_option"]["option_id"] == "O1"
    assert d["action"] == "HUMAN"
    assert d["policy_ref"] == "POL-DELAY-2026-03"
    body = json.dumps(d)
    for secret in ("maria.silva@example.com", "+56 9 8765 4321", "12.345.678-9"):
        assert secret not in body
