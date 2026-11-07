"""Evaluation Test - Case 4: Resilient Upstream 503 Timeout Handling.

Validates that when external write APIs return 503 UPSTREAM_TIMEOUT,
the action is marked INDETERMINATE and does not perform unverified blind retries.
"""

from app.services.agent.controls import action_guardrail


def test_case4_upstream_timeout_marked_indeterminate():
    action_type = "create_rebooking_request"
    payload = {"booking_id": "ABC123", "option_id": "O1"}

    result = action_guardrail.handle_upstream_timeout(action_type, payload)

    assert result.status == "INDETERMINATE"
    assert result.is_indeterminate is True
    assert result.details["error"] == "UPSTREAM_TIMEOUT"
    assert result.details["payload"]["booking_id"] == "ABC123"
