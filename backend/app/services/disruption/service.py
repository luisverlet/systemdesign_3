"""Use case: read the external systems, decide, and escalate to a human when needed."""

from __future__ import annotations

from datetime import datetime

from app.services.disruption import mocks
from app.services.disruption.decision import decide


def load(booking_id: str) -> tuple:
    """(trip, events, options, policy). Raises mocks.BookingNotFound or mocks.UpstreamError."""
    trip = mocks.get_trip_context(booking_id)
    events = mocks.get_operational_events([s["segment_id"] for s in trip["segments"]])
    return (
        trip,
        events,
        mocks.get_eligible_options(trip),
        mocks.get_policy_rules("DELAY"),
    )


def resolve(
    booking_id: str, now: datetime, compensation_requested: bool = False
) -> dict:
    return resolve_loaded(load(booking_id), now, compensation_requested)


def resolve_loaded(
    inputs: tuple, now: datetime, compensation_requested: bool = False
) -> dict:
    """Decide on already-read inputs; creates the human case only when needed."""
    decision = decide(*inputs, now, compensation_requested)
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
