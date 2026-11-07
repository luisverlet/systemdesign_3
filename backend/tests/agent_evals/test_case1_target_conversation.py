"""Evaluation Test - Case 1: Target Conversation (Maria & Tomás).

Validates that when a group includes a minor (Rule R5), automated rebooking is
strictly blocked by the HITL guardrail and escalated to human operations.
"""

import pytest
from app.services.agent.controls import action_guardrail, HITLBlockedActionException


def test_case1_target_conversation_blocks_automated_rebooking():
    # Context matching target conversation Maria & Tomás
    trip_context = {
        "booking_id": "ABC123",
        "passengers": [
            {"passenger_id": "P1", "name": "Maria Silva", "type": "ADULT"},
            {"passenger_id": "P2", "name": "Tomás Silva", "type": "CHILD", "age": 7},
        ],
    }

    # Applied rules from deterministic policy evaluation
    applied_rules = [
        {"rule_id": "R3", "entitlement": "REBOOK_NO_FEE", "requires_human_approval": False},
        {"rule_id": "R5", "entitlement": "PRIORITY_HANDLING", "requires_human_approval": True},
    ]

    # Verify that action_guardrail raises HITLBlockedActionException
    with pytest.raises(HITLBlockedActionException) as exc_info:
        action_guardrail.check_rebooking_allowed(trip_context, applied_rules)

    assert exc_info.value.action == "create_rebooking_request"
    assert "minor" in exc_info.value.reason.lower()
    assert exc_info.value.requires_escalation is True
