"""Use case: read the external systems, decide, and escalate to a human when needed."""

from __future__ import annotations

from datetime import datetime

from app.services.disruption import mocks
from app.services.disruption.decision import decide


def resolve(
    booking_id: str, now: datetime, compensation_requested: bool = False
) -> dict:
    """Raises mocks.BookingNotFound or mocks.UpstreamError before any write happens."""
    trip = mocks.get_trip_context(booking_id)
    events = mocks.get_operational_events([s["segment_id"] for s in trip["segments"]])
    options = mocks.get_eligible_options(trip)
    policy = mocks.get_policy_rules("DELAY")

    decision = decide(trip, events, options, policy, now, compensation_requested)
    decision["human_case"] = None
    if decision["action"] == "HUMAN":
        evidence = {
            k: decision[k]
            for k in (
                "booking_id",
                "facts",
                "applied_rules",
                "policy_ref",
                "recommended_option",
                "conflicts",
            )
        }
        status, body = mocks.create_human_case(
            "; ".join(decision["human_reasons"]), evidence
        )
        if status != 201:
            raise mocks.UpstreamError("create_human_case")
        decision["human_case"] = body
    return decision
