"""
Agent Tool Bindings for Nubara Airlines Disruption Companion.
Wraps deterministic domain mocks and applies prompt injection defense.
"""

from typing import Any
from app.services.disruption import mocks
from app.services.agent.security import PromptInjectionDefense


def get_trip_context_tool(booking_id: str) -> dict[str, Any]:
    """
    Retrieves passenger labels, segment details, and fare conditions for a booking.
    Applies security sanitization to prevent prompt injection from untrusted metadata.
    """
    raw_trip = mocks.get_trip_context(booking_id)
    sanitized_trip = PromptInjectionDefense.sanitize_raw_value(raw_trip)
    return sanitized_trip


def get_operational_events_tool(booking_id: str) -> dict[str, Any]:
    """
    Retrieves operational status telemetry, delays, and gate changes across sources.
    Resolves segment IDs from the booking context.
    """
    try:
        raw_trip = mocks.get_trip_context(booking_id)
        segment_ids = [s["segment_id"] for s in raw_trip.get("segments", [])]
    except Exception:
        segment_ids = ["S1", "S2"]

    return mocks.get_operational_events(segment_ids)


def get_policy_rules_tool(category: str = "DELAY") -> dict[str, Any]:
    """
    Retrieves verified contractual airline disruption policies and conditions.
    """
    return mocks.get_policy_rules(category)


def get_eligible_options_tool(booking_id: str) -> dict[str, Any]:
    """
    Retrieves alternative flight segments and refund options available for rebooking.
    """
    try:
        raw_trip = mocks.get_trip_context(booking_id)
    except Exception:
        raw_trip = {}

    return mocks.get_eligible_options(raw_trip)


def create_human_case_tool(
    booking_id: str, reason: str, evidence: dict[str, Any] | None = None
) -> dict[str, Any]:
    """
    Escalates a complex case to the airport special assistance care desk.
    """
    payload_evidence = evidence or {}
    payload_evidence["booking_id"] = booking_id

    result = mocks.create_human_case(reason, payload_evidence)
    if isinstance(result, tuple) and len(result) == 2:
        return result[1]
    return result if isinstance(result, dict) else {"case_id": "HC-4471"}


# Declarations of tool metadata for Google GenAI / Gemini Function Calling
AGENT_TOOL_DECLARATIONS = [
    {
        "name": "get_trip_context",
        "description": "Retrieves the itinerary, passenger categories (Adult, Child, Infant), and fare rules for a booking code (e.g. ABC123).",
        "parameters": {
            "type": "object",
            "properties": {
                "booking_id": {
                    "type": "string",
                    "description": "The 6-character uppercase PNR booking reference.",
                }
            },
            "required": ["booking_id"],
        },
    },
    {
        "name": "get_operational_events",
        "description": "Retrieves operational telemetry events (delays, statuses, gate changes) for the booking.",
        "parameters": {
            "type": "object",
            "properties": {
                "booking_id": {
                    "type": "string",
                    "description": "The 6-character uppercase PNR booking reference.",
                }
            },
            "required": ["booking_id"],
        },
    },
    {
        "name": "get_policy_rules",
        "description": "Retrieves the governing airline business rules, conditions, and entitlements for a disruption scenario (e.g. 'DELAY').",
        "parameters": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "Policy category (defaults to 'DELAY').",
                }
            },
            "required": ["category"],
        },
    },
    {
        "name": "get_eligible_options",
        "description": "Retrieves available alternative flight rebooking options and refund solutions for the passenger.",
        "parameters": {
            "type": "object",
            "properties": {
                "booking_id": {
                    "type": "string",
                    "description": "The 6-character uppercase PNR booking reference.",
                }
            },
            "required": ["booking_id"],
        },
    },
    {
        "name": "create_human_case",
        "description": "Creates an escalation case ticket for human airport agent intervention when required by policy or safety rules.",
        "parameters": {
            "type": "object",
            "properties": {
                "booking_id": {
                    "type": "string",
                    "description": "The 6-character uppercase PNR booking reference.",
                },
                "reason": {
                    "type": "string",
                    "description": "Detailed justification for human escalation.",
                },
            },
            "required": ["booking_id", "reason"],
        },
    },
]

AGENT_TOOL_MAPPING = {
    "get_trip_context": get_trip_context_tool,
    "get_operational_events": get_operational_events_tool,
    "get_policy_rules": get_policy_rules_tool,
    "get_eligible_options": get_eligible_options_tool,
    "create_human_case": create_human_case_tool,
}
