"""Combine events, facts, policy and options into one traceable decision."""

from __future__ import annotations

from datetime import datetime

from app.services.disruption.events import resolve_events
from app.services.disruption.facts import derive_facts
from app.services.disruption.options import select_option
from app.services.disruption.policy import evaluate

# Only these passenger fields ever leave the engine (no email, phone or document).
SAFE_PASSENGER_FIELDS = ("passenger_id", "type", "age")


def decide(
    trip: dict,
    events_resp: dict,
    options_resp: dict,
    policy: dict,
    now: datetime,
    compensation_requested: bool = False,
) -> dict:
    resolved, discarded = resolve_events(events_resp)
    facts = derive_facts(trip, resolved, compensation_requested)
    evaluation = evaluate(policy, facts)
    option, rejected = select_option(options_resp, trip, facts, evaluation, now)

    conflicts = [eid for seg in resolved.values() for eid in seg["conflicts"]]
    human_reasons = []
    if conflicts:
        human_reasons.append("contradicting trusted sources")
    if evaluation["not_evaluable"]:
        human_reasons.append("rules not evaluable")
    if any(r in evaluation["applied_rules"] for r in _human_rules(policy)):
        human_reasons.append("policy requires human approval")
    if facts["disrupted_segment"] and option is None:
        human_reasons.append("no eligible option")

    return {
        "booking_id": trip["booking_id"],
        "passengers": [
            {k: p[k] for k in SAFE_PASSENGER_FIELDS if k in p}
            for p in trip["passengers"]
        ],
        "facts": {
            **facts,
            "estimated_arrival": facts["estimated_arrival"]
            and facts["estimated_arrival"].strftime("%Y-%m-%d %H:%M"),
        },
        "segments": {
            sid: {
                "status": seg["status"] and seg["status"]["event_id"],
                "gate": seg["gate"] and seg["gate"].get("gate"),
            }
            for sid, seg in resolved.items()
        },
        "discarded_events": discarded,
        "conflicts": conflicts,
        "policy_ref": evaluation["policy_ref"],
        "applied_rules": evaluation["applied_rules"],
        "entitlements": evaluation["entitlements"],
        "not_evaluable_rules": evaluation["not_evaluable"],
        "recommended_option": option,
        "rejected_options": rejected,
        "missing_fields": trip.get("_meta", {}).get("missing_fields", []),
        "action": "HUMAN" if human_reasons else "AUTO",
        "human_reasons": human_reasons,
    }


def _human_rules(policy: dict) -> list:
    return [r["rule_id"] for r in policy["rules"] if r["requires_human_approval"]]
