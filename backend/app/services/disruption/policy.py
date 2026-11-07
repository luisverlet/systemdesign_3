"""Evaluate versioned policy rules against trip facts with a closed set of conditions."""

from __future__ import annotations

# Each known condition string -> (facts it needs, check). Unknown strings fail closed.
CONDITIONS = {
    "delay_minutes >= 180": (("delay_minutes",), lambda f: f["delay_minutes"] >= 180),
    "delay_minutes >= 240 AND international": (
        ("delay_minutes", "international"),
        lambda f: f["delay_minutes"] >= 240 and f["international"],
    ),
    "missed_connection == true": (
        ("missed_connection",),
        lambda f: f["missed_connection"],
    ),
    "compensation_requested == true": (
        ("compensation_requested",),
        lambda f: f["compensation_requested"],
    ),
    "group_includes_minor == true": (
        ("group_includes_minor",),
        lambda f: f["group_includes_minor"],
    ),
}


def evaluate(policy: dict, facts: dict) -> dict:
    applied, not_evaluable = [], []
    for rule in policy["rules"]:
        known = CONDITIONS.get(rule["condition"])
        if known is None or any(facts.get(k) is None for k in known[0]):
            not_evaluable.append(rule["rule_id"])
        elif known[1](facts):
            applied.append(rule)
    return {
        "policy_ref": policy["version"],
        "applied_rules": [r["rule_id"] for r in applied],
        "entitlements": sorted({r["entitlement"] for r in applied}),
        "not_evaluable": not_evaluable,
        "requires_human": bool(not_evaluable)
        or any(r["requires_human_approval"] for r in applied),
    }
