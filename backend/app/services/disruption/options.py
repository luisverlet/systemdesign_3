"""Filter candidate options down to the one the passenger is offered."""

from __future__ import annotations

from datetime import datetime, timedelta

from app.services.disruption.facts import MIN_CONNECTION_MINUTES, local_dt


def parse_utc(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def _reject_reasons(opt, trip, facts, evaluation) -> list:
    reasons = []
    if "REBOOK_NO_FEE" not in evaluation["entitlements"]:
        reasons.append("no rebook entitlement")
    if opt.get("type") != "REBOOK":
        return reasons + ["not a rebooking"]
    seg = next(
        s for s in trip["segments"] if s["segment_id"] == facts["disrupted_segment"]
    )
    if (opt["origin"], opt["destination"]) != (
        seg["destination"],
        trip["segments"][-1]["destination"],
    ):
        reasons.append("wrong route")
    earliest = facts["estimated_arrival"] + timedelta(minutes=MIN_CONNECTION_MINUTES)
    if local_dt(opt["date"], opt["departure"]) < earliest:
        reasons.append("departs before passengers can connect")
    if opt.get("seats_available", 0) < len(trip["passengers"]):
        reasons.append("not enough seats")
    if opt.get("fare_difference", 0) != 0:
        reasons.append("fare difference not covered")
    if opt.get("policy_ref") != evaluation["policy_ref"]:
        reasons.append("policy version mismatch")
    return reasons


def select_option(
    options_resp: dict, trip: dict, facts: dict, evaluation: dict, now: datetime
):
    """Return (recommended option or None, [{"option_id", "reasons"}])."""
    meta = options_resp["_meta"]
    expires = parse_utc(meta["retrieved_at"]) + timedelta(seconds=meta["ttl_seconds"])
    options = options_resp["options"]
    if now > expires:
        return None, [
            {"option_id": o["option_id"], "reasons": ["options expired"]}
            for o in options
        ]
    if facts["disrupted_segment"] is None:
        return None, [
            {"option_id": o["option_id"], "reasons": ["no disruption"]} for o in options
        ]

    eligible, rejected = [], []
    for opt in options:
        reasons = _reject_reasons(opt, trip, facts, evaluation)
        if reasons:
            rejected.append({"option_id": opt["option_id"], "reasons": reasons})
        else:
            eligible.append(opt)
    eligible.sort(key=lambda o: local_dt(o["date"], o["departure"]))
    return (eligible[0] if eligible else None), rejected
